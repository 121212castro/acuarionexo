import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function clean(value: unknown, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function extractJson(text: string) {
  const source = text.match(/```json\s*([\s\S]*?)```/i)?.[1] || text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("MODEL_JSON_MISSING");
  return JSON.parse(source.slice(start, end + 1));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed", message: "Método no permitido." }, 405);

  try {
    const auth = req.headers.get("Authorization") || "";
    if (!auth) return json({ error: "auth_required", message: "Sesión no válida." }, 401);

    const payload = await req.json();
    const instruction = clean(payload?.instruction, 2000);
    const project = payload?.project;
    if (instruction.length < 3) return json({ error: "instruction_required", message: "Indica qué cambio quieres hacer." }, 400);
    if (!project || typeof project !== "object") return json({ error: "project_required", message: "No hay un proyecto 3D válido para editar." }, 400);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY_MISSING");
    const model = clean(Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini", 80);

    const schema = {
      name: "aquarium_3d_project_edit",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["project", "change_summary", "warnings"],
        properties: {
          project: { type: "object", additionalProperties: true },
          change_summary: { type: "string" },
          warnings: { type: "array", items: { type: "string" } }
        }
      }
    };

    const system = [
      "Eres el editor 3D de AcuarioNexo.",
      "Modifica el proyecto completo según la orden del usuario y devuelve SIEMPRE el proyecto completo, no un parche.",
      "Conserva medidas, ids y objetos no afectados.",
      "No cambies especies, marcas ni productos salvo que el usuario lo pida expresamente.",
      "Operaciones permitidas: mover, girar, redimensionar, añadir, eliminar, duplicar, redistribuir y cambiar material o color.",
      "Todas las posiciones y dimensiones están en centímetros y deben quedar dentro de la urna.",
      "No superes 40 objetos.",
      "No guardes nada ni afirmes que el cambio ya está confirmado.",
      "Si la orden es ambigua, realiza el cambio mínimo y añade una advertencia.",
      "Devuelve JSON estricto conforme al esquema."
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        temperature: 0.1,
        input: [
          { role: "system", content: system },
          { role: "user", content: [{ type: "input_text", text: `ORDEN:\n${instruction}\n\nPROYECTO ACTUAL:\n${JSON.stringify(project)}` }] }
        ],
        text: { format: { type: "json_schema", ...schema } }
      })
    });

    if (!response.ok) throw new Error(`OPENAI_${response.status}:${(await response.text()).slice(0, 700)}`);
    const output = await response.json();
    const text = output.output_text || output.output?.flatMap((item: any) => item.content || []).map((part: any) => part.text || "").join("\n") || "";
    const parsed = extractJson(text);
    if (!parsed?.project || typeof parsed.project !== "object") throw new Error("MODEL_PROJECT_MISSING");
    return json({ data: parsed, model });
  } catch (error) {
    return json({ error: "map_edit_failed", message: `No se pudo editar el proyecto: ${String(error?.message || error)}` }, 502);
  }
});
