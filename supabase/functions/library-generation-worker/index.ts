import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import {
  auditEntry,
  biologicalTypes,
  clean,
  concreteScientificName,
  contractPrompt,
  contracts,
  corsHeaders,
  multiTaxonMicrofauna,
  normalizeSources,
  openAiJson,
  pollOpenAiJsonBackground,
  productTypes,
  startOpenAiJsonBackground
} from "../_shared/library-v3.ts";

const allowedTypes = [...biologicalTypes, ...productTypes];

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function generationState(identity: any) {
  return identity?.generation_state && typeof identity.generation_state === "object"
    ? identity.generation_state
    : null;
}

function withoutGenerationState(identity: any) {
  const result = { ...(identity || {}) };
  delete result.generation_state;
  return result;
}

function buildEntry(userId: string, identity: any, parsed: any, normalizedSources: any[], model: string) {
  const isMultispeciesMix = identity.entry_type === "microfauna" &&
    identity.is_multispecies_mix === true;
  const parsedData = parsed.data && typeof parsed.data === "object" ? parsed.data : {};
  const data = {
    ...parsedData,
    ...(isMultispeciesMix ? {
      culture_type: clean(parsedData.culture_type, 1000) ||
        "Mezcla viva multiespecífica comercial.",
      identification: clean(parsedData.identification, 3000) ||
        clean(identity.sections?.identity, 3000) ||
        `Mezcla multiespecífica identificada como ${clean(identity.scientific_name, 500)}.`
    } : {}),
    ai_notes: typeof parsedData.ai_notes === "object" && parsedData.ai_notes !== null
      ? JSON.stringify(parsedData.ai_notes)
      : parsedData.ai_notes
  };
  return {
    user_id: userId,
    title: clean(parsed.title || identity.title, 180),
    scientific_name: clean(
      isMultispeciesMix
        ? identity.scientific_name
        : (parsed.scientific_name || identity.scientific_name),
      500
    ) || null,
    entry_type: identity.entry_type,
    status: "review",
    visibility: "private",
    summary: clean(parsed.summary, 1200) || null,
    cover_url: null,
    photo_url: null,
    sections: parsed.sections && typeof parsed.sections === "object" ? parsed.sections : {},
    data,
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 20) : [],
    identity_confirmed: true,
    confidence: Number(identity.confidence) || null,
    identify_result: withoutGenerationState(identity),
    sources: normalizedSources,
    ai_model: model,
    ai_generated_at: new Date().toISOString()
  };
}

