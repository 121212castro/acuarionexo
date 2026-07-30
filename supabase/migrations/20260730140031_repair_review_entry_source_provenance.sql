update public.library_entries
set sources = '[
 {"name":"Power Aquaculture — Artemia nauplio","url":"https://www.power-aquaculture.es/product/artemia-nauplio/","source_type":"fabricante oficial","used_for":"Producto exacto, fabricante, presentación, conservación, dosificación y uso declarado."},
 {"name":"WoRMS — Artemia salina","url":"https://www.marinespecies.org/aphia.php?id=480246&p=taxdetails","source_type":"base especializada","used_for":"Identidad y taxonomía del organismo comercializado como nauplio de Artemia."},
 {"name":"INVE Aquaculture — Artemia","url":"https://artemia.inveaquaculture.com/artemia/","source_type":"referencia técnica especializada","used_for":"Contraste técnico independiente sobre Artemia como alimento vivo en acuicultura."}
]'::jsonb,
validation_result = jsonb_build_object('approved',false,'errors',jsonb_build_array('Fuentes normalizadas; pendiente de reauditoría automática.'),'audited_at',now())
where entry_type='alimento' and title='Artemia nauplio';

update public.library_entries
set sources = '[
 {"name":"Power Aquaculture — Artemia subadulta","url":"https://www.power-aquaculture.es/product/artemia-subadulta/","source_type":"fabricante oficial","used_for":"Producto exacto, composición declarada, uso, almacenamiento, dosis y características principales."},
 {"name":"OportoReef — Artemia subadulta ultraconcentrado","url":"https://oportoreef.pt/produto/artemia-subadulta-ultraconcentrado/","source_type":"distribuidor especializado","used_for":"Contraste independiente de presentación, dosis, compatibilidad y recomendaciones de uso."},
 {"name":"INVE Aquaculture — Artemia","url":"https://artemia.inveaquaculture.com/artemia/","source_type":"referencia técnica especializada","used_for":"Contraste técnico sobre Artemia, composición nutricional y uso en acuicultura."}
]'::jsonb,
validation_result = jsonb_build_object('approved',false,'errors',jsonb_build_array('URLs duplicadas de seguimiento eliminadas; pendiente de reauditoría automática.'),'audited_at',now())
where entry_type='alimento' and title='Artemia Subadulta ultraconcentrado';

update public.library_entries
set sources = '[
 {"name":"Power Aquaculture — Artemia adulta","url":"https://www.power-aquaculture.es/product/artemia-adulta/","source_type":"fabricante oficial","used_for":"Fabricante, producto exacto, fases comercializadas, conservación, duración, dosis y presentaciones."},
 {"name":"OportoReef — Power Aquaculture Artemia adulta","url":"https://oportoreef.pt/categoria-produto/alimentacao/viva/power-aquaculture/","source_type":"distribuidor especializado","used_for":"Contraste independiente de marca, clasificación como alimento vivo y referencia comercial."},
 {"name":"INVE Aquaculture — Artemia","url":"https://artemia.inveaquaculture.com/artemia/","source_type":"referencia técnica especializada","used_for":"Contraste técnico independiente sobre Artemia como alimento vivo en acuicultura."}
]'::jsonb,
validation_result = jsonb_build_object('approved',false,'errors',jsonb_build_array('Tipo de fuente oficial normalizado; pendiente de reauditoría automática.'),'audited_at',now())
where entry_type='alimento' and title='Power Aquaculture Artemia adulta 250 mL — alimento vivo para peces marinos';

update public.library_entries
set sources = '[
 {"name":"Power Aquaculture — Copépodos bentónicos Apocalypse Mix","url":"https://www.power-aquaculture.es/product/copepodos-bentonicos-apocalypse-mix/","source_type":"fabricante oficial","used_for":"Producto exacto, mezcla declarada, animales objetivo, conservación, aplicación y formatos."},
 {"name":"Power Aquaculture — Copépodos bentónicos","url":"https://www.power-aquaculture.es/que-son-los-copepodos-bentonicos/","source_type":"documentación del fabricante","used_for":"Taxones declarados, tamaños relativos, hábitos, dieta y aplicación en el acuario."},
 {"name":"WoRMS — The World of Copepods: Tisbe","url":"https://www.marinespecies.org/copepoda/aphia.php?id=115484&p=taxdetails","source_type":"base especializada","used_for":"Validación taxonómica especializada del género Tisbe incluido en la mezcla."},
 {"name":"IRC Shop — Apocalypse Mix","url":"https://ircshop.com/p/copepodos-bentonicos-apocalypse-mix/","source_type":"distribuidor especializado","used_for":"Contraste independiente de marca, composición comercial, formatos, refrigeración y aplicación."}
]'::jsonb,
validation_result = jsonb_build_object('approved',false,'errors',jsonb_build_array('Base taxonómica especializada añadida; pendiente de reauditoría automática.'),'audited_at',now())
where entry_type='microfauna' and title='Copépodos bentónicos Apocalypse Mix — Power Aquaculture';

update public.library_entries
set scientific_name='Apocyclops panamensis + Tisbe biminiensis + Tisbe battagliai',
data=jsonb_set(coalesce(data,'{}'::jsonb),'{identification}',to_jsonb('Apocyclops panamensis (70%), Tisbe biminiensis (15%) y Tisbe battagliai (15%).'::text),true),
validation_result=jsonb_build_object('approved',false,'errors',jsonb_build_array('Taxonomía normalizada; pendiente de reauditoría automática.'),'audited_at',now())
where entry_type='microfauna' and title='Nuclear Mix';

update public.library_entries
set sources = '[
 {"name":"Power Aquaculture — Zoo Mix","url":"https://www.power-aquaculture.es/product/zoo-mix/","source_type":"fabricante oficial","used_for":"Composición vigente, clasificación como zooplancton vivo, finalidad, conservación, formatos y dosificación."},
 {"name":"FAO — General culture conditions for marine rotifers","url":"https://www.fao.org/4/W3732E/w3732e0h.htm","source_type":"organismo técnico","used_for":"Condiciones documentadas de cultivo de Brachionus plicatilis y riesgos por salinidad, temperatura, oxígeno y contaminación."},
 {"name":"FAO — Production of copepods","url":"https://www.fao.org/4/W3732E/w3732e0t.htm","source_type":"organismo técnico","used_for":"Fases vitales, valor alimenticio, muestreo y cultivo de copépodos."},
 {"name":"WoRMS — The World of Copepods: Tisbe","url":"https://www.marinespecies.org/copepoda/aphia.php?id=115484&p=taxdetails","source_type":"base especializada","used_for":"Validación taxonómica especializada de uno de los géneros de copépodos declarados."}
]'::jsonb,
validation_result=jsonb_build_object('approved',false,'errors',jsonb_build_array('Base taxonómica especializada añadida; pendiente de reauditoría automática.'),'audited_at',now())
where entry_type='microfauna' and title='Zoo Mix — Power Aquaculture';
