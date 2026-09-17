import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Jimp } from "npm:jimp@1.6.0";

const TEMPLATE = "marine-fish-master-v1-locked";
const CONTRACT_VERSION = "cover-contract-v13";
const OFFICIAL_BACKGROUND_SOURCE = "https://raw.githubusercontent.com/121212castro/acuarionexo/main/src/library/ficha/library-cover-auto.js";
const GOLD = "#e7bc58";
const LIGHT_GOLD = "#f3d77c";

const clean = (value: unknown) => String(value ?? "").trim();
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { "content-type": "application/json" }
});

function escapeXml(value: unknown) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tmcSkus(entry: any) {
  return clean(entry?.data?.tmc_sku)
    .split(/[;,/\s]+/)
    .map(clean)
    .filter(value => /^\d{4,6}$/.test(value));
}

function cleanTitle(entry: any) {
  return clean(entry?.title).replace(/\s+[—-]\s+TMC\s+SKU.*$/i, "").trim();
}

function fitFont(text: string, max = 96, min = 46, budget = 1040) {
  return Math.max(min, Math.min(max, Math.floor(budget / Math.max(10, text.length * 0.58))));
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 32768, bytes.length)));
  }
  return btoa(binary);
}

async function officialBackgroundDataUrl() {
  const response = await fetch(OFFICIAL_BACKGROUND_SOURCE, {
    cache: "no-store",
    headers: { "User-Agent": "AcuarioNexo/1.0" }
  });
  if (!response.ok) throw new Error(`No se pudo cargar el fondo oficial (${response.status}).`);
  const source = await response.text();
  const match = source.match(/const BG = '([^']+)'/);
  if (!match?.[1]?.startsWith("data:image/")) throw new Error("El fondo oficial no está disponible.");
  return match[1];
}

