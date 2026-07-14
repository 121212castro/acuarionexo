/* AcuarioNexo · animals from inventory */
(function () {
  const { supabase, state, esc, msg, token, isCurrent, currentAquarium, render, aqHeader } = window.ANX;
  const { liveCategories, isAlive, animalCard } = window.ANX.AnimalsCore;

  async function animales() {
    const aq = currentAquarium();
    if (!aq) return;
    const t = token();
    render(aqHeader('animales') + `<section class="panel animals-panel"><div class="panel-head"><h2>Animales</h2><button onclick="importarFichaInventario('aquarium')">Añadir desde ficha</button></div>${msg('Cargando animales vivos...')}</section>`, 'acuarios');
    try {
      const { data, error } = await supabase.from('inventory_items')
        .select('id,name,category,quantity,unit,photo_url,aquarium_id,notes,created_at')
        .eq('user_id', state.user.id)
        .eq('aquarium_id', aq.id)
        .order('created_at', { ascending: false })
        .limit(160);
      if (error) throw error;
      if (!isCurrent(t)) return;
      const rows = (data || []).filter(item => liveCategories.has(item.category || '') && isAlive(item));
      render(aqHeader('animales') + `<section class="panel animals-panel">
        <div class="panel-head"><h2>Animales vivos</h2><button class="primary" onclick="importarFichaInventario('aquarium')">Añadir desde ficha</button></div>
        <p class="small">Esta pantalla sale del inventario de este acuario. No crea animales aparte.</p>
        <div class="animals-grid">${rows.map(animalCard).join('') || msg('Sin animales vivos en el inventario de este acuario.', 'notice')}</div>
      </section>`, 'acuarios');
    } catch (e) {
      if (isCurrent(t)) render(aqHeader('animales') + `<section class="panel animals-panel">${msg(e.message, 'error')}</section>`, 'acuarios');
    }
  }

  window.eliminarAnimalInventario = async function (id, name = 'este organismo') {
    const aq = currentAquarium();
    if (!aq || !id) return;
    const ok = confirm(`¿Eliminar ${name} del acuario?\n\nSe borrará del inventario de este acuario. Esta acción no se puede deshacer.`);
    if (!ok) return;
    const t = token();
    render(aqHeader('animales') + `<section class="panel animals-panel">${msg('Eliminando organismo...')}</section>`, 'acuarios');
    try {
      const { error } = await supabase.from('inventory_items')
        .delete()
        .eq('id', id)
        .eq('user_id', state.user.id)
        .eq('aquarium_id', aq.id);
      if (error) throw error;
      if (!isCurrent(t)) return;
      await animales();
    } catch (e) {
      if (isCurrent(t)) render(aqHeader('animales') + `<section class="panel animals-panel">${msg(e.message, 'error')}<button onclick="animales()">Volver a animales</button></section>`, 'acuarios');
    }
  };

  window.animales = animales;
  window.formAnimal = function () { importarFichaInventario('aquarium'); };
  window.saveAnimal = function () { importarFichaInventario('aquarium'); };
})();