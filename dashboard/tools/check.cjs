const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map(); const get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',style:{},addEventListener(){},focus(){},append(){},classList:{toggle(){}},setAttribute(){},removeAttribute(){}});return nodes.get(id);};
const sandbox={window:{addEventListener(){}},fetch:async()=>({ok:true,json:async()=>({conectada:true})}),document:{createElement:()=>({}),documentElement:{dataset:{}},querySelector:get,getElementById:id=>get('#'+id),querySelectorAll:()=>[]},location:{hash:'#resumen'},console,TextEncoder,Blob,setTimeout,clearTimeout};
vm.createContext(sandbox);for(const f of ['demo.js','export.js','app.js'])vm.runInContext(fs.readFileSync('dashboard/'+f,'utf8'),sandbox);
(async()=>{await new Promise(resolve=>setImmediate(resolve));for(const route of ['resumen','estudiantes','actividades','exportaciones','conexion','ayuda']){get('#dataset').value='assessments';sandbox.location.hash='#'+route;vm.runInContext('route()',sandbox);assert(get('#main').innerHTML.includes('<h1>'));}
get('#idFrom').value='1';get('#idTo').value='999999';let filtered=vm.runInContext("getRows('assessments')",sandbox);assert(filtered.length===1);assert(vm.runInContext("getRows('activities').length",sandbox)===1);
get('#idFrom').value='100';get('#idTo').value='1';assert(vm.runInContext("getRows('assessments').length",sandbox)===0);assert(get('#filter-error').textContent);
get('#idFrom').value='';get('#idTo').value='';get('#dateFrom').value='2099-01-01';assert(vm.runInContext("getRows('assessments').length",sandbox)===0);
const rows=[{id:'9007199254740993',observacion:'=SUM(1,2)\nTexto "con comas", áéí',global_score:'2.50'}];
const csv=await sandbox.window.makeExport(rows,['id','observacion'],'csv').text();assert(csv.includes("'=SUM"));assert(csv.includes('""con comas""'));
const txt=await sandbox.window.makeExport(rows,['observacion'],'txt').text();assert(txt.includes('áéí'));
const xlsx=sandbox.window.makeExport(rows,['id','observacion','global_score'],'xlsx');fs.writeFileSync('dashboard/tools/test-export.xlsx',Buffer.from(await xlsx.arrayBuffer()));console.log('PASS: 6 routes render, filters handle missing links and invalid ranges; CSV and TXT preserve content; XLSX generated.');})();
