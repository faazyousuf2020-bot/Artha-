/* ---------- demo data ---------- */
let seed = 11;
const rnd = () => { seed = (seed*16807)%2147483647; return (seed-1)/2147483646; };
const RR = (a,b,st=10) => Math.round((a+rnd()*(b-a))/st)*st;
const pick = a => a[Math.floor(rnd()*a.length)];

const ACCOUNTS = [
  {id:'hdfc', name:'HDFC Savings', kind:'Bank account', bal:1020000},
  {id:'icici', name:'ICICI Current', kind:'Bank account', bal:442000},
  {id:'cash', name:'Cash wallet', kind:'Cash', bal:18000},
  {id:'card', name:'HDFC Regalia card', kind:'Credit card', bal:0}
];
const accName = id => (ACCOUNTS.find(a=>a.id===id)||{name:id}).name;

const EXP_CATS = {
  Housing:['Rent','Utilities','Internet','Maintenance'], Food:['Groceries'], Dining:['Restaurants','Cafés','Delivery'],
  Transportation:['Fuel','Cabs','Parking'], Travel:['Flights','Hotels'], Electronics:['Devices','Accessories'],
  Shopping:['Online','Apparel'], SaaS:['Productivity','Design','AI tools','Cloud'], Subscriptions:['Streaming','Music','Storage'],
  Education:['Courses'], Healthcare:['Pharmacy','Consultation'], Entertainment:['Movies','Events'], Business:['Tools','Assets'],
  Taxes:['Advance tax','Self-assessment'], Insurance:['Health','Vehicle'], Other:['Misc']
};
const INC_CATS = ['Salary','Business','Freelance','Side Gig','Investment Income','Dividends','Interest','Other'];

let TX = []; let tid = 1;
function add(o){
  const h = 8+Math.floor(rnd()*14), mi = Math.floor(rnd()*60);
  const t = Object.assign({id:'T'+String(tid++).padStart(4,'0'), time:`${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`,
    desc:'', sub:'', account:'hdfc', method:'UPI', gstRate:0, gstMode:'none', itc:'N/A', notes:'', tags:[], recurring:false, attach:0, ai:true}, o);
  if(t.gstRate>0 && t.gstMode==='none') t.gstMode='intra';
  if(t.gstRate>0 && t.itc==='N/A') t.itc='Not eligible';
  TX.push(t); return t;
}
const GIGS = [
  {id:'G1', client:'Arka Foods', project:'Landing page build', revenue:55000, expenses:2000, hours:22, status:'Paid', date:'2026-04-22'},
  {id:'G2', client:'Kovai Textiles', project:'Inventory dashboard', revenue:120000, expenses:8400, hours:64, status:'Paid', date:'2026-05-19'},
  {id:'G3', client:'Lumen Edtech', project:'App MVP sprint', revenue:180000, expenses:14500, hours:96, status:'Paid', date:'2026-06-26'},
  {id:'G4', client:'Meera Organics', project:'Brand identity', revenue:60000, expenses:2100, hours:30, status:'Paid', date:'2026-07-14'},
  {id:'G5', client:'Coimbatore Startups Forum', project:'Pitch deck review', revenue:40000, expenses:0, hours:12, status:'Paid', date:'2026-08-06'},
  {id:'G6', client:'Nila Interiors', project:'Website refresh', revenue:72000, expenses:1800, hours:34, status:'Paid', date:'2026-08-27'},
  {id:'G7', client:'Zenith Dental', project:'Booking site', revenue:85000, expenses:3200, hours:38, status:'Paid', date:'2026-09-24'},
  {id:'G8', client:'Kovai Textiles', project:'Phase 2 analytics', revenue:95000, expenses:5000, hours:44, status:'Invoiced', date:'2026-09-29'}
];

