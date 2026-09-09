/* AcuarioNexo · reusable 3D model families */
(function () {
  const FAMILY_GROUPS = {
    coral: [
      ['coral-branching-sps', 'SPS ramificado'],
      ['coral-plating-sps', 'SPS plato / incrustante'],
      ['coral-massive-lps', 'LPS masivo'],
      ['coral-brain-lps', 'LPS cerebro'],
      ['coral-tentacled-lps', 'LPS tentáculos largos'],
      ['coral-flower-lps', 'LPS pólipos florales'],
      ['coral-mushroom', 'Coralimorfario / mushroom'],
      ['coral-zoanthid', 'Zoanthus / Palythoa'],
      ['coral-leather', 'Coral blando cuero'],
      ['coral-xenia', 'Xenia / Anthelia'],
      ['coral-gorgonian', 'Gorgonia / abanico'],
      ['coral-generic', 'Coral genérico']
    ],
    fish: [
      ['fish-tang', 'Cirujano / cuerpo ovalado'],
      ['fish-angelfish', 'Ángel / cuerpo alto'],
      ['fish-butterfly', 'Mariposa / cuerpo discoidal'],
      ['fish-wrasse', 'Lábrido / cuerpo fusiforme'],
      ['fish-goby', 'Gobio / cuerpo alargado'],
      ['fish-clown', 'Payaso / cuerpo compacto'],
      ['fish-seahorse', 'Caballito de mar'],
      ['fish-generic', 'Pez genérico']
    ],
    plant: [
      ['plant-rosette', 'Planta de roseta'],
      ['plant-stem', 'Planta de tallo'],
      ['plant-grass', 'Planta tipo césped'],
      ['plant-moss', 'Musgo'],
      ['plant-rhizome', 'Rizoma / Anubias / helecho'],
      ['plant-generic', 'Planta genérica']
    ],
    equipment: [
      ['equipment-pump', 'Bomba / wavemaker'],
      ['equipment-filter', 'Filtro'],
      ['equipment-skimmer', 'Skimmer'],
      ['equipment-heater', 'Calentador'],
      ['equipment-light', 'Pantalla / iluminación'],
      ['equipment-generic', 'Equipo genérico']
    ],
    rock: [['rock-generic', 'Roca']],
    other: [['other-generic', 'Objeto genérico']]
  };

  function textOf(marker) {
    return `${marker?.label || ''} ${marker?.scientific_name || ''} ${marker?.note || ''}`.toLowerCase();
  }

  function resolveFamily(marker) {
    const explicit = String(marker?.model_family || '').trim();
    if (explicit) return explicit;
    const type = String(marker?.type || 'other');
    const text = textOf(marker);

    if (type === 'coral') {
      if (/acropora|seriatopora|stylophora|pocillopora|montipora digitata|branch|staghorn|bird'?s nest/.test(text)) return 'coral-branching-sps';
      if (/montipora|pavona|leptoseris|psammocora|plate|plating|encrust/.test(text)) return 'coral-plating-sps';
      if (/favia|favites|goniastrea|platygyra|brain|scolymia|homophyllia|lobophyllia|micromussa|acantha/.test(text)) return 'coral-brain-lps';
      if (/euphyllia|fimbriaphyllia|catalaphyllia|hammer|torch|frogspawn|anchor/.test(text)) return 'coral-tentacled-lps';
      if (/goniopora|alveopora|duncan|flower|daisy/.test(text)) return 'coral-flower-lps';
      if (/discosoma|ricordea|rhodactis|mushroom/.test(text)) return 'coral-mushroom';
      if (/zoanthus|palythoa|protopalythoa|polyp/.test(text)) return 'coral-zoanthid';
      if (/sarcophyton|sinularia|lobophytum|cladiella|capnella|leather|toadstool|kenya/.test(text)) return 'coral-leather';
      if (/xenia|anthelia|clavularia|briareum|star polyp/.test(text)) return 'coral-xenia';
      if (/gorgonia|gorgonian|muricea|acalcy|fan|whip/.test(text)) return 'coral-gorgonian';
      return 'coral-massive-lps';
    }

    if (type === 'fish') {
      if (/acanthurus|zebrasoma|ctenochaetus|naso|cirujano|tang/.test(text)) return 'fish-tang';
      if (/centropyge|pomacanthus|holacanthus|apolemichthys|genicanthus|chaetodontoplus|angel/.test(text)) return 'fish-angelfish';
      if (/chaetodon|forcipiger|chelmon|prognathodes|butterfly|mariposa/.test(text)) return 'fish-butterfly';
      if (/cirrhilabrus|halichoeres|paracheilinus|wrasse|labr/.test(text)) return 'fish-wrasse';
      if (/gobio|goby|amblyeleotris|valenciennea|stonogobiops|trimma|eviota/.test(text)) return 'fish-goby';
      if (/amphiprion|premnas|clown|payaso/.test(text)) return 'fish-clown';
      if (/hippocampus|seahorse|caballito/.test(text)) return 'fish-seahorse';
      return 'fish-generic';
    }

    if (type === 'plant') {
      if (/echinodorus|cryptocoryne|aponogeton|nymphaea|rosette/.test(text)) return 'plant-rosette';
      if (/rotala|ludwigia|bacopa|hygrophila|limnophila|stem|tallo/.test(text)) return 'plant-stem';
      if (/eleocharis|vallisneria|sagittaria|grass|césped|cesped/.test(text)) return 'plant-grass';
      if (/moss|musgo|taxiphyllum|fissidens|vesicularia/.test(text)) return 'plant-moss';
      if (/anubias|microsorum|bolbitis|bucephalandra|rhizome|rizoma/.test(text)) return 'plant-rhizome';
      return 'plant-generic';
    }

    if (type === 'equipment') {
      if (/pump|bomba|wavemaker|circul/.test(text)) return 'equipment-pump';
      if (/skimmer|espumador/.test(text)) return 'equipment-skimmer';
      if (/heater|calentador/.test(text)) return 'equipment-heater';
      if (/light|luz|led|t5|pantalla/.test(text)) return 'equipment-light';
      if (/filter|filtro|uv/.test(text)) return 'equipment-filter';
      return 'equipment-generic';
    }
    if (type === 'rock') return 'rock-generic';
    return 'other-generic';
  }

  function familyOptionsHtml(type, selected, marker) {
    const esc = window.ANX?.esc || (v => String(v || ''));
    const selectedValue = String(selected || '').trim();
    const autoFamily = resolveFamily({ ...(marker || {}), type, model_family: '' });
    const groups = Object.entries(FAMILY_GROUPS);
    return `<option value="" ${selectedValue ? '' : 'selected'}>Automático según nombre (${esc(autoFamily)})</option>` + groups.map(function ([group, rows]) {
      return `<optgroup label="${esc(group === 'fish' ? 'Peces' : group === 'coral' ? 'Corales' : group === 'plant' ? 'Plantas' : group === 'equipment' ? 'Equipos' : group === 'rock' ? 'Rocas' : 'Otros')}">${rows.map(function ([value, label]) {
        return `<option value="${esc(value)}" ${selectedValue === value ? 'selected' : ''}>${esc(label)}</option>`;
      }).join('')}</optgroup>`;
    }).join('');
  }

  window.ANX = window.ANX || {};
  window.ANX.MapModelFamilies = { FAMILY_GROUPS, resolveFamily, familyOptionsHtml };
})();
