import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { auditEntry, authenticatedClients, clean, contractPrompt, contracts, corsHeaders, errorJson, json, normalizeSources, openAiJson } from "../_shared/library-v3.ts";

function buildRow(userId: string, identity: any, parsed: any, entryType: string, normalizedSources: any[], model: string, payload: any) {
  return {
    user_id: userId,
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
}

async function repairDraft(identity: any, entryType: string, fields: string[], parsed: any, audit: any, imageUrl: string) {
  return openAiJson(
    "Eres el motor REPAIR de AcuarioNexo. Recibes un borrador rechazado y lo completas. Devuelve JSON estricto con la ficha completa corregida. No inventes datos: si no puedes verificar algo, usa null.",
    [
      `Identidad validada: ${JSON.stringify(identity)}`,
      contractPrompt(entryType, fields),
      `Borrador rechazado: ${JSON.stringify(parsed)}`,
      `Errores de auditoría: ${JSON.stringify(audit.errors)}`,
      `Campos incompletos: ${JSON.stringify(audit.missing_fields || [])}`,
      `Campos pobres o genéricos: ${JSON.stringify(audit.poor_fields || [])}`,
      "Corrige SOLO los campos rechazados y conserva lo que ya sea válido.",
      "Cada campo corregido debe ser específico, verificable y útil para usuario final y para IA.",
      "Prohibido usar: bajo, medio, alto, moderado, suele, normalmente, aproximadamente, mantener parámetros estables, compatible con peces pacíficos.",
      "Para compatibilidad, indica grupos concretos compatibles e incompatibles, condiciones y riesgos.",
      "Para salud, indica problemas concretos, señales observables y prevención verificable.",
      "Para ai_notes, escribe datos estructurados en texto natural para decisiones futuras de AcuarioNexo.",
      "Mantén o mejora sources con URLs reales y used_for.",
      "Devuelve exactamente: title, scientific_name, summary, data, sections, tags y sources."
    ].join("\n\n"),
    imageUrl
  );
}

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
    const imageUrl = clean(payload.photo_url, 800);

    const first = await openAiJson(
      "Eres el motor GENERATE de AcuarioNexo. Recibes una identidad validada, investigas y creas únicamente un borrador completo, útil para usuario final y útil para IA. Nunca publicas. No inventes datos. Devuelve JSON estricto.",
      [
        `Identidad validada: ${JSON.stringify(identity)}`,
        contractPrompt(entryType, fields),
        "Contrasta fuentes reales. Mínimo dos URLs reales sobre la misma entidad.",
        "Cada dato debe ser rastreable con sources[].used_for.",
        "Reef safe solo puede ser Sí, Sí con precaución o No.",
        "No devuelvas una ficha mínima: todos los campos del contrato deben estar cubiertos con datos útiles o null si no son verificables.",
        "Prohibido usar: bajo, medio, alto, moderado, suele, normalmente, aproximadamente, mantener parámetros estables, compatible con peces pacíficos.",
        "Devuelve exactamente: title, scientific_name, summary, data, sections, tags y sources."
      ].join("\n\n"),
      imageUrl
    );

    let parsed = first.parsed;
    let model = first.model;
    let normalizedSources = normalizeSources([...(parsed.sources || []), ...sources]);
    if (normalizedSources.length < 2) return errorJson("sources_required", "La investigación no mantuvo dos fuentes reales.", 502);

    let row = buildRow(user.id, identity, parsed, entryType, normalizedSources, model, payload);
    let audit = auditEntry(row);

    for (let attempt = 1; !audit.approved && attempt <= 3; attempt += 1) {
      const repair = await repairDraft(identity, entryType, fields, parsed, audit, imageUrl);
      parsed = repair.parsed;
      model = `${model}+repair${attempt}:${repair.model}`;
      normalizedSources = normalizeSources([...(parsed.sources || []), ...normalizedSources, ...sources]);
      if (normalizedSources.length < 2) return errorJson("sources_required", "La reparación no mantuvo dos fuentes reales.", 502);
      row = buildRow(user.id, identity, parsed, entryType, normalizedSources, model, payload);
      audit = auditEntry(row);
    }

    if (!audit.approved) {
      return errorJson("draft_quality_failed", "La IA no consiguió crear una ficha completa sin campos pobres. No se ha guardado la ficha.", 422, {
        errors: audit.errors,
        missing_fields: audit.missing_fields || [],
        poor_fields: audit.poor_fields || [],
        warnings: audit.warnings || []
      });
    }

    row.validation_result = { ...audit, generated_audit: true, audited_at: new Date().toISOString(), engine: "library-generate-draft-v5" };
    row.status = "validated";
    row.validated_by = user.id;
    row.validated_at = new Date().toISOString();

    const { data, error } = await serviceClient.from("library_entries").insert(row).select("*").single();
    if (error) throw error;
    return json({ data, result: "APROBADA" });
  } catch (error) {
    const message = String(error?.message || error);
    if (message === "AUTH_REQUIRED") return errorJson("auth_required", "Sesión no válida.", 401);
    return errorJson("generate_failed", `No se pudo crear el borrador: ${message}`, 502);
  }
});
