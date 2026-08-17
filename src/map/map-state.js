/* AcuarioNexo · Map state */
(function () {
  const MAP_PREFIX = 'ACUARIONEXO_MAP_V2:';

  function emptyMap(aq) {
    const front = aq?.map_photo_url || aq?.__cover_source || aq?.cover_url || aq?.photo_url || aq?.image_url || '';
    return {
      version: 2,
      photo_url: front,
      photos: { front, left: '', right: '', top: '' },
      markers: [],
      selected_id: '',
      updated_at: new Date().toISOString()
    };
  }

  function normalizeMap(raw, aq) {
    const base = emptyMap(aq);
    if (!raw || typeof raw !== 'object') return base;
    const markers = Array.isArray(raw.markers) ? raw.markers : [];
    const rawPhotos = raw.photos && typeof raw.photos === 'object' ? raw.photos : {};
    const photos = {
      front: rawPhotos.front || raw.photo_url || base.photo_url || '',
      left: rawPhotos.left || '',
      right: rawPhotos.right || '',
      top: rawPhotos.top || ''
    };
    return {
      ...base,
      ...raw,
      photos,
      photo_url: photos.front,
      markers: markers.map(function (m) {
        return {
          id: String(m.id || `mk-${Date.now()}`),
          label: String(m.label || 'Punto'),
          type: String(m.type || 'coral'),
          note: String(m.note || ''),
          x: Math.max(0, Math.min(100, Number(m.x) || 50)),
          y: Math.max(0, Math.min(100, Number(m.y) || 50)),
          z: Math.max(0, Math.min(100, Number(m.z) || 50)),
          size: Math.max(6, Math.min(32, Number(m.size) || 14))
        };
      })
    };
  }

  function readMap(aq) {
    try {
      const text = String(aq?.ai_summary || '');
      if (text.startsWith(MAP_PREFIX)) return normalizeMap(JSON.parse(text.slice(MAP_PREFIX.length)), aq);
    } catch (_) {}
    return emptyMap(aq);
  }

  function writeMapDraft(aq, map) {
    const clean = normalizeMap({ ...map, updated_at: new Date().toISOString() }, aq);
    window.__aqMap = clean;
    return clean;
  }

  function markerTypeLabel(type) {
    return {
      coral: 'Coral',
      plant: 'Planta',
      rock: 'Roca',
      fish: 'Pez',
      equipment: 'Equipo',
      other: 'Otro'
    }[type] || 'Punto';
  }

  function mapPhotos(map) {
    const signed = map?.__signed_photos && typeof map.__signed_photos === 'object' ? map.__signed_photos : {};
    const stored = storedMapPhotos(map);
    return {
      front: signed.front || stored.front,
      left: signed.left || stored.left,
      right: signed.right || stored.right,
      top: signed.top || stored.top
    };
  }

  function storedMapPhotos(map) {
    const photos = map?.photos && typeof map.photos === 'object' ? map.photos : {};
    return {
      front: photos.front || map?.photo_url || '',
      left: photos.left || '',
      right: photos.right || '',
      top: photos.top || ''
    };
  }

  async function hydrateMapPhotos(map) {
    const clean = normalizeMap(map, window.ANX?.currentAquarium?.());
    const stored = storedMapPhotos(clean);
    const sign = window.ANX?.signedPhotoUrl;
    if (typeof sign !== 'function') return clean;
    const entries = await Promise.all(Object.entries(stored).map(async function ([key, value]) {
      return [key, value ? await sign(value) : ''];
    }));
    clean.__signed_photos = Object.fromEntries(entries);
    return clean;
  }

  function photoCount(map) {
    return Object.values(storedMapPhotos(map)).filter(Boolean).length;
  }

  function selectedMapMarker(map) {
    return map?.markers?.find(m => m.id === map.selected_id) || map?.markers?.[0] || null;
  }

  window.ANX = window.ANX || {};
  window.ANX.MapState = {
    MAP_PREFIX,
    emptyMap,
    normalizeMap,
    readMap,
    writeMapDraft,
    markerTypeLabel,
    mapPhotos,
    storedMapPhotos,
    hydrateMapPhotos,
    photoCount,
    selectedMapMarker
  };
})();
