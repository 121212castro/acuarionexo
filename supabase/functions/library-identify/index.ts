import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticatedClients, biologicalTypes, clean, concreteScientificName, corsHeaders, errorJson, json, multiTaxonMicrofauna, normalizeSources, openAiJson, productTypes } from "../_shared/library-v3.ts";

const allowedTypes = [...biologicalTypes, ...productTypes];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorJson("method_not_allowed", "Método no permitido.", 405);
  try {
    await authenticatedClients(req);
    const payload = await req.json();
    const commonName = clean(payload.common_name || payload.title, 180);
    const scientificName = clean(payload.scientific_name, 180);
    const brand = clean(payload.brand, 180);
    const requestedType = clean(payload.entry_type, 80);
    const photoUrl = clean(payload.photo_url, 800);

    if (!commonName && !scientificName && !brand && !photoUrl) return errorJson("missing_identity_input", "Introduce un nombre, marca o foto.", 400);

    const automaticType = !requestedType || requestedType === "auto" || requestedType === "general";
    if (!automaticType && !allowedTypes.includes(requestedType)) return errorJson("invalid_entry_type", "El tipo de ficha no es válido.", 400);

    const typeInstruction = automaticType
      ? `Clasifica primero la entidad en exactamente uno de estos entry_type: ${allowedTypes.join(", ")}. No uses general, otros ni categorías nuevas.`
      : `El entry_type solicitado es ${requestedType}; confírmalo y no lo cambies salvo que sea incompatible con la entidad.`;

    const sourceInstruction = automaticType
      ? "Para organismos usa primero fuentes taxonómicas oficiales. Para productos usa fabricante, manual, ficha técnica o prospecto oficial como fuentes principales."
      : biologicalTypes.has(requestedType)
        ? "Usa primero FishBase, WoRMS, Catalogue of Life, GBIF, IUCN, ITIS, POWO o fuentes taxonómicas oficiales."
        : "Usa fabricante, ficha técnica, prospecto o manual oficial como fuentes principales.";

    const { parsed, model } = await openAiJson(
      "Eres el motor IDENTIFY de AcuarioNexo. Solo identificas y clasificas. No generas fichas, cuidados, dosis ni recomendaciones. Devuelve JSON estricto.",
      `Identifica de forma verificable. ${typeInstruction} Nombre recibido: ${commonName}. Nombre científico aportado: ${scientificName}. Marca aportada: ${brand}. Notas: ${clean(payload.notes, 1200)}. ${sourceInstruction} No inventes. Si hay duda identity_confirmed=false. Para biología exige especie concreta, salvo mezclas multiespecíficas comerciales de microfauna verificadas. Para productos identifica fabricante, marca, nombre comercial exacto, referencia o código cuando exista, versión vigente, presentación y documentación aplicable al producto exacto. No mezcles versiones antiguas y actuales. Exige al menos dos URLs reales de la misma entidad. Devuelve identity_confirmed, confidence, title, scientific_name, entry_type, manufacturer, brand, product_code, version, presentation, candidates, sources y sections.identity.`,
      photoUrl
    );

    const resolvedType = clean(parsed.entry_type || requestedType, 80);
    if (!allowedTypes.includes(resolvedType)) return errorJson("unresolved_entry_type", "No se pudo determinar una categoría válida.", 422);

    const identifiedEntry = {
      ...parsed,
      entry_type: resolvedType,
      data: parsed.data || { culture_type: parsed.culture_type, identification: parsed.sections?.identity }
    };
    const sources = normalizeSources(parsed.sources);
    const biologicalOk = !biologicalTypes.has(resolvedType) || concreteScientificName(parsed.scientific_name) || multiTaxonMicrofauna(identifiedEntry);
    const manufacturer = clean(parsed.manufacturer, 180);
    const resolvedBrand = clean(parsed.brand || brand, 180);
    const productOk = !productTypes.has(resolvedType) || Boolean(clean(parsed.title) && (manufacturer || resolvedBrand));
    const confirmed = parsed.identity_confirmed === true && sources.length >= 2 && biologicalOk && productOk;

    return json({
      data: {
        identity_confirmed: confirmed,
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
        title: clean(parsed.title || commonName || resolvedBrand, 180),
        scientific_name: clean(parsed.scientific_name || scientificName, 180),
        entry_type: resolvedType,
        manufacturer,
        brand: resolvedBrand,
        product_code: clean(parsed.product_code || parsed.reference || parsed.sku, 180),
        version: clean(parsed.version, 180),
        presentation: clean(parsed.presentation || parsed.format, 300),
        candidates: Array.isArray(parsed.candidates) ? parsed.candidates.slice(0, 8) : [],
        sources,
        sections: { identity: clean(parsed.sections?.identity || parsed.identity, 3000) },
        ai_model: model
      }
    });
  } catch (error) {
    const message = String(error?.message || error);
    if (message === "AUTH_REQUIRED") return errorJson("auth_required", "Sesión no válida.", 401);
    return errorJson("identify_failed", `No se pudo cerrar la identificación: ${message}`, 502);
  }
});