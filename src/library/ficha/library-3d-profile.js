/* AcuarioNexo · Biblioteca -> perfil 3D y colocación directa */
(function () {
  const ANX = window.ANX = window.ANX || {};
  const SUPPORTED = new Set(['pez_marino','pez_dulce','coral','invertebrado','planta','equipamiento']);

  function typeForEntry(entryType) {
    if (entryType === 'pez_marino' || entryType === 'pez_dulce') return 'fish';
    if (entryType === 'coral') return 'coral';
    if (entryType === 'planta') return 'plant';
    if (entryType === 'equipamiento') return 'equipment';
    if (entryType === 'invertebrado') return 'other';
    return 'other';
  }

  function firstNumber(value) {
    const match = String(value ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function explicitSizeCm(entry) {
    const d = entry?.data || {};
    const candidates = [d.adult_size_cm, d.height_cm, d.size_cm, d.length_cm, d.dimensions_cm];
    for (const value of candidates) {
      const number = firstNumber(value);
      if (Number.isFinite(number) && number > 0) return number;
    }
    return null;
  }

  function familyFromEntry(entry) {
    const stored = String(entry?.data?.ai_3d_profile?.model_family || '').trim();
    if (stored) return stored;
    const type = typeForEntry(entry?.entry_type);
    const resolver = ANX.MapModelFamilies?.resolveFamily;
    if (typeof resolver === 'function') {
      return resolver({
        type,
        label: entry?.title || '',
        scientific_name: entry?.scientific_name || '',
        note: [entry?.data?.family, entry?.data?.growth_form, entry?.data?.coral_type, entry?.data?.plant_type, entry?.data?.equipment_type].filter(Boolean).join(' ')
      });
    }
    return type === 'fish' ? 'fish-generic' : type === 'coral' ? 'coral-generic' : type === 'plant' ? 'plant-generic' : type === 'equipment' ? 'equipment-generic' : 'other-generic';
  }

  function profileFor(entry) {
    if (!entry || !SUPPORTED.has(entry.entry_type)) return null;
    const d = entry.data || {};
    const size = explicitSizeCm(entry);
    const type = typeForEntry(entry.entry_type);
    const stored = d.ai_3d_profile && typeof d.ai_3d_profile === 'object' ? d.ai_3d_profile : {};
    const profile = {
      version: 1,
      representation_type: stored.representation_type || 'reusable_family',
      model_family: stored.model_family || familyFromEntry(entry),
      morphology: stored.morphology || d.growth_form || d.coral_type || d.plant_type || d.equipment_type || '',
      orientation: stored.orientation || (type === 'fish' ? 'horizontal' : 'upright'),
      mounting: stored.mounting || (type === 'coral' ? 'substrate_or_rock' : type === 'plant' ? 'substrate' : type === 'equipment' ? 'user_positioned' : type === 'fish' ? 'free_swimming' : 'user_positioned'),
      movement_profile: stored.movement_profile || (type === 'fish' ? 'swim' : 'static'),
      primary_colors: Array.isArray(stored.primary_colors) ? stored.primary_colors : [],
      real_dimensions_cm: stored.real_dimensions_cm ?? size,
      model_url: stored.model_url || null,
      texture_url: stored.texture_url || null,
      connection_points: Array.isArray(stored.connection_points) ? stored.connection_points : [],
      exactness: stored.model_url ? 'exact_asset' : 'family_representation',
      source: stored.source || 'library_entry'
    };
    return profile;
  }

  function markerSize(profile) {
    const cm = firstNumber(profile?.real_dimensions_cm);
    if (!cm) return 14;
    return Math.max(7, Math.min(32, 8 + Math.sqrt(cm) * 2.4));
  }

  async function ensureMapModules() {
    if (ANX.loadModuleGroup) await ANX.loadModuleGroup('mapa');
    if (!ANX.MapState || !ANX.MapModelFamilies) throw new Error('No se pudo cargar el motor 3D.');
  }

  async function ensureAquariums() {
    if (Array.isArray(ANX.state?.aquariums) && ANX.state.aquariums.length) return ANX.state.aquariums;
    const loader = ANX.loadAquariums || ANX.AquariumsCore?.loadAquariums;
    if (typeof loader !== 'function') throw new Error('No está disponible el cargador de acuarios.');
    const list = await loader();
    if (!Array.isArray(list) || !list.length) throw new Error('Primero crea un acuario para colocar la ficha en 3D.');
    return list;
  }

  function profileHtml(entry) {
    const esc = ANX.esc || (v => String(v ?? ''));
    const p = profileFor(entry);
    if (!p) return '';
    const size = p.real_dimensions_cm ? `${esc(p.real_dimensions_cm)} cm` : 'Escala editable';
    return `<section class="library-detail-section library-3d-profile" aria-label="Perfil 3D">
      <h3>Perfil 3D</h3>
      <dl>
        <div class="library-detail-field"><dt>Familia 3D</dt><dd>${esc(p.model_family)}</dd></div>
        <div class="library-detail-field"><dt>Escala</dt><dd>${size}</dd></div>
        <div class="library-detail-field"><dt>Representación</dt><dd>${p.model_url ? 'Modelo 3D específico' : 'Modelo reutilizable de la familia'}</dd></div>
      </dl>
    </section>`;
  }

  async function persistProfile(entry) {
    const profile = profileFor(entry);
    if (!profile || !ANX.supabase || !ANX.state?.user) return profile;
    const current = entry?.data?.ai_3d_profile;
    if (current && current.model_family === profile.model_family && current.version === profile.version) return profile;
    const data = { ...(entry.data || {}), ai_3d_profile: profile };
    const { error } = await ANX.supabase.from('library_entries').update({ data, updated_at: new Date().toISOString() }).eq('id', entry.id);
    if (!error) entry.data = data;
    return profile;
  }

  async function placeInAquarium(entryId, aquariumId) {
    await ensureMapModules();
    const entry = ANX.LibraryV3Core?.row?.(entryId) || (ANX.state?.libraryRows || []).find(x => String(x.id) === String(entryId));
    if (!entry) throw new Error('No encuentro la ficha.');
    const profile = await persistProfile(entry);
    if (!profile) throw new Error('Esta ficha no tiene representación 3D compatible.');
    const aquariums = await ensureAquariums();
    const aq = aquariums.find(x => String(x.id) === String(aquariumId));
    if (!aq) throw new Error('No encuentro el acuario destino.');

    const map = ANX.MapState.readMap(aq);
    map.markers = Array.isArray(map.markers) ? map.markers : [];
    const existing = map.markers.find(m => String(m.source_library_id || '') === String(entry.id));
    if (existing) {
      map.selected_id = existing.id;
    } else {
      const index = map.markers.length;
      const type = typeForEntry(entry.entry_type);
      const marker = {
        id: `lib-${entry.id}-${Date.now()}`,
        label: entry.title || entry.scientific_name || 'Ficha',
        scientific_name: entry.scientific_name || '',
        type,
        note: `Añadido desde Biblioteca: ${entry.title || ''}`,
        model_family: profile.model_family,
        model_url: profile.model_url,
        texture_url: profile.texture_url,
        ai_3d_profile: profile,
        x: 24 + ((index * 19) % 54),
        y: type === 'fish' ? 40 + ((index * 11) % 25) : 78,
        z: 24 + ((index * 23) % 54),
        size: markerSize(profile),
        source_library_id: entry.id,
        source_library_type: entry.entry_type,
        auto_from_library: true
      };
      map.markers.push(marker);
      map.selected_id = marker.id;
    }

    const clean = ANX.MapState.normalizeMap(map, aq);
    const persistent = { ...clean };
    delete persistent.__signed_photos;
    const text = (ANX.MapState.MAP_PREFIX || 'ACUARIONEXO_MAP_V2:') + JSON.stringify(persistent);
    const { error } = await ANX.supabase.from('aquariums').update({ ai_summary: text }).eq('id', aq.id).eq('user_id', ANX.state.user.id);
    if (error) throw error;
    aq.ai_summary = text;
    ANX.state.aquarium = aq;
    window.q = aq;
    window.__aqMap = clean;
    await ANX.MapMain?.renderMapIA?.(clean);
    return markerFromMap(clean, entry.id);
  }

  function markerFromMap(map, libraryId) {
    return (map?.markers || []).find(m => String(m.source_library_id || '') === String(libraryId)) || null;
  }

  async function chooseAquarium(entryId) {
    const esc = ANX.esc || (v => String(v ?? ''));
    const entry = ANX.LibraryV3Core?.row?.(entryId) || (ANX.state?.libraryRows || []).find(x => String(x.id) === String(entryId));
    if (!entry) throw new Error('No encuentro la ficha.');
    await ensureMapModules();
    await persistProfile(entry);
    const aquariums = await ensureAquariums();
    const current = ANX.currentAquarium?.();
    if (current && !current.__standalone_3d && aquariums.some(a => String(a.id) === String(current.id))) {
      return placeInAquarium(entryId, current.id);
    }
    if (aquariums.length === 1) return placeInAquarium(entryId, aquariums[0].id);

    ANX.render(`<section class="panel">
      <button onclick="verFicha('${esc(entryId)}')">← Volver a la ficha</button>
      <div class="panel-head"><div><h2>Añadir al acuario 3D</h2><p class="small">Elige dónde colocar ${esc(entry.title || 'esta ficha')}.</p></div></div>
      <div class="quick-actions">${aquariums.map(aq => `<button class="primary" onclick="colocarFichaEn3D('${esc(entryId)}','${esc(aq.id)}')">${esc(aq.name || 'Acuario')}</button>`).join('')}</div>
      <div id="library3dStatus"></div>
    </section>`, 'biblioteca');
  }

  async function safeChoose(entryId) {
    const box = ANX.byId?.('libraryActionStatus') || ANX.byId?.('library3dStatus');
    try {
      if (box) box.innerHTML = ANX.msg('Preparando ficha 3D...');
      await chooseAquarium(entryId);
    } catch (error) {
      const target = ANX.byId?.('libraryActionStatus') || ANX.byId?.('library3dStatus');
      if (target) target.innerHTML = ANX.msg(error.message || error, 'error');
    }
  }

  async function safePlace(entryId, aquariumId) {
    const box = ANX.byId?.('library3dStatus');
    try {
      if (box) box.innerHTML = ANX.msg('Colocando ficha en el acuario 3D...');
      await placeInAquarium(entryId, aquariumId);
    } catch (error) {
      if (box) box.innerHTML = ANX.msg(error.message || error, 'error');
    }
  }

  ANX.Library3DProfile = { SUPPORTED, typeForEntry, profileFor, profileHtml, persistProfile, chooseAquarium, placeInAquarium };
  window.anadirFichaAl3D = safeChoose;
  window.colocarFichaEn3D = safePlace;
})();
