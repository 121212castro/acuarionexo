import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticatedClients, clean, contractPrompt, contracts, corsHeaders, errorJson, json, normalizeSources, openAiJson } from "../_shared/library-v3.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorJson("method_not_allowed", "Método no permitido.", 405);
  try {
    const { user, serviceClient } = await authenticatedClients(req);
    const payload = await req.json();
    const identity = payload.identify_result || {};
    const sources = normalizeSources(identity.sources);
    if (identity.identity_confirmed !== true) return errorJson("identity_required", "Identificación insuficiente. No se puede crear ficha.", 409);
    if (sources.length < 2) return errorJson("sources_required", "Se requieren al menos dos URLs reales.", 409);

    const entryType = clean(identity.entry_type || payload.entry_type, 80);
    const fields = contracts[entryType];
    if (!fields) return errorJson("unsupported_entry_type", "Tipo de ficha no soportado.", 400);

    const { parsed, model } = await openAiJson(
      "Eres el motor GENERATE de AcuarioNexo. Recibes una identidad validada, investigas y creas únicamente un borrador completo, útil para usuario final y útil para IA. Nunca publicas. No inventes datos. Devuelve JSON estricto.",
      [
        `Identidad validada: ${JSON.stringify(identity)}`,
        contractPrompt(entryType, fields),
        "Contrasta fuentes reales. Mínimo dos URLs reales sobre la misma entidad.",
        "Cada dato debe ser rastreable con sources[].used_for.",
        "Reef safe solo puede ser Sí, Sí con precaución o No.",
        "No devuelvas una ficha mínima: todos los campos del contrato deben estar cubiertos con datos útiles o null si no son verificables.",
        "Devuelve exactamente: title, scientific_name, summary, data, sections, tags y sources."
      ].join("\n\n"),
      clean(payload.photo_url, 800)
    );

    const normalizedSources = normalizeSources([...(parsed.sources || []), ...sources]);
    if (normalizedSources.length < 2) return errorJson("sources_required", "La investigación no mantuvo dos fuentes reales.", 502);

    const row = {
      user_id: user.id,
      title: clean(parsed.title || identity.title, 180),
      scientific_name: clean(parsed.scientific_name || identity.scientific_name, 180) || null,
      entry_type: entryType,
      status: "draft",
      visibility: "private",
      summary: clean(parsed.summary, 1200) || null,
      cover_url: clean(payload.cover_url, 800) || null,
      photo_url: clean(payload.photo_url, 800) || null,
      sections: parsed.sections && typeof parsed.sections === "object" ? parsed.sections : {},
      data: parsed.data && typeof parsed.data === "object" ? parsed.data : {},
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 20) : [],
      identity_confirmed: true,
      confidence: Number(identity.confidence) || null,
      identify_result: identity,
      sources: normalizedSources,
      ai_model: model,
      ai_generated_at: new Date().toISOString()
    };

    const { data, error } = await serviceClient.from("library_entries").insert(row).select("*").single();
    if (error) throw error;
    return json({ data });
  } catch (error) {
    const message = String(error?.message || error);
    if (message === "AUTH_REQUIRED") return errorJson("auth_required", "Sesión no válida.", 401);
    return errorJson("generate_failed", `No se pudo crear el borrador: ${message}`, 502);
  }
});
