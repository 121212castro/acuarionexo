import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { auditEntry, authenticatedClients, corsHeaders, errorJson, json } from "../_shared/library-v3.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorJson("method_not_allowed", "Método no permitido.", 405);
  try {
    const { user, serviceClient } = await authenticatedClients(req); const { entry_id } = await req.json();
    const { data: entry, error } = await serviceClient.from("library_entries").select("*").eq("id", entry_id).eq("user_id", user.id).single();
    if (error || !entry) return errorJson("entry_not_found", "Ficha no encontrada.", 404);
    if (entry.status !== "validated") return errorJson("validated_required", "Solo se puede publicar una ficha validada.", 409);
    const audit = auditEntry(entry); if (!audit.approved) return errorJson("audit_failed", "La ficha ya no cumple el contrato.", 409, audit);
    const { data, error: updateError } = await serviceClient.from("library_entries").update({ status: "published", visibility: "public", published_at: new Date().toISOString() }).eq("id", entry.id).select("*").single();
    if (updateError) throw updateError; return json({ data });
  } catch (error) {
    const message = String(error?.message || error); if (message === "AUTH_REQUIRED") return errorJson("auth_required", "Sesión no válida.", 401);
    return errorJson("publish_failed", `No se pudo publicar la ficha: ${message}`, 502);
  }
});
