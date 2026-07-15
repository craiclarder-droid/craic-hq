
const DB_KEY = "craic_hq_v2";

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
    ["salt","Coarse Sea Salt","Ingredient","g"],["garlic","Garlic Minced 8/16","Ingredient","g"],
    ["blackpepper","Black Peppercorns Whole","Ingredient","g"],["onion","Kibbled Onion","Ingredient","g"],
    ["brownsugar","Light Brown Sugar","Ingredient","g"],["fenugreek","Fenugreek Whole","Ingredient","g"],
    ["oregano","Oregano Rubbed","Ingredient","g"],["thyme","Thyme Rubbed","Ingredient","g"],
    ["lemon","Lemon Peel Dried","Ingredient","g"],["pinkpepper","Pink Peppercorn Whole","Ingredient","g"],
    ["paprika","Paprika Noblesweet","Ingredient","g"],["smokedsalt","Maldon Smoked Sea Salt","Ingredient","g"],
    ["chilli","Chilli Crushed","Ingredient","g"],["coriander","Coriander Whole","Ingredient","g"],
    ["juniper","Juniper Berries","Ingredient","g"],["caraway","Caraway Whole","Ingredient","g"],
    ["fennel","Fennel Seed Whole","Ingredient","g"],["pimento","Pimento Whole","Ingredient","g"],
    ["parsley","Parsley","Ingredient","g"],["whitepepper","Pepper White Whole","Ingredient","g"],
    ["marjoram","Marjoram Rubbed","Ingredient","g"],["cumin","Cumin Whole","Ingredient","g"],
    ["ginger","Ginger Ground","Ingredient","g"],["cinnamon","Ground Cinnamon","Ingredient","g"],
    ["cayenne","Cayenne","Ingredient","g"],["pouch","Black Pouch","Packaging","item"],
    ["frontlabel","Front Label","Packaging","item"],["backlabel","Back Label","Packaging","item"],
    ["desiccant","Desiccant","Packaging","item"],["outerbox","Outer Box","Packaging","item"],
    ["tape","Tape","Packaging","item"],["postage","Postage","Packaging","item"]
  ].map(x=>({id:x[0],name:x[1],type:x[2],unit:x[3],qty:0,supplier:"",costPerUnit:0,reorder:0})),
  recipes: {
    GH:{salt:10,garlic:30,blackpepper:5,onion:5,brownsugar:5,fenugreek:5,oregano:3,thyme:3,lemon:1,pinkpepper:1},
    SC:{salt:40,chilli:25,garlic:10,brownsugar:13,blackpepper:2,coriander:2,juniper:1,caraway:1,fennel:.5,pimento:.5},
    SS:{brownsugar:20,paprika:19,smokedsalt:12,garlic:12,salt:5,onion:5,blackpepper:1},
    HS:{salt:40,parsley:9,onion:8,thyme:6,lemon:5,whitepepper:4,marjoram:4},
    KH:{salt:25,paprika:10,cumin:12,coriander:7,garlic:5,ginger:2,lemon:2,cayenne:2,cinnamon:3,blackpepper:1,brownsugar:1},
    MX:{paprika:16,salt:18,garlic:10,cumin:7,coriander:3,brownsugar:6,cayenne:2,lemon:3,onion:5,blackpepper:1,smokedsalt:5},
    LH:{salt:26,lemon:7,garlic:15,oregano:4,thyme:4,parsley:5,blackpepper:2,onion:5,brownsugar:2}
  },
  ingredientBatches:[],
  productionRuns:[], customers:[], orders:[], deliveries:[], movements:[], haccp:[], activity:[], settings:{businessName:"Craic Larder",address:"",ehoNumber:"",defaultOperator:"James",labourPerBatch:0}
};

let db = loadAndMigrate();
let currentView = "dashboard";
let preparedProduction = null;
const app = document.getElementById("app");

function clone(x){return JSON.parse(JSON.stringify(x))}
function loadAndMigrate(){
  let loaded=null;
  for(const key of [DB_KEY,"craic_hq_v1"]){
    const raw=localStorage.getItem(key);
    if(raw){try{loaded=JSON.parse(raw);break}catch{}}
  }
  const out=loaded||clone(seed);
  for(const [k,v] of Object.entries(seed)) if(out[k]===undefined) out[k]=clone(v);
  if(!Array.isArray(out.ingredientBatches)) out.ingredientBatches=[];
  out.resources=out.resources.map(r=>({...r,batch:undefined,active:r.active!==false}));
  out.blends=out.blends.map(b=>({...b,active:b.active!==false}));
  localStorage.setItem(DB_KEY,JSON.stringify(out));
  return out;
}
function save(){localStorage.setItem(DB_KEY,JSON.stringify(db))}
function uid(prefix){return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6)}
function today(){return new Date().toISOString().slice(0,10)}
function blend(id){return db.blends.find(x=>x.id===id)}
function stock(id){return db.stock.find(x=>x.blendId===id)}
function resource(id){return db.resources.find(x=>x.id===id)}
function activeResources(){return db.resources.filter(r=>r.active!==false)}
function activeBlends(){return db.blends.filter(b=>b.active!==false)}
function lot(id){return db.ingredientBatches.find(x=>x.id===id)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function options(items,valueKey,labelKey,selected=""){return items.map(x=>`<option value="${esc(x[valueKey])}" ${String(x[valueKey])===String(selected)?"selected":""}>${esc(x[labelKey])}</option>`).join("")}
function fmt(n){return Number(n||0).toLocaleString(undefined,{maximumFractionDigits:3})}
function money(n){return "£"+Number(n||0).toFixed(2)}
function batchCode(blendId,date){
  const d=new Date(date+"T12:00:00");
  const base=`${blendId}-${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getFullYear()).slice(-2)}`;
  const count=db.productionRuns.filter(r=>r.batchCode===base||r.batchCode.startsWith(base+"-")).length;
  return count?`${base}-${count+1}`:base;
}
function availableLots(resourceId){
  return db.ingredientBatches.filter(b=>b.resourceId===resourceId&&Number(b.remaining)>0)
    .sort((a,b)=>(a.receivedDate||"").localeCompare(b.receivedDate||""));
}
function recalcResourceQty(resourceId){
  const r=resource(resourceId);
  if(r) r.qty=availableLots(resourceId).reduce((sum,b)=>sum+Number(b.remaining||0),0);
}
function logActivity(type,details,date=today()){
  if(!Array.isArray(db.activity)) db.activity=[];
  db.activity.push({id:uid("ACT"),date,time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),type,details});
}
function resourceValue(type){
  return db.resources.filter(r=>r.type===type).reduce((sum,r)=>sum+(Number(r.qty||0)*Number(r.costPerUnit||0)),0);
}
function blendCost(blendId){
  const rec=db.recipes[blendId]||{};
  const ingredients=Object.entries(rec).map(([rid,qty])=>({rid,qty:Number(qty),cost:Number(resource(rid)?.costPerUnit||0)*Number(qty)}));
  const packagingIds=["pouch","frontlabel","backlabel","desiccant"];
  const packaging=packagingIds.map(rid=>({rid,qty:1,cost:Number(resource(rid)?.costPerUnit||0)}));
  const ingredientCost=ingredients.reduce((a,b)=>a+b.cost,0);
  const packagingCost=packaging.reduce((a,b)=>a+b.cost,0);
  return {ingredients,packaging,ingredientCost,packagingCost,total:ingredientCost+packagingCost};
}
function finishedStockCostValue(){
  return db.stock.reduce((sum,s)=>sum+(Number(s.qty||0)*blendCost(s.blendId).total),0);
}
function finishedStockRetailValue(){
  return db.stock.reduce((sum,s)=>sum+(Number(s.qty||0)*Number(blend(s.blendId)?.retail||0)),0);
}

