/* AcuarioNexo · generador único de fichas V3 · contrato único */
(function () {
  const { supabase, state, esc, byId, val, msg, render } = window.ANX;
  const { types, libraryInfoNotice, S } = window.ANX.LibraryV3Core;
  const FUNCTION = 'library-generator-v2';
  const MAX_REPAIRS = 2;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function call(body) {
    const response = await supabase.functions.invoke(FUNCTION, { body });
    if (response.error) throw new Error(response.error.message || 'Error del generador.');
    if (response.data?.error) throw new Error(response.data.message || response.data.error);
    return response.data;
  }

  function contractFor(entryType) {
    if (!S.contractForAI) throw new Error('El contrato canónico no está disponible. Actualiza la aplicación.');
    return S.contractForAI(entryType);
  }

  function buildEntry(parsed, entryType) {
    const summary = String(parsed.summary || parsed.sections?.summary || '').trim();
    return {
      title: String(parsed.title || '').trim(),
      scientific_name: String(parsed.scientific_name || '').trim() || null,
      entry_type: entryType,
      status: 'review',
      visibility: 'private',
      summary,
      sections: { ...(parsed.sections || {}), summary },
      data: parsed.data && typeof parsed.data === 'object' ? parsed.data : {},
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).map(x => x.trim()).filter(Boolean).slice(0, 30) : [],
      sources: S.normalizeSources(parsed.sources || []),
      identity_confirmed: true,
      identify_result: {
        source: 'generator-v3-canonical-contract',
        identity_confirmed: true,
        title: String(parsed.title || '').trim(),
        scientific_name: String(parsed.scientific_name || '').trim(),
        entry_type: entryType
      },
      ai_model: 'library-generator-v3-canonical-contract',
      ai_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  function auditHtml(audit) {
    if (!audit || audit.approved) return '';
    return `<div class="error"><strong>La ficha no se guardó.</strong><ul>${(audit.errors || []).slice(0, 30).map(error => `<li>${esc(error)}</li>`).join('')}</ul></div>`;
  }

  async function pollUntilDone(responseId, box, phase) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await wait(attempt < 5 ? 1500 : 3000);
      const result = await call({ action: 'poll', response_id: responseId });
      if (result.status === 'completed') return result.result;
      if (box) box.innerHTML = msg(`${phase} · ${result.status || 'en curso'}...`);
    }
    throw new Error('La generación excedió el tiempo de espera. No se guardó ninguna ficha.');
  }

  async function generateAndAudit(payload, box) {
    const started = await call({ action: 'start', ...payload });
    let responseId = started.response_id;
    let parsed = await pollUntilDone(responseId, box, 'Investigando y generando');
    let entry = buildEntry(parsed, payload.entry_type);
    let audit = S.audit(entry);

    for (let repair = 1; !audit.approved && repair <= MAX_REPAIRS; repair += 1) {
      if (box) box.innerHTML = `${msg(`Corrigiendo automáticamente (${repair}/${MAX_REPAIRS})...`)}${auditHtml(audit)}`;
      const startedRepair = await call({
        action: 'repair',
        entry_type: payload.entry_type,
        subject: payload.subject,
        scientific_name: payload.scientific_name,
        contract: payload.contract,
        previous_json: parsed,
        previous_response_id: responseId,
        audit_errors: audit.errors
      });
      responseId = startedRepair.response_id;
      parsed = await pollUntilDone(responseId, box, 'Reparando');
      entry = buildEntry(parsed, payload.entry_type);
      audit = S.audit(entry);
    }

    return { entry, audit };
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }

  window.copiarEsquemaExacto = async function () {
    const box = byId('aiBox');
    try {
      const entryType = val('entryType');
      if (!entryType || !S.CONTRACTS?.[entryType]) throw new Error('Selecciona una categoría válida.');
      if (!S.promptForAI) throw new Error('El contrato visible no está sincronizado con el validador. Actualiza la aplicación.');
      await copyText(S.promptForAI(entryType));
      if (box) box.innerHTML = msg('Esquema exacto copiado desde el mismo contrato que valida la ficha.', 'success');
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo copiar el esquema.', 'error');
    }
  };

  window.nuevaFichaV3 = function () {
    render(`<section class="panel">${libraryInfoNotice()}<button onclick="biblioteca()">← Biblioteca</button><h2>Generador de fichas</h2><div class="notice">El esquema visible, el generador y el validador usan ahora el mismo contrato. No existen reglas ocultas separadas.</div><label>Tipo exacto</label><select id="entryType">${types.filter(([key]) => key !== 'all').map(([key,name]) => `<option value="${key}">${esc(name)}</option>`).join('')}</select><button onclick="copiarEsquemaExacto()">Copiar esquema exacto</button><label>Nombre exacto del organismo, variedad o producto</label><input id="generatorSubject" placeholder="Ej. Nuclear Mix — Power Aquaculture"><label>Nombre científico conocido (opcional)</label><input id="generatorScientific" placeholder="Ej. Megacalanus sp."><button class="primary" onclick="generarFichaV2()">Investigar y crear ficha</button><div id="aiBox"></div></section>`, 'biblioteca');
  };

  window.generarFichaV2 = async function () {
    const box = byId('aiBox');
    try {
      const entryType = val('entryType');
      const subject = val('generatorSubject');
      const scientificName = val('generatorScientific');
      if (!entryType || !S.CONTRACTS?.[entryType]) throw new Error('Selecciona una categoría válida.');
      if (!subject) throw new Error('Escribe el nombre exacto de la ficha.');
      const contract = contractFor(entryType);
      box.innerHTML = msg(`Investigando ${subject} y comprobando ${contract.required_fields.length} campos con el contrato canónico...`);
      const { entry, audit } = await generateAndAudit({
        entry_type: entryType,
        subject,
        scientific_name: scientificName,
        contract
      }, box);

      if (!audit.approved) {
        box.innerHTML = `${msg('El generador no consiguió una ficha válida. No se guardó nada.', 'error')}${auditHtml(audit)}`;
        return;
      }

      const row = {
        ...entry,
        user_id: state.user.id,
        validation_result: {
          ...audit,
          approved: true,
          review_required: false,
          requires_review: false,
          audited_at: new Date().toISOString(),
          engine: 'library-generator-v3-canonical-contract'
        }
      };
      const { data, error } = await supabase.from('library_entries').insert(row).select('*').single();
      if (error) throw error;
      await biblioteca();
      formFicha(data.id);
      const status = byId('x');
      if (status) status.innerHTML = msg('Ficha creada, guardada y auditada con cero errores.', 'success');
    } catch (error) {
      if (box) box.innerHTML = msg(error.message || 'No se pudo generar la ficha.', 'error');
    }
  };

  window.buscarIdentify = window.generarFichaV2;
  window.crearBorradorV3 = window.generarFichaV2;
  window.ANX.LibraryV3AI = { call, contractFor, buildEntry, generateAndAudit };
})();