MK.forEach((mk,i)=>{
  const D = d => mk+'-'+String(d).padStart(2,'0');
  add({date:D(1), time:'09:12', merchant:'Payroll — Salary', desc:'Monthly salary credit', amount:320000, type:'Income', cat:'Salary', sub:'Base pay', method:'NEFT', recurring:true});
  add({date:D(3), merchant:'Landlord — R.S. Puram', desc:'House rent', amount:45000, type:'Expense', cat:'Housing', sub:'Rent', recurring:true});
  add({date:D(5), merchant:'SBI Car Loan', desc:'EMI — Hyundai Creta', amount:18500, type:'Transfer', cat:'Loan repayment', sub:'Car loan', method:'Auto-debit', recurring:true});
  add({date:D(10), merchant:'Arun (family loan)', desc:'Monthly repayment', amount:20000, type:'Transfer', cat:'Loan repayment', sub:'Personal debt', recurring:true});
  add({date:D(7), merchant:'Zerodha Coin — SIP', desc:'Parag Parikh Flexi Cap SIP', amount:25000, type:'Investment', cat:'Mutual fund SIP', sub:'SIP', method:'Auto-debit', recurring:true});
  add({date:D(6), merchant:'TNEB Electricity', desc:'Electricity bill', amount:RR(2200,3400), type:'Expense', cat:'Housing', sub:'Utilities', recurring:true});
  add({date:D(8), merchant:'Airtel Xstream Fiber', desc:'Broadband 300 Mbps', amount:1178, type:'Expense', cat:'Housing', sub:'Internet', gstRate:18, account:'card', method:'Card', recurring:true});
  add({date:D(9), merchant:'Jio Postpaid', desc:'Mobile plan', amount:699, type:'Expense', cat:'Housing', sub:'Utilities', gstRate:18, recurring:true});
  for(let k=0;k<3;k++) add({date:D(4+k*9), merchant:'BigBasket', desc:'Weekly groceries', amount:RR(2800,5200), type:'Expense', cat:'Food', sub:'Groceries', gstRate:5, account:'card', method:'Card'});
  const rest = [['Annapoorna Gowrishankar',600,1400,'Restaurants'],['Barbeque Nation',2200,3800,'Restaurants'],['Starbucks Brookefields',450,950,'Cafés'],['Hari Bhavanam',900,2400,'Restaurants']];
  for(let k=0;k<3;k++){ const r=pick(rest); add({date:D(2+k*10), merchant:r[0], desc:'Dining', amount:RR(r[1],r[2]), type:'Expense', cat:'Dining', sub:r[3], gstRate:5, account:'card', method:'Card'}); }
  for(let k=0;k<4;k++) add({date:D(5+k*6), merchant:'Swiggy', desc:'Food delivery', amount:RR(380,920), type:'Expense', cat:'Dining', sub:'Delivery', gstRate:5});
  const saas = {gstRate:18, gstMode:'inter', account:'icici', method:'Card', recurring:true, itc:'Eligible', tags:['side-gig'], type:'Expense', cat:'SaaS'};
  add({...saas, date:D(2), merchant:'Notion', desc:'Notion Plus — annualised monthly', amount:1800, sub:'Productivity'});
  add({...saas, date:D(4), merchant:'Figma', desc:'Figma Professional', amount: i<3?1500:2100, sub:'Design'});
  add({...saas, date:D(11), merchant:'ChatGPT Plus', desc:'OpenAI subscription', amount:1950, sub:'AI tools'});
  add({...saas, date:D(1), merchant:'AWS', desc:'Cloud hosting — client apps', amount:[3500,3800,4100,4600,5200,5900][i], sub:'Cloud'});
  const subs = {gstRate:18, gstMode:'inter', account:'card', method:'Card', recurring:true, type:'Expense', cat:'Subscriptions'};
  add({...subs, date:D(2), merchant:'Netflix', desc:'Premium plan', amount:649, sub:'Streaming'});
  add({...subs, date:D(12), merchant:'Spotify', desc:'Individual', amount:119, sub:'Music'});
  add({...subs, date:D(15), merchant:'YouTube Premium', desc:'Individual', amount:149, sub:'Streaming'});
  add({...subs, date:D(18), merchant:'JioHotstar', desc:'Super plan', amount:299, sub:'Streaming'});
  add({...subs, date:D(20), merchant:'Apple iCloud+', desc:'50 GB storage', amount:75, sub:'Storage'});
  for(let k=0;k<2;k++) add({date:D(6+k*13), merchant:'Indian Oil — Avinashi Rd', desc:'Petrol', amount:RR(2400,3400), type:'Expense', cat:'Transportation', sub:'Fuel', account:'card', method:'Card', notes:'Petrol is outside GST'});
  for(let k=0;k<3;k++) add({date:D(3+k*8), merchant:'Uber', desc:'Cab ride', amount:RR(220,680), type:'Expense', cat:'Transportation', sub:'Cabs', gstRate:5});
  const nA = 1+Math.floor(rnd()*2);
  for(let k=0;k<nA;k++) add({date:D(9+k*11), merchant:'Amazon.in', desc:pick(['Home essentials','Books','Kitchen appliance','Desk accessories']), amount:RR(1200,8500), type:'Expense', cat:'Shopping', sub:'Online', gstRate:18, gstMode:'inter', account:'card', method:'Card'});
  if(i%2===0) add({date:D(16), merchant:'Myntra', desc:'Apparel', amount:RR(1400,2400), type:'Expense', cat:'Shopping', sub:'Apparel', gstRate:5, gstMode:'inter', account:'card', method:'Card'});
  add({date:D(13), merchant:'Apollo Pharmacy', desc:'Medicines', amount:RR(500,1800), type:'Expense', cat:'Healthcare', sub:'Pharmacy', gstRate:5});
  add({date:D(21), merchant:'BookMyShow', desc:'Movie tickets', amount:RR(450,1200), type:'Expense', cat:'Entertainment', sub:'Movies', gstRate:18});
  if(i%3===0) add({date:D(12), merchant:'HDFC ERGO', desc:'Health insurance — quarterly', amount:8400, type:'Expense', cat:'Insurance', sub:'Health', method:'Auto-debit', notes:'Individual health cover is GST-exempt'});
  if(i%2===1) add({date:D(19), merchant:'Envato Elements', desc:'Stock assets for client work', amount:1600, type:'Expense', cat:'Business', sub:'Tools', gstRate:18, gstMode:'inter', account:'icici', method:'Card', itc:'Eligible', tags:['side-gig']});
});
// one-offs
add({date:'2026-05-18', merchant:'Croma — Brookefields', desc:'Headphones + 1TB SSD', amount:22490, type:'Expense', cat:'Electronics', sub:'Accessories', gstRate:18, account:'card', method:'Card', attach:1});
add({date:'2026-06-08', merchant:'IndiGo', desc:'CJB → BOM return', amount:12400, type:'Expense', cat:'Travel', sub:'Flights', gstRate:5, gstMode:'inter', account:'card', method:'Card', attach:1});
add({date:'2026-06-09', merchant:'Vivanta Mumbai', desc:'2 nights', amount:18600, type:'Expense', cat:'Travel', sub:'Hotels', gstRate:18, gstMode:'inter', account:'card', method:'Card', attach:1});
add({date:'2026-06-14', merchant:'Coursera', desc:'Data analytics certificate', amount:3299, type:'Expense', cat:'Education', sub:'Courses', gstRate:18, gstMode:'inter', account:'card', method:'Card'});
add({date:'2026-08-11', merchant:'Udemy', desc:'React Native course', amount:499, type:'Expense', cat:'Education', sub:'Courses', gstRate:18, gstMode:'inter', account:'card', method:'Card'});
add({date:'2026-07-22', merchant:'Kovai Medical Center', desc:'Consultation', amount:1200, type:'Expense', cat:'Healthcare', sub:'Consultation', notes:'Healthcare services are GST-exempt'});
add({date:'2026-09-14', time:'18:42', merchant:'Apple Store', desc:'iPad Air 11"', amount:48000, type:'Expense', cat:'Electronics', sub:'Devices', gstRate:18, account:'card', method:'Card', attach:1, tags:['side-gig'], itc:'Review'});
add({date:'2026-06-15', merchant:'Income Tax Dept', desc:'Advance tax — Q1', amount:30000, type:'Tax', cat:'Taxes', sub:'Advance tax', method:'NEFT'});
add({date:'2026-09-15', merchant:'Income Tax Dept', desc:'Advance tax — Q2', amount:35000, type:'Tax', cat:'Taxes', sub:'Advance tax', method:'NEFT'});
add({date:'2026-07-18', merchant:'TCS', desc:'Final dividend', amount:2880, type:'Income', cat:'Dividends', sub:'Equity', method:'NEFT'});
add({date:'2026-09-30', time:'06:00', merchant:'HDFC Bank', desc:'Savings interest — Q2', amount:6200, type:'Income', cat:'Interest', sub:'Savings', method:'NEFT'});
add({date:'2026-08-21', merchant:'Amazon.in', desc:'Refund — returned kettle', amount:2499, type:'Refund', cat:'Shopping', sub:'Online', account:'card', method:'Card'});
add({date:'2026-08-02', merchant:'Self transfer', desc:'ICICI → HDFC', amount:50000, type:'Transfer', cat:'Self transfer', sub:'Internal', account:'icici', method:'IMPS'});
add({date:'2026-08-12', merchant:'Zerodha — NIFTYBEES', desc:'Top-up purchase', amount:50000, type:'Investment', cat:'ETF', sub:'Lump sum', method:'NEFT'});
GIGS.filter(g=>g.status==='Paid').forEach(g=> add({date:g.date, merchant:g.client, desc:g.project, amount:g.revenue, type:'Income', cat:'Side Gig', sub:'Client project', account:'icici', method:'NEFT', gigId:g.id, tags:['side-gig']}));

