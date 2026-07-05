/* AcuarioNexo · IA · Biblioteca solo si esta vinculada a Inventario */
(function () {
  const { supabase, state, esc } = window.ANX;
  const originalAi = window.iaAcuarioNexo;
  if (typeof originalAi !== 'function') return;

  function inventoryMeta(item) {
    const match = String(item?.notes || '').match(/(?:^|\n)AcuarioNexoMeta:(\{[^\n]*\})/i);
    try { return match ? JSON.parse(match[1]) : {}; } catch (_) { return {}; }
  }

  async function inventoryLinkedLibraryCards(inventoryItems) {
    const linkedIds = Array.from(new Set((inventoryItems || [])
      .map(item => String(inventoryMeta(item).library_id || '').trim())
      .filter(Boolean)));
    if (!linkedIds.length) return [];
    const { data, error } = await supabase
      .from('library_entries')
      .select('id,title,entry_type,status,data,sources,validation_result')
      .in('id', linkedIds)
      .in('status', ['validated', 'published'])
      .limit(250);
    if (error) throw error;
    return data || [];
  }

  window.iaAcuarioNexo = async function () {
    const inventory = await supabase
      .from('inventory_items')
      .select('id,name,notes')
      .eq('user_id', state.user.id)
      .limit(250);
    if (inventory.error) throw inventory.error;

    const cards = new Map((await inventoryLinkedLibraryCards(inventory.data || [])).map(row => [String(row.id), row]));
    state.libraryKnowledge = Array.from(cards.values());
    await originalAi.apply(this, arguments);

    const review = window.__aiReview;
    if (review?.suggestions) {
      const itemKnowledge = new Map();
      (inventory.data || []).forEach(item => {
        const card = cards.get(String(inventoryMeta(item).library_id || ''));
        if (card) itemKnowledge.set(String(item.name || '').toLowerCase(), card);
      });
      review.suggestions.forEach(suggestion => {
        const title = String(suggestion.title || '').toLowerCase();
        const match = Array.from(itemKnowledge.entries()).find(([name]) => name && title.includes(name));
        const card = match?.[1];
        const verified = card?.data?.risks || card?.data?.monitoring || '';
        if (verified && !String(suggestion.notes || '').includes(verified)) suggestion.notes = `${suggestion.notes || ''} Ficha vinculada al inventario: ${verified}`.trim();
      });
    }

    const panel = document.querySelector('#app .panel');
    if (panel) {
      const info = document.createElement('p');
      info.className = 'small';
      info.innerHTML = `La IA no usa Biblioteca como stock real. Solo cruza fichas vinculadas a Inventario: <b>${esc(cards.size)}</b>.`;
      panel.insertBefore(info, panel.children[1] || null);
    }
  };

  window.ANX.getLibraryKnowledge = function () {
    return state.libraryKnowledge || [];
  };
})();
