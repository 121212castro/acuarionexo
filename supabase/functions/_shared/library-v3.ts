import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export type SourceItem = { name: string; url: string; source_type?: string; original?: unknown; used_for?: string; confidence?: number | null; consulted_at?: string };
export const biologicalTypes = new Set(["pez_marino", "pez_dulce", "coral", "invertebrado", "planta", "microfauna"]);
export const productTypes = new Set(["producto", "medicamento", "sal", "aditivo", "alimento", "test", "equipamiento"]);
export const statuses = ["identified", "draft", "review", "validated", "published"];

export const contracts: Record<string, string[]> = {
  pez_marino: ["title","scientific_name","common_names","synonyms","family","order_name","class_name","distribution","habitat","depth_range","natural_environment","adult_size_cm","life_expectancy_years","minimum_tank_liters","recommended_tank_liters","tank_maturity","temperature_min","temperature_max","ph_min","ph_max","kh_min","kh_max","salinity_min","salinity_max","nitrate_max","phosphate_max","diet","feeding_frequency","feeding_notes","behavior","aggressiveness","territoriality","social_behavior","compatibility","fish_compatibility","coral_compatibility","invertebrate_compatibility","reef_safe","reef_safe_notes","care_level","beginner_suitable","acclimation","common_diseases","health_notes","reproduction","purchase_recommendations","common_mistakes","curiosities","ai_notes","user_summary","sources"],
  pez_dulce: ["title","scientific_name","common_names","synonyms","family","order_name","class_name","distribution","habitat","natural_environment","adult_size_cm","life_expectancy_years","minimum_tank_liters","recommended_tank_liters","temperature_min","temperature_max","ph_min","ph_max","gh_min","gh_max","kh_min","kh_max","diet","feeding_frequency","feeding_notes","behavior","aggressiveness","territoriality","schooling","swimming_zone","compatibility","plant_compatibility","invertebrate_compatibility","care_level","beginner_suitable","acclimation","common_diseases","health_notes","reproduction","breeding_notes","purchase_recommendations","common_mistakes","curiosities","ai_notes","user_summary","sources"],
  coral: ["title","scientific_name","common_names","synonyms","family","distribution","habitat","depth_range","natural_environment","coral_type","growth_form","lighting","par_range","flow","placement","aggressiveness","sweeper_tentacles","growth_rate","adult_size_cm","feeding","feeding_frequency","photosynthetic","reef_safe","compatibility","fish_compatibility","invertebrate_compatibility","temperature_min","temperature_max","salinity_min","salinity_max","ph_min","ph_max","kh_min","kh_max","calcium_min","calcium_max","magnesium_min","magnesium_max","nitrate_range","phosphate_range","care_level","beginner_suitable","fragging","propagation","common_problems","pests","purchase_recommendations","common_mistakes","curiosities","ai_notes","user_summary","sources"],
  invertebrado: ["title","scientific_name","common_names","synonyms","family","distribution","habitat","natural_environment","adult_size_cm","minimum_tank_liters","temperature_min","temperature_max","ph_min","ph_max","salinity_min","salinity_max","kh_min","kh_max","diet","feeding","feeding_frequency","behavior","aggressiveness","territoriality","reef_safe","reef_safe_notes","coral_compatibility","fish_compatibility","invertebrate_compatibility","molting","iodine_sensitivity","copper_sensitivity","care_level","beginner_suitable","acclimation","common_problems","reproduction","purchase_recommendations","common_mistakes","curiosities","ai_notes","user_summary","sources"],
  planta: ["title","scientific_name","common_names","synonyms","family","distribution","habitat","natural_environment","plant_type","growth_rate","height_cm","placement","temperature_min","temperature_max","ph_min","ph_max","gh_min","gh_max","kh_min","kh_max","lighting","co2","fertilization","substrate","propagation","maintenance","trimming","compatibility","fish_compatibility","invertebrate_compatibility","care_level","beginner_suitable","common_problems","algae_risk","purchase_recommendations","common_mistakes","curiosities","ai_notes","user_summary","sources"],
  microfauna: ["title","scientific_name","common_names","culture_type","identification","use_in_aquarium","target_animals","culture_method","container","temperature_min","temperature_max","salinity_min","salinity_max","feeding","feeding_frequency","harvest","harvest_frequency","maintenance","water_changes","density_control","crash_risks","contamination_risks","storage","care_level","common_problems","common_mistakes","ai_notes","user_summary","sources"],
  producto: ["title","manufacturer","brand","product_code","category","composition","active_components","intended_use","dose","dose_calculation","use","instructions","monitoring","compatibility","risks","warnings","storage","expiry","aquarium_type","source_label","ai_notes","user_summary","sources"],
  sal: ["title","manufacturer","brand","product_code","composition","declared_parameters","salinity_reference","grams_per_liter","mixing","mixing_time","dose","dose_calculation","use","water_change_use","monitoring","compatibility","risks","storage","expiry","aquarium_type","source_label","ai_notes","user_summary","sources"],
  aditivo: ["title","manufacturer","brand","product_code","composition","active_components","what_corrects","parameter_target","dose","dose_calculation","maximum_dose","use","instructions","monitoring","compatibility","risks","warnings","storage","expiry","aquarium_type","source_label","ai_notes","user_summary","sources"],
  alimento: ["title","manufacturer","brand","product_code","food_type","composition","analysis","particle_size","target_species","feeding_frequency","dose","use","instructions","compatibility","risks","storage","expiry","aquarium_type","source_label","ai_notes","user_summary","sources"],
  medicamento: ["title","manufacturer","brand","product_code","active_ingredient","indications","target_diseases","dose","dose_calculation","treatment_days","repeat_treatment","remove_equipment","water_change_after","monitoring","compatibility","contraindications","risks","warnings","storage","expiry","hospital_tank_use","source_label","ai_notes","user_summary","sources"],
  test: ["title","manufacturer","brand","product_code","parameter","method","range","resolution","scale_values","sample_volume","reagents","procedure","reading_time","interpretation","interferences","expiry","storage","compatibility","acuarionexo_mapping","common_errors","source_label","ai_notes","user_summary","sources"],
  equipamiento: ["title","manufacturer","brand","product_code","equipment_type","specifications","power","consumption_watts","flow","volume","tank_size_recommended","installation","setup","maintenance","cleaning_frequency","spare_parts","compatibility","risks","warnings","warranty","source_manual","ai_notes","user_summary","sources"]
};

