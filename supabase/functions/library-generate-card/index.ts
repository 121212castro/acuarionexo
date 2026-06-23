import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Payload = {
  title?: string;
  scientific_name?: string;
  entry_type?: string;
  notes?: string;
  cover_url?: string;
  photo_url?: string;
  source_context?: Record<string, string>;
};

type NormalizedCard = {
  title: string;
  scientific_name: string;
  entry_type: string;
  summary: string;
  tags: string[];
  candidates: unknown[];
  warnings: string[];
  confidence: string;
  identity_confirmed: boolean;
  sections: Record<string, string>;
  ai_model: string;
  sources: SourceItem[];
};

type SourceItem = {
  title?: string;
  url?: string;
  source_type?: string;
  reliability?: string;
  used_for?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const sectionMap: Record<string, string[]> = {
  pez_marino: ["summary", "identity", "habitat", "aquarium", "parameters", "behavior", "feeding", "compatibility", "reef_safe", "health", "purchase", "mistakes", "sources"],
  pez_dulce: ["summary", "identity", "habitat", "aquarium", "parameters", "behavior", "feeding", "compatibility", "breeding", "health", "purchase", "mistakes", "sources"],
  coral: ["summary", "identity", "habitat", "aquarium", "parameters", "lighting", "flow", "placement", "feeding", "compatibility", "health", "purchase", "mistakes", "sources"],
  invertebrado: ["summary", "identity", "habitat", "aquarium", "parameters", "behavior", "feeding", "compatibility", "reef_safe", "health", "purchase", "mistakes", "sources"],
  planta: ["summary", "identity", "habitat", "aquarium", "parameters", "lighting", "co2", "maintenance", "compatibility", "health", "sources"],
  microfauna: ["summary", "identity", "culture", "parameters", "feeding", "maintenance", "harvest", "risks", "sources"],
  medicamento: ["summary", "identity", "uses", "dose", "monitoring", "compatibility", "remove", "risks", "aftercare", "inventory_logic", "sources"],
  sal: ["summary", "identity", "parameters", "mixing", "use", "monitoring", "risks", "sources"],
  aditivo: ["summary", "identity", "composition", "dose", "use", "monitoring", "compatibility", "risks", "storage", "sources"],
  alimento: ["summary", "identity", "nutrition", "use", "monitoring", "compatibility", "risks", "acuarionexo_plan", "sources"],
  equipamiento: ["summary", "identity", "specs", "installation", "maintenance", "monitoring", "compatibility", "risks", "sources"],
  test: ["summary", "identity", "parameters", "reading", "range", "use", "monitoring", "risks", "storage", "sources"],
  general: ["summary", "identity", "aquarium", "parameters", "compatibility", "risks", "sources"]
};

const biologicalTypes = new Set(["pez_marino", "pez_dulce", "coral", "invertebrado", "planta", "microfauna"]);
const productTypes = new Set(["medicamento", "sal", "aditivo", "alimento", "equipamiento", "test"]);
const criticalProductSections: Record<string, string[]> = {
  medicamento: ["uses", "dose", "monitoring", "risks"],
  sal: ["parameters", "mixing", "use", "monitoring"],
  aditivo: ["dose", "use", "monitoring", "risks"],
  alimento: ["nutrition", "use", "monitoring", "risks"],
  equipamiento: ["specs", "installation", "maintenance"],
  test: ["parameters", "reading", "range", "use"]
};
const fallbackModel = "gpt-4.1-mini";
const supportedModels = new Set(["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini"]);
const forbiddenText = /pendiente de validar|completar este apartado|datos reales antes de publicar|borrador pendiente|\[object Object\]/i;
const genericText = /informaci[oó]n no disponible|no se dispone de informaci[oó]n|consultar el envase|consultar fabricante|consulte al fabricante|no hay datos suficientes|no disponible\.?$/i;

function textFrom(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textFrom).filter(Boolean).join("\n");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => {
        const text = textFrom(val);
        return text ? `${key}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return String(value);
}

function clean(value: unknown, max = 2600) {
  return textFrom(value).replace(forbiddenText, "").trim().slice(0, max);
}

function keysFor(type: string) {
  return sectionMap[type] || sectionMap.general;
}

function selectedModel() {
  const raw = clean(Deno.env.get("OPENAI_MODEL"), 80).replace(/_/g, "-").toLowerCase();
  if (!raw) return fallbackModel;
  return supportedModels.has(raw) ? raw : fallbackModel;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function jsonError(code: string, message: string, status = 500) {
  return json({ error: code, message }, status);
}

function norm(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function looksBinomial(value: string) {
  return /^[A-Z][a-z]+ [a-z][a-z-]+(?:\s|$)/.test(value.trim());
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1];
  return JSON.parse(fenced || text.match(/\{[\s\S]*\}/)?.[0] || text);
}

function sourceList(parsed: any): SourceItem[] {
  const raw = Array.isArray(parsed?.sources) ? parsed.sources : [];
  return raw.map((item: any) => ({
    title: clean(item?.title, 180),
    url: clean(item?.url, 600),
    source_type: clean(item?.source_type, 80),
    reliability: clean(item?.reliability, 80),
    used_for: clean(item?.used_for, 260)
  })).filter((item: SourceItem) => item.title || item.url).slice(0, 12);
}

function formatSources(sources: SourceItem[], fallback = "") {
  const lines = sources.map((source, idx) => {
    const title = source.title || source.url || `Fuente ${idx + 1}`;
    const type = source.source_type ? ` (${source.source_type})` : "";
    const url = source.url ? ` - ${source.url}` : "";
    const used = source.used_for ? `\nUso: ${source.used_for}` : "";
    return `${idx + 1}. ${title}${type}${url}${used}`;
  });
  return lines.join("\n") || fallback;
}

function bestCandidate(parsed: any, payload: Payload) {
  const title = norm(payload.title);
  const sciInput = norm(payload.scientific_name);
  const items = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  const candidates = [{ name: parsed?.title, scientific_name: parsed?.scientific_name }, ...items];
  return candidates.find((item: any) => {
    const sci = norm(item?.scientific_name);
    const name = norm(item?.name);
    return (title && (sci.includes(title) || name.includes(title) || title.includes(sci) || title.includes(name))) || (sciInput && sci.includes(sciInput));
  }) || candidates.find((item: any) => looksBinomial(clean(item?.scientific_name, 180))) || null;
}

function confidenceFor(parsed: any, payload: Payload, entryType: string, sections: Record<string, string>, sources: SourceItem[]) {
  let score = Number.parseFloat(String(parsed?.confidence || "0"));
  if (!Number.isFinite(score)) score = 0;
  if (score > 1) score = score / 100;
  score = Math.min(Math.max(score, 0), 1);

  const candidate = bestCandidate(parsed, payload);
  const sci = clean(parsed?.scientific_name || candidate?.scientific_name, 180);
  const title = norm(payload.title);
  const sciNorm = norm(sci);
  const hasSources = sources.some(source => /^https?:\/\//i.test(source.url || "")) || /https?:\/\//i.test(sections.sources || "");

  if (biologicalTypes.has(entryType)) {
    if (looksBinomial(sci)) score = Math.max(score, 0.62);
    if (title && sciNorm.includes(title)) score = Math.max(score, 0.84);
    if (hasSources && score >= 0.62) score = Math.max(score, 0.88);
  } else if (productTypes.has(entryType)) {
    const source = payload.source_context || {};
    if (clean(source.manufacturer, 120) || clean(source.manufacturer_url, 300)) score = Math.max(score, 0.72);
    if (clean(source.label_text, 400) || clean(source.datasheet_url, 300)) score = Math.max(score, 0.82);
    if (hasSources) score = Math.max(score, 0.84);
  }

  const confirmed = score >= 0.82 && hasSources;
  return { score: Math.round(score * 100) / 100, confirmed, scientificName: sci };
}

function normalize(parsed: any, payload: Payload, model: string): NormalizedCard {
  const entryType = clean(parsed?.entry_type, 80) || clean(payload.entry_type, 80) || "general";
  const sourceSections = parsed?.sections && typeof parsed.sections === "object" ? parsed.sections : {};
  const sources = sourceList(parsed);
  const sections: Record<string, string> = {};
  keysFor(entryType).forEach(key => {
    let text = clean((sourceSections as Record<string, unknown>)[key]);
    if (genericText.test(text)) text = "";
    sections[key] = text;
  });
  sections.sources = formatSources(sources, clean(sections.sources));

  const confidence = confidenceFor(parsed, payload, entryType, sections, sources);
  const warnings = Array.isArray(parsed?.warnings)
    ? parsed.warnings.map((w: any) => clean(w, 260)).filter(Boolean).slice(0, 10)
    : [];

  if (!confidence.confirmed) warnings.unshift("Identificacion o fuentes insuficientes: revisar antes de publicar.");
  if (!sections.sources) warnings.unshift("La IA no devolvio fuentes verificables. No se cargan datos genericos.");

  return {
    title: clean(parsed?.title, 180) || clean(payload.title, 180) || "Ficha identificada por foto",
    scientific_name: confidence.scientificName || clean(parsed?.scientific_name, 180),
    entry_type: entryType,
    summary: clean(parsed?.summary, 900) || sections.summary,
    tags: Array.isArray(parsed?.tags) ? parsed.tags.map((tag: any) => clean(tag, 60)).filter(Boolean).slice(0, 20) : [],
    candidates: Array.isArray(parsed?.candidates) ? parsed.candidates.slice(0, 6) : [],
    warnings,
    confidence: confidence.score.toFixed(2),
    identity_confirmed: confidence.confirmed,
    sections,
    ai_model: model,
    sources
  };
}

function isUsefulSection(text: unknown) {
  const value = clean(text, 1200);
  return value.length >= 24 && !genericText.test(value);
}

function validateRequiredSections(card: NormalizedCard) {
  const required = criticalProductSections[card.entry_type] || [];
  const missing = required.filter(key => !isUsefulSection(card.sections[key]));
  if (!missing.length) return "";
  const labels: Record<string, string> = {
    uses: "usos",
    dose: "dosis",
    monitoring: "mediciones / seguimiento",
    risks: "riesgos",
    parameters: "parametros objetivo",
    mixing: "preparacion",
    use: "uso",
    nutrition: "composicion / nutricion",
    specs: "especificaciones",
    installation: "instalacion",
    maintenance: "mantenimiento",
    reading: "lectura",
    range: "rango"
  };
  return missing.map(key => labels[key] || key).join(", ");
}

async function fetchText(url: string) {
  if (!/^https?:\/\//i.test(url)) return "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "AcuarioNexo/1.0" } });
    if (!res.ok) return "";
    const type = res.headers.get("content-type") || "";
    if (!/text|html|json/i.test(type)) return "";
    return (await res.text())
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6500);
  } catch (_) {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function promptFor(payload: Payload, sourceBlock: Record<string, string>, entryType: string) {
  const mode = payload.mode || "generate";
  if (mode === "identify") {
  return `IDENTIFY V1 AcuarioNexo. Solo identifica. No crees ficha completa.

Tipo solicitado: ${entryType}.
Nombre común introducido: ${clean(payload.title, 180)}.
Nombre científico/marca introducido: ${clean(payload.scientific_name, 180)}.
Notas usuario: ${clean(payload.notes, 1800)}.
Datos y fuentes aportadas: ${JSON.stringify(sourceBlock)}.

Reglas obligatorias:
- Usa búsqueda web real y, si hay foto, visión para identificar lo visible.
- No inventes.
- Si hay duda, devuelve candidatos con motivo.
- identity_confirmed solo puede ser true si hay coincidencia clara y fuentes reales con URL.
- Sin fuentes reales, identity_confirmed=false.
- No crees ficha completa.
- No rellenes cuidados, parámetros, dosis ni compatibilidad.
- Devuelve solo JSON puro, sin markdown.

Devuelve JSON con:
title, scientific_name, entry_type, summary, tags, confidence, identity_confirmed, candidates, warnings, sources, sections.

sections solo debe contener identity y sources.`;}
}
const typeRules = productTypes.has(entryType)
    ? "Es una ficha de producto/equipo. Prioridad estricta: fabricante, etiqueta, ficha tecnica, prospecto, documentacion oficial. Tiendas y foros solo sirven como apoyo, nunca como fuente principal de dosis/composicion."
    : "Es una ficha biologica/cultivo. Prioridad estricta: bases biologicas reconocidas, taxonomia aceptada, literatura/documentacion tecnica y despues foros solo como experiencia no autoritativa.";

  return `Crea una ficha tecnica AcuarioNexo en espanol usando busqueda web real y, si hay foto, vision para identificar lo visible.
Tipo de ficha: ${entryType}.
Nombre introducido por usuario: ${clean(payload.title, 180) || "SIN NOMBRE, IDENTIFICAR POR FOTO"}.
Nombre cientifico/marca introducido: ${clean(payload.scientific_name, 180)}.
Notas usuario: ${clean(payload.notes, 1800)}.
Datos y fuentes aportadas: ${JSON.stringify(sourceBlock)}.

Reglas obligatorias:
- Usa busqueda web. No rellenes por memoria si no tienes fuentes.
- ${typeRules}
- Si hay foto, primero identifica etiqueta/producto/animal/coral/planta visible y luego busca por internet para contrastar.
- Hay una sola respuesta valida: JSON puro, sin markdown.
- Las claves de sections obligatorias son: ${keysFor(entryType).join(", ")}.
- Cada sections[key] debe ser SIEMPRE un string. Nunca devuelvas objetos ni arrays dentro de sections.
- Devuelve sources como array de objetos con title, url, source_type, reliability y used_for.
- En sections.sources resume las fuentes con URLs.
- No escribas frases genericas como "informacion no disponible", "consultar fabricante" o "consultar el envase". Si no encuentras un dato, deja ese campo vacio y pon una advertencia concreta.
- No inventes dosis, parametros, composicion, compatibilidades ni URLs.
- Para productos, dosis, modo de uso, mediciones necesarias, seguimiento, composicion y riesgos solo pueden salir de fabricante, etiqueta, prospecto o ficha tecnica fiable.
- Para productos que afecten parametros del agua, sections.monitoring debe indicar que medir, cuando medir, frecuencia inicial, frecuencia de seguimiento y cuando retirar/ajustar el producto.
- Para resinas, adsorbentes, sales, aditivos, tests y medicamentos, no dejes sections.dose, sections.use ni sections.monitoring vacios si existen en la plantilla.
- Para animales, corales, plantas y microfauna no uses fabricante, SKU, referencia comercial ni prospecto salvo cultivo/producto comercial real.
- Si el usuario escribe solo una parte del nombre, busca candidatos y elige el mas probable. Ejemplo: "Ocellaris" debe contrastarse como posible Amphiprion ocellaris.
- confidence debe ser numero 0-1.
- identity_confirmed debe ser true solo si hay coincidencia clara y fuentes reales.

Devuelve JSON con: title, scientific_name, entry_type, summary, tags, confidence, identity_confirmed, candidates, warnings, sources, sections.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonError("method_not_allowed", "Metodo no permitido.", 405);

  let payload: Payload = {};
  try {
    payload = await req.json();
  } catch (_) {}

  const photoUrl = clean(payload.photo_url || payload.cover_url, 800);
  if (!clean(payload.title, 180) && !photoUrl) {
    return jsonError("missing_identity_input", "Pon un nombre o sube una foto para que la IA pueda identificar y buscar.", 400);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return jsonError("openai_key_missing", "OPENAI_API_KEY no esta configurada en Supabase Edge Function Secrets. No se genera ninguna ficha sin IA real.", 503);
  }

  const model = selectedModel();
  const s = payload.source_context || {};
  const entryType = clean(payload.entry_type, 80) || "general";
  const sourceBlock = {
    manufacturer: productTypes.has(entryType) ? clean(s.manufacturer, 180) : "",
    manufacturer_url: productTypes.has(entryType) ? clean(s.manufacturer_url, 500) : "",
    datasheet_url: clean(s.datasheet_url, 500),
    product_code: productTypes.has(entryType) ? clean(s.product_code, 180) : "",
    label_text: productTypes.has(entryType) ? clean(s.label_text, 4200) : "",
    source_notes: clean(s.source_notes, 1800),
    photo_url: clean(payload.photo_url || payload.cover_url, 800),
    manufacturer_page_excerpt: productTypes.has(entryType) ? await fetchText(clean(s.manufacturer_url, 500)) : "",
    datasheet_page_excerpt: await fetchText(clean(s.datasheet_url, 500))
  };

  const content: any[] = [{ type: "input_text", text: promptFor(payload, sourceBlock, entryType) }];
  if (photoUrl) content.push({ type: "input_image", image_url: photoUrl, detail: "high" });

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: "Eres el generador oficial de fichas de AcuarioNexo. Debes buscar en internet, contrastar fuentes, usar vision si hay imagen y devolver JSON estricto. No generes relleno ni texto generico." },
          { role: "user", content }
        ],
        tools: [{ type: "web_search_preview" }],
        tool_choice: { type: "web_search_preview" },
        temperature: 0.1
      })
    });
    if (!res.ok) {
      const detail = await res.text();
      return jsonError("openai_request_failed", `OpenAI no genero la ficha con ${model}: ${detail.slice(0, 1200)}`, 502);
    }
    const out = await res.json();
    const text = out.output_text || out.output?.flatMap((i: any) => i.content || []).map((p: any) => p.text || "").join("\n") || "";
    const normalized = normalize(extractJson(text), payload, model);
    if (!normalized.sections.sources || !/https?:\/\//i.test(normalized.sections.sources)) {
      return jsonError("sources_missing", "La IA no devolvio fuentes reales con URL. No se carga una ficha generica.", 502);
    }
    const missingCritical = validateRequiredSections(normalized);
    if (missingCritical) {
      return jsonError("critical_sections_missing", `La IA no completo apartados obligatorios para este producto: ${missingCritical}. No se carga una ficha incompleta.`, 502);
    }
    const usefulSections = Object.entries(normalized.sections).filter(([key, value]) => key !== "sources" && clean(value).length > 20).length;
    if (usefulSections < 3) {
      return jsonError("insufficient_verified_content", "La IA no encontro suficiente informacion verificable para crear una ficha util.", 502);
    }
    return json({ data: normalized });
  } catch (error) {
    return jsonError("openai_generation_failed", `No se pudo generar con IA real usando ${model}: ${String(error?.message || error)}`, 502);
  }
});
