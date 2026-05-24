/* AcuarioNexo · premium-ui neutralizado como controlador de navegación.
   La navegación oficial y estable queda en navigation-engine.js. */
window.AcuarioNexoPremiumUI={version:'neutralized-24-05-core-navigation'};
(function(){
  window.AcuarioNexoPremiumUI.active=false;
  window.AcuarioNexoPremiumUI.reason='navigation-engine is authoritative';
  window.AcuarioNexoPremiumUI.note='Este archivo queda cargado por compatibilidad, pero no redefine goSection, dashboard, acs ni home.';
  function noop(){return false}
  window.AcuarioNexoPremiumUI.noop=noop;
})();
