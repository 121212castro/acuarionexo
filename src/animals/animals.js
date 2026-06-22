/* AcuarioNexo · animals */
(function () {
  const { supabase, state, esc, byId, val, num, msg, token, isCurrent, dateText, currentAquarium, render, panel, aqHeader, aquariumIcon, photoUrl, uploadAquariumImage } = window.ANX;

function animalCard(a) {
  return `<div class="item">
    ${a.photo_url ? `<img src="${esc(a.photo_url)}" style="width:100%;max-height:170px;object-fit:cover;border-radius:14px;margin-bottom:8px" alt="${esc(a.common_name)}">` : ''}
    <b>${esc(a.common_name || 'Animal')}</b>
    <p>${esc(a.scientific_name || '')}</p>
    <p class="small">${esc(a.category || 'otro')} · ${esc(a.status || 'active')} · Cantidad ${esc(a.quantity || 1)}</p>
    ${a.notes ? `<p>${esc(a.notes)}</p>` : ''}
  </div>`;
}

async function animales() {
  const aq = currentAquarium();
  const t = token();
  render(aqHeader('animales') + `<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="formAnimal()">Añadir</button></div>${msg('Cargando animales...')}</section>`, 'acuarios');
  try {
    const { data, error } = await supabase.from('animals').select('*').eq('aquarium_id', aq.id).order('created_at', { ascending: false });
    if (error) throw error;
    if (!isCurrent(t)) return;
    render(aqHeader('animales') + `<section class="panel"><div class="panel-head"><h2>Animales</h2><button onclick="formAnimal()">Añadir</button></div>${(data || []).map(animalCard).join('') || msg('Sin animales registrados.')}</section>`, 'acuarios');
  } catch (e) {
    if (isCurrent(t)) render(aqHeader('animales') + `<section class="panel">${msg(e.message, 'error')}</section>`, 'acuarios');
  }
}

window.animales = animales;

window.formAnimal = function () {
  render(aqHeader('animales') + `<section class="panel">
    <button onclick="openAqSection('animales')">← Volver</button>
    <h2>Añadir animal</h2>
    <label>Nombre común</label><input id="anName">
    <label>Nombre científico o técnico</label><input id="anSci">
    <label>Tipo</label><select id="anCat"><option value="fish">Pez</option><option value="coral">Coral</option><option value="invertebrate">Invertebrado</option><option value="plant">Planta</option><option value="other">Otro</option></select>
    <label>Cantidad</label><input id="anQty" type="number" min="1" value="1">
    <label>Notas</label><textarea id="anNotes"></textarea>
    <button class="primary" onclick="saveAnimal()">Guardar</button>
    <div id="x"></div>
  </section>`, 'acuarios');
};

window.saveAnimal = async function () {
  try {
    const aq = currentAquarium();
    if (!val('anName')) throw new Error('Pon un nombre.');
    const row = {
      user_id: state.user.id,
      aquarium_id: aq.id,
      common_name: val('anName'),
      scientific_name: val('anSci') || val('anName'),
      category: val('anCat') || 'other',
      quantity: Number(val('anQty') || 1),
      status: 'active',
      notes: val('anNotes') || null
    };
    const { error } = await supabase.from('animals').insert(row);
    if (error) throw error;
    animales();
  } catch (e) {
    if (byId('x')) byId('x').innerHTML = msg(e.message, 'error');
  }
};

})();
