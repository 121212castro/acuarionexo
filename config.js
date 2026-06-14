window.ACUARIONEXO_CONFIG = {
  SUPABASE_URL: "https://fpykunamxygclolnjnke.supabase.co",
  SUPABASE_KEY: "sb_publishable_FICmG_EDURKDibSrG0R2EA_kRqaHNe-",
  APP_VERSION: "AcuarioNexo Base Real V2 · Tests separados",
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyCOSMcEEHG97qgtSeetB03fDYk8r-0420c",
    authDomain: "acuarionexo.firebaseapp.com",
    projectId: "acuarionexo",
    storageBucket: "acuarionexo.firebasestorage.app",
    messagingSenderId: "912663485955",
    appId: "1:912663485955:web:440ef36d43cecc37d4f836"
  },
  FIREBASE_VAPID_KEY: "BLhWFlKYQfuG9Moxoiifhm6igFoDMSZi27qCrVpt2c3HOkxIKay4I-iLPlXZhHC2vW4NmOpSg5dqliSNMUwb6Cc"
};

(function() {
  function loadScript(src, flag) {
    if (window[flag]) return;
    window[flag] = true;
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  }

  function loadRouters() {
    loadScript('library-router.js?v=20260612-0440', '__ACUARIONEXO_LIBRARY_ROUTER_LOADING__');
    loadScript('library-photo-roles.js?v=20260612-0440', '__ACUARIONEXO_LIBRARY_PHOTO_ROLES_LOADING__');
    loadScript('inventory-router.js?v=20260612-0440', '__ACUARIONEXO_INVENTORY_ROUTER_LOADING__');
    loadScript('animals-router.js?v=20260612-0440', '__ACUARIONEXO_ANIMALS_ROUTER_LOADING__');
    loadScript('animal-cover-cards.js?v=20260612-0440', '__ACUARIONEXO_ANIMAL_COVER_CARDS_LOADING__');
    loadScript('library-animal-guard.js?v=20260612-0440', '__ACUARIONEXO_LIBRARY_ANIMAL_GUARD_LOADING__');
    loadScript('animal-import-full.js?v=20260612-0440', '__ACUARIONEXO_ANIMAL_IMPORT_FULL_LOADING__');
    loadScript('library-animal-species-photo.js?v=20260612-0440', '__ACUARIONEXO_LIBRARY_ANIMAL_SPECIES_PHOTO_LOADING__');
    loadScript('library-admin-delete.js?v=20260612-0440', '__ACUARIONEXO_LIBRARY_ADMIN_DELETE_LOADING__');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRouters);
  } else {
    loadRouters();
  }
})();
