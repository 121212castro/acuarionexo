import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { auditEntry, authenticatedClients, corsHeaders, errorJson, json } from "../_shared/library-v3.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorJson("method_not_allowed", "Método no permitido.", 405);
  try {
    const { user, serviceClient } = await authenticatedClients(req);
    const { entry_id } = await req.json();
    const { data: entry, error } = await serviceClient.from("library_entries").select("*").eq("id", entry_id).eq("user_id", user.id).single();
    if (error || !entry) return errorJson("entry_not_found", "Ficha no encontrada.", 404);
    const result = auditEntry(entry); const status = result.approved ? "validated" : "review";
    const update = { status, validation_result: { ...result, audited_at: new Date().toISOString(), engine: "library-audit-card-v3" }, sources: result.sources, validated_by: result.approved ? user.id : null, validated_at: result.approved ? new Date().toISOString() : null };
    const { data, error: updateError } = await serviceClient.from("library_entries").update(update).eq("id", entry.id).select("*").single();
    if (updateError) throw updateError;
    return json({ data, result: result.approved ? "APROBADA" : "REQUIERE REVISIÓN" });
  } catch (error) {
    const message = String(error?.message || error); if (message === "AUTH_REQUIRED") return errorJson("auth_required", "Sesión no válida.", 401);
    return errorJson("audit_failed", `No se pudo auditar la ficha: ${message}`, 502);
  }
});
