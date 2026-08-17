-- Keep user-owned aquarium media private and restrict library asset writes.

-- One legacy public library photo was stored in a user-media bucket. Preserve
-- the published card by using its existing public library cover before privacy
-- is enabled. The original object remains stored for later manual replacement.
create temporary table acuarionexo_legacy_library_media
on commit drop
as
select id, status, published_at
from public.library_entries
where photo_url like '%/storage/v1/object/public/aquarium-photos/library/%'
  and cover_url like '%/storage/v1/object/public/library-images/%';

-- Published cards must pass through the application's validated state before
-- their media metadata can be changed by the existing guard trigger.
update public.library_entries as entry
set status = 'validated'
from acuarionexo_legacy_library_media as legacy
where entry.id = legacy.id
  and legacy.status = 'published';

update public.library_entries
set
  photo_url = cover_url,
  image_assets = jsonb_set(
    coalesce(image_assets, '{}'::jsonb),
    '{photo,original}',
    to_jsonb(cover_url),
    true
  ),
  updated_at = now()
where photo_url like '%/storage/v1/object/public/aquarium-photos/library/%'
  and cover_url like '%/storage/v1/object/public/library-images/%';

update public.library_entries as entry
set
  status = 'published',
  published_at = legacy.published_at
from acuarionexo_legacy_library_media as legacy
where entry.id = legacy.id
  and legacy.status = 'published';

update storage.buckets
set public = false
where id in ('aquarium-photos', 'photos', 'animal-photos');

drop policy if exists acuarionexo_public_photo_read on storage.objects;
drop policy if exists acuarionexo_photo_select on storage.objects;

create policy acuarionexo_photo_select
on storage.objects
for select
to authenticated
using (
  bucket_id = any (array['aquarium-photos', 'photos', 'animal-photos'])
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists library_images_authenticated_insert on storage.objects;
drop policy if exists library_images_authenticated_update on storage.objects;
drop policy if exists library_images_authenticated_delete on storage.objects;

create policy library_images_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'library-images'
  and (select public.is_admin((select auth.uid())))
);

create policy library_images_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'library-images'
  and (select public.is_admin((select auth.uid())))
)
with check (
  bucket_id = 'library-images'
  and (select public.is_admin((select auth.uid())))
);

create policy library_images_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'library-images'
  and (select public.is_admin((select auth.uid())))
);