async function identifyJob(serviceClient: any, job: any) {
  const requestedBrand = clean(job.identify_result?.requested_brand, 180);
  const commonName = clean(job.subject, 180);
  const { parsed, model } = await openAiJson(
    "Eres el motor IDENTIFY de AcuarioNexo. Solo identificas y clasificas. No generas fichas, cuidados, dosis ni recomendaciones. Devuelve JSON estricto.",
    [
      `Clasifica la entidad en exactamente uno de estos entry_type: ${allowedTypes.join(", ")}.`,
      `Nombre recibido: ${commonName}.`,
      `Marca o fabricante obligatorio: ${requestedBrand || "no indicado"}.`,
      requestedBrand ? `Descarta candidatos que no pertenezcan a ${requestedBrand}.` : "",
      "Para organismos usa primero fuentes taxonómicas oficiales. Para productos usa fabricante, manual, ficha técnica o prospecto oficial.",
      "No inventes. Si hay duda, identity_confirmed=false.",
      "Para biología exige especie concreta, salvo mezclas multiespecíficas comerciales de microfauna verificadas.",
      "Si es una mezcla comercial de microfauna, confirma todos los taxones publicados, escribe scientific_name con los taxones separados por +, marca is_multispecies_mix=true y explica la composición en sections.identity. No fuerces una especie única.",
      "Para productos identifica fabricante, marca, nombre comercial exacto, referencia o código cuando exista, versión vigente y presentación.",
      "Exige al menos dos URLs reales de la misma entidad.",
      "Devuelve identity_confirmed, confidence, title, scientific_name, is_multispecies_mix, entry_type, manufacturer, brand, product_code, version, presentation, candidates, sources y sections.identity."
    ].filter(Boolean).join("\n\n")
  );

  const resolvedType = clean(parsed.entry_type, 80);
  const identifiedEntry = {
    ...parsed,
    entry_type: resolvedType,
    data: parsed.data || {
      culture_type: parsed.is_multispecies_mix === true ? "Mezcla multiespecífica comercial" : parsed.culture_type,
      identification: parsed.sections?.identity
    }
  };
  const sources = normalizeSources(parsed.sources);
  const manufacturer = clean(parsed.manufacturer, 180);
  const resolvedBrand = clean(parsed.brand || requestedBrand, 180);
  const biologicalOk = !biologicalTypes.has(resolvedType) ||
    concreteScientificName(parsed.scientific_name) ||
    multiTaxonMicrofauna(identifiedEntry);
  const productOk = !productTypes.has(resolvedType) ||
    Boolean(clean(parsed.title) && (manufacturer || resolvedBrand));
  const confirmed = parsed.identity_confirmed === true &&
    allowedTypes.includes(resolvedType) &&
    sources.length >= 2 &&
    biologicalOk &&
    productOk &&
    (!requestedBrand || resolvedBrand.toLocaleLowerCase("es-ES") === requestedBrand.toLocaleLowerCase("es-ES"));

  const identity = {
    identity_confirmed: confirmed,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    title: clean(parsed.title || commonName, 180),
    scientific_name: clean(parsed.scientific_name, 500),
    entry_type: resolvedType,
    manufacturer,
    brand: resolvedBrand,
    requested_brand: requestedBrand,
    is_multispecies_mix: parsed.is_multispecies_mix === true,
    product_code: clean(parsed.product_code || parsed.reference || parsed.sku, 180),
    version: clean(parsed.version, 180),
    presentation: clean(parsed.presentation || parsed.format, 300),
    candidates: Array.isArray(parsed.candidates) ? parsed.candidates.slice(0, 8) : [],
    sources,
    sections: {
      identity: clean(
        typeof parsed.sections?.identity === "string"
          ? parsed.sections.identity
          : JSON.stringify(parsed.sections?.identity || parsed.identity || {}),
        3000
      )
    },
    ai_model: model
  };

  if (!confirmed) {
    await serviceClient.from("library_generation_jobs").update({
      status: "blocked",
      progress: 35,
      entry_type: resolvedType || "auto",
      identify_result: identity,
      error_code: "identity_required",
      error_message: "No se confirmó la categoría, identidad, marca o versión exacta con dos fuentes reales."
    }).eq("id", job.id);
    return { id: job.id, subject: job.subject, phase: "blocked" };
  }

  let duplicateQuery = serviceClient.from("library_entries")
    .select("id,title")
    .eq("entry_type", resolvedType)
    .limit(1);
  duplicateQuery = identity.scientific_name
    ? duplicateQuery.ilike("scientific_name", identity.scientific_name)
    : duplicateQuery.ilike("title", identity.title || commonName);
  const { data: duplicates, error: duplicateError } = await duplicateQuery;
  if (duplicateError) throw duplicateError;
  if (duplicates?.[0]) {
    await serviceClient.from("library_generation_jobs").update({
      status: "blocked",
      progress: 100,
      entry_type: resolvedType,
      identify_result: identity,
      library_entry_id: duplicates[0].id,
      error_code: "duplicate_entry",
      error_message: `Ya existe una ficha: ${duplicates[0].title}.`
    }).eq("id", job.id);
    return { id: job.id, subject: job.subject, phase: "duplicate" };
  }

  await serviceClient.from("library_generation_jobs").update({
    status: "generating",
    progress: 45,
    entry_type: resolvedType,
    identify_result: identity,
    error_code: null,
    error_message: null
  }).eq("id", job.id);
  return { id: job.id, subject: job.subject, phase: "identified" };
}

