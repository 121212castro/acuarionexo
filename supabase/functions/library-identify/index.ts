import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticatedClients, biologicalTypes, clean, concreteScientificName, corsHeaders, errorJson, json, normalizeSources, openAiJson, productTypes } from "../_shared/library-v3.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorJson("method_not_allowed", "Método no permitido.", 405);
  try {
    await authenticatedClients(req); const payload = await req.json();
    const commonName = clean(payload.common_name || payload.title, 180); const scientificName = clean(payload.scientific_name, 180); const brand = clean(payload.brand, 180); const entryType = clean(payload.entry_type || "general", 80); const photoUrl = clean(payload.photo_url, 800);
    if (!commonName && !scientificName && !brand && !photoUrl) return errorJson("missing_identity_input", "Introduce un nombre, marca o foto.", 400);
    const groupRule = biologicalTypes.has(entryType) ? "Usa primero FishBase, WoRMS, Catalogue of Life, GBIF, IUCN, ITIS, POWO o fuentes taxonómicas oficiales." : productTypes.has(entryType) ? "Usa fabricante, ficha técnica, prospecto o manual oficial como fuentes principales." : "Usa fuentes oficiales primarias adecuadas.";
    const { parsed, model } = await openAiJson("Eres el motor IDENTIFY de AcuarioNexo. Solo identificas. No generas fichas, cuidados, dosis ni recomendaciones. Devuelve JSON estricto.", `Identifica de forma verificable. Tipo: ${entryType}. Nombre común: ${commonName}. Nombre científico: ${scientificName}. Marca: ${brand}. Notas: ${clean(payload.notes,1200)}. ${groupRule} No inventes. Si hay duda identity_confirmed=false. Para biología exige especie concreta y rechaza spp., sp., cf., aff. y género solo. Para productos exige fabricante y referencia concreta. Exige al menos dos URLs reales de la misma entidad. Devuelve identity_confirmed, confidence, title, scientific_name, entry_type, candidates, sources y sections.identity.`, photoUrl);
    const sources = normalizeSources(parsed.sources); const biologicalOk = !biologicalTypes.has(entryType) || concreteScientificName(parsed.scientific_name); const productOk = !productTypes.has(entryType) || Boolean(clean(parsed.title) && (brand || clean(parsed.manufacturer))); const confirmed = parsed.identity_confirmed === true && sources.length >= 2 && biologicalOk && productOk;
    return json({ data: { identity_confirmed: confirmed, confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)), title: clean(parsed.title || commonName || brand, 180), scientific_name: clean(parsed.scientific_name || scientificName, 180), entry_type: entryType, candidates: Array.isArray(parsed.candidates) ? parsed.candidates.slice(0, 8) : [], sources, sections: { identity: clean(parsed.sections?.identity || parsed.identity, 3000) }, ai_model: model } });
  } catch (error) {
    const message = String(error?.message || error); if (message === "AUTH_REQUIRED") return errorJson("auth_required", "Sesión no válida.", 401);
    return errorJson("identify_failed", `No se pudo cerrar la identificación: ${message}`, 502);
  }
});