function nav(v){currentView=v;preparedProduction=null;render()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>nav(b.dataset.view));
document.getElementById("menuBtn").onclick=()=>document.getElementById("nav").scrollIntoView({behavior:"smooth"});

function render(){
  const map={dashboard,stock:stockView,planner:plannerView,resources:resourcesView,blends:blendsView,recipes:recipesView,production:productionView,orders:ordersView,customers:customersView,deliveries:deliveriesView,costing:costingView,reports:reportsView,traceability:traceabilityView,haccp:haccpView,settings:settingsView,backup:backupView};
  (map[currentView]||dashboard)();
}
function dashboard(){
  const lowBlends=db.stock.filter(s=>s.qty<=s.low).length;
  const lowResources=db.resources.filter(r=>Number(r.qty||0)<=Number(r.reorder||0)&&Number(r.reorder||0)>0).length;
  const rawValue=resourceValue("Ingredient");
  const packagingValue=resourceValue("Packaging");
  const finishedCost=finishedStockCostValue();
  const finishedRetail=finishedStockRetailValue();
  const recent=(db.activity||[]).slice(-10).reverse();
  app.innerHTML=`<div class="grid">
  <section class="card"><div class="muted">Finished pouches</div><div class="kpi">${db.stock.reduce((a,b)=>a+Number(b.qty),0)}</div></section>
  <section class="card"><div class="muted">Low-stock blends</div><div class="kpi">${lowBlends}</div></section>
  <section class="card"><div class="muted">Low resources</div><div class="kpi">${lowResources}</div></section>
  <section class="card"><div class="muted">Open ingredient lots</div><div class="kpi">${db.ingredientBatches.filter(b=>b.remaining>0).length}</div></section>
  </div>
  <div class="grid">
  <section class="card"><h3>Inventory value</h3>
    <div class="metric-row"><span>Ingredients</span><b>${money(rawValue)}</b></div>
    <div class="metric-row"><span>Packaging</span><b>${money(packagingValue)}</b></div>
    <div class="metric-row"><span>Finished stock at cost</span><b>${money(finishedCost)}</b></div>
    <div class="metric-row"><span>Finished stock retail value</span><b>${money(finishedRetail)}</b></div>
  </section>
  <section class="card"><h3>Records</h3>
    <div class="metric-row"><span>Production batches</span><b>${db.productionRuns.length}</b></div>
    <div class="metric-row"><span>Completed orders</span><b>${db.orders.length}</b></div>
    <div class="metric-row"><span>HACCP records</span><b>${db.haccp.length}</b></div>
    <div class="metric-row"><span>Stock movements</span><b>${db.movements.length}</b></div>
  </section></div>
  <section class="card"><h2>Recent activity</h2>${recent.length?`<table><tr><th>Date</th><th>Time</th><th>Action</th><th>Details</th></tr>${recent.map(a=>`<tr><td>${a.date}</td><td>${a.time}</td><td>${esc(a.type)}</td><td>${esc(a.details)}</td></tr>`).join("")}</table>`:"<p>No activity recorded yet.</p>"}</section>`;
}
function plannerView(){const plans=activeBlends().map(b=>{const rec=db.recipes[b.id]||{};let max=Infinity,limiting="";for(const [rid,per] of Object.entries(rec)){if(Number(per)<=0)continue;const possible=Math.floor(Number(resource(rid)?.qty||0)/Number(per));if(possible<max){max=possible;limiting=resource(rid)?.name||rid}}for(const rid of ["pouch","frontlabel","backlabel","desiccant"]){const possible=Math.floor(Number(resource(rid)?.qty||0));if(possible<max){max=possible;limiting=resource(rid)?.name||rid}}if(max===Infinity)max=0;return {b,max,limiting}});app.innerHTML=`<section class="card"><h2>Production Planner</h2><div class="notice">Maximum pouches available from current stock.</div><div class="grid">${plans.map(p=>`<section class="card plan-card"><h3>${esc(p.b.name)}</h3><div class="kpi">${p.max}</div><div class="muted">pouches possible</div><p><b>Limiting item:</b> ${esc(p.limiting||"Recipe incomplete")}</p></section>`).join("")}</div></section><section class="card"><h2>Plan a Batch & Shopping List</h2><div class="row"><div><label>Blend</label><select id="planBlend">${options(activeBlends(),"id","name")}</select></div><div><label>Pouches planned</label><input type="number" id="planQty" value="40" min="1"></div></div><button onclick="calculateShopping()">Calculate shortages</button><div id="shoppingResult"></div></section>`}
window.calculateShopping=()=>{const blendId=document.getElementById("planBlend").value,qty=Number(document.getElementById("planQty").value),rec=db.recipes[blendId]||{},rows=[];for(const [rid,per] of Object.entries(rec)){const need=Number(per)*qty,have=Number(resource(rid)?.qty||0);rows.push({name:resource(rid)?.name||rid,need,have,short:Math.max(0,need-have),unit:resource(rid)?.unit||"g"})}for(const rid of ["pouch","frontlabel","backlabel","desiccant"]){const need=qty,have=Number(resource(rid)?.qty||0);rows.push({name:resource(rid)?.name||rid,need,have,short:Math.max(0,need-have),unit:resource(rid)?.unit||"item"})}document.getElementById("shoppingResult").innerHTML=`<h3>Requirements for ${qty} ${blend(blendId).name}</h3><table><tr><th>Resource</th><th>Need</th><th>Have</th><th>Order</th></tr>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${fmt(r.need)} ${r.unit}</td><td>${fmt(r.have)} ${r.unit}</td><td><b>${r.short>0?fmt(r.short)+" "+r.unit:"Enough"}</b></td></tr>`).join("")}</table>`}

function stockView(){
  app.innerHTML=`<section class="card"><h2>Add Opening Finished Stock</h2><div class="row"><div><label>Blend</label><select id="openBlend">${options(activeBlends(),"id","name")}</select></div><div><label>Quantity</label><input type="number" id="openQty" min="1"></div><div><label>Opening batch code</label><input id="openBatch" placeholder="e.g. GH-OPEN-160726"></div></div><button onclick="addOpeningFinished()">Add opening finished stock</button></section><section class="card"><h2>Finished Stock</h2>
  <table><tr><th>Blend</th><th>Total</th><th>Low level</th><th>Status</th></tr>
  ${db.stock.map(s=>`<tr><td>${blend(s.blendId).name}</td><td>${s.qty}</td>
  <td><input type="number" id="low-${s.blendId}" value="${s.low}"></td>
  <td><span class="badge ${s.qty<=s.low?'bad':'good'}">${s.qty<=s.low?'LOW':'OK'}</span> <button onclick="saveLow('${s.blendId}')">Save</button></td></tr>`).join("")}</table></section>
  <section class="card"><h2>Finished Batches</h2><table><tr><th>Batch</th><th>Blend</th><th>Made</th><th>Original</th><th>Remaining</th></tr>
  ${db.productionRuns.slice().reverse().map(r=>`<tr><td><b>${r.batchCode}</b></td><td>${blend(r.blendId).name}</td><td>${r.date}</td><td>${r.qty}</td><td>${r.remaining}</td></tr>`).join("")}</table></section>`;
}
window.saveLow=id=>{stock(id).low=Number(document.getElementById("low-"+id).value);save();render()}
window.addOpeningFinished=()=>{const blendId=document.getElementById("openBlend").value,qty=Number(document.getElementById("openQty").value),code=document.getElementById("openBatch").value.trim();if(qty<=0||!code)return alert("Enter quantity and an opening batch code.");stock(blendId).qty+=qty;db.productionRuns.push({id:uid("RUN"),date:today(),blendId,qty,batchCode:code,notes:"Opening finished stock",completedBy:"Opening Balance",inputs:[],remaining:qty,recipeSnapshot:clone(db.recipes[blendId]||{}),opening:true});db.movements.push({id:uid("MOV"),date:today(),type:"OPENING FINISHED IN",blendId,resourceId:"",qty,batchCode:code,notes:"Opening finished stock"});logActivity("Opening finished stock",`${code}: ${qty} ${blend(blendId).name}`);save();render()}

function resourcesView(){app.innerHTML=`<section class="card"><h2>Add Ingredient or Packaging</h2><div class="row"><div><label>Name</label><input id="newResName"></div><div><label>Type</label><select id="newResType"><option>Ingredient</option><option>Packaging</option></select></div><div><label>Unit</label><select id="newResUnit"><option>g</option><option>kg</option><option>item</option><option>ml</option><option>litre</option><option>roll</option><option>box</option></select></div><div><label>Reorder level</label><input type="number" step="0.01" id="newResReorder" value="0"></div></div><div class="row"><div><label>Default supplier</label><input id="newResSupplier"></div><div><label>Cost per unit</label><input type="number" step="0.00001" id="newResCost" value="0"></div></div><button onclick="addResource()">Add resource</button></section><section class="card"><h2>Ingredients & Packaging</h2><input class="search-box" id="resSearch" placeholder="Search resources" oninput="renderResourceTable()"><div class="notice">Use Deliveries or Opening Balance to add physical stock.</div><div id="resourceTable"></div></section>`;renderResourceTable()}
window.renderResourceTable=()=>{const q=(document.getElementById("resSearch")?.value||"").toLowerCase(),rows=db.resources.filter(r=>r.name.toLowerCase().includes(q)||r.type.toLowerCase().includes(q));document.getElementById("resourceTable").innerHTML=`<table><tr><th>Resource</th><th>Type</th><th>Available</th><th>Unit</th><th>Supplier</th><th>Cost/unit</th><th>Reorder</th><th>Actions</th></tr>${rows.map(r=>`<tr class="${r.active===false?'archived':''}"><td><input id="rn-${r.id}" value="${esc(r.name)}"></td><td><select id="rtp-${r.id}"><option ${r.type==="Ingredient"?"selected":""}>Ingredient</option><option ${r.type==="Packaging"?"selected":""}>Packaging</option></select></td><td>${fmt(r.qty)}</td><td><input id="ru-${r.id}" value="${esc(r.unit)}"></td><td><input id="rs-${r.id}" value="${esc(r.supplier||"")}"></td><td><input type="number" step="0.00001" id="rc-${r.id}" value="${r.costPerUnit||0}"></td><td><input type="number" step="0.01" id="rr-${r.id}" value="${r.reorder||0}"></td><td><div class="manager-actions"><button onclick="saveResource('${r.id}')">Save</button><button class="secondary" onclick="toggleResource('${r.id}')">${r.active===false?'Restore':'Archive'}</button></div></td></tr>`).join("")}</table>`}
window.addResource=()=>{const name=document.getElementById("newResName").value.trim();if(!name)return alert("Enter a resource name.");const id="RES-"+Date.now().toString(36);db.resources.push({id,name,type:document.getElementById("newResType").value,unit:document.getElementById("newResUnit").value,qty:0,supplier:document.getElementById("newResSupplier").value,costPerUnit:Number(document.getElementById("newResCost").value),reorder:Number(document.getElementById("newResReorder").value),active:true});logActivity("Resource added",name);save();render()}
window.saveResource=id=>{const r=resource(id);r.name=document.getElementById("rn-"+id).value.trim()||r.name;r.type=document.getElementById("rtp-"+id).value;r.unit=document.getElementById("ru-"+id).value.trim()||r.unit;r.supplier=document.getElementById("rs-"+id).value;r.costPerUnit=Number(document.getElementById("rc-"+id).value);r.reorder=Number(document.getElementById("rr-"+id).value);save();logActivity("Resource updated",r.name);render()}
window.toggleResource=id=>{const r=resource(id);r.active=r.active===false;save();logActivity(r.active?"Resource restored":"Resource archived",r.name);render()}
function blendsView(){app.innerHTML=`<section class="card"><h2>Add Blend</h2><div class="row"><div><label>Blend name</label><input id="newBlendName"></div><div><label>Short code</label><input id="newBlendCode" maxlength="6" placeholder="e.g. GH"></div><div><label>Wholesale</label><input type="number" step="0.01" id="newBlendWholesale" value="2.50"></div><div><label>Retail</label><input type="number" step="0.01" id="newBlendRetail" value="4.49"></div><div><label>Market</label><input type="number" step="0.01" id="newBlendMarket" value="4.50"></div></div><button onclick="addBlend()">Add blend</button></section><section class="card"><h2>Manage Blends</h2><table><tr><th>Name</th><th>Code</th><th>Wholesale</th><th>Retail</th><th>Market</th><th>Actions</th></tr>${db.blends.map(b=>`<tr class="${b.active===false?'archived':''}"><td><input id="bn-${b.id}" value="${esc(b.name)}"></td><td><b>${esc(b.id)}</b></td><td><input type="number" step="0.01" id="bw-${b.id}" value="${b.wholesale}"></td><td><input type="number" step="0.01" id="br-${b.id}" value="${b.retail}"></td><td><input type="number" step="0.01" id="bm-${b.id}" value="${b.market}"></td><td><div class="manager-actions"><button onclick="saveBlend('${b.id}')">Save</button><button class="secondary" onclick="toggleBlend('${b.id}')">${b.active===false?'Restore':'Archive'}</button></div></td></tr>`).join("")}</table></section>`}
window.addBlend=()=>{const name=document.getElementById("newBlendName").value.trim(),code=document.getElementById("newBlendCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");if(!name||!code)return alert("Enter a blend name and short code.");if(db.blends.some(b=>b.id===code))return alert("That blend code already exists.");db.blends.push({id:code,name,wholesale:Number(document.getElementById("newBlendWholesale").value),retail:Number(document.getElementById("newBlendRetail").value),market:Number(document.getElementById("newBlendMarket").value),active:true});db.stock.push({blendId:code,qty:0,low:10});db.recipes[code]={};logActivity("Blend added",name);save();render()}
window.saveBlend=id=>{const b=blend(id);b.name=document.getElementById("bn-"+id).value.trim()||b.name;b.wholesale=Number(document.getElementById("bw-"+id).value);b.retail=Number(document.getElementById("br-"+id).value);b.market=Number(document.getElementById("bm-"+id).value);save();logActivity("Blend updated",b.name);render()}
window.toggleBlend=id=>{const b=blend(id);b.active=b.active===false;save();logActivity(b.active?"Blend restored":"Blend archived",b.name);render()}

function recipesView(){
  const selected=document.getElementById("recipeBlend")?.value||db.blends[0].id;
  const rec=db.recipes[selected]||{};
  const lines=Object.entries(rec);
  app.innerHTML=`<section class="card"><h2>Master Recipes</h2>
  <div class="notice">Quantities are per retail pouch. Production multiplies these amounts by the number of pouches made.</div>
  <label>Blend</label><select id="recipeBlend" onchange="changeRecipeBlend()">${options(db.blends,"id","name",selected)}</select>
  <div id="recipeLines">
  ${lines.map(([rid,qty],i)=>recipeLine(i,rid,qty)).join("")}
  </div>
  <div class="actions"><button class="secondary" onclick="addRecipeLine()">Add ingredient</button><button onclick="saveRecipe()">Save master recipe</button></div>
  <p><b>Total pouch weight:</b> <span id="recipeTotal">${fmt(Object.values(rec).reduce((a,b)=>a+Number(b),0))}</span>g</p>
  </section>`;
}
function recipeLine(i,rid="",qty=""){return `<div class="recipe-line" data-i="${i}">
  <div><label>Ingredient</label><select class="recipe-resource">${options(activeResources().filter(r=>r.type==="Ingredient"),"id","name",rid)}</select></div>
  <div><label>Qty per pouch</label><input class="recipe-qty" type="number" step="0.01" value="${qty}"></div>
  <div><label>Unit</label><input value="g" disabled></div>
  <button class="danger" onclick="this.parentElement.remove();updateRecipeTotal()">Remove</button>
