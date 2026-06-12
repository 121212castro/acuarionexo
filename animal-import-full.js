/* AcuarioNexo · Importacion completa de animales */
(function() {
  const BUILD = 'animal-import-full-v1';

  function esc(x) {
    return (window.E ? window.E(x) : String(x ?? '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    }));
  }

  function msg(t, k) {
    return window.M ? window.M(t, k) : '<div class="' + (k || 'notice') + '">' + esc(t) + '</div>';
  }

  function val(id) {
    return (document.getElementById(id)?.value || '').trim();
  }

  function num(id) {
    return val(id) === '' ? null : Number(val(id));
  }

  function clean(x) {
    return String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function setAqSection(section) {
    if (window.setAqSection) window.setAqSection(section);
    window.currentAqSection = section;
  }

  function shell(html) {
    const head = window.am ? window.am('animales') : '';
    if (window.S) window.S(head + html + '<div style="height:140px"></div>' + nav('acuarios'));
  }

  function nav(active) {
    const item = (id, label, icon, fn) => '<button class="' + (active === id ? 'active' : '') + '" onclick="' + fn + '"><span>' + icon + '</span><small>' + label + '</small></button>';
    return '<nav class="bottom-nav">' +
      item('inicio', 'Inicio', '⌂', 'dashboard()') +
      item('acuarios', 'Acuarios', '▣', 'dashboard()') +
      item('biblioteca', 'Biblioteca', '□', 'biblioteca()') +
      item('avisos', 'Avisos', '♢', 'tareas()') +
      item('microfauna', 'Microfauna', '∞', 'microfauna()') +
    '</nav>';
  }

  function textValue(v) {
    if (v == null || v === '') return '';
    if (Array.isArray(v)) return v.map(textValue).filter(Boolean).join('\n');
    if (typeof v === 'object') return textValue(v.text || v.texto || v.value || v.valor || v.description || v.descripcion || JSON.stringify(v));
    return String(v).trim();
  }

  function normalizeFicha(row) {
    const raw = row?.raw || row || {};
    return {
      raw,
      id: raw.id || row?.id || null,
      title: row?.nombre || row?.title || raw.title || raw.nombre || raw.nombre_comun || raw.common_name || raw.scientific_name || '',
      scientific_name: row?.cientifico || row?.scientific_name || raw.scientific_name || raw.nombre_cientifico || '',
      category: row?.categoria || row?.category || raw.category || raw.source_category || raw.tipo || raw.tipo_ficha || 'other',
      source_category: raw.source_category || row?.source_category || null,
      photo_url: row?.foto || row?.photo_url || raw.photo_url || raw.foto_url || raw.foto || raw.imagen || raw.image_url || '',
      description: row?.descripcion || row?.description || raw.description || raw.descripcion || raw.resumen || raw.notes || '',
      care_level: raw.care_level || null,
      compatibility: raw.compatibility || null,
      feeding: raw.feeding || raw.diet || null,
      parameters: raw.parameters || null,
      min_tank_liters: raw.min_tank_liters || null,
      temperament: raw.temperament || null,
      reef_safe: raw.reef_safe,
      acquisition_notes: raw.acquisition_notes || null,
      references_text: raw.references_text || null,
      source_url: raw.source_url || null
    };
  }

  function fichaType(f) {
    const x = normalizeFicha(f);
    const text = clean([x.category, x.source_category, x.title, x.scientific_name, x.description].filter(Boolean).join(' '));
    if (/coral|sps|lps|euphyllia|zoanthus|acropora|montipora/.test(text)) return 'coral';
    if (/crust|gamba|camaron|shrimp|cangrejo|crab/.test(text)) return 'crustacean';
    if (/molus|caracol|snail/.test(text)) return 'mollusk';
    if (/invert|erizo|estrella/.test(text)) return 'invertebrate';
    if (/planta|plant/.test(text)) return 'plant';
    if (/alga|macroalga/.test(text)) return 'algae';
    if (/fish|pez|peces|marino|marine|fresh|dulce/.test(text)) return 'fish';
    return 'other';
  }

  function aquariumKind() {
    const t = clean([window.q?.aquarium_type, window.q?.subtype, window.q?.description].filter(Boolean).join(' '));
    if (/fresh|dulce/.test(t)) return 'freshwater';
    if (/reef|arrecife|marine|marino|salado|salt/.test(t)) return 'marine';
    return 'mixed';
  }

  function incompatibilityReason(f) {
    const x = normalizeFicha(f);
    if (!window.q?.id) return 'Primero abre el acuario donde quieres guardar el animal.';
    const text = clean([x.category, x.source_category, x.title, x.scientific_name, x.description].filter(Boolean).join(' '));
    const aq = aquariumKind();
    if (aq === 'freshwater' && (/coral|marino|marine|reef|arrecife|salado|saltwater/.test(text))) return 'Este acuario es de agua dulce: no acepta corales ni animales marinos.';
    if (aq === 'marine' && (/fresh|dulce|agua dulce/.test(text))) return 'Este acuario es marino/reef: no acepta peces de agua dulce.';
    return '';
  }

  function reefSafeValue(v) {
    const x = clean(v);
    if (v === true || ['true', 'si', 'sí', 'yes', 'reef safe', 'seguro'].includes(x)) return 'yes';
    if (v === false || ['false', 'no'].includes(x)) return 'no';
    if (/caution|precaucion|precaución|depende|with caution/.test(x)) return 'caution';
    return 'unknown';
  }

  function notesFromFicha(x) {
    const blocks = [
      ['Resumen', x.description],
      ['Dificultad', x.care_level],
      ['Temperamento', x.temperament],
      ['Litros minimos', x.min_tank_liters ? x.min_tank_liters + ' L' : ''],
      ['Parametros', textValue(x.parameters)],
      ['Notas de adquisicion', x.acquisition_notes],
      ['Fuentes', x.references_text || x.source_url]
    ];
    return blocks.filter(([, body]) => textValue(body)).map(([title, body]) => title + ':\n' + textValue(body)).join('\n\n');
  }

  function formFull(a) {
    const acquired = a.acquired_at || (a.acquisition_year ? a.acquisition_year + '-' + String(a.acquisition_month || 1).padStart(2, '0') + '-' + String(a.acquisition_day || 1).padStart(2, '0') : '');
    const fichaJson = a.ficha_json ? JSON.stringify(a.ficha_json) : '';
    return '<label>Nombre comun</label><input id="anName" value="' + esc(a.common_name || a.title || '') + '">' +
      '<label>Nombre cientifico</label><input id="anSci" value="' + esc(a.scientific_name || '') + '">' +
      '<label>Tipo</label><select id="anCat">' +
      ['fish:Pez','coral:Coral','invertebrate:Invertebrado','crustacean:Crustaceo','mollusk:Molusco','plant:Planta','algae:Alga','other:Otro'].map(opt => { const p = opt.split(':'); return '<option value="' + p[0] + '" ' + (a.category === p[0] ? 'selected' : '') + '>' + p[1] + '</option>'; }).join('') +
      '</select>' +
      '<div class="form-grid"><div><label>Cantidad</label><input id="anQty" type="number" min="1" value="' + esc(a.quantity || 1) + '"></div>' +
      '<div><label>Estado</label><select id="anStatus">' +
      ['active:Vivo / activo','quarantine:Cuarentena','hospital:Hospital','dead:Baja','moved:Movido','sold:Vendido','archived:Archivado'].map(opt => { const p = opt.split(':'); return '<option value="' + p[0] + '" ' + (a.status === p[0] ? 'selected' : '') + '>' + p[1] + '</option>'; }).join('') +
      '</select></div>' +
      '<div><label>Alta / compra</label><input id="anAcquired" type="date" value="' + esc(acquired) + '"></div>' +
      '<div><label>Tienda / origen</label><input id="anPlace" value="' + esc(a.purchase_place || a.origin || '') + '" placeholder="Tienda, particular, esqueje..."></div>' +
      '<div><label>Precio</label><input id="anPrice" type="number" step="0.01" value="' + esc(a.purchase_price || '') + '"></div>' +
      '<div><label>Fecha baja</label><input id="anDeathDate" type="date" value="' + esc(a.death_date || '') + '"></div></div>' +
      '<label>Motivo de baja</label><input id="anLossReason" value="' + esc(a.loss_reason || '') + '">' +
      '<label>Zona del acuario</label><input id="anZone" value="' + esc(a.aquarium_zone || '') + '" placeholder="Media, roca, arena, superficie...">' +
      '<label>Estado de salud</label><input id="anHealth" value="' + esc(a.health_status || '') + '" placeholder="Correcto, observacion, cuarentena...">' +
      '<label>Reef safe</label><select id="anReefSafe">' +
      ['unknown:Desconocido','yes:Si','no:No','caution:Con precaucion'].map(opt => { const p = opt.split(':'); return '<option value="' + p[0] + '" ' + (a.reef_safe === p[0] ? 'selected' : '') + '>' + p[1] + '</option>'; }).join('') +
      '</select>' +
      '<label>Alimentacion</label><textarea id="anFeeding">' + esc(a.feeding || '') + '</textarea>' +
      '<label>Compatibilidad</label><textarea id="anCompatibility">' + esc(a.compatibility || '') + '</textarea>' +
      '<label>Rutina de observacion</label><textarea id="anObservation">' + esc(a.observation_schedule || '') + '</textarea>' +
      '<label>Foto desde camara</label><input id="anCam" type="file" accept="image/*" capture="environment">' +
      '<label>Foto desde galeria</label><input id="anGal" type="file" accept="image/*">' +
      '<label>Notas</label><textarea id="anNotes">' + esc(a.notes || a.description || '') + '</textarea>' +
      '<input id="anPhotoUrl" type="hidden" value="' + esc(a.photo_url || '') + '">' +
      '<input id="anLibraryEntryId" type="hidden" value="' + esc(a.library_entry_id || '') + '">' +
      '<input id="anSourceCategory" type="hidden" value="' + esc(a.source_category || '') + '">' +
      '<textarea id="anFichaJson" class="hidden" style="display:none">' + esc(fichaJson) + '</textarea>';
  }

  async function uploadAnimalPhoto() {
    const f = (document.getElementById('anCam')?.files?.[0]) || (document.getElementById('anGal')?.files?.[0]);
    if (!f) return val('anPhotoUrl') || null;
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
    const path = 'animals/' + window.u.id + '/' + window.q.id + '/' + Date.now() + '.' + ext;
    for (const b of ['aquarium-photos', 'photos', 'animal-photos']) {
      const up = await window.s.storage.from(b).upload(path, f, { upsert: true, contentType: f.type || 'image/jpeg' });
      if (!up.error) return window.s.storage.from(b).getPublicUrl(path).data.publicUrl;
    }
    throw new Error('No se pudo subir la foto.');
  }

  const previousImportar = window.importarAnimalBiblioteca;
  window.importarAnimalBiblioteca = function(row) {
    const reason = incompatibilityReason(row);
    if (reason) return alert(reason);
    const x = normalizeFicha(row);
    setAqSection('animales');
    shell('<section class="panel"><button onclick="buscarAnimalBiblioteca ? buscarAnimalBiblioteca() : biblioteca()">← Volver</button><h2>Importar ficha completa</h2>' +
      msg('Se importan los campos de la ficha: alimentacion, compatibilidad, parametros, reef safe y una copia completa en ficha_json.', 'success') +
      formFull({
        common_name: x.title,
        scientific_name: x.scientific_name,
        category: fichaType(x),
        status: 'active',
        quantity: 1,
        photo_url: x.photo_url,
        library_entry_id: x.id,
        source_category: x.source_category,
        ficha_json: x.raw,
        feeding: x.feeding,
        compatibility: x.compatibility,
        reef_safe: reefSafeValue(x.reef_safe),
        health_status: x.care_level ? 'Dificultad: ' + x.care_level : '',
        observation_schedule: [x.temperament ? 'Temperamento: ' + x.temperament : '', x.min_tank_liters ? 'Litros minimos: ' + x.min_tank_liters + ' L' : '', textValue(x.parameters)].filter(Boolean).join('\n'),
        notes: notesFromFicha(x)
      }) +
      '<button class="primary" onclick="saveAnimal()">Guardar en ' + esc(window.q?.name || 'este acuario') + '</button><div id="x"></div></section>');
  };

  const previousSave = window.saveAnimal;
  window.saveAnimal = async function(id = '') {
    if (!document.getElementById('anFeeding') && previousSave) return previousSave(id);
    try {
      if (!window.u) throw new Error('Debes iniciar sesion.');
      if (!window.q?.id) throw new Error('Abre un acuario primero.');
      const name = val('anName');
      if (!name) throw new Error('Pon el nombre del animal.');
      const d = val('anAcquired') ? new Date(val('anAcquired')) : null;
      let ficha = null;
      try { ficha = val('anFichaJson') ? JSON.parse(val('anFichaJson')) : null; } catch (_) { ficha = null; }
      const row = {
        user_id: window.u.id,
        aquarium_id: window.q.id,
        common_name: name,
        scientific_name: val('anSci') || null,
        category: val('anCat') || 'other',
        quantity: Number(val('anQty') || 1),
        acquisition_day: d ? d.getDate() : null,
        acquisition_month: d ? d.getMonth() + 1 : null,
        acquisition_year: d ? d.getFullYear() : null,
        acquired_at: val('anAcquired') || null,
        origin: val('anPlace') || null,
        purchase_place: val('anPlace') || null,
        purchase_price: num('anPrice'),
        death_date: val('anDeathDate') || null,
        loss_reason: val('anLossReason') || null,
        status: val('anStatus') || 'active',
        photo_url: await uploadAnimalPhoto(),
        notes: val('anNotes') || null,
        compatibility: val('anCompatibility') || null,
        reef_safe: val('anReefSafe') || 'unknown',
        feeding: val('anFeeding') || null,
        aquarium_zone: val('anZone') || null,
        health_status: val('anHealth') || null,
        observation_schedule: val('anObservation') || null,
        ai_notes: ficha ? 'Importada desde biblioteca con ficha completa.' : null,
        library_entry_id: val('anLibraryEntryId') || null,
        source_category: val('anSourceCategory') || null,
        ficha_json: ficha
      };
      const r = id ? await window.s.from('animals').update(row).eq('id', id) : await window.s.from('animals').insert(row);
      if (r.error) throw r.error;
      if (window.anis) window.anis();
    } catch (e) {
      const x = document.getElementById('x');
      if (x) x.innerHTML = msg(e.message, 'error');
      else alert(e.message);
    }
  };

  const previousEdit = window.editAnimal;
  window.editAnimal = async function(id) {
    try {
      setAqSection('animales');
      const r = await window.s.from('animals').select('*').eq('id', id).single();
      if (r.error) throw r.error;
      shell('<section class="panel"><button onclick="anis()">← Volver</button><h2>Editar animal</h2>' + formFull(r.data || {}) + '<button class="primary" onclick="saveAnimal(\'' + esc(id) + '\')">Guardar cambios</button><div id="x"></div></section>');
    } catch (e) {
      if (previousEdit) return previousEdit(id);
      alert(e.message);
    }
  };

  window.__ACUARIONEXO_ANIMAL_IMPORT_FULL__ = BUILD;
})();
