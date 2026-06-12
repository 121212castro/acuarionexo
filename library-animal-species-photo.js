/* AcuarioNexo · Foto real en ficha animal */
(function() {
  const BUILD = 'library-animal-species-photo-v1';

  function speciesPhoto(row) {
    const raw = row?.raw || row || {};
    return raw.species_photo_url || raw.species_photo || raw.speciesPhoto ||
      row?.species_photo_url || row?.species_photo || row?.speciesPhoto ||
      row?.foto_real || raw.foto_real || row?.real_photo || raw.real_photo ||
      row?.photo_url || raw.photo_url || row?.foto || raw.foto || '';
  }

  function withSpeciesPhoto(row) {
    if (!row) return row;
    const photo = speciesPhoto(row);
    if (!photo) return row;
    const raw = { ...(row.raw || row || {}) };
    raw.species_photo_url = photo;
    raw.photo_url = photo;
    return {
      ...row,
      raw,
      foto: photo,
      photo_url: photo,
      species_photo_url: photo
    };
  }

  const previousVer = window.verFichaBiblioteca;
  window.verFichaBiblioteca = function(i) {
    const list = window.__bibliotecaVistaActual || [];
    if (!list[i]) return previousVer ? previousVer(i) : undefined;
    const original = list[i];
    list[i] = withSpeciesPhoto(original);
    try {
      return previousVer ? previousVer(i) : undefined;
    } finally {
      list[i] = original;
    }
  };

  const previousImport = window.importarAnimalBiblioteca;
  window.importarAnimalBiblioteca = function(row) {
    return previousImport ? previousImport(withSpeciesPhoto(row)) : undefined;
  };

  window.__ACUARIONEXO_LIBRARY_ANIMAL_SPECIES_PHOTO__ = BUILD;
})();
