import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { LIBRARY_CONTRACT } from "./library-contract.generated.ts";

export type SourceItem = { name: string; url: string; source_type?: string; original?: unknown; used_for?: string; confidence?: number | null; consulted_at?: string };
export const biologicalTypes = new Set<string>(LIBRARY_CONTRACT.biologicalTypes);
export const productTypes = new Set<string>(LIBRARY_CONTRACT.productTypes);
export const statuses = [...LIBRARY_CONTRACT.statuses];
export const contracts: Record<string, string[]> = Object.fromEntries(
  Object.entries(LIBRARY_CONTRACT.contracts).map(([type, fields]) => [type, [...fields]])
);
const fieldRules = LIBRARY_CONTRACT.fieldRules as Record<string, Record<string, {
  id: string;
  label: string;
  section: string;
  type: string;
  minLength: number;
  allowed: readonly string[] | null;
  validator: string | null;
}>>;

function contractSectionsFor(entryType: string) {
  return Object.values(fieldRules[entryType] || {}).reduce((sections, field) => {
    const section = field.section || "identity";
    (sections[section] ||= []).push(field.id);
    return sections;
  }, {} as Record<string, string[]>);
}

export const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
export function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
export function errorJson(code: string, message: string, status = 400, details?: unknown) { return json({ error: code, message, details }, status); }
export function clean(value: unknown, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function jsonCandidate(text: string) {
  const source = text.match(/```json\s*([\s\S]*?)```/i)?.[1] || text;
  const start = source.indexOf("{");
  if (start < 0) return source;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return source.slice(start);
}
export function extractJson(text: string) { return JSON.parse(jsonCandidate(text)); }
export function urlsFromAny(value: unknown, found: string[] = []): string[] {
  if (value == null) return found;
  if (typeof value === "string") (value.match(/https?:\/\/[^\s<>"')\]]+/gi) || []).forEach(url => found.push(url.replace(/[.,;:]+$/, "")));
  else if (Array.isArray(value)) value.forEach(item => urlsFromAny(item, found));
  else if (typeof value === "object") Object.values(value as Record<string, unknown>).forEach(item => urlsFromAny(item, found));
  return found;
}
export function realUrl(value: unknown) { return urlsFromAny(value).some(url => { try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname.includes("."); } catch (_) { return false; } }); }
function canonicalSourceKey(value: string) {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    [...parsed.searchParams.keys()].forEach(key => {
      if (/^utm_/i.test(key) || /^(fbclid|gclid|dclid|msclkid)$/i.test(key)) parsed.searchParams.delete(key);
    });
    if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString();
  } catch (_) {
    return value;
  }
}
export function normalizeSources(value: unknown): SourceItem[] {
  const raw = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  return raw.map((source: any, index) => {
    const item = typeof source === "string" ? { url: source } : (source || {});
    const url = urlsFromAny(item.url || item)[0] || "";
    let hostname = ""; try { hostname = new URL(url).hostname; } catch (_) {}
    return { name: clean(item.name || item.title || hostname || `Fuente ${index + 1}`, 180), url, source_type: clean(item.source_type || item.type, 80), original: item.original || item, used_for: clean(item.used_for, 500), confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : null, consulted_at: item.consulted_at || new Date().toISOString() };
  }).filter(source => { const key = canonicalSourceKey(source.url); if (!realUrl(source.url) || seen.has(key)) return false; seen.add(key); return true; }).slice(0, 20);
}
const sourceConfiguration = LIBRARY_CONTRACT.sourcePolicy;
const sourceDomains = sourceConfiguration.specializedDomains as Record<string, readonly string[]>;
const minimumSources = Number(sourceConfiguration.minimumSources);
const minimumIndependentSources = Number(sourceConfiguration.minimumIndependentSources);
const officialSourceType = new RegExp(sourceConfiguration.officialSourcePattern, "i");
const weakSourceDomain = new RegExp(sourceConfiguration.weakSourceDomainPattern, "i");
function sourceHostname(source: SourceItem) { try { return new URL(source.url).hostname.toLowerCase().replace(/^www\./, ""); } catch (_) { return ""; } }
function matchesDomain(hostname: string, domains: readonly string[]) { return domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`)); }
export function sourcePolicy(entryType: string, value: unknown) {
  const sources = normalizeSources(value);
  const errors: string[] = [];
  if (sources.length < minimumSources) errors.push(`Se requieren al menos ${minimumSources} fuentes reales con URL completa.`);
  if (sources.some(source => !clean(source.used_for, 500))) errors.push("Cada fuente debe indicar en used_for qué datos respalda.");
  const specializedDomains = sourceDomains[entryType] || [];
  const hasSpecialized = sources.some(source => matchesDomain(sourceHostname(source), specializedDomains));
  if (biologicalTypes.has(entryType) && !hasSpecialized) {
    errors.push("Falta una base especializada obligatoria para esta categoría.");
  }
  if (productTypes.has(entryType)) {
    const hasOfficial = sources.some(source => officialSourceType.test(`${source.source_type || ""} ${source.name || ""}`) && !weakSourceDomain.test(sourceHostname(source)));
    if (!hasOfficial) errors.push("Falta una fuente oficial del fabricante, manual, prospecto o ficha técnica.");
  }
  const reliableHosts = new Set(sources.map(sourceHostname).filter(hostname => hostname && !weakSourceDomain.test(hostname)));
  if (reliableHosts.size < minimumIndependentSources) errors.push(`Se requieren al menos ${minimumIndependentSources} fuentes fiables que no sean Wikipedia, redes sociales o marketplaces.`);
  return { approved: errors.length === 0, errors, sources, source_count: sources.length, has_specialized: hasSpecialized };
}
export function concreteScientificName(value: unknown) { const name = clean(value, 200); return /^[A-Z][a-z-]+ [a-z][a-z-]+(?:\s+var\.\s+[a-z-]+)?$/.test(name) && !/\b(?:spp?|cf|aff)\.?\b/i.test(name); }
export function multiTaxonMicrofauna(entry: any) {
  if (entry?.entry_type !== "microfauna") return false;
  const taxa = clean(entry?.scientific_name, 500).split(/\s*\+\s*/).map(value => value.trim()).filter(Boolean);
  if (taxa.length < 2) return false;
  const validTaxon = (taxon: string) => concreteScientificName(taxon) || /^[A-Z][a-z-]+(?:\s+spp?\.)?$/.test(taxon);
  const description = `${clean(entry?.data?.culture_type, 500)} ${clean(entry?.data?.identification, 2000)}`;
  return taxa.every(validTaxon) && /\b(mezcla|multiespec[ií]fic[ao])\b/i.test(description);
}

export function contractPrompt(entryType: string, fields: string[]) {
  return [
    `Contrato obligatorio para ${entryType}: ${fields.join(", ")}.`,
    "Rellena TODOS los campos del contrato dentro de data, salvo title, scientific_name, summary y sources, que también deben ir en raíz cuando corresponda.",
    "Cada campo textual importante debe tener información útil para usuario e IA: explicación concreta, condiciones, valores, advertencias y aplicación práctica en acuario.",
    "No aceptes fichas pobres: nada de frases cortas genéricas. Evita textos tipo 'requiere buena calidad de agua', 'mantener parámetros estables', 'alimentación variada', 'compatible con peces pacíficos'.",
    "No uses bajo, medio, alto, moderado, suele, normalmente ni aproximadamente. Si existe rango, escribe valores concretos con unidad.",
    "Si un dato no se puede verificar en fuentes, devuelve null, pero no sustituyas con relleno genérico.",
    "Añade user_summary: resumen claro para el usuario final. Añade ai_notes: datos estructurados para que la IA pueda tomar decisiones después.",
    "Devuelve sections agrupadas por apartados legibles para mostrar la ficha completa.",
    `Apartados de referencia: ${JSON.stringify(contractSectionsFor(entryType))}.`,
    "sources debe incluir al menos tres URLs reales y used_for explicando qué dato justifica cada fuente.",
    "Fuentes obligatorias: una oficial o primaria, una base especializada adecuada a la categoría y una tercera fuente fiable elegida por la investigación.",
    "Para productos comerciales, la fuente oficial debe ser el fabricante, manual, prospecto o ficha técnica; si no existe accesible, documenta una fuente primaria equivalente.",
    "Para peces usa FishBase, Catalog of Fishes, WoRMS cuando sea marino, IUCN o GBIF. Para plantas usa POWO, World Flora Online, Tropicos o GBIF. Para corales, invertebrados y microfauna usa WoRMS, Coral Traits, AlgaeBase, GBIF o literatura científica según corresponda.",
    "Wikipedia puede aportar información general como fuente complementaria, pero no sustituye la fuente oficial o especializada."
  ].join("\n");
}

const topLevelFields = new Set(["title", "scientific_name", "summary", "sources"]);
const numericPattern = /\d+(?:[.,]\d+)?(?:\s*(?:-|–|—|a|hasta)\s*\d+(?:[.,]\d+)?)?/i;
const urlPattern = /https?:\/\//i;
const internalTrace = /\b(entry_type|identity_confirmed|source_context|utm_source)\b/i;
const impreciseText = /\b(bajo|medio|alto|moderado|normalmente|suele|aproximadamente)\b/i;

function unique(values: string[]) {
  return [...new Set(values.map(value => clean(value, 2000)).filter(Boolean))];
}

function valueFor(entry: any, field: string) {
  if (topLevelFields.has(field)) return entry?.[field];
  return entry?.data?.[field] ?? entry?.[field];
}

function isMultiTaxonFlexibleField(entry: any, field: string) {
  return multiTaxonMicrofauna(entry) && [
    "scientific_name",
    "temperature_min",
    "temperature_max",
    "salinity_min",
    "salinity_max"
  ].includes(field);
}

function validateGeneratedField(entry: any, field: string) {
  if (field === "sources") return sourcePolicy(entry.entry_type, entry.sources).errors.join(" ");
  const rule = fieldRules[entry.entry_type]?.[field];
  if (!rule) return "El campo no existe en el contrato generado.";
  const value = valueFor(entry, field);
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return "Campo obligatorio vacío.";
  if (rule.allowed?.length && !rule.allowed.includes(clean(value, 500))) {
    return `Valor no permitido. Usa exactamente: ${rule.allowed.join(" | ")}.`;
  }
  if (rule.validator === "scientificName" && !isMultiTaxonFlexibleField(entry, field) && !concreteScientificName(value)) {
    return "Debe ser una especie concreta con binomio científico válido.";
  }
  const text = clean(typeof value === "object" ? JSON.stringify(value) : value, 10000);
  if (rule.type === "number" && !isMultiTaxonFlexibleField(entry, field) && !numericPattern.test(text)) {
    return "Debe incluir un valor numérico o rango concreto.";
  }
  if (rule.type !== "number" && !rule.allowed?.length && text.length < Number(rule.minLength || 1)) {
    return `Debe tener al menos ${Number(rule.minLength || 1)} caracteres.`;
  }
  if (urlPattern.test(text)) return "Las URLs solo pueden aparecer en Fuentes.";
  if (internalTrace.test(text)) return "Contiene trazas internas de la aplicación.";
  return "";
}

export function auditEntry(entry: any) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const type = clean(entry?.entry_type, 80);
  const required = contracts[type] || ["title", "sources"];
  const missing: string[] = [];
  const invalid: string[] = [];

  if (!statuses.includes(entry?.status)) errors.push("Estado no permitido.");
  if (!entry?.identity_confirmed) errors.push("Identificación insuficiente.");
  if (biologicalTypes.has(type) && !multiTaxonMicrofauna(entry) && !concreteScientificName(entry?.scientific_name)) {
    errors.push("La ficha biológica no tiene una especie concreta.");
  }

  for (const field of required) {
    const error = validateGeneratedField(entry, field);
    if (!error) continue;
    const value = valueFor(entry, field);
    if (field === "sources" || value == null || value === "" || (Array.isArray(value) && value.length === 0)) missing.push(field);
    else invalid.push(field);
    const rule = fieldRules[type]?.[field];
    errors.push(`${rule?.section || "Contrato"} · ${rule?.label || field}: ${error}`);
  }

  const summary = clean(entry?.summary ?? entry?.sections?.summary, 5000);
  if (!summary) {
    errors.push("Resumen · Resumen: Campo obligatorio vacío.");
    missing.push("summary");
  } else if (summary.length < 20) {
    errors.push("Resumen · Resumen: Debe tener al menos 20 caracteres.");
    invalid.push("summary");
  }
  if (urlPattern.test(summary)) errors.push("Resumen · Resumen: Las URLs solo pueden aparecer en Fuentes.");

  const narrativeText = JSON.stringify({ summary, data: entry?.data || {} });
  const impreciseMatch = narrativeText.match(impreciseText);
  if (impreciseMatch) warnings.push(`Revisar expresión contextual: ${impreciseMatch[0]}.`);
  if (type === "pez_marino" && /\bGH\b/i.test(JSON.stringify(entry?.data || {}))) {
    errors.push("GH no es un parámetro contractual para pez marino.");
  }

  const sources = normalizeSources(entry?.sources);
  return {
    approved: unique(errors).length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
    missing_fields: unique(missing),
    poor_fields: unique(invalid),
    source_count: sources.length,
    sources,
    contract_version: "generated-client-parity-v1"
  };
}
export async function authenticatedClients(req: Request) {
  const authHeader = req.headers.get("Authorization") || ""; if (!authHeader) throw new Error("AUTH_REQUIRED");
  const url = Deno.env.get("SUPABASE_URL")!; const anon = Deno.env.get("SUPABASE_ANON_KEY")!; const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await userClient.auth.getUser(); if (error || !data.user) throw new Error("AUTH_REQUIRED");
  return { user: data.user, userClient, serviceClient: createClient(url, service) };
}
async function repairJsonWithModel(apiKey: string, model: string, brokenText: string, originalError: unknown) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: "Eres un reparador estricto de JSON. Devuelve solo JSON válido. No añadas explicación, markdown ni texto fuera del JSON." },
        { role: "user", content: [{ type: "input_text", text: `Error al parsear: ${String(originalError)}\n\nRepara este contenido para que sea JSON válido sin cambiar el significado:\n${brokenText.slice(0, 60000)}` }] }
      ],
      temperature: 0
    })
  });
  if (!response.ok) throw new Error(`OPENAI_REPAIR_${response.status}:${(await response.text()).slice(0, 800)}`);
  const output = await response.json();
  const repaired = output.output_text || output.output?.flatMap((item: any) => item.content || []).map((part: any) => part.text || "").join("\n") || "";
  return extractJson(repaired);
}
export async function openAiJson(system: string, prompt: string, imageUrl = "") {
  const apiKey = Deno.env.get("OPENAI_API_KEY"); if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");
  const model = clean(Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini", 80);
  const content: any[] = [{ type: "input_text", text: `${prompt}\n\nDevuelve SOLO JSON válido. No uses markdown. No escribas comentarios. No dejes comas, corchetes ni llaves sin cerrar.` }];
  if (imageUrl) content.push({ type: "input_image", image_url: imageUrl, detail: "high" });
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, input: [{ role: "system", content: system }, { role: "user", content }], tools: [{ type: "web_search_preview" }], tool_choice: { type: "web_search_preview" }, temperature: 0.1 }) });
  if (!response.ok) throw new Error(`OPENAI_${response.status}:${(await response.text()).slice(0, 800)}`);
  const output = await response.json(); const text = output.output_text || output.output?.flatMap((item: any) => item.content || []).map((part: any) => part.text || "").join("\n") || "";
  try {
    return { parsed: extractJson(text), model };
  } catch (parseError) {
    return { parsed: await repairJsonWithModel(apiKey, model, text, parseError), model };
  }
}

function responseText(output: any) {
  return output?.output_text || output?.output?.flatMap((item: any) => item.content || []).map((part: any) => part.text || "").join("\n") || "";
}

export async function startOpenAiJsonBackground(system: string, prompt: string, imageUrl = "", previousResponseId = "") {
  const apiKey = Deno.env.get("OPENAI_API_KEY"); if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");
  const model = clean(Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini", 80);
  const content: any[] = [{ type: "input_text", text: `${prompt}\n\nDevuelve SOLO JSON válido. No uses markdown. No escribas comentarios. No dejes comas, corchetes ni llaves sin cerrar.` }];
  if (imageUrl) content.push({ type: "input_image", image_url: imageUrl, detail: "high" });
  const body: any = {
    model,
    input: previousResponseId
      ? [{ role: "user", content }]
      : [{ role: "system", content: system }, { role: "user", content }],
    background: true,
    store: true,
    temperature: 0.1
  };
  if (previousResponseId) body.previous_response_id = previousResponseId;
  else {
    body.tools = [{ type: "web_search_preview" }];
    body.tool_choice = { type: "web_search_preview" };
  }
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`OPENAI_BACKGROUND_${response.status}:${(await response.text()).slice(0, 800)}`);
  const output = await response.json();
  if (!output?.id) throw new Error("OPENAI_BACKGROUND_ID_MISSING");
  return { response_id: output.id, status: clean(output.status, 40) || "queued", model };
}

export async function pollOpenAiJsonBackground(responseId: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY"); if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");
  const response = await fetch(`https://api.openai.com/v1/responses/${encodeURIComponent(responseId)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }
  });
  if (!response.ok) throw new Error(`OPENAI_BACKGROUND_POLL_${response.status}:${(await response.text()).slice(0, 800)}`);
  const output = await response.json();
  const status = clean(output.status, 40);
  if (status !== "completed") {
    if (["failed", "cancelled", "incomplete"].includes(status)) {
      throw new Error(`OPENAI_BACKGROUND_${status.toUpperCase()}:${clean(output.error?.message || output.incomplete_details?.reason, 800)}`);
    }
    return { response_id: responseId, status: status || "in_progress", parsed: null };
  }
  const text = responseText(output);
  try {
    return { response_id: responseId, status, parsed: extractJson(text) };
  } catch (parseError) {
    const model = clean(Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini", 80);
    return {
      response_id: responseId,
      status,
      parsed: await repairJsonWithModel(apiKey, model, text, parseError)
    };
  }
}