const sortTx = () => TX.sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));
sortTx();

const HOLDINGS = [
  {id:'H1', name:'Nippon India NIFTY 50 BeES', ticker:'NIFTYBEES', cls:'ETF', qty:3000, avg:250, price:281.5, prev:279.9, date:'2024-02-12', live:true},
  {id:'H2', name:'Tata Consultancy Services', ticker:'TCS', cls:'Equities', qty:120, avg:3770, price:4000, prev:4021, date:'2023-11-03', live:true},
  {id:'H3', name:'Startup equity — Series A', ticker:'PRIVATE', cls:'Private Equity', qty:1, avg:1008000, price:1190000, prev:1190000, date:'2024-06-01', live:false, note:'Marked at last round valuation'},
  {id:'H4', name:'Sovereign Gold Bond 2024 S-II', ticker:'SGBFEB32', cls:'Gold', qty:30, avg:10180, price:10667, prev:10612, date:'2024-02-21', live:true},
  {id:'H5', name:'Parag Parikh Flexi Cap', ticker:'PPFAS-DG', cls:'Mutual Funds', qty:1764.7, avg:85, price:89.6, prev:89.3, date:'2026-04-07', live:true}
];
const REALIZED = {amount:18400, note:'1 closed position · INFY sold Jun 2026'};
const OTHER_ASSETS = [
  {id:'A1', name:'Apartment — Saibaba Colony', cls:'Property', cost:3200000, value:4050000, date:'2021-03-14', notes:'2BHK, self-occupied'},
  {id:'A2', name:'Hyundai Creta', cls:'Vehicles', cost:1350000, value:620000, date:'2023-08-02', notes:'Hypothecated to SBI'},
  {id:'A3', name:'Crypto (BTC, ETH)', cls:'Digital Assets', cost:80000, value:106000, date:'2024-11-20', notes:'Hardware wallet'}
];
const LIABS = [
  {id:'L1', name:'SBI car loan', type:'Loans', outstanding:560000, original:900000, rate:8.9, emi:18500, due:'2026-10-05', term:'34 months'},
  {id:'L2', name:'HDFC Regalia card', type:'Credit Cards', outstanding:62000, original:62000, rate:42, emi:62000, due:'2026-10-12', term:'Statement due'},
  {id:'L3', name:'Family loan — Arun', type:'Personal Debt', outstanding:200000, original:300000, rate:0, emi:20000, due:'2026-10-10', term:'10 months'}
];
const NW_HISTORY = [['Jan',7490000],['Feb',7612000],['Mar',7520000],['Apr',7781000],['May',7905000],['Jun',8062000],['Jul',8140000],['Aug',8296000]];
const SUB_USAGE = {'JioHotstar':41,'YouTube Premium':33,'Apple iCloud+':0,'Netflix':3,'Spotify':1};

