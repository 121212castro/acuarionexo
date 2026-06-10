/* AcuarioNexo · Biblioteca runtime fix
   Fuente única real: library_entries
*/
(function(){
  window.searchLibrary = async function(qv) {
    try {
      const r = await window.s
        .from('library_entries')
        .select('*')
        .or(`title.ilike.%${qv}%,scientific_name.ilike.%${qv}%`)
        .limit(20);
      if (r.error) return [];
      return (r.data || []).map(window.normLib || function(x){
        return {
          title: x.title || x.nombre || x.nombre_comun || x.common_name || x.nombre_cientifico || '',
          scientific_name: x.scientific_name || x.nombre_cientifico || '',
          category: x.category || x.tipo || x.tipo_ficha || 'other',
          photo_url: x.photo_url || x.foto_url || x.foto || x.imagen || x.image_url || '',
          description: x.description || x.descripcion || x.descripcion_detallada || ''
        };
      });
    } catch(e) {
      return [];
    }
  };

  window.bibliotecaTabla = async function(tabla, texto) {
    try {
      let q = window.s.from('library_entries').select('*').limit(60);
      if (texto) q = q.or('title.ilike.%' + texto + '%,scientific_name.ilike.%' + texto + '%,description.ilike.%' + texto + '%');
      const r = await q;
      if (r.error || !Array.isArray(r.data)) return [];
      const normalizar = window.bibliotecaNorm || function(x){
        return {
          nombre: x.title || x.nombre || x.nombre_comun || x.common_name || x.nombre_cientifico || x.scientific_name || 'Ficha sin nombre',
          cientifico: x.scientific_name || x.nombre_cientifico || x.scientific || '',
          categoria: x.category || x.tipo || x.tipo_ficha || x.grupo || x.seccion || 'fish',
          foto: x.photo_url || x.foto_url || x.foto || x.imagen || x.image_url || x.url_foto || '',
          descripcion: x.resumen_rapido || x.resumen || x.description || x.descripcion || x.descripcion_detallada || x.notes || '',
          raw: x
        };
      };
      return r.data.map(normalizar);
    } catch(e) {
      return [];
    }
  };

  window.bibliotecaDatos = async function(texto) {
    const rows = await window.bibliotecaTabla('library_entries', texto);
    const map = new Map();
    rows.forEach(f => {
      const key = String((f.nombre || '') + '|' + (f.cientifico || '')).toLowerCase();
      if (!map.has(key)) map.set(key, f);
    });
    return Array.from(map.values());
  };
})();
