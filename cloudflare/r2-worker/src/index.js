export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "acuarionexo-media-r2" }, { headers: cors });
    }

    if (request.method === "GET" && url.pathname.startsWith("/media/")) {
      const key = decodeURIComponent(url.pathname.slice("/media/".length));
      const object = await env.MEDIA.get(key);
      if (!object) return new Response("Not found", { status: 404, headers: cors });
      const headers = new Headers(cors);
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", "public, max-age=31536000, immutable");
      return new Response(object.body, { headers });
    }

    const user = await verifyUser(request, env);
    if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });

    if (request.method === "POST" && url.pathname === "/upload") {
      const form = await request.formData();
      const file = form.get("file");
      const requestedPath = String(form.get("path") || "").replace(/^\/+/, "");
      if (!(file instanceof File) || !requestedPath) {
        return Response.json({ error: "file_and_path_required" }, { status: 400, headers: cors });
      }
      const safePath = requestedPath.replace(/\.\./g, "").replace(/[^a-zA-Z0-9._\/-]/g, "_");
      await env.MEDIA.put(safePath, file.stream(), {
        httpMetadata: {
          contentType: file.type || "application/octet-stream",
          cacheControl: "public, max-age=31536000, immutable"
        },
        customMetadata: { user_id: user.id }
      });
      const base = String(env.PUBLIC_BASE_URL || new URL(request.url).origin + "/media").replace(/\/$/, "");
      return Response.json({ ok: true, key: safePath, url: base + "/" + safePath.split("/").map(encodeURIComponent).join("/") }, { headers: cors });
    }

    if (request.method === "DELETE" && url.pathname === "/object") {
      const key = String(url.searchParams.get("key") || "");
      if (!key) return Response.json({ error: "key_required" }, { status: 400, headers: cors });
      const head = await env.MEDIA.head(key);
      if (!head) return Response.json({ ok: true, deleted: false }, { headers: cors });
      if (head.customMetadata?.user_id && head.customMetadata.user_id !== user.id) {
        return Response.json({ error: "forbidden" }, { status: 403, headers: cors });
      }
      await env.MEDIA.delete(key);
      return Response.json({ ok: true, deleted: true }, { headers: cors });
    }

    return new Response("Not found", { status: 404, headers: cors });
  }
};

async function verifyUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const response = await fetch(env.SUPABASE_URL + "/auth/v1/user", {
    headers: { Authorization: auth, apikey: env.SUPABASE_ANON_KEY }
  });
  if (!response.ok) return null;
  return response.json();
}