const numericOrShortFields = new Set(["title","scientific_name","manufacturer","brand","product_code","family","order_name","class_name","common_names","synonyms","adult_size_cm","height_cm","life_expectancy_years","minimum_tank_liters","recommended_tank_liters","temperature_min","temperature_max","ph_min","ph_max","gh_min","gh_max","kh_min","kh_max","salinity_min","salinity_max","nitrate_max","phosphate_max","calcium_min","calcium_max","magnesium_min","magnesium_max","reef_safe","beginner_suitable","care_level","feeding_frequency","reading_time","sample_volume","resolution","range","method","power","flow","volume","consumption_watts","grams_per_liter","mixing_time","treatment_days","expiry","source_label","sources"]);

export const contractSections: Record<string, string[]> = {
  identidad: ["title","scientific_name","common_names","synonyms","manufacturer","brand","product_code","family","order_name","class_name","category","equipment_type","food_type","culture_type","coral_type","plant_type"],
  habitat: ["distribution","habitat","depth_range","natural_environment"],
  acuario: ["minimum_tank_liters","recommended_tank_liters","tank_maturity","tank_size_recommended","aquarium_type","placement","substrate"],
  parametros: ["temperature_min","temperature_max","ph_min","ph_max","gh_min","gh_max","kh_min","kh_max","salinity_min","salinity_max","nitrate_max","phosphate_max","calcium_min","calcium_max","magnesium_min","magnesium_max","nitrate_range","phosphate_range","declared_parameters","salinity_reference","grams_per_liter","parameter","parameter_target","range","resolution","scale_values"],
  alimentacion: ["diet","feeding","feeding_frequency","feeding_notes","target_species","composition","analysis","particle_size"],
  comportamiento: ["behavior","aggressiveness","territoriality","social_behavior","schooling","swimming_zone","growth_form","growth_rate","photosynthetic","sweeper_tentacles"],
  compatibilidad: ["compatibility","fish_compatibility","coral_compatibility","invertebrate_compatibility","plant_compatibility","reef_safe","reef_safe_notes"],
  salud_mantenimiento: ["acclimation","common_diseases","health_notes","common_problems","pests","molting","iodine_sensitivity","copper_sensitivity","maintenance","trimming","fertilization","co2","lighting","par_range","flow","fragging","propagation","reproduction","breeding_notes"],
  uso_dosis: ["active_components","active_ingredient","intended_use","use","instructions","dose","dose_calculation","maximum_dose","mixing","water_change_use","monitoring","indications","target_diseases","repeat_treatment","remove_equipment","water_change_after","hospital_tank_use","procedure","interpretation","interferences","acuarionexo_mapping"],
  riesgos: ["risks","warnings","contraindications","crash_risks","contamination_risks","algae_risk","common_mistakes","common_errors"],
  compra: ["purchase_recommendations","storage","expiry","warranty","spare_parts","source_manual"],
  ia_usuario: ["user_summary","ai_notes","curiosities"]
};

