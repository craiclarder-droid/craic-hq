
const DB_KEY = "craic_hq_v1";

const seed = {
  blends: [
    {id:"GH",name:"Garlic / Herb",retail:4.49,wholesale:2.50,market:4.50},
    {id:"SC",name:"Salt / Chilli",retail:4.49,wholesale:2.50,market:4.50},
    {id:"SS",name:"Smokey / Sweet",retail:4.49,wholesale:2.50,market:4.50},
    {id:"HS",name:"Highlander Salt",retail:4.49,wholesale:2.50,market:4.50},
    {id:"MX",name:"Mexican Mix",retail:4.49,wholesale:2.50,market:4.50},
    {id:"KH",name:"Kebab House",retail:4.49,wholesale:2.50,market:4.50},
    {id:"LH",name:"Lemon / Herb",retail:4.49,wholesale:2.50,market:4.50}
  ],
  stock: [
    {blendId:"GH",qty:0,low:10},{blendId:"SC",qty:0,low:10},{blendId:"SS",qty:0,low:10},
    {blendId:"HS",qty:0,low:10},{blendId:"MX",qty:0,low:10},{blendId:"KH",qty:0,low:10},{blendId:"LH",qty:0,low:10}
  ],
  resources: [
    ["salt","Coarse Sea Salt","Ingredient","g"],
    ["garlic","Garlic Minced 8/16","Ingredient","g"],
    ["blackpepper","Black Peppercorns Whole","Ingredient","g"],
    ["onion","Kibbled Onion","Ingredient","g"],
    ["brownsugar","Light Brown Sugar","Ingredient","g"],
    ["fenugreek","Fenugreek Whole","Ingredient","g"],
    ["oregano","Oregano Rubbed","Ingredient","g"],
    ["thyme","Thyme Rubbed","Ingredient","g"],
    ["lemon","Lemon Peel Dried","Ingredient","g"],
    ["pinkpepper","Pink Peppercorn Whole","Ingredient","g"],
    ["paprika","Paprika Noblesweet","Ingredient","g"],
    ["smokedsalt","Maldon Smoked Sea Salt","Ingredient","g"],
    ["chilli","Chilli Crushed","Ingredient","g"],
    ["coriander","Coriander Whole","Ingredient","g"],
    ["juniper","Juniper Berries","Ingredient","g"],
    ["caraway","Caraway Whole","Ingredient","g"],
    ["fennel","Fennel Seed Whole","Ingredient","g"],
    ["pimento","Pimento Whole","Ingredient","g"],
    ["parsley","Parsley","Ingredient","g"],
    ["whitepepper","Pepper White Whole","Ingredient","g"],
    ["marjoram","Marjoram Rubbed","Ingredient","g"],
    ["cumin","Cumin Whole","Ingredient","g"],
    ["ginger","Ginger Ground","Ingredient","g"],
    ["cinnamon","Ground Cinnamon","Ingredient","g"],
    ["cayenne","Cayenne","Ingredient","g"],
    ["pouch","Black Pouch","Packaging","item"],
    ["frontlabel","Front Label","Packaging","item"],
    ["backlabel","Back Label","Packaging","item"],
    ["desiccant","Desiccant","Packaging","item"],
    ["outerbox","Outer Box","Packaging","item"],
    ["tape","Tape","Packaging","item"],
    ["postage","Postage","Packaging","item"]
  ].map(x=>({id:x[0],name:x[1],type:x[2],unit:x[3],qty:0,supplier:"",batch:"",costPerUnit:0,reorder:0})),
  recipes: {
    GH:{salt:10,garlic:30,blackpepper:5,onion:5,brownsugar:5,fenugreek:5,oregano:3,thyme:3,lemon:1,pinkpepper:1},
    SC:{salt:40,chilli:25,garlic:10,brownsugar:13,blackpepper:2,coriander:2,juniper:1,caraway:1,fennel:.5,pimento:.5},
    SS:{brownsugar:20,paprika:19,smokedsalt:12,garlic:12,salt:5,onion:5,blackpepper:1},
    HS:{salt:40,parsley:9,onion:8,thyme:6,lemon:5,whitepepper:4,marjoram:4},
    KH:{salt:25,paprika:10,cumin:12,coriander:7,garlic:5,ginger:2,lemon:2,cayenne:2,cinnamon:3,blackpepper:1,brownsugar:1},
    MX:{paprika:16,salt:18,garlic:10,cumin:7,coriander:3,brownsugar:6,cayenne:2,lemon:3,onion:5,blackpepper:1,smokedsalt:5},
    LH:{salt:26,lemon:7,garlic:15,oregano:4,thyme:4,parsley:5,blackpepper:2,onion:5,brownsugar:2}
  },
  productionRuns:[], customers:[], orders:[], deliveries:[], movements:[], haccp:[]
};

