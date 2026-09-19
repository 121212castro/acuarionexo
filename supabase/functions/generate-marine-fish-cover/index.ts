import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Jimp } from "npm:jimp@1.6.0";

const TEMPLATE = "marine-fish-master-v1-locked";
const CONTRACT_VERSION = "cover-contract-v13";
const OFFICIAL_BACKGROUND_SOURCE = "https://raw.githubusercontent.com/121212castro/acuarionexo/aff161d7b329dcb8fc08432b4f8d3a9004c4ea79/src/library/assets/marine-fish-cover-master-v1.jpg";
const GOLD = "#e7bc58";
const LIGHT_GOLD = "#f3d77c";
const clean = (value: unknown) => String(value ?? "").trim();
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

function escapeXml(value: unknown) {
  return clean(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
function tmcSkus(entry: any) {
  return clean(entry?.data?.tmc_sku).split(/[;,/\s]+/).map(clean).filter(value => /^\d{4,6}$/.test(value));
}
function cleanTitle(entry: any) { return clean(entry?.title).replace(/\s+[—-]\s+TMC\s+SKU.*$/i, "").trim(); }
function fitFont(text: string, max = 96, min = 46, budget = 1040) { return Math.max(min, Math.min(max, Math.floor(budget / Math.max(10, text.length * 0.58)))); }
function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 32768, bytes.length)));
  return btoa(binary);
}
async function officialBackgroundDataUrl() {
  const response = await fetch(`${OFFICIAL_BACKGROUND_SOURCE}?v=${Date.now()}`, { cache: "no-store", headers: { "User-Agent": "AcuarioNexo/1.0" } });
  if (!response.ok) throw new Error(`No se pudo cargar el fondo oficial (${response.status}).`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4000) throw new Error("El fondo oficial descargado no es válido.");
  const type = (response.headers.get("content-type") || "image/jpeg").split(";")[0];
  return `data:${type.startsWith("image/") ? type : "image/jpeg"};base64,${bytesToBase64(bytes)}`;
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function isolateFishCutout(sourceBytes: Uint8Array, mimeType: string, entry: any) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");

  const form = new FormData();
  form.append("model", "gpt-image-2.5-sunburst");
  form.append("image[]", new Blob([sourceBytes], { type: mimeType || "image/jpeg" }), "tmc-source");
  form.append("background", "transparent");
  form.append("output_format", "png");
  form.append("size", "1024x1024");
  form.append("quality", "medium");
  form.append("prompt", [
    "IMAGE EDIT / SUBJECT ISOLATION ONLY.",
    "Use the supplied TMC photo as the sole identity reference.",
    `Species: ${clean(entry.scientific_name)}. Common name: ${cleanTitle(entry)}.`,
    "Return the same fish specimen isolated on a fully transparent background.",
    "Preserve the exact body shape, fins, tail, markings, colors, proportions, orientation and visible anatomy from the input photo.",
    "Remove only the original photographic background.",
    "Do not invent or redesign the fish. Do not add reef, water, sand, plants, shadows, frames, text, labels or other animals.",
    "Keep translucent fins and fine fin rays instead of cutting them away.",
    "Output one complete fish, centered, with generous transparent margin."
  ].join("\n"));

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`OPENAI_IMAGE_EDIT_${response.status}:${clean(payload?.error?.message || JSON.stringify(payload), 900)}`);
  }
  const b64 = clean(payload?.data?.[0]?.b64_json, 20_000_000);
  if (!b64) throw new Error("OPENAI_IMAGE_EDIT_EMPTY");

  const isolatedBytes = base64ToBytes(b64);
  const isolated = await Jimp.read(isolatedBytes.buffer);
  const { data, width, height } = isolated.bitmap;

  let minX = width, minY = height, maxX = -1, maxY = -1, visible = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        visible++;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) throw new Error("El aislamiento visual devolvió un recorte vacío.");
  const ratio = visible / (width * height);
  if (ratio < 0.02 || ratio > 0.72) throw new Error(`Recorte visual inválido (ocupación ${ratio.toFixed(3)}).`);

  const pad = Math.max(8, Math.round(Math.max(width, height) * 0.025));
  const x0 = Math.max(0, minX - pad), y0 = Math.max(0, minY - pad);
  const x1 = Math.min(width - 1, maxX + pad), y1 = Math.min(height - 1, maxY + pad);
  isolated.crop({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });

  const png = new Uint8Array(await isolated.getBuffer("image/png"));
  return `data:image/png;base64,${bytesToBase64(png)}`;
}

