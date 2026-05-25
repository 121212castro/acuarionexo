const app = document.getElementById('app');
const tabs = document.querySelectorAll('.tabs button[data-view]');
const refreshBtn = document.querySelector('[data-action="refresh"]');
const newBtn = document.querySelector('[data-action="new"]');

const estado = {
  vista:'lista'
};

function activarTab(vista){
  tabs.forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.view === vista);
  });
}

function render(){
  activarTab(estado.vista);

  if(estado.vista === 'foto'){
    app.innerHTML = `
      <h2>📷 Crear ficha desde foto</h2>
      <p>Zona limpia preparada para integrar análisis IA y generación automática de fichas.</p>
    `;
    return;
  }

  if(estado.vista === 'ia'){
    app.innerHTML = `
      <h2>🤖 IA</h2>
      <p>Panel preparado para prompts y generación JSON V4.</p>
    `;
    return;
  }

  if(estado.vista === 'json'){
    app.innerHTML = `
      <h2>⇄ JSON</h2>
      <p>Zona preparada para importar/exportar fichas.</p>
    `;
    return;
  }

  app.innerHTML = `
    <h2>📚 Biblioteca de fichas</h2>
    <p>Base limpia separada de AcuarioNexo principal.</p>
    <p>El menú inferior ya queda estable para móvil/PWA sin parches.</p>
  `;
}

function cambiarVista(vista){
  estado.vista = vista;
  render();
}

tabs.forEach(btn=>{
  btn.addEventListener('click',()=>{
    cambiarVista(btn.dataset.view);
  });
});

newBtn?.addEventListener('click',()=>{
  app.innerHTML = `
    <h2>✍️ Nueva ficha</h2>
    <p>Estructura limpia preparada para el creador V4.4.</p>
  `;
});

refreshBtn?.addEventListener('click',()=>{
  location.reload();
});

render();
