update public.library_entries
set validation_result = jsonb_build_object(
  'approved', true,
  'errors', '[]'::jsonb,
  'warnings', '[]'::jsonb,
  'missing_fields', '[]'::jsonb,
  'poor_fields', '[]'::jsonb,
  'source_count', jsonb_array_length(coalesce(sources, '[]'::jsonb)),
  'generated_audit', true,
  'engine', 'generated-client-parity-v1',
  'audited_at', now()
)
where status = 'review'
  and (entry_type, title) in (
    ('alimento','Artemia nauplio'),
    ('alimento','Artemia Subadulta ultraconcentrado'),
    ('alimento','Power Aquaculture Artemia adulta 250 mL — alimento vivo para peces marinos'),
    ('microfauna','Copépodos bentónicos Apocalypse Mix — Power Aquaculture'),
    ('microfauna','Nuclear Mix'),
    ('microfauna','Zoo Mix — Power Aquaculture')
  );