let db = load();
let currentView = "dashboard";
const app = document.getElementById("app");

function load(){
  const raw=localStorage.getItem(DB_KEY);
  if(!raw) return structuredClone(seed);
  try{return JSON.parse(raw)}catch{return structuredClone(seed)}
}
function save(){localStorage.setItem(DB_KEY,JSON.stringify(db));}
function uid(prefix){return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6)}
function today(){return new Date().toISOString().slice(0,10)}
function money(n){return "£"+Number(n||0).toFixed(2)}
function blend(id){return db.blends.find(x=>x.id===id)}
function stock(id){return db.stock.find(x=>x.blendId===id)}
function resource(id){return db.resources.find(x=>x.id===id)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function options(items,valueKey,labelKey,selected=""){return items.map(x=>`<option value="${esc(x[valueKey])}" ${x[valueKey]===selected?"selected":""}>${esc(x[labelKey])}</option>`).join("")}
function batchCode(blendId,date){
  const d=new Date(date+"T12:00:00");
  const base=`${blendId}-${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getFullYear()).slice(-2)}`;
  const count=db.productionRuns.filter(r=>r.batchCode===base || r.batchCode.startsWith(base+"-")).length;
  return count?`${base}-${count+1}`:base;
}
function nav(v){currentView=v;render();}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>nav(b.dataset.view));
document.getElementById("menuBtn").onclick=()=>document.getElementById("nav").scrollIntoView({behavior:"smooth"});

function render(){
  const f={dashboard,stockView,resourcesView,productionView,ordersView,customersView,deliveriesView,traceabilityView,haccpView,backupView};
  const key={stock:"stockView",resources:"resourcesView",production:"productionView",orders:"ordersView",customers:"customersView",deliveries:"deliveriesView",traceability:"traceabilityView",haccp:"haccpView",backup:"backupView"}[currentView]||"dashboard";
  f[key]();
}

function dashboard(){
  const low=db.stock.filter(s=>s.qty<=s.low).length;
  const batches=db.productionRuns.length;
  const stockUnits=db.stock.reduce((a,b)=>a+Number(b.qty),0);
  const openOrders=db.orders.filter(o=>o.status!=="Complete").length;
  app.innerHTML=`<div class="grid">
    <section class="card"><div class="muted">Finished pouches</div><div class="kpi">${stockUnits}</div></section>
    <section class="card"><div class="muted">Low-stock blends</div><div class="kpi">${low}</div></section>
    <section class="card"><div class="muted">Production batches</div><div class="kpi">${batches}</div></section>
    <section class="card"><div class="muted">Open orders</div><div class="kpi">${openOrders}</div></section>
  </div>
  <section class="card"><h2>Latest audit activity</h2>${movementTable(db.movements.slice(-12).reverse())}</section>`;
}

function stockView(){
  app.innerHTML=`<section class="card"><h2>Finished Stock</h2>
  <table><tr><th>Blend</th><th>Qty</th><th>Low level</th><th>Status</th><th></th></tr>
  ${db.stock.map(s=>`<tr><td>${blend(s.blendId).name}</td>
  <td><input type="number" id="qty-${s.blendId}" value="${s.qty}"></td>
  <td><input type="number" id="low-${s.blendId}" value="${s.low}"></td>
  <td><span class="badge ${s.qty<=s.low?'bad':'good'}">${s.qty<=s.low?'LOW':'OK'}</span></td>
  <td><button onclick="saveStock('${s.blendId}')">Save</button></td></tr>`).join("")}</table></section>`;
}
window.saveStock=(id)=>{const s=stock(id);s.qty=Number(document.getElementById("qty-"+id).value);s.low=Number(document.getElementById("low-"+id).value);save();render();}