function coverSvg(background: string, cutout: string, entry: any) {
  const common = cleanTitle(entry), scientific = clean(entry.scientific_name);
  const commonSize = fitFont(common, 92, 44, 1050), scientificSize = fitFont(scientific, 60, 34, 900);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
<defs><filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".82"/></filter><filter id="fishShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".34"/></filter><linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03132d" stop-opacity=".30"/><stop offset="1" stop-color="#03132d" stop-opacity="0"/></linearGradient></defs>
<image href="${background}" x="0" y="0" width="1200" height="1200" preserveAspectRatio="xMidYMid slice"/>
<rect x="0" y="0" width="1200" height="260" fill="url(#topShade)"/>
<text x="600" y="142" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, Times New Roman, serif" font-size="${commonSize}" font-weight="700" fill="${GOLD}" filter="url(#textShadow)">${escapeXml(common)}</text>
<image href="${cutout}" x="70" y="250" width="1060" height="660" preserveAspectRatio="xMidYMid meet" filter="url(#fishShadow)"/>
<text x="600" y="1040" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, Times New Roman, serif" font-size="${scientificSize}" font-style="italic" font-weight="500" fill="${LIGHT_GOLD}" filter="url(#textShadow)">${escapeXml(scientific)}</text>
</svg>`;
}

async function authorize(req: Request, entry: any, db: any, body: any) {
  const authorization = req.headers.get("authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (serviceKey && authorization === `Bearer ${serviceKey}`) return "service";
  const workerSecret = clean(body?.worker_secret);
  if (workerSecret) {
    const check = await db.rpc("verify_library_generation_worker_secret", { candidate: workerSecret });
    if (!check.error && check.data === true) return "worker";
  }
  if (!authorization.startsWith("Bearer ")) throw new Error("Falta autenticación.");
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const user = await client.auth.getUser();
  if (user.error || !user.data.user) throw new Error("Autenticación no válida.");
  if (String(entry.user_id) !== String(user.data.user.id)) throw new Error("No tienes permiso para generar esta portada.");
  return "user";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido." }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const entryId = clean(body?.entry_id);
    if (!entryId) throw new Error("Falta entry_id.");
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const query = await db.from("library_entries").select("id,user_id,title,scientific_name,entry_type,status,data,photo_url,cover_url,image_assets").eq("id", entryId).single();
    if (query.error) throw query.error;
    const entry: any = query.data;
    const authMode = await authorize(req, entry, db, body);
    if (entry.entry_type !== "pez_marino") throw new Error("Esta función solo genera portadas de peces marinos.");
    const existingTemplate = clean(entry?.image_assets?.cover?.template);
    if (["manual-approved", "manual-restored-approved"].includes(existingTemplate) && clean(entry.cover_url)) return json({ ok: true, auth_mode: authMode, preserved_manual_cover: true, entry });
    if (!clean(entry.photo_url)) throw new Error("La ficha no tiene foto interior.");
    const skus = tmcSkus(entry), photo = entry?.image_assets?.photo || {};
    const evidence = [photo.source_name, photo.source_url, photo.source_page].map(clean).join(" ");
    if (skus.length && !photo.exact_sku) throw new Error("La foto no está validada para el SKU exacto.");
    if (skus.length && !skus.some((sku: string) => evidence.includes(sku))) throw new Error("La trazabilidad de la foto no contiene el SKU exacto.");
    const normalizedPhotoUrl = clean(entry.photo_url).replace(/\\\//g, "/");
    const photoResponse = await fetch(normalizedPhotoUrl, { cache: "no-store" });
    if (!photoResponse.ok) throw new Error(`No se pudo cargar la foto interior (${photoResponse.status}).`);
    const bytes = new Uint8Array(await photoResponse.arrayBuffer());
    if (bytes.length < 4000 || bytes.length > 20 * 1024 * 1024) throw new Error("Tamaño de foto no válido.");
    const photoMime = (photoResponse.headers.get("content-type") || "image/jpeg").split(";")[0];
    const cutout = await isolateFishCutout(bytes, photoMime.startsWith("image/") ? photoMime : "image/jpeg", entry);
    const background = await officialBackgroundDataUrl();
    const svg = coverSvg(background, cutout, entry);
    const stamp = Date.now();
    const path = `library/${entry.user_id}/organismos/cover-master-${entry.id}-${stamp}.svg`;
    const upload = await db.storage.from("library-generated-covers").upload(path, new Blob([svg], { type: "image/svg+xml" }), { upsert: true, contentType: "image/svg+xml", cacheControl: "0" });
    if (upload.error) throw upload.error;
    const coverUrl = db.storage.from("library-generated-covers").getPublicUrl(path).data.publicUrl;
    const now = new Date().toISOString();
    const cover = { original: coverUrl, generated_at: now, generated_from_photo_url: normalizedPhotoUrl, source_name: "AcuarioNexo portada marina oficial · foto TMC exacta", template: TEMPLATE, contract_version: CONTRACT_VERSION, common_name_position: "top", common_name_color: GOLD, scientific_name_position: "bottom", scientific_name_color: LIGHT_GOLD, scientific_name_style: "italic", specimen_position: "center", real_subject_cutout: true, cutout_engine: "gpt-image-2.5-sunburst-transparent-edit", fixed_background: true, background_master: "approved-marine-master", aspect_ratio: "1:1" };
    const updated = await db.from("library_entries").update({ cover_url: coverUrl, photo_url: normalizedPhotoUrl, image_assets: { ...(entry.image_assets || {}), cover }, updated_at: now }).eq("id", entry.id).select("*").single();
    if (updated.error) throw updated.error;
    return json({ ok: true, auth_mode: authMode, entry: updated.data });
  } catch (error) {
    return json({ ok: false, error: String((error as any)?.message || error) }, 400);
  }
});