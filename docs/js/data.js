/* =========================================================
   ARTHA — data model, demo ledger, saving and derived totals
   ========================================================= */
const EXP_CATS = {
  Housing:['Rent','Utilities','Internet','Maintenance'], Food:['Groceries'], Dining:['Restaurants','Cafés','Delivery'],
  Transportation:['Fuel','Cabs','Parking'], Travel:['Flights','Hotels'], Electronics:['Devices','Accessories'],
  Shopping:['Online','Apparel'], SaaS:['Productivity','Design','AI tools','Cloud'], Subscriptions:['Streaming','Music','Storage'],
  Education:['Courses'], Healthcare:['Pharmacy','Consultation'], Entertainment:['Movies','Events'], Business:['Tools','Assets'],
  Taxes:['Advance tax','Self-assessment'], Insurance:['Health','Vehicle'], Other:['Misc']
};
const INC_CATS = ['Salary','Business','Freelance','Side Gig','Investment Income','Dividends','Interest','Other'];
const HOLDING_CLASSES = ['Equities','ETF','Mutual Funds','Gold','Private Equity','Other'];
const ASSET_CLASSES = ['Property','Vehicles','Digital Assets','Business Equity','Other Assets'];
const LIAB_TYPES = ['Loans','EMIs','Personal Debt','Business Debt','Other'];
const ACCOUNT_KINDS = ['Bank account','Cash','Credit card'];

/* ---------- the stores (everything the user owns lives here) ---------- */
let TX = []; let tid = 1;
const ACCOUNTS = [], HOLDINGS = [], OTHER_ASSETS = [], LIABS = [], GIGS = [];
let SNAP = {};                       // month → net worth snapshot
let META = {mode:null, realized:0, realizedNote:'', usage:{}, demoPrices:false};
const uid = p => p + Date.now().toString(36) + Math.floor(Math.random()*1e4).toString(36);
const accName = id => id==='invest' ? 'Investments' : (ACCOUNTS.find(a=>a.id===id)||{name:'Removed account'}).name;

let seed = 11;
const rnd = () => { seed = (seed*16807)%2147483647; return (seed-1)/2147483646; };
const RR = (a,b,st=10) => Math.round((a+rnd()*(b-a))/st)*st;
const pick = a => a[Math.floor(rnd()*a.length)];

function add(o){
  const h = 8+Math.floor(rnd()*14), mi = Math.floor(rnd()*60);
  const t = Object.assign({id:'T'+String(tid++).padStart(4,'0'), time:`${pad2(h)}:${pad2(mi)}`,
    desc:'', sub:'', account:'hdfc', method:'UPI', gstRate:0, gstMode:'none', itc:'N/A', notes:'', tags:[], recurring:false, attach:0, ai:true}, o);
  if(t.date > TODAY) return null;                                  // never create future entries
  if(t.gstRate>0 && t.gstMode==='none') t.gstMode='intra';
  if(t.gstRate>0 && t.itc==='N/A') t.itc='Not eligible';
  TX.push(t); return t;
}
const sortTx = () => TX.sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));
const clearStores = () => { TX=[]; tid=1; [ACCOUNTS,HOLDINGS,OTHER_ASSETS,LIABS,GIGS].forEach(a=>a.splice(0)); SNAP={}; };

/* ---------- fresh start ---------- */
function seedFresh(){
  clearStores();
  ACCOUNTS.push({id:'bank', name:'Bank account', kind:'Bank account', bal:0}, {id:'cash', name:'Cash wallet', kind:'Cash', bal:0}, {id:'card', name:'Credit card', kind:'Credit card', bal:0});
  META = {mode:'fresh', realized:0, realizedNote:'', usage:{}, demoPrices:false};
}