function resourcesView(){
  app.innerHTML=`<section class="card"><h2>Ingredients & Packaging</h2>
  <table><tr><th>Resource</th><th>Type</th><th>Stock</th><th>Unit</th><th>Supplier</th><th>Cost/unit</th><th></th></tr>
  ${db.resources.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.type}</td>
  <td><input type="number" step="0.01" id="rq-${r.id}" value="${r.qty}"></td><td>${r.unit}</td>
  <td><input id="rs-${r.id}" value="${esc(r.supplier)}"></td>
  <td><input type="number" step="0.00001" id="rc-${r.id}" value="${r.costPerUnit}"></td>
  <td><button onclick="saveResource('${r.id}')">Save</button></td></tr>`).join("")}</table></section>`;
}
window.saveResource=(id)=>{const r=resource(id);r.qty=Number(document.getElementById("rq-"+id).value);r.supplier=document.getElementById("rs-"+id).value;r.costPerUnit=Number(document.getElementById("rc-"+id).value);save();render();}

function productionView(){
  app.innerHTML=`<section class="card"><h2>Record Production Run</h2>
  <div class="row">
  <div><label>Date</label><input type="date" id="prDate" value="${today()}"></div>
  <div><label>Blend</label><select id="prBlend">${options(db.blends,"id","name")}</select></div>
  <div><label>Pouches made</label><input type="number" id="prQty" min="1" value="10"></div>
  </div>
  <label>Notes</label><textarea id="prNotes"></textarea>
  <div class="actions"><button onclick="recordProduction()">Complete production</button></div>
  </section>
  <section class="card"><h2>Production History</h2>
  <table><tr><th>Batch</th><th>Date</th><th>Blend</th><th>Qty</th><th>Notes</th></tr>
  ${db.productionRuns.slice().reverse().map(r=>`<tr><td><b>${r.batchCode}</b></td><td>${r.date}</td><td>${blend(r.blendId).name}</td><td>${r.qty}</td><td>${esc(r.notes)}</td></tr>`).join("")}</table></section>`;
}
window.recordProduction=()=>{
  const date=document.getElementById("prDate").value, blendId=document.getElementById("prBlend").value, qty=Number(document.getElementById("prQty").value), notes=document.getElementById("prNotes").value;
  if(!date||qty<=0) return alert("Enter a valid date and quantity.");
  const rec=db.recipes[blendId]||{};
  const shortages=[];
  for(const [rid,per] of Object.entries(rec)){const r=resource(rid); if(!r||r.qty < per*qty) shortages.push(`${r?.name||rid}: need ${per*qty}, have ${r?.qty||0}`);}
  if(shortages.length && !confirm("Ingredient stock is short:\n\n"+shortages.join("\n")+"\n\nRecord production anyway?")) return;
  const code=batchCode(blendId,date);
  const ingredients=[];
  for(const [rid,per] of Object.entries(rec)){
    const r=resource(rid), used=per*qty;
    if(r) r.qty-=used;
    ingredients.push({resourceId:rid,name:r?.name||rid,qty:used,unit:r?.unit||"g",supplierBatch:r?.batch||""});
    db.movements.push({id:uid("MOV"),date,type:"RESOURCE OUT",blendId,resourceId:rid,qty:-used,batchCode:code,notes:`Used in ${code}`});
  }
  for(const rid of ["pouch","frontlabel","backlabel","desiccant"]){
    const r=resource(rid); if(r){r.qty-=qty;ingredients.push({resourceId:rid,name:r.name,qty,unit:r.unit,supplierBatch:r.batch||""});}
  }
  stock(blendId).qty+=qty;
  db.movements.push({id:uid("MOV"),date,type:"FINISHED IN",blendId,resourceId:"",qty,batchCode:code,notes:`Production completed`});
  db.productionRuns.push({id:uid("RUN"),date,blendId,qty,batchCode:code,notes,ingredients,remaining:qty});
  save();render();
}

function customersView(){
  app.innerHTML=`<section class="card"><h2>Add Customer / Stockist</h2>
  <div class="row"><div><label>Business</label><input id="cBiz"></div><div><label>Contact</label><input id="cContact"></div>
  <div><label>Type</label><select id="cType"><option>Stockist</option><option>Wholesale</option><option>Website</option><option>Market</option></select></div></div>
  <div class="row"><div><label>Email</label><input id="cEmail"></div><div><label>Phone</label><input id="cPhone"></div></div>
  <label>Address / notes</label><textarea id="cNotes"></textarea>
  <div class="actions"><button onclick="addCustomer()">Save customer</button></div></section>
  <section class="card"><h2>Customers</h2><table><tr><th>Business</th><th>Contact</th><th>Type</th><th>Orders</th></tr>
  ${db.customers.map(c=>`<tr><td>${esc(c.business)}</td><td>${esc(c.contact)}</td><td>${c.type}</td><td>${db.orders.filter(o=>o.customerId===c.id).length}</td></tr>`).join("")}</table></section>`;
}
window.addCustomer=()=>{const business=document.getElementById("cBiz").value.trim(); if(!business)return alert("Business name required.");db.customers.push({id:uid("CUS"),business,contact:document.getElementById("cContact").value,type:document.getElementById("cType").value,email:document.getElementById("cEmail").value,phone:document.getElementById("cPhone").value,notes:document.getElementById("cNotes").value});save();render();}

function ordersView(){
  const batches=db.productionRuns.filter(r=>r.remaining>0);
  app.innerHTML=`<section class="card"><h2>Create & Complete Order</h2>
  ${db.customers.length?"":'<div class="notice">Add a customer first.</div>'}
  <div class="row"><div><label>Date</label><input id="oDate" type="date" value="${today()}"></div>
  <div><label>Customer</label><select id="oCustomer">${options(db.customers,"id","business")}</select></div>
  <div><label>Batch supplied</label><select id="oBatch">${batches.map(r=>`<option value="${r.id}">${r.batchCode} · ${blend(r.blendId).name} · ${r.remaining} left</option>`).join("")}</select></div>
  <div><label>Quantity</label><input id="oQty" type="number" min="1" value="5"></div></div>
  <label>Notes</label><textarea id="oNotes"></textarea>
  <div class="actions"><button onclick="completeOrder()">Complete order & deduct stock</button></div></section>
  <section class="card"><h2>Order History</h2>
  <table><tr><th>Date</th><th>Customer</th><th>Blend</th><th>Batch</th><th>Qty</th><th>Status</th></tr>
  ${db.orders.slice().reverse().map(o=>`<tr><td>${o.date}</td><td>${esc(db.customers.find(c=>c.id===o.customerId)?.business||"")}</td><td>${blend(o.blendId)?.name||""}</td><td>${o.batchCode}</td><td>${o.qty}</td><td>${o.status}</td></tr>`).join("")}</table></section>`;
}
window.completeOrder=()=>{
  if(!db.customers.length) return alert("Add a customer first.");
  const run=db.productionRuns.find(r=>r.id===document.getElementById("oBatch").value);
  if(!run) return alert("Choose an available batch.");
  const qty=Number(document.getElementById("oQty").value);
  if(qty<=0) return alert("Enter a valid quantity.");
  if(qty>run.remaining) return alert(`Only ${run.remaining} pouches remain in this batch.`);
  if(qty>stock(run.blendId).qty) return alert("Finished stock is too low.");
  run.remaining-=qty; stock(run.blendId).qty-=qty;
  const order={id:uid("ORD"),date:document.getElementById("oDate").value,customerId:document.getElementById("oCustomer").value,blendId:run.blendId,batchCode:run.batchCode,qty,status:"Complete",notes:document.getElementById("oNotes").value};
  db.orders.push(order);
  db.movements.push({id:uid("MOV"),date:order.date,type:"FINISHED OUT",blendId:run.blendId,resourceId:"",qty:-qty,batchCode:run.batchCode,notes:`Order to ${db.customers.find(c=>c.id===order.customerId)?.business||""}`});
  save();render();
}

function deliveriesView(){
  app.innerHTML=`<section class="card"><h2>Record Delivery</h2>
  <div class="row"><div><label>Date</label><input id="dDate" type="date" value="${today()}"></div>
  <div><label>Resource</label><select id="dRes">${options(db.resources,"id","name")}</select></div>
  <div><label>Quantity</label><input id="dQty" type="number" step="0.01"></div>
  <div><label>Cost paid</label><input id="dCost" type="number" step="0.01"></div></div>
  <div class="row"><div><label>Supplier</label><input id="dSupplier"></div><div><label>Supplier batch code</label><input id="dBatch"></div></div>
  <label>Notes</label><textarea id="dNotes"></textarea>
  <div class="actions"><button onclick="addDelivery()">Save delivery</button></div></section>
  <section class="card"><h2>Delivery History</h2><table><tr><th>Date</th><th>Resource</th><th>Qty</th><th>Supplier</th><th>Supplier batch</th></tr>
  ${db.deliveries.slice().reverse().map(d=>`<tr><td>${d.date}</td><td>${resource(d.resourceId)?.name||""}</td><td>${d.qty}</td><td>${esc(d.supplier)}</td><td>${esc(d.batch)}</td></tr>`).join("")}</table></section>`;
}
window.addDelivery=()=>{
  const resourceId=document.getElementById("dRes").value,r=resource(resourceId),qty=Number(document.getElementById("dQty").value);
  if(qty<=0)return alert("Enter a valid quantity.");
  const d={id:uid("DEL"),date:document.getElementById("dDate").value,resourceId,qty,cost:Number(document.getElementById("dCost").value),supplier:document.getElementById("dSupplier").value,batch:document.getElementById("dBatch").value,notes:document.getElementById("dNotes").value};
  r.qty+=qty;r.supplier=d.supplier||r.supplier;r.batch=d.batch||r.batch;if(d.cost>0)r.costPerUnit=d.cost/qty;
  db.deliveries.push(d);db.movements.push({id:uid("MOV"),date:d.date,type:"RESOURCE IN",blendId:"",resourceId,qty,batchCode:d.batch,notes:`Delivery from ${d.supplier}`});save();render();
}

function traceabilityView(){
  app.innerHTML=`<section class="card"><h2>Traceability Search</h2>
  <label>Batch code, blend or customer</label><input id="traceSearch" placeholder="e.g. GH-150726">
  <div class="actions"><button onclick="runTrace()">Search</button></div></section><div id="traceResults"></div>`;
}
window.runTrace=()=>{
  const q=document.getElementById("traceSearch").value.toLowerCase().trim();
  const runs=db.productionRuns.filter(r=>{
    const cust=db.orders.filter(o=>o.batchCode===r.batchCode).map(o=>db.customers.find(c=>c.id===o.customerId)?.business||"").join(" ");
    return [r.batchCode,blend(r.blendId).name,r.date,cust].join(" ").toLowerCase().includes(q);
  });
  document.getElementById("traceResults").innerHTML=runs.map(r=>{
    const outs=db.orders.filter(o=>o.batchCode===r.batchCode);
    return `<section class="card"><h3>${r.batchCode} · ${blend(r.blendId).name}</h3>
      <p><b>Made:</b> ${r.date} &nbsp; <b>Quantity:</b> ${r.qty} &nbsp; <b>Remaining:</b> ${r.remaining}</p>
      <h4>Inputs recorded</h4><table><tr><th>Resource</th><th>Qty</th><th>Supplier batch</th></tr>
      ${(r.ingredients||[]).map(i=>`<tr><td>${esc(i.name)}</td><td>${i.qty} ${i.unit}</td><td>${esc(i.supplierBatch)}</td></tr>`).join("")}</table>
      <h4>Customers supplied</h4>${outs.length?`<table><tr><th>Date</th><th>Customer</th><th>Qty</th></tr>${outs.map(o=>`<tr><td>${o.date}</td><td>${esc(db.customers.find(c=>c.id===o.customerId)?.business||"")}</td><td>${o.qty}</td></tr>`).join("")}</table>`:"<p>None recorded.</p>"}
    </section>`;
  }).join("")||`<section class="card">No matching traceability record.</section>`;
}

function haccpView(){
  app.innerHTML=`<section class="card"><h2>Add HACCP Record</h2>
  <div class="row"><div><label>Date</label><input id="hDate" type="date" value="${today()}"></div>
  <div><label>Record type</label><select id="hType">
  <option>Cleaning</option><option>Pest Control</option><option>Calibration</option><option>Complaint</option><option>Corrective Action</option><option>Recall Test</option><option>Market Checklist</option><option>Opening Check</option><option>Closing Check</option>
  </select></div>
  <div><label>Completed by</label><input id="hBy" value="James"></div>
  <div><label>Result</label><select id="hResult"><option>Pass</option><option>Fail</option><option>N/A</option></select></div></div>
  <label>Notes / observations</label><textarea id="hNotes"></textarea>
  <label>Corrective action</label><textarea id="hAction"></textarea>
  <div class="actions"><button onclick="addHaccp()">Save signed record</button></div></section>
  <section class="card"><h2>HACCP Log</h2><table><tr><th>Date</th><th>Type</th><th>By</th><th>Result</th><th>Notes</th><th>Action</th></tr>
  ${db.haccp.slice().reverse().map(h=>`<tr><td>${h.date}</td><td>${h.type}</td><td>${esc(h.by)}</td><td><span class="badge ${h.result==="Pass"?"good":h.result==="Fail"?"bad":""}">${h.result}</span></td><td>${esc(h.notes)}</td><td>${esc(h.action)}</td></tr>`).join("")}</table></section>`;
}
window.addHaccp=()=>{db.haccp.push({id:uid("HACCP"),date:document.getElementById("hDate").value,type:document.getElementById("hType").value,by:document.getElementById("hBy").value,result:document.getElementById("hResult").value,notes:document.getElementById("hNotes").value,action:document.getElementById("hAction").value,createdAt:new Date().toISOString()});save();render();}

function movementTable(moves){
  return `<table><tr><th>Date</th><th>Type</th><th>Item</th><th>Qty</th><th>Batch</th><th>Note</th></tr>${moves.map(m=>`<tr><td>${m.date}</td><td>${m.type}</td><td>${m.blendId?blend(m.blendId)?.name:resource(m.resourceId)?.name||""}</td><td>${m.qty}</td><td>${esc(m.batchCode)}</td><td>${esc(m.notes)}</td></tr>`).join("")}</table>`;
}
function backupView(){
  app.innerHTML=`<section class="card"><h2>Backup & Transfer</h2>
  <div class="notice"><b>Current version:</b> data is stored on this device. Export a backup regularly. Live multi-device cloud sync is not connected yet.</div>
  <div class="actions"><button onclick="exportBackup()">Export full backup</button><button class="secondary" onclick="document.getElementById('importFile').click()">Import backup</button><input hidden id="importFile" type="file" accept=".json" onchange="importBackup(event)"><button class="danger" onclick="resetApp()">Reset all data</button></div>
  <h3>Audit totals</h3><p>${db.productionRuns.length} batches · ${db.orders.length} orders · ${db.movements.length} stock movements · ${db.haccp.length} HACCP records</p></section>`;
}
window.exportBackup=()=>{
  const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`craic-hq-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);
}
window.importBackup=(e)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();render();alert("Backup imported.");}catch{alert("Invalid backup file.");}};r.readAsText(f);}
window.resetApp=()=>{if(confirm("Delete all Craic HQ data on this device?")){db=structuredClone(seed);save();render();}}

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