async function generateJob(serviceClient: any, job: any) {
  const identity = job.identify_result || {};
  const state = generationState(identity);
  const fields = contracts[identity.entry_type || job.entry_type];
  if (!fields) throw new Error("Tipo de ficha no soportado.");
  if (identity.identity_confirmed !== true || normalizeSources(identity.sources).length < 2) {
    throw new Error("La identidad no está confirmada con dos fuentes.");
  }

  if (!state?.response_id) {
    const started = await startOpenAiJsonBackground(
      "Eres el motor GENERATE de AcuarioNexo. Recibes una identidad validada, investigas y creas únicamente un borrador completo, útil para usuario final y útil para IA. Nunca publicas. No inventes datos. Devuelve JSON estricto.",
      [
        `Identidad validada: ${JSON.stringify(withoutGenerationState(identity))}`,
        contractPrompt(identity.entry_type, fields),
        "Contrasta fuentes reales y cumple la política obligatoria de tres fuentes: oficial o primaria, especializada por categoría y una tercera fiable.",
        "Cada dato debe ser rastreable con sources[].used_for.",
        "No devuelvas una ficha mínima: todos los campos deben contener datos útiles o una explicación verificable de que el fabricante no los publica.",
        "ai_notes debe ser texto útil de al menos 20 caracteres; no devuelvas un objeto ni una lista en ese campo.",
        identity.is_multispecies_mix === true
          ? "Es una mezcla multiespecífica: conserva exactamente scientific_name de la identidad validada y declara expresamente la mezcla en data.culture_type y data.identification."
          : "",
        "Prohibido usar: bajo, medio, alto, moderado, suele, normalmente, aproximadamente, mantener parámetros estables, compatible con peces pacíficos.",
        "Devuelve exactamente: title, scientific_name, summary, data, sections, tags y sources."
      ].join("\n\n")
    );
    await serviceClient.from("library_generation_jobs").update({
      progress: 55,
      identify_result: { ...identity, generation_state: { ...started, phase: "generating", attempt: 0 } }
    }).eq("id", job.id);
    return { id: job.id, subject: job.subject, phase: "generation_started", response_id: started.response_id };
  }

  const polled = await pollOpenAiJsonBackground(state.response_id);
  if (polled.status !== "completed") {
    await serviceClient.from("library_generation_jobs").update({
      progress: state.phase === "repairing" ? Math.min(90, 70 + ((state.attempt || 1) * 5)) : 60,
      identify_result: { ...identity, generation_state: { ...state, status: polled.status } }
    }).eq("id", job.id);
    return { id: job.id, subject: job.subject, phase: state.phase || "generating", status: polled.status };
  }

  const parsed = polled.parsed;
  const sources = normalizeSources([...(parsed.sources || []), ...(identity.sources || [])]);
  const model = clean(Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini", 80);
  const row = buildEntry(job.requested_by, identity, parsed, sources, model);
  const audit = auditEntry(row);
  if (!audit.approved) {
    const attempt = Math.max(0, Number(state.attempt) || 0);
    if (attempt >= 3) {
      await serviceClient.from("library_generation_jobs").update({
        status: "blocked",
        progress: 95,
        error_code: "draft_quality_failed",
        error_message: `La auditoría rechazó la ficha: ${audit.errors.join(" ")}`
      }).eq("id", job.id);
      return { id: job.id, subject: job.subject, phase: "quality_blocked" };
    }
    const repair = await startOpenAiJsonBackground(
      "Eres el motor REPAIR de AcuarioNexo. Completa y corrige el JSON anterior sin inventar datos. Devuelve la ficha completa en JSON estricto.",
      [
        contractPrompt(identity.entry_type, fields),
        `Errores de auditoría: ${JSON.stringify(audit.errors)}`,
        `Campos incompletos: ${JSON.stringify(audit.missing_fields || [])}`,
        `Campos pobres o genéricos: ${JSON.stringify(audit.poor_fields || [])}`,
        "Corrige los campos rechazados y conserva el resto.",
        "Mantén o mejora sources con URLs reales y used_for."
      ].join("\n\n"),
      "",
      state.response_id
    );
    await serviceClient.from("library_generation_jobs").update({
      progress: Math.min(90, 75 + (attempt * 5)),
      identify_result: {
        ...identity,
        generation_state: { ...repair, phase: "repairing", attempt: attempt + 1 }
      }
    }).eq("id", job.id);
    return { id: job.id, subject: job.subject, phase: "repair_started", attempt: attempt + 1 };
  }

  row.validation_result = {
    ...audit,
    generated_audit: true,
    audited_at: new Date().toISOString(),
    engine: "library-generation-worker-v1"
  };
  row.validated_by = job.requested_by;
  row.validated_at = new Date().toISOString();
  const { data: entry, error: insertError } = await serviceClient.from("library_entries")
    .insert(row)
    .select("id,title")
    .single();
  if (insertError) throw insertError;

  await serviceClient.from("library_generation_jobs").update({
    status: "completed",
    progress: 100,
    library_entry_id: entry.id,
    identify_result: withoutGenerationState(identity),
    completed_at: new Date().toISOString(),
    error_code: null,
    error_message: null
  }).eq("id", job.id);
  return { id: job.id, subject: job.subject, phase: "completed", library_entry_id: entry.id };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(url, serviceKey);

  try {
    const payload = await req.json().catch(() => ({}));
    const candidate = clean(payload.worker_secret, 300);
    const { data: authorized, error: authError } = await serviceClient.rpc(
      "verify_library_generation_worker_secret",
      { candidate }
    );
    if (authError || authorized !== true) return response({ error: "worker_auth_required" }, 401);

    const { data: jobs, error: jobsError } = await serviceClient.from("library_generation_jobs")
      .select("*")
      .in("status", ["pending", "identifying", "generating"])
      .order("queue_order", { ascending: true })
      .limit(1);
    if (jobsError) throw jobsError;
    const job = jobs?.[0];
    if (!job) return response({ ok: true, result: "idle" });

    if (job.status === "pending" || job.status === "identifying") {
      await serviceClient.from("library_generation_jobs").update({
        status: "identifying",
        progress: 10,
        started_at: job.started_at || new Date().toISOString(),
        attempts: (job.attempts || 0) + (job.status === "pending" ? 1 : 0),
        error_code: null,
        error_message: null
      }).eq("id", job.id);
      return response({ ok: true, result: await identifyJob(serviceClient, job) });
    }

    return response({ ok: true, result: await generateJob(serviceClient, job) });
  } catch (error) {
    const message = clean(error?.message || error, 1000);
    const { data: active } = await serviceClient.from("library_generation_jobs")
      .select("id")
      .in("status", ["identifying", "generating"])
      .order("updated_at", { ascending: true })
      .limit(1);
    if (active?.[0]?.id) {
      await serviceClient.from("library_generation_jobs").update({
        status: "failed",
        progress: 0,
        error_code: "worker_failed",
        error_message: message
      }).eq("id", active[0].id);
    }
    return response({ error: "worker_failed", message }, 500);
  }
});
