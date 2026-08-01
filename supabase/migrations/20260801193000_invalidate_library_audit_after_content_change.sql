create or replace function public.invalidate_library_audit_after_content_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if row(
    new.entry_type,
    new.title,
    new.scientific_name,
    new.summary,
    new.data,
    new.sections,
    new.sources,
    new.identity_confirmed
  ) is distinct from row(
    old.entry_type,
    old.title,
    old.scientific_name,
    old.summary,
    old.data,
    old.sections,
    old.sources,
    old.identity_confirmed
  ) and (
    new.validation_result is null
    or new.validation_result is not distinct from old.validation_result
  ) then
    new.status := 'review';
    new.validation_result := null;
    new.validated_by := null;
    new.validated_at := null;
    new.published_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists library_entries_invalidate_audit_after_content_change on public.library_entries;
create trigger library_entries_invalidate_audit_after_content_change
before update on public.library_entries
for each row
execute function public.invalidate_library_audit_after_content_change();
