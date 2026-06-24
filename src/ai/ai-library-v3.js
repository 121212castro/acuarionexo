/* AcuarioNexo · IA · consumo exclusivo de Biblioteca validada */
(function () {
  const { supabase, state, esc } = window.ANX;
  const originalAi = window.iaAcuarioNexo;
  if (typeof originalAi !== 'function') return;

  function inventoryMeta(item) {
    const match = String(item?.notes || '').match(/(?:^|\n)AcuarioNexoMeta:(\{[^\n]*\})/i);
    try { return match ? JSON.parse(match[1]) : {}; } catch (_) { return {}; }
  }

  window.iaAcuarioNexo = async function () {
    const [library, inventory] = await Promise.all([
      supabase.from('library_entries').select('id,title,entry_type,status,data,sources,validation_result').in('status', ['validated', 'published']).limit(250),
      supabase.from('inventory_items').select('id,name,notes').eq('user_id', state.user.id).limit(250)
    ]);
    if (library.error) throw library.error;
    if (inventory.error) throw inventory.error;

    const cards = new Map((library.data || []).map(row => [String(row.id), row]));
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
        if (verified && !String(suggestion.notes || '').includes(verified)) suggestion.notes = `${suggestion.notes || ''} Biblioteca validada: ${verified}`.trim();
      });
    }

    const panel = document.querySelector('#app .panel');
    if (panel) {
      const info = document.createElement('p');
      info.className = 'small';
      info.innerHTML = `Biblioteca usada por la IA: <b>${esc(cards.size)}</b> fichas validadas o publicadas.`;
      panel.insertBefore(info, panel.children[1] || null);
    }
  };

  window.ANX.getLibraryKnowledge = function () {
    return (state.libraryKnowledge || []).filter(row => ['validated', 'published'].includes(row.status));
  };
})();
