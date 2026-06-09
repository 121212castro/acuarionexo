// AcuarioNexo · Fase 1: portada de acuario desde Fotos
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  ready(function () {
    const originalAm = window.am;
    const originalFotos = window.fotos;
    const originalSaveFoto = window.saveFoto;

    function esc(x) {
      return String(x ?? '').replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
      });
    }

    function fotoUrl(p) {
      return p?.image_url || p?.photo_url || p?.public_url || p?.url || '';
    }

    window.am = function (section) {
      const html = originalAm ? originalAm(section) : '';
      const aq = window.q || {};
      if (!aq.cover_photo_url) return html;
      return '<div class="tank-cover"><img src="' + esc(aq.cover_photo_url) + '" alt="Portada de ' + esc(aq.name || 'acuario') + '"></div>' + html;
    };

    window.fotos = async function () {
      if (!window.s || !window.q) return originalFotos ? originalFotos() : null;
      if (typeof window.currentAqSection !== 'undefined') window.currentAqSection = 'fotos';
      if (originalFotos) await originalFotos();

      setTimeout(async function () {
        const box = document.getElementById('galeriaList');
        if (!box) return;
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
              '<div class="quick-actions" style="margin-top:6px;gap:6px;">' +
              '<button class="small" onclick="setFotoPortada(\'' + p.id + '\')">' + (actual ? '⭐ Portada actual' : '⭐ Portada') + '</button>' +
              '<button class="danger small" onclick="deleteFoto(\'' + p.id + '\')">🗑️</button>' +
              '</div></div>';
          }).join('');
        } catch (e) {
          box.innerHTML = '<div class="error">' + esc(e.message) + '</div>';
        }
      }, 50);
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
        if (window.state?.aquarium) window.state.aquarium.cover_photo_url = url;
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
        const row = { user_id: window.u.id, aquarium_id: window.q.id, module: 'aquarium', title, file_path: path, public_url: publicUrl, image_url: publicUrl, photo_url: publicUrl, notes: title };
        const ins = await window.s.from('aquarium_photos').insert([row]);
        if (ins.error) throw ins.error;
        await window.fotos();
      } catch (e) {
        if (x) x.innerHTML = '<div class="error">' + esc(e.message) + '</div>';
      }
    };
  });
})();