import fs from "node:fs/promises";

const input = process.argv[2] || "data/r2-migration-result.json";
const output = process.argv[3] || "data/r2-relink-library.sql";
const result = JSON.parse(await fs.readFile(input, "utf8"));
const rows = [...(result.copied || []), ...(result.skipped || []).filter(x => x.old_url && x.new_url)];

if (!rows.length) throw new Error("No hay objetos migrados con old_url/new_url.");

const q = value => "'" + String(value).replaceAll("'", "''") + "'";
const values = rows.map(x => `(${q(x.old_url)},${q(x.new_url)})`).join(",\n");
const sql = `begin;

create temporary table _r2_url_map(old_url text primary key, new_url text not null) on commit drop;
insert into _r2_url_map(old_url,new_url) values
${values};

update public.library_entries e
set cover_url = m.new_url
from _r2_url_map m
where e.cover_url = m.old_url;

update public.library_entries e
set photo_url = m.new_url
from _r2_url_map m
where e.photo_url = m.old_url;

update public.library_entries e
set image_assets = jsonb_set(e.image_assets, '{cover,original}', to_jsonb(m.new_url), true)
from _r2_url_map m
where e.image_assets #>> '{cover,original}' = m.old_url;

update public.library_entries e
set image_assets = jsonb_set(e.image_assets, '{photo,original}', to_jsonb(m.new_url), true)
from _r2_url_map m
where e.image_assets #>> '{photo,original}' = m.old_url;

update public.library_entries e
set image_assets = jsonb_set(e.image_assets, '{cover,generated_from_photo_url}', to_jsonb(m.new_url), true)
from _r2_url_map m
where e.image_assets #>> '{cover,generated_from_photo_url}' = m.old_url;

commit;
`;

await fs.writeFile(output, sql);
console.log(`SQL generado: ${output} · ${rows.length} URL migradas`);
