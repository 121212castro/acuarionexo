// AcuarioNexo · Fase 1 V3: portada de acuario desde Fotos y lista de acuarios
(function () {
  function esc(x) {
    return String(x ?? '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function fotoUrl(p) {
    return p?.image_url || p?.photo_url || p?.public_url || p?.url || '';
  }

  function waitForApp(fn, tries) {
    tries = tries || 0;
    if (window.s && typeof window.am === 'function' && typeof window.fotos === 'function' && typeof window.dashboard === 'function') return fn();
    if (tries > 80) return;
    setTimeout(function () { waitForApp(fn, tries + 1); }, 100);
  }

  function install() {
    if (window.__ACUARIONEXO_PORTADA_FASE1_V3__) return;
    window.__ACUARIONEXO_PORTADA_FASE1_V3__ = true;

    const originalAm = window.am;
    const originalFotos = window.fotos;
    const originalSaveFoto = window.saveFoto;
    const originalDashboard = window.dashboard;

    window.am = function (section) {
      const html = originalAm ? originalAm(section) : '';
      const aq = window.q || {};
      if (!aq.cover_photo_url) return html;
      return '<div class="tank-cover" style="margin:16px 24px 8px;border-radius:22px;overflow:hidden;border:1px solid rgba(92,171,255,.35);box-shadow:0 16px 40px rgba(0,0,0,.25);">' +
        '<img src="' + esc(aq.cover_photo_url) + '" alt="Portada de ' + esc(aq.name || 'acuario') + '" style="width:100%;height:190px;object-fit:cover;display:block;">' +
        '</div>' + html;
    };

    async function patchDashboardCovers() {
      if (!window.s || !window.u) return;
      try {
        const r = await window.s.from('aquariums').select('id,name,cover_photo_url').eq('user_id', window.u.id);
        if (r.error) return;
        const list = r.data || [];
        list.forEach(function (a) {
          if (!a.cover_photo_url) return;
          document.querySelectorAll('.tank-card').forEach(function (card) {
            const title = card.querySelector('h3')?.textContent?.trim();
            if (title !== a.name) return;
            const art = card.querySelector('.tank-art');
            if (!art) return;
            art.innerHTML = '<img src="' + esc(a.cover_photo_url) + '" alt="' + esc(a.name) + '" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;">';
          });
        });
      } catch (e) {}
    }

    window.dashboard = async function () {
      if (originalDashboard) await originalDashboard();
      setTimeout(patchDashboardCovers, 100);
      setTimeout(patchDashboardCovers, 700);
    };

    async function renderGaleriaConPortada() {
      const box = document.getElementById('galeriaList');
      if (!box || !window.s || !window.q) return;
      try {
        const r = await window.s.from('aquarium_photos').select('*').eq('aquarium_id', window.q.id).order('created_at', { ascending: false }).limit(24);
        if (r.error) throw r.error;
        const data = r.data || [];
        if (!data.length) return;
        box.innerHTML = data.map(function (p) {
          const url = fotoUrl(p);
          const actual = url && url === window.q.cover_photo_url;
          return '<div class="item" style="padding:8px;position:relative;">' +
            '<img src="' + esc(url) + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;margin-bottom:4px;">' +
            '<b style="font-size:12px;display:block;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(p.title || p.caption || 'Sin título') + '</b>' +
            '<div class="quick-actions" style="margin-top:8px;gap:6px;display:flex;flex-wrap:wrap;">' +
            '<button class="small" style="font-size:12px;padding:7px 9px;" onclick="setFotoPortada(\'' + p.id + '\')">' + (actual ? '⭐ Portada actual' : '⭐ Portada') + '</button>' +
            '<button class="danger small" style="font-size:12px;padding:7px 9px;" onclick="deleteFoto(\'' + p.id + '\')">🗑️</button>' +
            '</div></div>';
        }).join('');
      } catch (e) {
        box.innerHTML = '<div class="error">' + esc(e.message) + '</div>';
      }
    }

    window.fotos = async function () {
      if (originalFotos) await originalFotos();
      setTimeout(renderGaleriaConPortada, 100);
      setTimeout(renderGaleriaConPortada, 600);
    };

    window.setFotoPortada = async function (id) {
      try {
        const r = await window.s.from('aquarium_photos').select('*').eq('id', id).single();
        if (r.error) throw r.error;
        const url = fotoUrl(r.data);
        if (!url) throw new Error('Esta foto no tiene URL válida para portada.');
        const up = await window.s.from('aquariums').update({ cover_photo_url: url, updated_at: new Date().toISOString() }).eq('id', window.q.id);
        if (up.error) throw up.error;
        window.q.cover_photo_url = url;
        await window.fotos();
      } catch (e) {
        alert(e.message);
      }
    };

    window.saveFoto = async function () {
      const file = (document.getElementById('fCam')?.files?.[0]) || (document.getElementById('fGal')?.files?.[0]);
      if (!file || !window.s || !window.q || !window.u) return originalSaveFoto ? originalSaveFoto() : null;
      const x = document.getElementById('x');
      try {
        if (x) x.innerHTML = '<div class="notice">Subiendo archivo a Supabase Storage...</div>';
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = 'gallery/' + window.u.id + '/' + window.q.id + '/' + Date.now() + '.' + ext;
        let publicUrl = null;
        for (const b of ['aquarium-photos', 'photos', 'animal-photos']) {
          const up = await window.s.storage.from(b).upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
          if (!up.error) { publicUrl = window.s.storage.from(b).getPublicUrl(path).data.publicUrl; break; }
        }
        if (!publicUrl) throw new Error('Error al subir la imagen. Verifica tus buckets.');
        const title = (document.getElementById('fTitle')?.value || '').trim() || 'Foto de acuario';
        const row = { user_id: window.u.id, aquarium_id: window.q.id, module: 'aquarium', title: title, file_path: path, public_url: publicUrl, image_url: publicUrl, photo_url: publicUrl, notes: title };
        const ins = await window.s.from('aquarium_photos').insert([row]);
        if (ins.error) throw ins.error;
        await window.fotos();
      } catch (e) {
        if (x) x.innerHTML = '<div class="error">' + esc(e.message) + '</div>';
      }
    };

    document.addEventListener('click', function () {
      if (document.getElementById('galeriaList')) setTimeout(renderGaleriaConPortada, 200);
      if (document.querySelector('.tank-card')) setTimeout(patchDashboardCovers, 250);
    }, true);

    setTimeout(patchDashboardCovers, 1200);
  }

  waitForApp(install);
})();