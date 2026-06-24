import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export type SourceItem = { name: string; url: string; source_type?: string; original?: unknown; used_for?: string; confidence?: number | null; consulted_at?: string };
export const biologicalTypes = new Set(["pez_marino", "pez_dulce", "coral", "invertebrado", "planta", "microfauna"]);
export const productTypes = new Set(["producto", "medicamento", "sal", "aditivo", "alimento", "test", "equipamiento"]);
export const statuses = ["identified", "draft", "review", "validated", "published"];
export const contracts: Record<string, string[]> = {
  pez_marino: ["title","scientific_name","family","order_name","class_name","distribution","adult_size_cm","minimum_tank_liters","temperature_min","temperature_max","ph_min","ph_max","salinity_min","salinity_max","diet","behavior","compatibility","reef_safe","care_level","sources"],
  pez_dulce: ["title","scientific_name","family","order_name","class_name","distribution","adult_size_cm","minimum_tank_liters","temperature_min","temperature_max","ph_min","ph_max","diet","behavior","compatibility","care_level","sources"],
  coral: ["title","scientific_name","family","distribution","lighting","flow","placement","growth_rate","aggressiveness","reef_safe","sources"],
  invertebrado: ["title","scientific_name","family","distribution","reef_safe","molting","feeding","behavior","sources"],
  planta: ["title","scientific_name","family","distribution","lighting","co2","growth_rate","placement","sources"],
  microfauna: ["title","scientific_name","culture_method","feeding","harvest","use_in_aquarium","sources"],
  producto: ["title","manufacturer","product_code","composition","dose","use","monitoring","risks","sources"],
  sal: ["title","manufacturer","product_code","composition","dose","use","monitoring","risks","sources"],
  aditivo: ["title","manufacturer","product_code","composition","dose","use","monitoring","risks","sources"],
  alimento: ["title","manufacturer","product_code","composition","dose","use","monitoring","risks","sources"],
  medicamento: ["title","manufacturer","product_code","active_ingredient","dose","treatment_days","remove_equipment","monitoring","risks","sources"],
  test: ["title","manufacturer","product_code","parameter","range","resolution","interpretation","sources"],
  equipamiento: ["title","manufacturer","product_code","power","flow","volume","maintenance","sources"]
};
export const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
export function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
export function errorJson(code: string, message: string, status = 400, details?: unknown) { return json({ error: code, message, details }, status); }
export function clean(value: unknown, max = 5000) { return String(value ?? "").trim().slice(0, max); }
export function extractJson(text: string) { const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1]; return JSON.parse(fenced || text.match(/\{[\s\S]*\}/)?.[0] || text); }
export function urlsFromAny(value: unknown, found: string[] = []): string[] {
  if (value == null) return found;
  if (typeof value === "string") (value.match(/https?:\/\/[^\s<>"')\]]+/gi) || []).forEach(url => found.push(url.replace(/[.,;:]+$/, "")));
  else if (Array.isArray(value)) value.forEach(item => urlsFromAny(item, found));
  else if (typeof value === "object") Object.values(value as Record<string, unknown>).forEach(item => urlsFromAny(item, found));
  return found;
}
export function realUrl(value: unknown) { return urlsFromAny(value).some(url => { try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname.includes("."); } catch (_) { return false; } }); }
export function normalizeSources(value: unknown): SourceItem[] {
  const raw = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  return raw.map((source: any, index) => {
    const item = typeof source === "string" ? { url: source } : (source || {});
    const url = urlsFromAny(item.url || item)[0] || "";
    let hostname = ""; try { hostname = new URL(url).hostname; } catch (_) {}
    return { name: clean(item.name || item.title || hostname || `Fuente ${index + 1}`, 180), url, source_type: clean(item.source_type || item.type, 80), original: item.original || item, used_for: clean(item.used_for, 500), confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : null, consulted_at: item.consulted_at || new Date().toISOString() };
  }).filter(source => { if (!realUrl(source.url) || seen.has(source.url)) return false; seen.add(source.url); return true; }).slice(0, 20);
}
export function concreteScientificName(value: unknown) { const name = clean(value, 200); return /^[A-Z][a-z-]+ [a-z][a-z-]+(?:\s+var\.\s+[a-z-]+)?$/.test(name) && !/\b(?:spp?|cf|aff)\.?\b/i.test(name); }
export function auditEntry(entry: any) {
  const errors: string[] = []; const warnings: string[] = []; const sources = normalizeSources(entry.sources); const data = entry.data && typeof entry.data === "object" ? entry.data : {}; const required = contracts[entry.entry_type] || ["title", "sources"];
  const missing = required.filter(field => { if (field === "sources") return sources.length < 2; const value = data[field] ?? entry[field]; return value == null || value === "" || (Array.isArray(value) && !value.length); });
  if (!entry.identity_confirmed) errors.push("Identificación insuficiente.");
  if (biologicalTypes.has(entry.entry_type) && !concreteScientificName(entry.scientific_name)) errors.push("La ficha biológica no tiene una especie concreta.");
  if (sources.length < 2) errors.push("Se requieren al menos dos URLs reales.");
  if (missing.length) errors.push(`Campos obligatorios incompletos: ${missing.join(", ")}.`);
  const text = JSON.stringify(data);
  [/requiere buena calidad de agua/i,/mantener par[aá]metros estables/i,/alimentaci[oó]n variada/i,/compatible con peces pac[ií]ficos/i,/\b(bajo|medio|alto|moderado|normalmente|suele|aproximadamente)\b/i].forEach(pattern => { const match = text.match(pattern); if (match) warnings.push(`Frase genérica o imprecisa: ${match[0]}.`); });
  if (entry.entry_type === "pez_marino" && /\bGH\b/i.test(text)) errors.push("GH no es un parámetro contractual para pez marino.");
  return { approved: errors.length === 0, errors, warnings, missing_fields: missing, source_count: sources.length, sources };
}
export async function authenticatedClients(req: Request) {
  const authHeader = req.headers.get("Authorization") || ""; if (!authHeader) throw new Error("AUTH_REQUIRED");
  const url = Deno.env.get("SUPABASE_URL")!; const anon = Deno.env.get("SUPABASE_ANON_KEY")!; const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await userClient.auth.getUser(); if (error || !data.user) throw new Error("AUTH_REQUIRED");
  return { user: data.user, userClient, serviceClient: createClient(url, service) };
}
export async function openAiJson(system: string, prompt: string, imageUrl = "") {
  const apiKey = Deno.env.get("OPENAI_API_KEY"); if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");
  const model = clean(Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini", 80);
  const content: any[] = [{ type: "input_text", text: prompt }]; if (imageUrl) content.push({ type: "input_image", image_url: imageUrl, detail: "high" });
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, input: [{ role: "system", content: system }, { role: "user", content }], tools: [{ type: "web_search_preview" }], tool_choice: { type: "web_search_preview" }, temperature: 0.1 }) });
  if (!response.ok) throw new Error(`OPENAI_${response.status}:${(await response.text()).slice(0, 800)}`);
  const output = await response.json(); const text = output.output_text || output.output?.flatMap((item: any) => item.content || []).map((part: any) => part.text || "").join("\n") || "";
  return { parsed: extractJson(text), model };
}