function connectedBorderCutout(image: any) {
  const { data, width, height } = image.bitmap;
  const total = width * height;
  const seen = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isBackground = (index: number) => {
    const offset = index * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];
    if (a < 8) return true;
    const maximum = Math.max(r, g, b);
    const minimum = Math.min(r, g, b);
    const spread = maximum - minimum;
    const neutralBackground = spread <= 20;
    const greenBackground = g >= r + 24 && g >= b + 18 && g >= 72;
    const brightBackground = minimum >= 210 && spread <= 52;
    const darkBackground = maximum <= 72;
    return darkBackground || brightBackground || neutralBackground || greenBackground;
  };

  const push = (index: number) => {
    if (index < 0 || index >= total || seen[index] || !isBackground(index)) return;
    seen[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) push(index - 1);
    if (x + 1 < width) push(index + 1);
    if (y > 0) push(index - width);
    if (y + 1 < height) push(index + width);
  }

  for (let i = 0; i < total; i++) {
    if (seen[i]) data[i * 4 + 3] = 0;
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let opaque = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        opaque++;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) throw new Error("El recorte del pez quedó vacío.");
  const opaqueRatio = opaque / total;
  if (opaqueRatio > 0.78) throw new Error("La foto no tiene un fondo separable de forma segura; se conserva sin generar una portada incorrecta.");
  if (opaqueRatio < 0.015) throw new Error("El recorte del pez eliminó demasiado contenido; se conserva sin generar una portada incorrecta.");

  const pad = Math.max(4, Math.round(Math.max(width, height) * 0.018));
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const x1 = Math.min(width - 1, maxX + pad);
  const y1 = Math.min(height - 1, maxY + pad);
  image.crop({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
  return image;
}

function coverSvg(background: string, cutout: string, entry: any) {
  const common = cleanTitle(entry);
  const scientific = clean(entry.scientific_name);
  const commonSize = fitFont(common, 96, 46, 1040);
  const scientificSize = fitFont(scientific, 58, 32, 900);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".82"/></filter>
    <filter id="fishShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".34"/></filter>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03132d" stop-opacity=".30"/><stop offset="1" stop-color="#03132d" stop-opacity="0"/></linearGradient>
  </defs>
  <image href="${background}" x="0" y="0" width="1200" height="1200" preserveAspectRatio="xMidYMid slice"/>
  <rect x="0" y="0" width="1200" height="330" fill="url(#topShade)"/>
  <text x="600" y="155" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, Times New Roman, serif" font-size="${commonSize}" font-weight="700" fill="${GOLD}" filter="url(#textShadow)">${escapeXml(common)}</text>
  <text x="600" y="250" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, Times New Roman, serif" font-size="${scientificSize}" font-style="italic" font-weight="500" fill="${LIGHT_GOLD}" filter="url(#textShadow)">${escapeXml(scientific)}</text>
  <image href="${cutout}" x="70" y="345" width="1060" height="650" preserveAspectRatio="xMidYMid meet" filter="url(#fishShadow)"/>
</svg>`;
}

async function authorize(req: Request, entry: any, db: any, body: any) {
  const workerSecret = clean(body?.worker_secret);
  if (workerSecret) {
    const check = await db.rpc("verify_library_generation_worker_secret", { candidate: workerSecret });
    if (!check.error && check.data === true) return "worker";
  }

  const authorization = req.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Falta autenticación.");
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } }
  );
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

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const query = await db.from("library_entries")
      .select("id,user_id,title,scientific_name,entry_type,status,data,photo_url,cover_url,image_assets")
      .eq("id", entryId)
      .single();
    if (query.error) throw query.error;
    const entry: any = query.data;

    const authMode = await authorize(req, entry, db, body);
    if (entry.entry_type !== "pez_marino") throw new Error("Esta función solo genera portadas de peces marinos.");

    const existingTemplate = clean(entry?.image_assets?.cover?.template);
    if (["manual-approved", "manual-restored-approved"].includes(existingTemplate) && clean(entry.cover_url)) {
      return json({ ok: true, auth_mode: authMode, preserved_manual_cover: true, entry });
    }

    if (!clean(entry.photo_url)) throw new Error("La ficha no tiene foto interior.");
    const skus = tmcSkus(entry);
    const photo = entry?.image_assets?.photo || {};
    const evidence = [photo.source_name, photo.source_url, photo.source_page].map(clean).join(" ");
    if (skus.length && !photo.exact_sku) throw new Error("La foto no está validada para el SKU exacto.");
    if (skus.length && !skus.some((sku: string) => evidence.includes(sku))) throw new Error("La trazabilidad de la foto no contiene el SKU exacto.");

    const normalizedPhotoUrl = clean(entry.photo_url).replace(/\\\//g, "/");
    const photoResponse = await fetch(normalizedPhotoUrl, { cache: "no-store" });
    if (!photoResponse.ok) throw new Error(`No se pudo cargar la foto interior (${photoResponse.status}).`);
    const bytes = new Uint8Array(await photoResponse.arrayBuffer());
    if (bytes.length < 4000 || bytes.length > 20 * 1024 * 1024) throw new Error("Tamaño de foto no válido.");

    const image = await Jimp.read(bytes.buffer);
    const maxSide = Math.max(image.bitmap.width, image.bitmap.height);
    if (maxSide > 1600) {
      const scale = 1600 / maxSide;
      image.resize({ w: Math.max(1, Math.round(image.bitmap.width * scale)), h: Math.max(1, Math.round(image.bitmap.height * scale)) });
    }
    connectedBorderCutout(image);
    const png = new Uint8Array(await image.getBuffer("image/png"));
    const cutout = `data:image/png;base64,${bytesToBase64(png)}`;
    const background = await officialBackgroundDataUrl();
    const svg = coverSvg(background, cutout, entry);

    const stamp = Date.now();
    const path = `library/${entry.user_id}/organismos/cover-master-${entry.id}-${stamp}.svg`;
    const upload = await db.storage.from("library-generated-covers").upload(
      path,
      new Blob([svg], { type: "image/svg+xml" }),
      { upsert: true, contentType: "image/svg+xml", cacheControl: "0" }
    );
    if (upload.error) throw upload.error;
    const coverUrl = db.storage.from("library-generated-covers").getPublicUrl(path).data.publicUrl;
    const now = new Date().toISOString();
    const cover = {
      original: coverUrl,
      generated_at: now,
      generated_from_photo_url: normalizedPhotoUrl,
      source_name: "AcuarioNexo portada marina oficial · foto TMC exacta",
      template: TEMPLATE,
      contract_version: CONTRACT_VERSION,
      common_name_position: "top",
      common_name_color: GOLD,
      scientific_name_position: "under_common_name",
      scientific_name_color: LIGHT_GOLD,
      scientific_name_style: "italic",
      specimen_position: "center",
      real_subject_cutout: true,
      fixed_background: true,
      background_master: "approved-marine-master",
      aspect_ratio: "1:1"
    };

    const updated = await db.from("library_entries")
      .update({ cover_url: coverUrl, photo_url: normalizedPhotoUrl, image_assets: { ...(entry.image_assets || {}), cover }, updated_at: now })
      .eq("id", entry.id)
      .select("*")
      .single();
    if (updated.error) throw updated.error;
    return json({ ok: true, auth_mode: authMode, entry: updated.data });
  } catch (error) {
    return json({ ok: false, error: String((error as any)?.message || error) }, 400);
  }
});