const CATEGORIES = ["Food & Dining","Transportation","Shopping","Bills & Utilities","Entertainment","School","Health","Other"];
const icons = {"Food & Dining":"☕","Transportation":"⌁","Shopping":"◇","Bills & Utilities":"⌂","Entertainment":"♪","School":"▤","Health":"＋","Other":"•"};

const demoTransactions = [
  {id:"1",description:"Monthly allowance",amount:8250,type:"income",category:"Other",date:"2026-08-01",note:"Allowance"},
  {id:"2",description:"Lunch",amount:180,type:"expense",category:"Food & Dining",date:"2026-08-12",note:"Cafeteria"},
  {id:"3",description:"Jeepney fare",amount:60,type:"expense",category:"Transportation",date:"2026-08-12",note:"School commute"},
  {id:"4",description:"School supplies",amount:320,type:"expense",category:"School",date:"2026-08-10",note:"Notebook and pens"},
  {id:"5",description:"Mobile data",amount:199,type:"expense",category:"Bills & Utilities",date:"2026-08-09",note:"7-day data"},
  {id:"6",description:"Coffee",amount:150,type:"expense",category:"Food & Dining",date:"2026-08-08",note:"Study break"},
  {id:"7",description:"Movie night",amount:350,type:"expense",category:"Entertainment",date:"2026-08-07",note:"Weekend"},
  {id:"8",description:"New shirt",amount:600,type:"expense",category:"Shopping",date:"2026-08-05",note:"Casual wear"},
  {id:"9",description:"Medicine",amount:240,type:"expense",category:"Health",date:"2026-08-04",note:"Personal"},
  {id:"10",description:"Lunch",amount:220,type:"expense",category:"Food & Dining",date:"2026-08-03",note:"Lunch out"}
];

const demoBudgets = [
  {id:"b1",category:"Food & Dining",limit:2500},
  {id:"b2",category:"Transportation",limit:1200},
  {id:"b3",category:"Shopping",limit:1500},
  {id:"b4",category:"Bills & Utilities",limit:1200},
  {id:"b5",category:"Entertainment",limit:800}
];

let transactions = JSON.parse(localStorage.getItem("dbt_transactions")) || demoTransactions;
let budgets = JSON.parse(localStorage.getItem("dbt_budgets")) || demoBudgets;
let overviewChart, categoryChart, analyticsChart, analyticsCategoryChart;