/* ---------- demo ledger (last six months, relative to today) ---------- */
function seedDemo(){
  clearStores(); seed = 11;
  META = {mode:'demo', realized:18400, realizedNote:'1 closed position · INFY', usage:{'JioHotstar':41,'YouTube Premium':33,'Apple iCloud+':0,'Netflix':3,'Spotify':1}, demoPrices:true};
  ACCOUNTS.push({id:'hdfc', name:'HDFC Savings', kind:'Bank account', bal:1020000}, {id:'icici', name:'ICICI Current', kind:'Bank account', bal:442000},
                {id:'cash', name:'Cash wallet', kind:'Cash', bal:18000}, {id:'card', name:'HDFC Regalia card', kind:'Credit card', bal:62000});
  const DM = (i,d) => MK[i]+'-'+pad2(d);
  const gigs = [['Arka Foods','Landing page build',55000,2000,22,'Paid',0,22],['Kovai Textiles','Inventory dashboard',120000,8400,64,'Paid',1,19],
    ['Lumen Edtech','App MVP sprint',180000,14500,96,'Paid',2,26],['Meera Organics','Brand identity',60000,2100,30,'Paid',3,14],
    ['Coimbatore Startups Forum','Pitch deck review',40000,0,12,'Paid',3,27],['Nila Interiors','Website refresh',72000,1800,34,'Paid',4,8],
    ['Zenith Dental','Booking site',85000,3200,38,'Paid',4,24],['Kovai Textiles','Phase 2 analytics',95000,5000,44,'Invoiced',5,1]];
  gigs.forEach((g,k)=>GIGS.push({id:'G'+(k+1), client:g[0], project:g[1], revenue:g[2], expenses:g[3], hours:g[4], status:g[5], date:DM(g[6],g[7]), account:'icici'}));

  MK.forEach((mk,i)=>{
    const D = d => mk+'-'+pad2(d);
    add({date:D(1), time:'09:12', merchant:'Payroll — Salary', desc:'Monthly salary credit', amount:320000, type:'Income', cat:'Salary', sub:'Base pay', method:'NEFT', recurring:true});
    add({date:D(3), merchant:'Landlord — R.S. Puram', desc:'House rent', amount:45000, type:'Expense', cat:'Housing', sub:'Rent', recurring:true});
    add({date:D(5), merchant:'SBI Car Loan', desc:'EMI — Hyundai Creta', amount:18500, type:'Transfer', cat:'Loan repayment', sub:'Car loan', method:'Auto-debit', recurring:true, liab:'L1'});
    add({date:D(10), merchant:'Arun (family loan)', desc:'Monthly repayment', amount:20000, type:'Transfer', cat:'Loan repayment', sub:'Personal debt', recurring:true, liab:'L3'});
    add({date:D(7), merchant:'Zerodha Coin — SIP', desc:'Parag Parikh Flexi Cap SIP', amount:25000, type:'Investment', cat:'Mutual Funds', sub:'SIP', method:'Auto-debit', recurring:true});
    add({date:D(6), merchant:'TNEB Electricity', desc:'Electricity bill', amount:RR(2200,3400), type:'Expense', cat:'Housing', sub:'Utilities', recurring:true});
    add({date:D(8), merchant:'Airtel Xstream Fiber', desc:'Broadband 300 Mbps', amount:1178, type:'Expense', cat:'Housing', sub:'Internet', gstRate:18, account:'card', method:'Card', recurring:true});
    add({date:D(9), merchant:'Jio Postpaid', desc:'Mobile plan', amount:699, type:'Expense', cat:'Housing', sub:'Utilities', gstRate:18, recurring:true});
    for(let k=0;k<3;k++) add({date:D(4+k*9), merchant:'BigBasket', desc:'Weekly groceries', amount:RR(2800,5200), type:'Expense', cat:'Food', sub:'Groceries', gstRate:5, account:'card', method:'Card'});
    const rest = [['Annapoorna Gowrishankar',600,1400,'Restaurants'],['Barbeque Nation',2200,3800,'Restaurants'],['Starbucks Brookefields',450,950,'Cafés'],['Hari Bhavanam',900,2400,'Restaurants']];
    for(let k=0;k<3;k++){ const r=pick(rest); add({date:D(2+k*10), merchant:r[0], desc:'Dining', amount:RR(r[1],r[2]), type:'Expense', cat:'Dining', sub:r[3], gstRate:5, account:'card', method:'Card'}); }
    for(let k=0;k<4;k++) add({date:D(5+k*6), merchant:'Swiggy', desc:'Food delivery', amount:RR(380,920), type:'Expense', cat:'Dining', sub:'Delivery', gstRate:5});
    const saas = {gstRate:18, gstMode:'inter', account:'icici', method:'Card', recurring:true, itc:'Eligible', tags:['side-gig'], type:'Expense', cat:'SaaS'};
    add({...saas, date:D(2), merchant:'Notion', desc:'Notion Plus', amount:1800, sub:'Productivity'});
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
  add({date:DM(1,18), merchant:'Croma — Brookefields', desc:'Headphones + 1TB SSD', amount:22490, type:'Expense', cat:'Electronics', sub:'Accessories', gstRate:18, account:'card', method:'Card', attach:1});
  add({date:DM(2,8), merchant:'IndiGo', desc:'CJB → BOM return', amount:12400, type:'Expense', cat:'Travel', sub:'Flights', gstRate:5, gstMode:'inter', account:'card', method:'Card', attach:1});
  add({date:DM(2,9), merchant:'Vivanta Mumbai', desc:'2 nights', amount:18600, type:'Expense', cat:'Travel', sub:'Hotels', gstRate:18, gstMode:'inter', account:'card', method:'Card', attach:1});
  add({date:DM(2,14), merchant:'Coursera', desc:'Data analytics certificate', amount:3299, type:'Expense', cat:'Education', sub:'Courses', gstRate:18, gstMode:'inter', account:'card', method:'Card'});
  add({date:DM(4,11), merchant:'Udemy', desc:'React Native course', amount:499, type:'Expense', cat:'Education', sub:'Courses', gstRate:18, gstMode:'inter', account:'card', method:'Card'});
  add({date:DM(3,22), merchant:'Kovai Medical Center', desc:'Consultation', amount:1200, type:'Expense', cat:'Healthcare', sub:'Consultation', notes:'Healthcare services are GST-exempt'});
  add({date:DM(4,14), time:'18:42', merchant:'Apple Store', desc:'iPad Air 11"', amount:48000, type:'Expense', cat:'Electronics', sub:'Devices', gstRate:18, account:'card', method:'Card', attach:1, tags:['side-gig'], itc:'Review'});
  add({date:DM(2,15), merchant:'Income Tax Dept', desc:'Advance tax instalment', amount:30000, type:'Tax', cat:'Taxes', sub:'Advance tax', method:'NEFT'});
  add({date:DM(4,15), merchant:'Income Tax Dept', desc:'Advance tax instalment', amount:35000, type:'Tax', cat:'Taxes', sub:'Advance tax', method:'NEFT'});
  add({date:DM(3,18), merchant:'TCS', desc:'Final dividend', amount:2880, type:'Income', cat:'Dividends', sub:'Equity', method:'NEFT'});
  add({date:DM(4,28), time:'06:00', merchant:'HDFC Bank', desc:'Savings interest', amount:6200, type:'Income', cat:'Interest', sub:'Savings', method:'NEFT'});
  add({date:DM(4,21), merchant:'Amazon.in', desc:'Refund — returned kettle', amount:2499, type:'Refund', cat:'Shopping', sub:'Online', account:'card', method:'Card'});
  add({date:DM(4,2), merchant:'Self transfer', desc:'ICICI → HDFC', amount:50000, type:'Transfer', cat:'Self transfer', sub:'Internal', account:'icici', method:'IMPS', to:'hdfc'});
  add({date:DM(4,12), merchant:'Zerodha — NIFTYBEES', desc:'Top-up purchase', amount:50000, type:'Investment', cat:'ETF', sub:'Lump sum', method:'NEFT'});
  GIGS.filter(g=>g.status==='Paid').forEach(g=> add({date:g.date, merchant:g.client, desc:g.project, amount:g.revenue, type:'Income', cat:'Side Gig', sub:'Client project', account:'icici', method:'NEFT', gigId:g.id, tags:['side-gig']}));
  sortTx();

  HOLDINGS.push(
    {id:'H1', name:'Nippon India NIFTY 50 BeES', ticker:'NIFTYBEES', cls:'ETF', qty:3000, avg:250, price:281.5, prev:279.9, date:'2024-02-12', live:true},
    {id:'H2', name:'Tata Consultancy Services', ticker:'TCS', cls:'Equities', qty:120, avg:3770, price:4000, prev:4021, date:'2023-11-03', live:true},
    {id:'H3', name:'Startup equity — Series A', ticker:'PRIVATE', cls:'Private Equity', qty:1, avg:1008000, price:1190000, prev:1190000, date:'2024-06-01', live:false, note:'Marked at last round valuation'},
    {id:'H4', name:'Sovereign Gold Bond', ticker:'SGB', cls:'Gold', qty:30, avg:10180, price:10667, prev:10612, date:'2024-02-21', live:true},
    {id:'H5', name:'Parag Parikh Flexi Cap', ticker:'PPFAS-DG', cls:'Mutual Funds', qty:1764.7, avg:85, price:89.6, prev:89.3, date:MK[0]+'-07', live:true});
  OTHER_ASSETS.push(
    {id:'A1', name:'Apartment — Saibaba Colony', cls:'Property', cost:3200000, value:4050000, date:'2021-03-14', notes:'2BHK, self-occupied'},
    {id:'A2', name:'Hyundai Creta', cls:'Vehicles', cost:1350000, value:620000, date:'2023-08-02', notes:'Hypothecated to SBI'},
    {id:'A3', name:'Crypto (BTC, ETH)', cls:'Digital Assets', cost:80000, value:106000, date:'2024-11-20', notes:'Hardware wallet'});
  LIABS.push(
    {id:'L1', name:'SBI car loan', type:'Loans', outstanding:560000, original:900000, rate:8.9, emi:18500, due:monthKey(1)+'-05', term:'34 months'},
    {id:'L3', name:'Family loan — Arun', type:'Personal Debt', outstanding:200000, original:300000, rate:0, emi:20000, due:monthKey(1)+'-10', term:'10 months'});
  const nw = netWorth();
  [.889,.903,.893,.923,.938,.957,.966,.985].forEach((f,k)=> SNAP[monthKey(k-8)] = Math.round(nw*f));
}

/* ---------- saving (browser / app storage) ---------- */
const STORE_KEY = 'artha.data.v2';
function saveData(){
  if(!META.mode) return;
  SNAP[monthKey(0)] = Math.round(netWorth());
  try{ localStorage.setItem(STORE_KEY, JSON.stringify({v:2, tid, TX, ACCOUNTS, HOLDINGS, OTHER_ASSETS, LIABS, GIGS, SNAP, META})); }catch(e){}
}
function applyData(d){
  if(!d || !Array.isArray(d.TX) || !Array.isArray(d.ACCOUNTS)) return false;
  TX = d.TX; tid = d.tid || TX.length+1; SNAP = d.SNAP || {}; META = Object.assign({mode:'fresh', realized:0, realizedNote:'', usage:{}, demoPrices:false}, d.META||{});
  [[ACCOUNTS,d.ACCOUNTS],[HOLDINGS,d.HOLDINGS],[OTHER_ASSETS,d.OTHER_ASSETS],[LIABS,d.LIABS],[GIGS,d.GIGS]].forEach(([a,b])=> a.splice(0, a.length, ...(Array.isArray(b)?b:[])));
  sortTx(); return true;
}
function loadData(){ try{ return applyData(JSON.parse(localStorage.getItem(STORE_KEY))); }catch(e){ return false; } }
function eraseData(){ try{ localStorage.removeItem(STORE_KEY); }catch(e){} clearStores(); META = {mode:null, realized:0, realizedNote:'', usage:{}, demoPrices:false}; }
const backupJSON = () => JSON.stringify({v:2, app:'Artha', exported:new Date().toISOString(), tid, TX, ACCOUNTS, HOLDINGS, OTHER_ASSETS, LIABS, GIGS, SNAP, META}, null, 2);
function importData(file, done){
  const r = new FileReader();
  r.onload = () => { try{ const ok = applyData(JSON.parse(r.result)); if(ok) saveData(); done(ok); }catch(e){ done(false); } };
  r.readAsText(file);
}

/* ---------- derived numbers ---------- */
const hv = h => h.qty*h.price, hi = h => h.qty*h.avg;
const cashAccounts = () => ACCOUNTS.filter(a=>a.kind!=='Credit card');
const cardAccounts = () => ACCOUNTS.filter(a=>a.kind==='Credit card');
const cashTotal = () => sum(cashAccounts(), a=>a.bal);
const invTotal = () => sum(HOLDINGS, hv);
const otherAssetsTotal = () => sum(OTHER_ASSETS, a=>a.value);
const assetsTotal = () => cashTotal()+invTotal()+otherAssetsTotal();
const allLiabs = () => [...LIABS, ...cardAccounts().filter(a=>a.bal>0).map(a=>({id:a.id, name:a.name, type:'Credit Cards', outstanding:a.bal, original:a.bal, rate:null, emi:a.bal, due:null, term:'Card balance', card:true}))];
const liabTotal = () => sum(allLiabs(), l=>l.outstanding);
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
  return {income, expense, refunds, tax, invest, debt, gig, gst, savings, rate: ratio(savings,income)};
}
const spendByCat = (txs) => { const m={}; txs.filter(isSpend).forEach(t=>m[t.cat]=(m[t.cat]||0)+t.amount); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
const groupBy = (txs,key) => { const m={}; txs.forEach(t=>m[t[key]]=(m[t[key]]||0)+t.amount); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
const CUR = MK[MK.length-1], PREV = MK[MK.length-2];
const in6 = t => t.date >= MK[0];
const avgMonthlyExpense = () => { const v=MK.map(m=>monthStats(m).expense).filter(x=>x>0); return v.length ? sum(v)/v.length : 0; };

/* ---------- money movement for new entries ---------- */
function moveMoney(accId, amount){            // +amount = money in
  const a = ACCOUNTS.find(x=>x.id===accId); if(!a) return;
  if(a.kind==='Credit card') a.bal -= amount; else a.bal += amount;
}

/* ---------- insights and alerts, computed from data ---------- */
function insights(){
  const out=[], s=monthStats(CUR), p=monthStats(PREV);
  const catM = (c,mk) => sum(TX.filter(t=>isSpend(t)&&t.cat===c&&inMonth(t,mk)), t=>t.amount);
  const prior3 = MK.slice(2,5);
  // biggest category rise vs 3-month average (last full month vs the three before it)
  const lastFull = PREV, before = MK.slice(1,4);
  const rises = Object.keys(EXP_CATS).map(c=>{ const now=catM(c,lastFull), avg=sum(before,m=>catM(c,m))/3; return {c,now,avg,d:avg?now/avg-1:0}; })
    .filter(x=>x.avg>500 && x.d>0.1).sort((a,b)=>(b.now-b.avg)-(a.now-a.avg));
  if(rises[0]) out.push({tone:'red', text:`${rises[0].c} spending in ${ml(lastFull)} was ${pct(rises[0].d,0)} above its 3-month average (${sh(rises[0].now)} vs ${sh(rises[0].avg)}).`, why:`Top merchant: ${groupBy(TX.filter(t=>isSpend(t)&&t.cat===rises[0].c&&inMonth(t,lastFull)),'merchant')[0]?.[0]||'—'}.`, act:{f:{cat:rises[0].c}, label:`View ${rises[0].c}`}});
  // unused subscriptions (usage signals)
  const low = Object.entries(META.usage||{}).filter(([k,v])=>v>=30 && TX.some(t=>t.merchant===k));
  if(low.length) out.push({tone:'gold', text:`${low.length} subscription${low.length>1?'s have':' has'} no logged usage in 30+ days: ${low.map(x=>x[0]).join(', ')}.`, why:`Together ${inr(sum(low,x=>TX.find(t=>t.merchant===x[0]).amount))}/month.`, act:{f:{cat:'Subscriptions'}, label:'Review subscriptions'}});
  // concentration
  if(HOLDINGS.length>1){ const top=HOLDINGS.slice().sort((a,b)=>hv(b)-hv(a))[0], w=ratio(hv(top),invTotal());
    if(w>0.35) out.push({tone:'cyan', text:`Portfolio concentration: ${top.name.split(' —')[0]} is ${(w*100).toFixed(0)}% of your investments.`, why:'A single holding above 35% is a concentration risk.', act:{tab:'portfolio', label:'Open portfolio'}}); }
  // side gigs
  const gigAvg = sum(MK.slice(0,5), mk=>monthStats(mk).gig)/5, unpaid = GIGS.filter(g=>g.status!=='Paid');
  if(gigAvg>0 || unpaid.length) out.push({tone:'green', text:`Side-gig income this month is ${sh(s.gig)}${gigAvg?`, ${pct(ratio(s.gig,gigAvg)-1,0)} vs your 5-month average`:''}.`, why: unpaid.length?`${unpaid.length} invoice${unpaid.length>1?'s':''} unpaid: ${sh(sum(unpaid,g=>g.revenue))}.`:'All invoices are paid.', act:{tab:'money', sub:'gigs', label:'Open side gigs'}});
  // expense trend
  const e3 = sum(prior3, m=>monthStats(m).expense)/3;
  if(e3>0 && p.expense>0){ const big = TX.filter(t=>isSpend(t)&&inMonth(t,PREV)).sort((a,b)=>b.amount-a.amount)[0];
    out.push({tone:p.expense>e3?'red':'green', text:`${ml(PREV)} expenses were ${pct(p.expense/e3-1,0)} vs the previous 3-month average.`, why: big?`Largest single expense: ${big.merchant} ${sh(big.amount)}.`:'', act:{f:{month:PREV,type:'Expense'}, label:`${ml(PREV)} expenses`}}); }
  // low cash
  const avgE = avgMonthlyExpense();
  if(avgE>0 && cashTotal() < avgE*3) out.push({tone:'red', text:`Cash covers only ${(cashTotal()/avgE).toFixed(1)} months of spending.`, why:'Aim for at least 3–6 months of expenses in cash.', act:{tab:'money', sub:'accounts', label:'Accounts'}});
  if(!out.length) out.push({tone:'cyan', text: TX.length ? 'No unusual patterns yet. Insights sharpen as your ledger grows.' : 'Add your first entries and Artha will start spotting patterns here.', why:'Insights compare recent months with your own averages.', act:null});
  return out;
}
function nextMonthlyDate(date){ const [y,m,d]=date.split('-').map(Number); const n=new Date(y,m,d); return `${n.getFullYear()}-${pad2(n.getMonth()+1)}-${pad2(Math.min(d,28))}`; }
function alerts(){
  const out=[], soon=isoDaysAgo(-14), recent=isoDaysAgo(30);
  TX.filter(t=>isSpend(t)&&t.date>=recent&&t.amount>=25000).slice(0,2).forEach(t=> out.push({tone:'red', t:'Large expense detected', d:`${t.merchant} · ${inr(t.amount)} · ${fdate(t.date)}`, f:{q:t.merchant}}));
  LIABS.filter(l=>l.due&&l.due>=TODAY&&l.due<=soon).forEach(l=> out.push({tone:'gold', t:'Loan payment due', d:`${l.name} ${inr(l.emi)} · ${fdate(l.due)}`, tab:'accounting', sub:'liabs'}));
  cardAccounts().filter(a=>a.bal>0).forEach(a=> out.push({tone:'gold', t:'Card balance to clear', d:`${a.name} ${inr(a.bal)}`, tab:'accounting', sub:'liabs'}));
  const subs={}; TX.filter(t=>t.recurring&&(t.cat==='Subscriptions'||t.cat==='SaaS')).forEach(t=>{ if(!subs[t.merchant]||subs[t.merchant].date<t.date) subs[t.merchant]=t; });
  Object.values(subs).map(t=>({t,next:nextMonthlyDate(t.date)})).filter(x=>x.next>=TODAY&&x.next<=isoDaysAgo(-7)).sort((a,b)=>a.next.localeCompare(b.next)).slice(0,2)
    .forEach(x=> out.push({tone:'cyan', t:'Subscription renewal', d:`${x.t.merchant} ${inr(x.t.amount)} · around ${fdate(x.next)}`, f:{q:x.t.merchant}}));
  const avgE=avgMonthlyExpense(); if(avgE>0 && cashTotal()<avgE*2) out.push({tone:'red', t:'Low cash balance', d:`${sh(cashTotal())} covers ${(cashTotal()/avgE).toFixed(1)} months`, tab:'money', sub:'accounts'});
  const gstNow=monthStats(PREV).gst; if(gstNow>0) out.push({tone:'gold', t:'GST summary ready', d:`${mlong(PREV)}: ${inr(gstNow)} estimated`, tab:'tax'});
  const mv=HOLDINGS.filter(h=>h.live&&h.prev).map(h=>({h,c:h.price/h.prev-1})).sort((a,b)=>Math.abs(b.c)-Math.abs(a.c))[0];
  if(mv && Math.abs(mv.c)>=0.005) out.push({tone:mv.c>=0?'green':'red', t:'Investment price movement', d:`${mv.h.ticker||mv.h.name} ${pct(mv.c,2)} since last update`, tab:'portfolio'});
  return out;
}

/* ---------- boot data ---------- */
if(!loadData()) META.mode = null;
