import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const allowedOrigins = new Set([
  "https://acuarionexo.com",
  "https://www.acuarionexo.com",
  "https://121212castro.github.io"
]);

const allowedEvents = new Set([
  "page_view",
  "access_landing_view",
  "access_form_open",
  "access_request_submitted"
]);

const allowedActors = new Set(["visitor", "user", "admin"]);

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://acuarionexo.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
});

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);
  if (!origin || !allowedOrigins.has(origin)) return json({ error: "origin_not_allowed" }, 403, headers);

  try {
    const body = await req.json();
    if (body?.consent !== "granted") return json({ ok: true, ignored: true }, 200, headers);

    const sessionId = clean(body.sessionId, 100);
    const eventName = clean(body.eventName, 40) || "page_view";
    const actorRaw = clean(body.actorType, 20);
    const actorType = allowedActors.has(actorRaw) ? actorRaw : "visitor";
    const page = eventName === "page_view" ? (clean(body.page, 120) || "inicio") : "acceso";
    const path = clean(body.path, 240) || "/";
    const referrerHost = clean(body.referrerHost, 160) || null;
    const deviceRaw = clean(body.device, 20);
    const device = ["mobile", "tablet", "desktop"].includes(deviceRaw) ? deviceRaw : "unknown";

    if (sessionId.length < 8) return json({ error: "invalid_session" }, 400, headers);
    if (!allowedEvents.has(eventName)) return json({ error: "invalid_event" }, 400, headers);

    const country = clean(req.headers.get("cf-ipcountry") || req.headers.get("x-country-code") || "", 8) || null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("server_not_configured");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { error } = await supabase.from("site_analytics_events").insert({
      session_id: sessionId,
      event_name: eventName,
      actor_type: actorType,
      page,
      path,
      referrer_host: referrerHost,
      device,
      country
    });
    if (error) throw error;

    return json({ ok: true }, 200, headers);
  } catch (error) {
    console.error("analytics-collect", error instanceof Error ? error.message : String(error));
    return json({ error: "collect_failed" }, 500, headers);
  }
});