const $ = id => document.getElementById(id);
const money = n => `₱${Number(n).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const save = () => { localStorage.setItem("dbt_transactions",JSON.stringify(transactions)); localStorage.setItem("dbt_budgets",JSON.stringify(budgets)); };
const expenseTotal = () => transactions.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0);
const incomeTotal = () => transactions.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0);
const categorySpent = cat => transactions.filter(t=>t.type==="expense"&&t.category===cat).reduce((a,t)=>a+t.amount,0);

function formatDate(date){ return new Date(date+"T00:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}); }
function showToast(msg){ const t=$("toast"); t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200); }

function renderDashboard(){
  const income=incomeTotal(), expenses=expenseTotal(), balance=income-expenses;
  $("incomeValue").textContent=money(income); $("expenseValue").textContent=money(expenses); $("balanceValue").textContent=money(balance);
  const totalBudget=budgets.reduce((a,b)=>a+b.limit,0), left=totalBudget-expenses;
  $("budgetLeftValue").textContent=money(Math.max(0,left)); $("budgetNote").textContent=`${money(totalBudget)} total limits`;
  renderRecent(); renderBudgetProgress(); renderOverviewChart(); renderCategoryChart();
}
function renderRecent(){
  const list=[...transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  $("recentTransactions").innerHTML=list.length?list.map(t=>`<div class="transaction-row"><div class="tx-icon">${icons[t.category]||"•"}</div><div><div class="tx-name">${escapeHtml(t.description)}</div><div class="tx-date">${formatDate(t.date)} · ${t.category}</div></div><div class="tx-amount ${t.type==="income"?"plus":"minus"}">${t.type==="income"?"+":"−"}${money(t.amount)}</div></div>`).join(""):`<div class="empty">No transactions yet.</div>`;
}
function renderBudgetProgress(){
  const el=$("budgetProgressList");
  el.innerHTML=budgets.length?budgets.map(b=>{
    const spent=categorySpent(b.category), pct=Math.min(100,Math.round(spent/b.limit*100)), cls=pct>=100?"danger":pct>=80?"warning":"";
    return `<div class="progress-item"><div class="progress-meta"><span>${icons[b.category]||"•"} ${b.category}</span><small>${money(spent)} / ${money(b.limit)}</small></div><div class="bar"><i class="${cls}" style="width:${pct}%"></i></div></div>`;
  }).join(""):`<div class="empty">No budgets yet.</div>`;
}
function renderOverviewChart(){
  const ctx=$("overviewChart").getContext("2d"); if(overviewChart) overviewChart.destroy();
  const labels=last7Labels(); const inc=labels.map(d=>sumOnDate(d,"income")), exp=labels.map(d=>sumOnDate(d,"expense"));
  overviewChart=new Chart(ctx,{type:"line",data:{labels,datasets:[
    {label:"Income",data:inc,borderColor:"#1f7a5a",backgroundColor:"rgba(31,122,90,.08)",fill:true,tension:.35,pointRadius:3},
    {label:"Expenses",data:exp,borderColor:"#d77b35",backgroundColor:"rgba(215,123,53,.05)",fill:true,tension:.35,pointRadius:3}
  ]},options:chartOptions()});
}
function renderCategoryChart(){
  const data=categoriesWithSpend(); const ctx=$("categoryChart").getContext("2d"); if(categoryChart)categoryChart.destroy();
  categoryChart=new Chart(ctx,{type:"doughnut",data:{labels:data.map(x=>x.category),datasets:[{data:data.map(x=>x.amount),backgroundColor:["#1f7a5a","#d77b35","#6c6b9a","#6c9a8a","#b56d6d","#777b84","#9b875f","#555"] ,borderWidth:3,borderColor:"#fff"}]},options:{responsive:true,maintainAspectRatio:false,cutout:"70%",plugins:{legend:{display:false}}}});
  $("categoryLegend").innerHTML=data.slice(0,5).map(x=>`<div class="legend-item"><span>${icons[x.category]||"•"} ${x.category}</span><b>${money(x.amount)}</b></div>`).join("");
}
function categoriesWithSpend(){return CATEGORIES.map(category=>({category,amount:categorySpent(category)})).filter(x=>x.amount>0).sort((a,b)=>b.amount-a.amount);}
function last7Labels(){const arr=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);arr.push(d.toISOString().slice(0,10));}return arr.map(d=>new Date(d+"T00:00:00").toLocaleDateString("en-PH",{weekday:"short"}));}
function sumOnDate(label,type){const labels=last7Labels(); const idx=labels.indexOf(label); if(idx<0)return 0; const d=new Date();d.setDate(d.getDate()-(6-idx));const key=d.toISOString().slice(0,10);return transactions.filter(t=>t.date===key&&t.type===type).reduce((a,t)=>a+t.amount,0);}
function chartOptions(){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{size:10},boxWidth:12}}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{beginAtZero:true,grid:{color:"#ededE8"},ticks:{font:{size:10},callback:v=>"₱"+v.toLocaleString()}}}};}

function renderTransactions(){
  const q=$("searchInput").value.toLowerCase(), type=$("typeFilter").value, cat=$("categoryFilter").value;
  const rows=transactions.filter(t=>(t.description+" "+t.category+" "+(t.note||"")).toLowerCase().includes(q)&&(type==="all"||t.type===type)&&(cat==="all"||t.category===cat)).sort((a,b)=>b.date.localeCompare(a.date));
  $("transactionTable").innerHTML=rows.length?rows.map(t=>`<tr><td><b>${escapeHtml(t.description)}</b><br><small>${escapeHtml(t.note||"")}</small></td><td>${t.category}</td><td>${formatDate(t.date)}</td><td><span class="type-pill type-${t.type}">${t.type}</span></td><td class="amount ${t.type==="income"?"plus":"minus"}">${t.type==="income"?"+":"−"}${money(t.amount)}</td><td><button class="action-btn" onclick="editTransaction('${t.id}')">✎</button><button class="action-btn" onclick="deleteTransaction('${t.id}')">×</button></td></tr>`).join(""):`<tr><td colspan="6" class="empty">No matching transactions.</td></tr>`;
}
function populateFilters(){
  $("categoryFilter").innerHTML='<option value="all">All categories</option>'+CATEGORIES.map(c=>`<option>${c}</option>`).join("");
  $("transactionCategory").innerHTML=CATEGORIES.map(c=>`<option>${c}</option>`).join("");
  $("budgetCategory").innerHTML=CATEGORIES.map(c=>`<option>${c}</option>`).join("");
}
function openTransaction(t=null){
  $("transactionModal").classList.add("open");
  $("modalTitle").textContent=t?"Edit transaction":"Add transaction";
  $("editId").value=t?.id||"";$("description").value=t?.description||"";$("amount").value=t?.amount||"";$("transactionType").value=t?.type||"expense";$("transactionCategory").value=t?.category||CATEGORIES[0];$("transactionDate").value=t?.date||new Date().toISOString().slice(0,10);$("transactionNote").value=t?.note||"";
}
function editTransaction(id){const t=transactions.find(x=>x.id===id);if(t)openTransaction(t)}
function deleteTransaction(id){if(confirm("Delete this transaction?")){transactions=transactions.filter(t=>t.id!==id);save();renderAll();showToast("Transaction deleted");}}
function renderBudgetPage(){
  $("budgetCards").innerHTML=budgets.length?budgets.map(b=>{const spent=categorySpent(b.category),pct=Math.min(100,Math.round(spent/b.limit*100)),remaining=b.limit-spent,cls=pct>=100?"danger":pct>=80?"warning":"";return `<article class="budget-card"><div class="panel-kicker">${icons[b.category]||"•"} CATEGORY</div><h3>${b.category}</h3><div class="budget-amount">${money(spent)} <span>of ${money(b.limit)}</span></div><div class="bar"><i class="${cls}" style="width:${pct}%"></i></div><div class="budget-foot"><span>${remaining>=0?money(remaining)+" left":"Over by "+money(Math.abs(remaining))}</span><button class="action-btn" onclick="deleteBudget('${b.id}')">×</button></div></article>`}).join(""):`<div class="empty">No budgets yet. Add your first monthly limit.</div>`;
}
function deleteBudget(id){budgets=budgets.filter(b=>b.id!==id);save();renderAll();showToast("Budget removed");}
function renderAnalytics(){
  const income=incomeTotal(), exp=expenseTotal(); $("savingsRate").textContent=income?Math.round((income-exp)/income*100)+"%":"0%";const top=categoriesWithSpend()[0];$("largestCategory").textContent=top?top.category:"—";$("transactionCount").textContent=transactions.length;
  const ctx=$("analyticsChart").getContext("2d");if(analyticsChart)analyticsChart.destroy();analyticsChart=new Chart(ctx,{type:"bar",data:{labels:last7Labels(),datasets:[{label:"Income",data:last7Labels().map(d=>sumOnDate(d,"income")),backgroundColor:"#1f7a5a"},{label:"Expenses",data:last7Labels().map(d=>sumOnDate(d,"expense")),backgroundColor:"#d77b35"}]},options:chartOptions()});
  const c2=$("analyticsCategoryChart").getContext("2d");if(analyticsCategoryChart)analyticsCategoryChart.destroy();const data=categoriesWithSpend();analyticsCategoryChart=new Chart(c2,{type:"bar",data:{labels:data.map(x=>x.category),datasets:[{label:"Spent",data:data.map(x=>x.amount),backgroundColor:"#1f7a5a",borderRadius:7}]},options:{...chartOptions(),indexAxis:"y"}});
}
function renderHistory(){
  const groups={}; transactions.forEach(t=>{const key=t.date.slice(0,7);groups[key]??=[];groups[key].push(t)});const keys=Object.keys(groups).sort().reverse();
  $("historyCards").innerHTML=keys.length?keys.map(key=>{const arr=groups[key],inc=arr.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0),exp=arr.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0),label=new Date(key+"-01T00:00:00").toLocaleDateString("en-PH",{month:"long",year:"numeric"});return `<article class="history-card"><div class="panel-kicker">MONTHLY SUMMARY</div><h3>${label}</h3><div class="big">${money(inc-exp)}</div><div class="history-line"><span>Income</span><b class="plus">${money(inc)}</b></div><div class="history-line"><span>Expenses</span><b class="minus">${money(exp)}</b></div><div class="history-line"><span>Transactions</span><b>${arr.length}</b></div></article>`}).join(""):`<div class="empty">Your monthly history will appear here.</div>`;
}
function renderAll(){renderDashboard();renderTransactions();renderBudgetPage();renderAnalytics();renderHistory();}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));
document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));
function switchView(view){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(view+"View").classList.add("active");document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===view));$("pageTitle").innerHTML={dashboard:"Good evening, Syrell <span>✦</span>",transactions:"Your money, in one place",analytics:"Your spending at a glance",budget:"Plan before you spend",history:"Your financial history"}[view];$("sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});}

$("quickAdd").onclick=()=>openTransaction();$("heroAdd").onclick=()=>openTransaction();$("transactionAdd").onclick=()=>openTransaction();$("budgetAdd").onclick=()=>$("budgetModal").classList.add("open");
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("transactionModal").classList.remove("open"));document.querySelectorAll("[data-close-budget]").forEach(b=>b.onclick=()=>$("budgetModal").classList.remove("open"));
$("transactionForm").onsubmit=e=>{e.preventDefault();const id=$("editId").value||Date.now().toString(),obj={id,description:$("description").value.trim(),amount:Number($("amount").value),type:$("transactionType").value,category:$("transactionCategory").value,date:$("transactionDate").value,note:$("transactionNote").value.trim()};const i=transactions.findIndex(t=>t.id===id);i>=0?transactions[i]=obj:transactions.push(obj);save();$("transactionModal").classList.remove("open");renderAll();showToast(i>=0?"Transaction updated":"Transaction added");};
$("budgetForm").onsubmit=e=>{e.preventDefault();const category=$("budgetCategory").value,limit=Number($("budgetAmount").value),existing=budgets.find(b=>b.category===category);existing?existing.limit=limit:budgets.push({id:Date.now().toString(),category,limit});save();$("budgetModal").classList.remove("open");$("budgetAmount").value="";renderAll();showToast("Budget saved");};
["searchInput","typeFilter","categoryFilter"].forEach(id=>$(id).addEventListener("input",renderTransactions));
$("chartPeriod").onchange=renderOverviewChart;
$("resetData").onclick=()=>{if(confirm("Restore the original demo data?")){transactions=structuredClone(demoTransactions);budgets=structuredClone(demoBudgets);save();renderAll();showToast("Demo data restored");}};
const today=new Date();$("dateLabel").textContent=today.toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
populateFilters();renderAll();
