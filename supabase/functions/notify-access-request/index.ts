import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" }
});

const clean = (value: unknown, max = 1000) => String(value ?? "").trim().slice(0, max);
const esc = (value: unknown) => clean(value, 4000)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let requestId = "";
  let admin: ReturnType<typeof createClient> | null = null;
  let claimed = false;

  try {
    const body = await req.json().catch(() => ({}));
    requestId = clean(body?.request_id, 80);
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
      return json({ error: "invalid_request_id" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceRole) throw new Error("SUPABASE_CONFIGURATION_MISSING");
    if (!resendKey) throw new Error("RESEND_API_KEY_MISSING");

    admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: rows, error: claimError } = await admin.rpc(
      "claim_access_request_notification",
      { p_request_id: requestId }
    );
    if (claimError) throw claimError;
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return json({ ok: true, already_processed: true });
    claimed = true;

    const email = clean(row.email, 320);
    const name = clean(row.name, 180) || "Sin nombre";
    const message = clean(row.message, 3000) || "Sin mensaje";
    const created = row.created_at
      ? new Date(row.created_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })
      : "";

    const resend = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "AcuarioNexo <acceso@acuarionexo.com>",
        to: ["contacto@acuarionexo.com"],
        reply_to: email,
        subject: `Nueva solicitud de acceso a AcuarioNexo · ${email}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#10283d">
          <h2>Nueva solicitud de acceso a AcuarioNexo</h2>
          <p><strong>Nombre:</strong> ${esc(name)}</p>
          <p><strong>Email:</strong> ${esc(email)}</p>
          <p><strong>Fecha:</strong> ${esc(created)}</p>
          <p><strong>Mensaje:</strong></p>
          <div style="white-space:pre-wrap;padding:12px;border-radius:8px;background:#f3f7fa">${esc(message)}</div>
          <p style="margin-top:18px">Revisa la solicitud desde el panel Admin de AcuarioNexo.</p>
        </div>`
      })
    });

    if (!resend.ok) {
      const detail = (await resend.text()).slice(0, 700);
      throw new Error(`RESEND_${resend.status}:${detail}`);
    }

    const { error: finishError } = await admin.rpc("finish_access_request_notification", {
      p_request_id: requestId,
      p_success: true,
      p_error: null
    });
    if (finishError) throw finishError;
    return json({ ok: true });
  } catch (error) {
    const detail = clean(error instanceof Error ? error.message : error, 700) || "notification_failed";
    console.error("notify-access-request", { request_id: requestId || null, error: detail });
    if (admin && claimed && requestId) {
      await admin.rpc("finish_access_request_notification", {
        p_request_id: requestId,
        p_success: false,
        p_error: detail
      }).catch(() => null);
    }
    return json({ error: "notification_failed" }, 502);
  }
});

