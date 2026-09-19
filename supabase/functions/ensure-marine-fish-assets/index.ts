import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const clean=(v:unknown,max=5000)=>String(v??"").trim().slice(0,max);
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{"content-type":"application/json"}});
const skuList=(entry:any)=>{
  const raw=[entry?.data?.tmc_sku,entry?.data?.sku,entry?.data?.product_code,entry?.product_code,entry?.sku,entry?.title].map(v=>clean(v,500)).join(" ");
  return [...new Set(raw.match(/\b\d{4,6}\b/g)||[])];
};
const isTmcHost=(u:string)=>{
  try{const h=new URL(u).hostname.toLowerCase().replace(/^www\./,"");return h==="tropicalmarinecentre.com"||h.endsWith(".tropicalmarinecentre.com");}
  catch{return false;}
};
const validPhoto=(entry:any)=>{
  const photo=entry?.image_assets?.photo||{};
  const url=clean(photo.original||entry?.photo_url);
  const evidence=[photo.source_url,photo.source_page,photo.source_name,photo.original,url].map(clean).join(" ");
  const skus=skuList(entry);
  const sourceLooksTmc=[photo.source_url,photo.source_page].map(clean).some(isTmcHost) || /\bTMC\b|tropicalmarinecentre/i.test(evidence);
  return !!url && photo.exact_sku===true && photo.official_tmc===true && sourceLooksTmc && skus.length>0 && skus.some((sku:string)=>evidence.includes(sku));
};
async function authorize(req:Request,entry:any,db:any){
  const auth=req.headers.get("authorization")||"";
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(service&&auth===`Bearer ${service}`) return;
  if(!auth.startsWith("Bearer ")) throw new Error("Falta autenticación.");
  const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const user=await client.auth.getUser();
  if(user.error||!user.data.user) throw new Error("Autenticación no válida.");
  if(String(entry.user_id)!==String(user.data.user.id)) throw new Error("No tienes permiso.");
}
function outputText(o:any){
  return o?.output_text||o?.output?.flatMap((i:any)=>i.content||[]).map((p:any)=>p.text||"").join("\n")||"";
}
function parseJson(text:string){
  const t=text.trim().replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim();
  return JSON.parse(t);
}
async function findExactTmcPhoto(entry:any){
  const key=Deno.env.get("OPENAI_API_KEY"); if(!key) throw new Error("OPENAI_API_KEY_MISSING");
  const skus=skuList(entry); if(!skus.length) throw new Error("La ficha no tiene SKU TMC.");
  const prompt=[
    "Busca EXCLUSIVAMENTE en tropicalmarinecentre.com la ficha oficial del pez TMC indicado.",
    `Título: ${clean(entry.title,300)}`,
    `Nombre científico: ${clean(entry.scientific_name,300)}`,
    `SKU TMC exacto: ${skus.join(" / ")}`,
    "Necesito la URL DIRECTA de la fotografía oficial del producto/pez exacto, preferiblemente media/catalog/product, y la URL de la página oficial.",
    "No uses otra especie, otro SKU, tiendas, distribuidores, redes sociales ni bancos de imágenes.",
    "Devuelve SOLO JSON válido con: photo_url, source_page, source_name. Si no puedes verificar el SKU exacto, devuelve photo_url vacío."
  ].join("\n");
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({
    model:Deno.env.get("OPENAI_MODEL")||"gpt-4.1-mini",
    input:[{role:"system",content:"Eres un buscador estricto de fotografías oficiales TMC. No inventes URLs."},{role:"user",content:[{type:"input_text",text:prompt}]}],
    tools:[{type:"web_search_preview"}],
    tool_choice:{type:"web_search_preview"},
    temperature:0
  })});
  if(!r.ok) throw new Error(`OPENAI_${r.status}:${(await r.text()).slice(0,600)}`);
  const parsed=parseJson(outputText(await r.json()));
  const photoUrl=clean(parsed.photo_url), sourcePage=clean(parsed.source_page), sourceName=clean(parsed.source_name,300)||`TMC SKU ${skus.join(" / ")}`;
  if(!photoUrl||!isTmcHost(photoUrl)||!isTmcHost(sourcePage)) throw new Error("No se encontró una foto oficial TMC verificable.");
  const evidence=`${photoUrl} ${sourcePage} ${sourceName}`;
  if(!skus.some((sku:string)=>evidence.includes(sku))) throw new Error("La foto encontrada no demuestra el SKU exacto.");
  const img=await fetch(photoUrl,{cache:"no-store"});
  if(!img.ok) throw new Error(`La foto TMC encontrada no responde (${img.status}).`);
  const ct=(img.headers.get("content-type")||"").toLowerCase();
  if(!ct.startsWith("image/")) throw new Error("La URL encontrada no es una imagen.");
  return {photoUrl,asset:{original:photoUrl,source_url:photoUrl,source_page:sourcePage,source_name:sourceName,exact_sku:true,official_tmc:true,verified_at:new Date().toISOString()}};
}
Deno.serve(async(req)=>{
  if(req.method!=="POST") return json({ok:false,error:"Método no permitido."},405);
  try{
    const body=await req.json().catch(()=>({})); const id=clean(body.entry_id,100);
    if(!id) throw new Error("Falta entry_id.");
    const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
    const q=await db.from("library_entries").select("*").eq("id",id).single(); if(q.error) throw q.error;
    let entry=q.data; await authorize(req,entry,db);
    if(entry.entry_type!=="pez_marino") return json({ok:true,entry,skipped:true});
    const template=clean(entry?.image_assets?.cover?.template);
    if(["manual-approved","manual-restored-approved"].includes(template)&&clean(entry.cover_url)) return json({ok:true,entry,preserved_manual_cover:true});

    if(!validPhoto(entry)){
      const found=await findExactTmcPhoto(entry);
      const now=new Date().toISOString();
      const up=await db.from("library_entries").update({
        photo_url:found.photoUrl,
        image_assets:{...(entry.image_assets||{}),photo:found.asset},
        updated_at:now
      }).eq("id",entry.id).select("*").single();
      if(up.error) throw up.error; entry=up.data;
    }

    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const coverResp=await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-marine-fish-cover`,{
      method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${service}`},
      body:JSON.stringify({entry_id:entry.id})
    });
    const cover=await coverResp.json().catch(()=>({}));
    if(!coverResp.ok||cover?.ok!==true||!cover?.entry?.cover_url) throw new Error(cover?.error||"No se pudo generar la portada oficial.");
    return json({ok:true,entry:cover.entry});
  }catch(e){return json({ok:false,error:String((e as any)?.message||e)},400)}
});