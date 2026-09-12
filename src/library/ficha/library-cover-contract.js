/* AcuarioNexo · contrato único de portadas oficiales */
(function () {
  const ANX = window.ANX = window.ANX || {};

  const TEMPLATE_VERSION = 'cover-contract-v1';
  const MASTER_TEMPLATE = 'marine-fish-coral-v6-approved-layout';
  const GOLD = '#e7bc58';

  const CONTRACTS = Object.freeze({
    pez_marino: Object.freeze({
      entry_type: 'pez_marino',
      template: MASTER_TEMPLATE,
      automatic: true,
      requires_real_photo: true,
      allow_generated_subject: false,
      preserve_manual_cover: true,
      aspect_ratio: '1:1',
      canvas: Object.freeze({ width: 1200, height: 1200 }),
      common_name: Object.freeze({ position: 'top', x: 600, y: 112, max_width: 1040, start_size: 106, min_size: 48, color: GOLD, style: 'bold' }),
      scientific_name: Object.freeze({ position: 'bottom', x: 600, y: 1110, max_width: 980, start_size: 64, min_size: 34, color: GOLD, style: 'italic' }),
      subject: Object.freeze({ position: 'center', x: 75, y: 245, width: 1050, height: 760, real_cutout: true }),
      background: Object.freeze({ fixed: true, source: 'approved-marine-master' })
    }),
    coral: Object.freeze({
      entry_type: 'coral',
      template: MASTER_TEMPLATE,
      automatic: true,
      requires_real_photo: true,
      allow_generated_subject: false,
      preserve_manual_cover: true,
      aspect_ratio: '1:1',
      canvas: Object.freeze({ width: 1200, height: 1200 }),
      common_name: Object.freeze({ position: 'top', x: 600, y: 112, max_width: 1040, start_size: 106, min_size: 48, color: GOLD, style: 'bold' }),
      scientific_name: Object.freeze({ position: 'bottom', x: 600, y: 1110, max_width: 980, start_size: 64, min_size: 34, color: GOLD, style: 'italic' }),
      subject: Object.freeze({ position: 'center', x: 75, y: 245, width: 1050, height: 760, real_cutout: true }),
      background: Object.freeze({ fixed: true, source: 'approved-marine-master' })
    })
  });

  function clean(value) {
    return String(value ?? '').trim();
  }

  function contractFor(entryOrType) {
    const type = typeof entryOrType === 'string' ? entryOrType : entryOrType?.entry_type;
    return CONTRACTS[clean(type)] || null;
  }

  function supports(entryOrType) {
    return !!contractFor(entryOrType);
  }

  function isAutomatic(entryOrType) {
    return contractFor(entryOrType)?.automatic === true;
  }

  function validateEntry(entry, photoUrl) {
    const contract = contractFor(entry);
    if (!contract) throw new Error('Esta categoría todavía no tiene una plantilla oficial aprobada.');
    if (!clean(entry?.id)) throw new Error('La portada debe estar vinculada a una ficha real.');
    if (!clean(entry?.title)) throw new Error('La ficha necesita nombre para generar la portada.');
    if (!clean(entry?.scientific_name)) throw new Error('La ficha necesita nombre científico para generar la portada.');
    if (contract.requires_real_photo && !clean(photoUrl || entry?.photo_url)) {
      throw new Error('La ficha necesita una foto interior real para generar la portada.');
    }
    return contract;
  }

  function metadata(contract) {
    return {
      contract_version: TEMPLATE_VERSION,
      template: contract.template,
      automatic: contract.automatic,
      requires_real_photo: contract.requires_real_photo,
      allow_generated_subject: contract.allow_generated_subject,
      aspect_ratio: contract.aspect_ratio,
      common_name_position: contract.common_name.position,
      common_name_color: contract.common_name.color,
      scientific_name_position: contract.scientific_name.position,
      scientific_name_color: contract.scientific_name.color,
      scientific_name_style: contract.scientific_name.style,
      specimen_position: contract.subject.position,
      real_subject_cutout: contract.subject.real_cutout,
      fixed_background: contract.background.fixed
    };
  }

  ANX.LibraryCoverContract = {
    version: TEMPLATE_VERSION,
    masterTemplate: MASTER_TEMPLATE,
    contracts: CONTRACTS,
    supportedTypes: new Set(Object.keys(CONTRACTS)),
    contractFor,
    supports,
    isAutomatic,
    validateEntry,
    metadata
  };
})();
