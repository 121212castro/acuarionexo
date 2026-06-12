window.ACUARIONEXO_CONFIG = {
  SUPABASE_URL: "https://fpykunamxygclolnjnke.supabase.co",
  SUPABASE_KEY: "sb_publishable_FICmG_EDURKDibSrG0R2EA_kRqaHNe-",
  APP_VERSION: "AcuarioNexo Base Real V1",
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
  function loadLibraryRouter() {
    if (window.__ACUARIONEXO_LIBRARY_ROUTER_LOADING__) return;
    window.__ACUARIONEXO_LIBRARY_ROUTER_LOADING__ = true;
    var script = document.createElement('script');
    script.src = 'library-router.js?v=20260612-0220';
    script.defer = true;
    document.head.appendChild(script);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLibraryRouter);
  } else {
    loadLibraryRouter();
  }
})();