/* ---------- persistence (browser storage) ---------- */
const STORE_KEY = 'artha.data.v1';
function saveData(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify({v:1, tid, TX, HOLDINGS, OTHER_ASSETS, LIABS, ACCOUNTS, GIGS})); }catch(e){}
}
function applyData(d){
  if(!d || !Array.isArray(d.TX)) return false;
  TX = d.TX; tid = d.tid || TX.length+1;
  [[HOLDINGS,d.HOLDINGS],[OTHER_ASSETS,d.OTHER_ASSETS],[LIABS,d.LIABS],[ACCOUNTS,d.ACCOUNTS],[GIGS,d.GIGS]].forEach(([a,b])=>{ if(Array.isArray(b)) a.splice(0,a.length,...b); });
  sortTx(); return true;
}
function loadData(){ try{ return applyData(JSON.parse(localStorage.getItem(STORE_KEY))); }catch(e){ return false; } }
function resetData(){ try{ localStorage.removeItem(STORE_KEY); }catch(e){} location.reload(); }
function exportData(){
  const blob = new Blob([JSON.stringify({v:1, exported:new Date().toISOString(), tid, TX, HOLDINGS, OTHER_ASSETS, LIABS, ACCOUNTS, GIGS}, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `artha-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function importData(file, done){
  const r = new FileReader();
  r.onload = () => { try{ const ok = applyData(JSON.parse(r.result)); if(ok) saveData(); done(ok); }catch(e){ done(false); } };
  r.readAsText(file);
}
loadData();

/* ---------- derived numbers ---------- */
const hv = h => h.qty*h.price, hi = h => h.qty*h.avg;
const cashTotal = () => sum(ACCOUNTS.filter(a=>a.kind!=='Credit card'), a=>a.bal);
const invTotal = () => sum(HOLDINGS, hv);
const otherAssetsTotal = () => sum(OTHER_ASSETS, a=>a.value);
const assetsTotal = () => cashTotal()+invTotal()+otherAssetsTotal();
const liabTotal = () => sum(LIABS, l=>l.outstanding);
const netWorth = () => assetsTotal()-liabTotal();
const inMonth = (t,mk) => t.date.startsWith(mk);
const isSpend = t => t.type==='Expense';
function gstOf(t){
  const r=+t.gstRate||0; if(!r || t.type!=='Expense') return {base:t.amount, gst:0, c:0, s:0, i:0};
  const base=t.amount/(1+r/100), gst=t.amount-base;
  return t.gstMode==='inter' ? {base,gst,c:0,s:0,i:gst} : {base,gst,c:gst/2,s:gst/2,i:0};
}
function monthStats(mk){
  const tx = TX.filter(t=>inMonth(t,mk));
  const income = sum(tx.filter(t=>t.type==='Income'), t=>t.amount);
  const refunds = sum(tx.filter(t=>t.type==='Refund'), t=>t.amount);
  const expense = sum(tx.filter(isSpend), t=>t.amount) - refunds;
  const tax = sum(tx.filter(t=>t.type==='Tax'), t=>t.amount);
  const invest = sum(tx.filter(t=>t.type==='Investment'), t=>t.amount);
  const debt = sum(tx.filter(t=>t.type==='Transfer'&&t.cat==='Loan repayment'), t=>t.amount);
  const gig = sum(tx.filter(t=>t.cat==='Side Gig'), t=>t.amount);
  const gst = sum(tx.filter(isSpend), t=>gstOf(t).gst);
  const savings = income-expense-tax;
  return {income, expense, refunds, tax, invest, debt, gig, gst, savings, rate: income? savings/income : 0};
}
const spendByCat = (txs) => { const m={}; txs.filter(isSpend).forEach(t=>m[t.cat]=(m[t.cat]||0)+t.amount); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
const groupBy = (txs,key) => { const m={}; txs.forEach(t=>m[t[key]]=(m[t[key]]||0)+t.amount); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
const CUR = MK[MK.length-1], PREV = MK[MK.length-2];

function insights(){
  const out=[];
  const saasM = mk => sum(TX.filter(t=>inMonth(t,mk)&&t.cat==='SaaS'), t=>t.amount);
  const saasAvg = (saasM(MK[2])+saasM(MK[3])+saasM(MK[4]))/3, saasNow = saasM(CUR);
  out.push({tone:'red', text:`SaaS spending is ${pct(saasNow/saasAvg-1)} against your 3-month average (${sh(saasNow)} vs ${sh(saasAvg)}).`, why:'AWS and Figma account for most of the rise.', act:{f:{cat:'SaaS'}, label:'View SaaS transactions'}});
  const low = Object.entries(SUB_USAGE).filter(([k,v])=>v>=30);
  out.push({tone:'gold', text:`${low.length} subscriptions have no logged usage in 30+ days: ${low.map(x=>x[0]).join(', ')}.`, why:`Together ${inr(sum(low,x=>TX.find(t=>t.merchant===x[0]).amount))}/month.`, act:{f:{cat:'Subscriptions'}, label:'Review subscriptions'}});
  const top = HOLDINGS.slice().sort((a,b)=>hv(b)-hv(a))[0];
  out.push({tone:'cyan', text:`Portfolio concentration: ${top.name.split(' —')[0]} is ${(hv(top)/invTotal()*100).toFixed(0)}% of investments.`, why:'Single-holding weight above 35% flags concentration risk.', act:{tab:'portfolio', label:'Open portfolio'}});
  const s=monthStats(CUR), avgGig = sum(MK.slice(0,5), mk=>monthStats(mk).gig)/5;
  out.push({tone:'green', text:`Side-gig revenue this month is ${sh(s.gig)}, ${pct(s.gig/avgGig-1,0)} vs your 5-month average.`, why:'Kovai Textiles Phase 2 (₹95K) is invoiced and unpaid.', act:{f:{cat:'Side Gig'}, label:'View gig income'}});
  const e3 = (monthStats(MK[2]).expense+monthStats(MK[3]).expense+monthStats(MK[4]).expense)/3;
  out.push({tone:'red', text:`Monthly expenses are ${pct(s.expense/e3-1,0)} vs the 3-month average, driven by a ${sh(48000)} Apple Store purchase.`, why:'Excluding that purchase, spending is roughly flat.', act:{f:{cat:'Electronics'}, label:'View electronics'}});
  return out;
}
function alerts(){
  return [
    {tone:'red', t:'Large expense detected', d:'Apple Store · ₹48,000 · 14 Sep', f:{q:'Apple Store'}},
    {tone:'gold', t:'Loan payment due', d:'SBI car loan EMI ₹18,500 · 5 Oct', tab:'accounting'},
    {tone:'gold', t:'Card statement due', d:'HDFC Regalia ₹62,000 · 12 Oct', tab:'accounting'},
    {tone:'cyan', t:'Subscription renewal', d:'Netflix ₹649 renews 2 Oct', f:{cat:'Subscriptions'}},
    {tone:'gold', t:'Advance tax reminder', d:'Q3 instalment due 15 Dec', tab:'tax'},
    {tone:'green', t:'Investment price movement', d:'NIFTYBEES +0.6% today', tab:'portfolio'}
  ];
}

/* ---------- state ---------- */
const S = {
  tab:'cc', range:'6M', from:'2026-08-01', to:'2026-09-30',
  money:{sub:'ledger', q:'', type:'All', cat:'All', month:'All', sumMonth:CUR},
  tax:{month:'All'}, acct:{sub:'bs', month:CUR},
  an:{period:'6M', cat:null, sub:null, merchant:null, q:'', answer:null},
  chat:[], bell:false, layer:null
};
const TABS = [
  ['cc','Command Center','cc','1'],['money','Money','money','2'],['tax','Tax Intelligence','tax','3'],
  ['portfolio','Portfolio','port','4'],['accounting','Personal Accounting','acct','5'],['analytics','Analytics','ana','6'],['ai','Artha AI','ai','7']
];
const SHORT = {cc:'Home',money:'Money',tax:'Tax',portfolio:'Portfolio',accounting:'Books',analytics:'Analytics',ai:'AI'};