</div>`}
window.changeRecipeBlend=()=>render()
window.addRecipeLine=()=>{const box=document.getElementById("recipeLines");box.insertAdjacentHTML("beforeend",recipeLine(Date.now()));updateRecipeTotal()}
window.updateRecipeTotal=()=>{document.getElementById("recipeTotal").textContent=fmt([...document.querySelectorAll(".recipe-qty")].reduce((a,x)=>a+Number(x.value||0),0))}
window.saveRecipe=()=>{
  const blendId=document.getElementById("recipeBlend").value, rec={};
  document.querySelectorAll(".recipe-line").forEach(line=>{
    const rid=line.querySelector(".recipe-resource").value,qty=Number(line.querySelector(".recipe-qty").value);
    if(rid&&qty>0)rec[rid]=(rec[rid]||0)+qty;
  });
  db.recipes[blendId]=rec;save();alert("Master recipe saved.");render()
}

function productionView(){
  app.innerHTML=`<section class="card"><h2>Record Production Run</h2>
  <div class="row"><div><label>Date</label><input type="date" id="prDate" value="${today()}"></div>
  <div><label>Blend</label><select id="prBlend">${options(activeBlends(),"id","name")}</select></div>
  <div><label>Pouches made</label><input type="number" id="prQty" min="1" value="10"></div>
  <div><label>Completed by</label><input id="prBy" value="${esc(db.settings?.defaultOperator||"James")}"></div></div>
  <label>Notes</label><textarea id="prNotes"></textarea>
  <div class="actions"><button onclick="prepareProduction()">Calculate requirements & choose batches</button></div></section>
  <div id="productionPlan"></div>
  <section class="card"><h2>Production History</h2><table><tr><th>Batch</th><th>Date</th><th>Blend</th><th>Qty</th><th>By</th></tr>
  ${db.productionRuns.slice().reverse().map(r=>`<tr><td><b>${r.batchCode}</b></td><td>${r.date}</td><td>${blend(r.blendId).name}</td><td>${r.qty}</td><td>${esc(r.completedBy||"")}</td></tr>`).join("")}</table></section>`;
}
window.prepareProduction=()=>{
  const date=document.getElementById("prDate").value,blendId=document.getElementById("prBlend").value,qty=Number(document.getElementById("prQty").value);
  if(!date||qty<=0)return alert("Enter a valid date and quantity.");
  const rec=db.recipes[blendId]||{};
  const requirements=Object.entries(rec).map(([rid,per])=>({resourceId:rid,required:Number(per)*qty,lots:availableLots(rid)}));
  preparedProduction={date,blendId,qty,completedBy:document.getElementById("prBy").value,notes:document.getElementById("prNotes").value,requirements};
  document.getElementById("productionPlan").innerHTML=`<section class="card"><h2>Choose exact supplier batches</h2>
  <div class="notice">FIFO is suggested automatically. Select the exact lot used for each ingredient.</div>
  ${requirements.map((req,i)=>{
    const r=resource(req.resourceId), total=req.lots.reduce((a,b)=>a+Number(b.remaining),0);
    return `<div class="batch-choice"><b>${esc(r.name)}</b> — need ${fmt(req.required)} ${r.unit} · available ${fmt(total)}
    <label>Supplier lot used</label><select id="lot-${i}">
    <option value="">Choose lot</option>${req.lots.map(l=>`<option value="${l.id}">${esc(l.supplierBatch)} · ${fmt(l.remaining)} ${r.unit} left · ${esc(l.supplier)}</option>`).join("")}
    </select></div>`;
  }).join("")}
  <h3>Packaging</h3><p>${qty} pouches, ${qty} front labels, ${qty} back labels and ${qty} desiccants will be deducted by FIFO.</p>
  <div class="actions"><button onclick="completeProduction()">Complete production & create batch</button></div></section>`;
}
function consumeLot(lotId,amount,finishedCode,date,resourceId){
  const l=lot(lotId); if(!l||Number(l.remaining)<amount)return false;
  l.remaining=Number(l.remaining)-amount;
  db.movements.push({id:uid("MOV"),date,type:"RESOURCE OUT",blendId:"",resourceId,qty:-amount,batchCode:finishedCode,supplierBatch:l.supplierBatch,notes:`Used supplier lot ${l.supplierBatch} in ${finishedCode}`});
  recalcResourceQty(resourceId);return true;
}
function consumeFifo(resourceId,amount,finishedCode,date){
  let left=amount,uses=[];
  for(const l of availableLots(resourceId)){
    if(left<=0)break;
    const take=Math.min(Number(l.remaining),left);
    l.remaining-=take;left-=take;
    uses.push({lotId:l.id,supplierBatch:l.supplierBatch,qty:take});
    db.movements.push({id:uid("MOV"),date,type:"RESOURCE OUT",blendId:"",resourceId,qty:-take,batchCode:finishedCode,supplierBatch:l.supplierBatch,notes:`Used in ${finishedCode}`});
  }
  recalcResourceQty(resourceId);return {ok:left<=0,uses,left};
}
window.completeProduction=()=>{
  if(!preparedProduction)return alert("Calculate requirements first.");
  const {date,blendId,qty,completedBy,notes,requirements}=preparedProduction;
  const selected=[];
  for(let i=0;i<requirements.length;i++){
    const req=requirements[i],lotId=document.getElementById("lot-"+i).value,l=lot(lotId);
    if(!l)return alert(`Choose a supplier lot for ${resource(req.resourceId).name}.`);
    if(Number(l.remaining)<req.required)return alert(`${l.supplierBatch} does not contain enough ${resource(req.resourceId).name}.`);
    selected.push({req,lot:l});
  }
  for(const rid of ["pouch","frontlabel","backlabel","desiccant"]){
    if(availableLots(rid).reduce((a,b)=>a+Number(b.remaining),0)<qty)return alert(`Not enough ${resource(rid).name}. Record a delivery first.`);
  }
  const code=batchCode(blendId,date),inputs=[];
  for(const x of selected){
    consumeLot(x.lot.id,x.req.required,code,date,x.req.resourceId);
    inputs.push({resourceId:x.req.resourceId,name:resource(x.req.resourceId).name,qty:x.req.required,unit:resource(x.req.resourceId).unit,supplierBatch:x.lot.supplierBatch,lotId:x.lot.id});
  }
  for(const rid of ["pouch","frontlabel","backlabel","desiccant"]){
    const result=consumeFifo(rid,qty,code,date);
    result.uses.forEach(u=>inputs.push({resourceId:rid,name:resource(rid).name,qty:u.qty,unit:resource(rid).unit,supplierBatch:u.supplierBatch,lotId:u.lotId}));
  }
  stock(blendId).qty+=qty;
  db.movements.push({id:uid("MOV"),date,type:"FINISHED IN",blendId,resourceId:"",qty,batchCode:code,notes:"Production completed"});
  const currentCost=blendCost(blendId); db.productionRuns.push({id:uid("RUN"),date,blendId,qty,batchCode:code,notes,completedBy,inputs,remaining:qty,recipeSnapshot:clone(db.recipes[blendId]),costSnapshot:{ingredientCost:currentCost.ingredientCost,packagingCost:currentCost.packagingCost,costPerPouch:currentCost.total,totalBatchCost:currentCost.total*qty}}); logActivity("Production completed",`${code}: ${qty} ${blend(blendId).name}`);
  preparedProduction=null;save();alert(`Production complete. Batch ${code} created.`);render()
}

function customersView(){
  app.innerHTML=`<section class="card"><h2>Add Customer / Stockist</h2>
  <div class="row"><div><label>Business</label><input id="cBiz"></div><div><label>Contact</label><input id="cContact"></div>
  <div><label>Type</label><select id="cType"><option>Stockist</option><option>Wholesale</option><option>Website</option><option>Market</option></select></div></div>
  <div class="row"><div><label>Email</label><input id="cEmail"></div><div><label>Phone</label><input id="cPhone"></div></div>
  <label>Address / notes</label><textarea id="cNotes"></textarea><button onclick="addCustomer()">Save customer</button></section>
  <section class="card"><h2>Customers</h2><table><tr><th>Business</th><th>Contact</th><th>Type</th><th>Orders</th></tr>
  ${db.customers.map(c=>`<tr><td>${esc(c.business)}</td><td>${esc(c.contact)}</td><td>${c.type}</td><td>${db.orders.filter(o=>o.customerId===c.id).length}</td></tr>`).join("")}</table></section>`;
}
window.addCustomer=()=>{const business=document.getElementById("cBiz").value.trim();if(!business)return alert("Business name required.");db.customers.push({id:uid("CUS"),business,contact:document.getElementById("cContact").value,type:document.getElementById("cType").value,email:document.getElementById("cEmail").value,phone:document.getElementById("cPhone").value,notes:document.getElementById("cNotes").value});save();render()}

function ordersView(){
  const batches=db.productionRuns.filter(r=>r.remaining>0);
  app.innerHTML=`<section class="card"><h2>Create & Complete Order</h2>
  ${db.customers.length?"":'<div class="notice">Add a customer first.</div>'}
  <div class="row"><div><label>Date</label><input id="oDate" type="date" value="${today()}"></div>
  <div><label>Customer</label><select id="oCustomer">${options(db.customers,"id","business")}</select></div>
  <div><label>Batch supplied</label><select id="oBatch">${batches.map(r=>`<option value="${r.id}">${r.batchCode} · ${blend(r.blendId).name} · ${r.remaining} left</option>`).join("")}</select></div>
  <div><label>Quantity</label><input id="oQty" type="number" min="1" value="5"></div></div>
  <label>Notes</label><textarea id="oNotes"></textarea><button onclick="completeOrder()">Complete order & deduct stock</button></section>
  <section class="card"><h2>Order History</h2><table><tr><th>Date</th><th>Customer</th><th>Blend</th><th>Batch</th><th>Qty</th></tr>
  ${db.orders.slice().reverse().map(o=>`<tr><td>${o.date}</td><td>${esc(db.customers.find(c=>c.id===o.customerId)?.business||"")}</td><td>${blend(o.blendId)?.name||""}</td><td>${o.batchCode}</td><td>${o.qty}</td></tr>`).join("")}</table></section>`;
}
window.completeOrder=()=>{
  if(!db.customers.length)return alert("Add a customer first.");
  const run=db.productionRuns.find(r=>r.id===document.getElementById("oBatch").value),qty=Number(document.getElementById("oQty").value);
  if(!run)return alert("Choose an available batch.");if(qty<=0||qty>run.remaining)return alert(`Enter a quantity up to ${run.remaining}.`);
  run.remaining-=qty;stock(run.blendId).qty-=qty;
  const order={id:uid("ORD"),date:document.getElementById("oDate").value,customerId:document.getElementById("oCustomer").value,blendId:run.blendId,batchCode:run.batchCode,qty,status:"Complete",notes:document.getElementById("oNotes").value};
  db.orders.push(order);logActivity("Order completed",`${db.customers.find(c=>c.id===order.customerId)?.business||""}: ${qty} x ${run.batchCode}`,order.date);db.movements.push({id:uid("MOV"),date:order.date,type:"FINISHED OUT",blendId:run.blendId,resourceId:"",qty:-qty,batchCode:run.batchCode,notes:`Order to ${db.customers.find(c=>c.id===order.customerId)?.business||""}`});save();render()
}

function deliveriesView(){
  app.innerHTML=`<section class="card"><h2>Record Delivery / Supplier Lot</h2>
  <div class="row"><div><label>Date received</label><input id="dDate" type="date" value="${today()}"></div>
  <div><label>Resource</label><select id="dRes">${options(activeResources(),"id","name")}</select></div>
  <div><label>Quantity</label><input id="dQty" type="number" step="0.01"></div><div><label>Cost paid</label><input id="dCost" type="number" step="0.01"></div></div>
  <div class="row"><div><label>Supplier</label><input id="dSupplier"></div><div><label>Supplier batch code</label><input id="dBatch"></div>
  <div><label>Best before</label><input id="dBBE" type="date"></div></div>
  <label>Notes</label><textarea id="dNotes"></textarea><div class="actions"><button onclick="addDelivery()">Save delivery lot</button><button class="secondary" onclick="addOpeningBalance()">Save as opening balance</button></div></section>
  <section class="card"><h2>Delivery History</h2><table><tr><th>Date</th><th>Resource</th><th>Supplier batch</th><th>Received</th><th>Remaining</th><th>Supplier</th></tr>
  ${db.ingredientBatches.slice().reverse().map(d=>`<tr><td>${d.receivedDate}</td><td>${resource(d.resourceId)?.name||""}</td><td><b>${esc(d.supplierBatch)}</b></td><td>${fmt(d.quantity)}</td><td>${fmt(d.remaining)}</td><td>${esc(d.supplier)}</td></tr>`).join("")}</table></section>`;
}
function saveLot(mode){const resourceId=document.getElementById("dRes").value,r=resource(resourceId),qty=Number(document.getElementById("dQty").value);let supplierBatch=document.getElementById("dBatch").value.trim();if(qty<=0)return alert("Enter a valid quantity.");if(!supplierBatch)supplierBatch=mode==="Opening Balance"?"UNKNOWN-OPENING":"";if(!supplierBatch)return alert("Supplier batch code is required for traceability.");const d={id:uid("LOT"),receivedDate:document.getElementById("dDate").value,resourceId,quantity:qty,remaining:qty,cost:Number(document.getElementById("dCost").value),supplier:document.getElementById("dSupplier").value,supplierBatch,bestBefore:document.getElementById("dBBE").value,notes:document.getElementById("dNotes").value,entryType:mode};db.ingredientBatches.push(d);db.deliveries.push({...d});r.supplier=d.supplier||r.supplier;if(d.cost>0)r.costPerUnit=d.cost/qty;recalcResourceQty(resourceId);logActivity(mode,`${r.name}: ${qty} ${r.unit}, lot ${supplierBatch}`,d.receivedDate);db.movements.push({id:uid("MOV"),date:d.receivedDate,type:mode==="Opening Balance"?"OPENING RESOURCE IN":"RESOURCE IN",blendId:"",resourceId,qty,batchCode:"",supplierBatch,notes:mode==="Opening Balance"?"Opening balance":`Delivery from ${d.supplier}`});save();render()}
window.addDelivery=()=>saveLot("Delivery received")
window.addOpeningBalance=()=>saveLot("Opening Balance")

function traceabilityView(){
  app.innerHTML=`<section class="card"><h2>Traceability Search</h2><label>Finished batch, supplier batch, blend or customer</label>
  <input id="traceSearch" placeholder="e.g. GH-150726 or GAR-240701-A"><button onclick="runTrace()">Search</button></section><div id="traceResults"></div>`;
}
window.runTrace=()=>{
  const q=document.getElementById("traceSearch").value.toLowerCase().trim();
  const runs=db.productionRuns.filter(r=>{
    const cust=db.orders.filter(o=>o.batchCode===r.batchCode).map(o=>db.customers.find(c=>c.id===o.customerId)?.business||"").join(" ");
    const supplier=(r.inputs||r.ingredients||[]).map(i=>i.supplierBatch||"").join(" ");
    return [r.batchCode,blend(r.blendId).name,r.date,cust,supplier].join(" ").toLowerCase().includes(q);
  });
  document.getElementById("traceResults").innerHTML=runs.map(r=>{
    const outs=db.orders.filter(o=>o.batchCode===r.batchCode),inputs=r.inputs||r.ingredients||[];
    return `<section class="card"><h3>${r.batchCode} · ${blend(r.blendId).name}</h3>
    <p><b>Made:</b> ${r.date} · <b>By:</b> ${esc(r.completedBy||"")} · <b>Made:</b> ${r.qty} · <b>Remaining:</b> ${r.remaining}</p>
    <h4>Exact supplier lots used</h4><table><tr><th>Resource</th><th>Qty</th><th>Supplier batch</th></tr>
    ${inputs.map(i=>`<tr><td>${esc(i.name)}</td><td>${fmt(i.qty)} ${i.unit}</td><td><b>${esc(i.supplierBatch)}</b></td></tr>`).join("")}</table>
    <h4>Customers supplied</h4>${outs.length?`<table><tr><th>Date</th><th>Customer</th><th>Qty</th></tr>${outs.map(o=>`<tr><td>${o.date}</td><td>${esc(db.customers.find(c=>c.id===o.customerId)?.business||"")}</td><td>${o.qty}</td></tr>`).join("")}</table>`:"<p>None recorded.</p>"}</section>`;
  }).join("")||`<section class="card">No matching traceability record.</section>`;
}

function haccpView(){
  app.innerHTML=`<section class="card"><h2>Add HACCP Record</h2>
  <div class="row"><div><label>Date</label><input id="hDate" type="date" value="${today()}"></div>
  <div><label>Record type</label><select id="hType"><option>Cleaning</option><option>Pest Control</option><option>Calibration</option><option>Complaint</option><option>Corrective Action</option><option>Recall Test</option><option>Market Checklist</option><option>Opening Check</option><option>Closing Check</option><option>Temperature</option><option>Maintenance</option><option>Glass & Plastic Inspection</option></select></div>
  <div><label>Completed by</label><input id="hBy" value="James"></div><div><label>Result</label><select id="hResult"><option>Pass</option><option>Fail</option><option>N/A</option></select></div></div>
  <label>Notes / observations</label><textarea id="hNotes"></textarea><label>Corrective action</label><textarea id="hAction"></textarea><button onclick="addHaccp()">Save signed record</button></section>
  <section class="card"><h2>HACCP Log</h2><table><tr><th>Date</th><th>Type</th><th>By</th><th>Result</th><th>Notes</th><th>Action</th></tr>
  ${db.haccp.slice().reverse().map(h=>`<tr><td>${h.date}</td><td>${h.type}</td><td>${esc(h.by)}</td><td>${h.result}</td><td>${esc(h.notes)}</td><td>${esc(h.action)}</td></tr>`).join("")}</table></section>`;
}
window.addHaccp=()=>{const rec={id:uid("HACCP"),date:document.getElementById("hDate").value,type:document.getElementById("hType").value,by:document.getElementById("hBy").value,result:document.getElementById("hResult").value,notes:document.getElementById("hNotes").value,action:document.getElementById("hAction").value,createdAt:new Date().toISOString()};db.haccp.push(rec);logActivity("HACCP recorded",`${rec.type}: ${rec.result}`,rec.date);save();render()}

function movementTable(moves){return `<table><tr><th>Date</th><th>Type</th><th>Item</th><th>Qty</th><th>Finished batch</th><th>Supplier batch</th></tr>${moves.map(m=>`<tr><td>${m.date}</td><td>${m.type}</td><td>${m.blendId?blend(m.blendId)?.name:resource(m.resourceId)?.name||""}</td><td>${fmt(m.qty)}</td><td>${esc(m.batchCode)}</td><td>${esc(m.supplierBatch||"")}</td></tr>`).join("")}</table>`}

function costingView(){
  app.innerHTML=`<section class="card"><h2>Blend Costing</h2>
  <div class="notice">Costs use the latest cost per gram/item stored against each resource. Enter delivery costs to keep these figures current.</div>
  <table><tr><th>Blend</th><th>Ingredient cost</th><th>Packaging</th><th>Total cost</th><th>Wholesale profit / margin</th><th>Retail profit / margin</th><th>Market profit / margin</th></tr>
  ${db.blends.map(b=>{
    const c=blendCost(b.id);
    const calc=p=>({profit:Number(p)-c.total,margin:Number(p)>0?((Number(p)-c.total)/Number(p))*100:0});
    const w=calc(b.wholesale),r=calc(b.retail),m=calc(b.market);
    return `<tr><td><b>${esc(b.name)}</b></td><td>${money(c.ingredientCost)}</td><td>${money(c.packagingCost)}</td><td><b>${money(c.total)}</b></td>
    <td>${money(w.profit)} / ${w.margin.toFixed(1)}%</td><td>${money(r.profit)} / ${r.margin.toFixed(1)}%</td><td>${money(m.profit)} / ${m.margin.toFixed(1)}%</td></tr>`;
  }).join("")}</table></section>
  ${db.blends.map(b=>{
    const c=blendCost(b.id);
    return `<section class="card"><h3>${esc(b.name)}</h3>
    <div class="grid"><div><h4>Ingredients</h4>${c.ingredients.map(i=>`<div class="metric-row"><span>${esc(resource(i.rid)?.name||i.rid)} · ${fmt(i.qty)}g</span><b>${money(i.cost)}</b></div>`).join("")}</div>
    <div><h4>Packaging</h4>${c.packaging.map(i=>`<div class="metric-row"><span>${esc(resource(i.rid)?.name||i.rid)}</span><b>${money(i.cost)}</b></div>`).join("")}</div></div>
    <div class="metric-row"><span>Cost per pouch</span><b>${money(c.total)}</b></div>
    <div class="metric-row"><span>Cost per kg</span><b>${money((c.total/((Object.values(db.recipes[b.id]||{}).reduce((a,x)=>a+Number(x),0)||1)))*1000)}</b></div>
    </section>`;
  }).join("")}`;
}

function reportsView(){
  const lowRes=db.resources.filter(r=>Number(r.reorder||0)>0&&Number(r.qty||0)<=Number(r.reorder||0));
  app.innerHTML=`<section class="card no-print"><h2>Reports</h2><div class="actions"><button onclick="window.print()">Print current report</button></div></section>
  <section class="card"><h2>${esc(db.settings?.businessName||"Craic Larder")} — Stock Valuation</h2>
  <div class="metric-row"><span>Ingredients</span><b>${money(resourceValue("Ingredient"))}</b></div>
  <div class="metric-row"><span>Packaging</span><b>${money(resourceValue("Packaging"))}</b></div>
  <div class="metric-row"><span>Finished stock at production cost</span><b>${money(finishedStockCostValue())}</b></div>
  <div class="metric-row"><span>Finished stock at retail value</span><b>${money(finishedStockRetailValue())}</b></div></section>
  <section class="card"><h2>Low Stock</h2>${lowRes.length?`<table><tr><th>Resource</th><th>Available</th><th>Reorder level</th></tr>${lowRes.map(r=>`<tr><td>${esc(r.name)}</td><td>${fmt(r.qty)} ${r.unit}</td><td>${fmt(r.reorder)} ${r.unit}</td></tr>`).join("")}</table>`:"<p>No resources are below their reorder levels.</p>"}</section>
  <section class="card"><h2>Production History</h2><table><tr><th>Date</th><th>Batch</th><th>Blend</th><th>Qty</th><th>Batch cost</th><th>Cost/pouch</th></tr>
  ${db.productionRuns.slice().reverse().map(r=>`<tr><td>${r.date}</td><td>${r.batchCode}</td><td>${blend(r.blendId)?.name||""}</td><td>${r.qty}</td><td>${money(r.costSnapshot?.totalBatchCost||0)}</td><td>${money(r.costSnapshot?.costPerPouch||blendCost(r.blendId).total)}</td></tr>`).join("")}</table></section>
  <section class="card"><h2>HACCP Records</h2><table><tr><th>Date</th><th>Type</th><th>By</th><th>Result</th><th>Notes</th></tr>${db.haccp.slice().reverse().map(h=>`<tr><td>${h.date}</td><td>${h.type}</td><td>${esc(h.by)}</td><td>${h.result}</td><td>${esc(h.notes)}</td></tr>`).join("")}</table></section>`;
}

function settingsView(){
  const s=db.settings||{};
  app.innerHTML=`<section class="card"><h2>Settings</h2>
  <label>Business name</label><input id="setBusiness" value="${esc(s.businessName||"Craic Larder")}">
  <label>Business address</label><textarea id="setAddress">${esc(s.address||"")}</textarea>
  <label>EHO registration / reference</label><input id="setEho" value="${esc(s.ehoNumber||"")}">
  <label>Default operator</label><input id="setOperator" value="${esc(s.defaultOperator||"James")}">
  <label>Optional labour cost per production batch</label><input type="number" step="0.01" id="setLabour" value="${Number(s.labourPerBatch||0)}">
  <div class="actions"><button onclick="saveSettings()">Save settings</button></div></section>
  <section class="card"><h2>Blend selling prices</h2><table><tr><th>Blend</th><th>Wholesale</th><th>Retail</th><th>Market</th><th></th></tr>
  ${db.blends.map(b=>`<tr><td>${esc(b.name)}</td><td><input type="number" step="0.01" id="wh-${b.id}" value="${b.wholesale}"></td><td><input type="number" step="0.01" id="rt-${b.id}" value="${b.retail}"></td><td><input type="number" step="0.01" id="mk-${b.id}" value="${b.market}"></td><td><button onclick="saveBlendPrice('${b.id}')">Save</button></td></tr>`).join("")}</table></section>`;
}
window.saveSettings=()=>{db.settings={businessName:document.getElementById("setBusiness").value,address:document.getElementById("setAddress").value,ehoNumber:document.getElementById("setEho").value,defaultOperator:document.getElementById("setOperator").value,labourPerBatch:Number(document.getElementById("setLabour").value)};save();logActivity("Settings updated","Business settings changed");render()}
window.saveBlendPrice=id=>{const b=blend(id);b.wholesale=Number(document.getElementById("wh-"+id).value);b.retail=Number(document.getElementById("rt-"+id).value);b.market=Number(document.getElementById("mk-"+id).value);save();logActivity("Selling prices updated",b.name);render()}

function backupView(){
  app.innerHTML=`<section class="card"><h2>Backup & Transfer</h2><div class="notice"><b>Current version:</b> data is stored on this device. Export a backup regularly. Live multi-device sync is not connected yet.</div>
  <div class="actions"><button onclick="exportBackup()">Export full backup</button><button class="secondary" onclick="document.getElementById('importFile').click()">Import backup</button><input hidden id="importFile" type="file" accept=".json" onchange="importBackup(event)"><button class="danger" onclick="resetApp()">Reset all data</button></div>
  <p>${db.productionRuns.length} batches · ${db.ingredientBatches.length} supplier lots · ${db.orders.length} orders · ${db.haccp.length} HACCP records · ${(db.activity||[]).length} activity entries</p></section>`;
}
window.exportBackup=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`craic-hq-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href)}
window.importBackup=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();render();alert("Backup imported.")}catch{alert("Invalid backup file.")}};r.readAsText(f)}
window.resetApp=()=>{if(confirm("Delete all Craic HQ data on this device?")){db=clone(seed);save();render()}}

if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
