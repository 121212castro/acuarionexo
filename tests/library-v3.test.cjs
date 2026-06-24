const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sandbox={URL,console,window:{ANX:{}},globalThis:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/library/library-schema.js'),'utf8'),sandbox);const S=sandbox.window.ANX.LibrarySchema;
const sources=[{name:'Fuente 1',url:'https://www.fishbase.se/a'},{name:'Fuente 2',url:'https://www.marinespecies.org/b'}];
function complete(type,o={}){const data={};(S.CONTRACTS[type]||[]).forEach(f=>{if(!['title','scientific_name','sources'].includes(f))data[f]=/(_cm|_liters|_min|_max|power|flow|volume|treatment_days)$/.test(f)?1:`Dato verificado ${f}`});if('reef_safe'in data)data.reef_safe='Sí con precaución';return{status:'review',title:'Entrada',entry_type:type,scientific_name:'',identity_confirmed:true,sources,data,...o}}
[
 complete('pez_marino',{title:'Pez payaso',scientific_name:'Amphiprion ocellaris'}),complete('pez_marino',{title:'Gramma real',scientific_name:'Gramma loreto'}),complete('pez_dulce',{title:'Escalar',scientific_name:'Pterophyllum scalare'}),complete('planta',{title:'Anubias nana',scientific_name:'Anubias barteri var. nana'}),complete('producto',{title:'Seachem Prime'}),complete('medicamento',{title:'Seachem Cupramine'}),complete('test',{title:'Hanna HI774'}),complete('equipamiento',{title:'EcoTech Marine VorTech MP40'})
].forEach(e=>assert.equal(S.audit(e).approved,true,e.title));
assert.equal(S.audit(complete('microfauna',{scientific_name:'Tisbe sp.'})).approved,false);
assert.equal(S.audit(complete('pez_marino',{scientific_name:'Naso elegans',sources:sources.slice(0,1)})).approved,false);
const generic=complete('pez_marino',{scientific_name:'Naso elegans'});generic.data.behavior='Compatible con peces pacíficos';assert.ok(S.audit(generic).warnings.length);
const gh=complete('pez_marino',{scientific_name:'Naso elegans'});gh.data.compatibility='GH 8';assert.equal(S.audit(gh).approved,false);
assert.equal(S.isConcreteScientificName('Naso spp.'),false);assert.equal(S.isConcreteScientificName('Naso elegans'),true);
console.log('Biblioteca V3: pruebas superadas');