export const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
export function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
export function errorJson(code: string, message: string, status = 400, details?: unknown) { return json({ error: code, message, details }, status); }
export function clean(value: unknown, max = 5000) { return String(value ?? "").trim().slice(0, max); }
function jsonCandidate(text: string) { return text.match(/```json\s*([\s\S]*?)```/i)?.[1] || text.match(/\{[\s\S]*\}/)?.[0] || text; }
export function extractJson(text: string) { return JSON.parse(jsonCandidate(text)); }
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
    `Apartados de referencia: ${JSON.stringify(contractSections)}.`,
    "sources debe incluir URLs reales y used_for explicando qué dato justifica cada fuente."
  ].join("\n");
}

function fieldIsPoor(field: string, value: unknown) {
  if (value == null || value === "" || (Array.isArray(value) && !value.length)) return true;
  if (numericOrShortFields.has(field)) return false;
  if (typeof value === "number" || typeof value === "boolean") return false;
  const text = clean(value, 5000);
  if (text.length < 35) return true;
  if (/\b(bajo|medio|alto|moderado|normalmente|suele|aproximadamente)\b/i.test(text)) return true;
  if (/requiere buena calidad de agua|mantener par[aá]metros estables|alimentaci[oó]n variada|compatible con peces pac[ií]ficos/i.test(text)) return true;
  return false;
}

export function auditEntry(entry: any) {
  const errors: string[] = []; const warnings: string[] = []; const sources = normalizeSources(entry.sources); const data = entry.data && typeof entry.data === "object" ? entry.data : {}; const required = contracts[entry.entry_type] || ["title", "sources"];
  const missing = required.filter(field => { if (field === "sources") return sources.length < 2; const value = data[field] ?? entry[field]; return value == null || value === "" || (Array.isArray(value) && !value.length); });
  const poor = required.filter(field => field !== "sources" && !missing.includes(field) && fieldIsPoor(field, data[field] ?? entry[field]));
  if (!entry.identity_confirmed) errors.push("Identificación insuficiente.");
  if (biologicalTypes.has(entry.entry_type) && !concreteScientificName(entry.scientific_name)) errors.push("La ficha biológica no tiene una especie concreta.");
  if (sources.length < 2) errors.push("Se requieren al menos dos URLs reales.");
  if (missing.length) errors.push(`Campos obligatorios incompletos: ${missing.join(", ")}.`);
  if (poor.length) errors.push(`Campos pobres o genéricos: ${poor.join(", ")}.`);
  const text = JSON.stringify(data);
  [/requiere buena calidad de agua/i,/mantener par[aá]metros estables/i,/alimentaci[oó]n variada/i,/compatible con peces pac[ií]ficos/i,/\b(bajo|medio|alto|moderado|normalmente|suele|aproximadamente)\b/i].forEach(pattern => { const match = text.match(pattern); if (match) warnings.push(`Frase genérica o imprecisa: ${match[0]}.`); });
  if (entry.entry_type === "pez_marino" && /\bGH\b/i.test(text)) errors.push("GH no es un parámetro contractual para pez marino.");
  return { approved: errors.length === 0, errors, warnings, missing_fields: missing, poor_fields: poor, source_count: sources.length, sources };
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
