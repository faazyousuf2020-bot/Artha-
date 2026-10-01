/* =========================================================
   ARTHA — state, forms, search, navigation and events
   ========================================================= */
const S = {
  tab:'cc', range:'6M', from:isoDaysAgo(30), to:TODAY,
  money:{sub:'ledger', q:'', type:'All', cat:'All', month:'All', sumMonth:CUR},
  tax:{month:'All'}, acct:{sub:'bs', month:CUR},
  an:{period:'6M', cat:null, sub:null, merchant:null, q:'', answer:null},
  chat:[], bell:false, layer:null, priceTime:null
};
const TABS = [
  ['cc','Command Center','cc','1'],['money','Money','money','2'],['tax','Tax Intelligence','tax','3'],
  ['portfolio','Portfolio','port','4'],['accounting','Personal Accounting','acct','5'],['analytics','Analytics','ana','6'],['ai','Artha AI','ai','7']
];
const SHORT = {cc:'Home',money:'Money',tax:'Tax',portfolio:'Portfolio',accounting:'Books',analytics:'Analytics',ai:'AI'};
const GST_GUESS = {Housing:0,Food:5,Dining:5,Transportation:5,Travel:5,Healthcare:5,Insurance:0,Taxes:0,Education:18,Electronics:18,Shopping:18,SaaS:18,Subscriptions:18,Entertainment:18,Business:18,Other:18};

/* ---------- money effects of a transaction ---------- */
function applyTx(t, dir=1){
  const a=t.amount*dir;
  if(t.type==='Income'||t.type==='Refund') moveMoney(t.account, a);
  else if(t.type==='Expense'||t.type==='Tax'||t.type==='Investment') moveMoney(t.account, -a);
  else if(t.type==='Transfer'){ moveMoney(t.account, -a); if(t.to) moveMoney(t.to, a); if(t.liab){ const l=LIABS.find(x=>x.id===t.liab); if(l) l.outstanding=Math.max(0,l.outstanding-a); } }
}
const num = v => { const n=parseFloat(String(v??'').replace(/[₹,\s]/g,'')); return Number.isFinite(n)?n:NaN; };
const val = id => document.getElementById(id)?.value?.trim() ?? '';
const opt = (list,cur) => list.map(o=>{ const [v,l]=Array.isArray(o)?o:[o,o]; return `<option value="${esc(v)}" ${String(v)===String(cur)?'selected':''}>${esc(l)}</option>`; }).join('');
const accOpts = (cur, filter=()=>true) => opt(ACCOUNTS.filter(filter).map(a=>[a.id,a.name]), cur);
const modal = (title, body, foot) => `<div class="scrim" data-act="closeLayer" data-self="1"><form class="modal" id="mForm" novalidate><div class="mh"><h3>${title}</h3><button type="button" class="ibtn" data-act="closeLayer" aria-label="Close">${icon('x',16)}</button></div>${body}<div id="qErr" class="dn" style="padding:0 16px 8px;font-size:12.5px"></div><div class="mf">${foot}</div></form></div>`;
const err = m => { const e=document.getElementById('qErr'); if(e) e.textContent=m; return false; };
const delBtn = kind => `<span id="delZone"><button type="button" class="btn ghost dn" data-act="delAsk" data-k="${kind}">Delete</button></span>`;

/* ---------- quick add ---------- */
function openQuick(type='Expense'){
  if(!ACCOUNTS.length && !['Asset','Liability'].includes(type)){ S.layer={kind:'edit', ek:'account'}; renderLayer(); toast('Add an account first'); return; }
  S.layer={kind:'quick', type}; renderLayer(); setTimeout(()=>document.getElementById('qAmt')?.focus(),40);
}
function quickHTML(){
  const ty=S.layer.type; const types=['Expense','Income','Transfer','Investment','Asset','Liability','Tax'];
  const defAcc = (ACCOUNTS.find(a=>a.kind==='Bank account')||ACCOUNTS[0]||{}).id;
  let f='';
  if(['Expense','Income','Tax'].includes(ty)){
    const cats = ty==='Expense'?Object.keys(EXP_CATS): ty==='Income'?INC_CATS: ['Taxes'];
    const subs = ty==='Expense'?EXP_CATS[cats[0]]: ty==='Tax'?['Advance tax','Self-assessment','TDS','GST payment']:[];
    f=`<label class="full">Amount<input class="inp amtin" id="qAmt" inputmode="decimal" placeholder="₹0"></label>
    <label>Category<select class="inp" id="qCat" data-sub="qSub">${opt(cats)}</select></label>
    ${subs.length?`<label>Subcategory<select class="inp" id="qSub">${opt(subs)}</select></label>`:`<label>Source<input class="inp" id="qSub" placeholder="e.g. Base pay"></label>`}
    <label>${ty==='Income'?'Into account':'Paid from'}<select class="inp" id="qAcc">${accOpts(defAcc)}</select></label>
    <label>Date<input class="inp" type="date" id="qDate" value="${TODAY}" max="${TODAY}"></label>
    <label class="full">${ty==='Income'?'Payer / client':'Merchant'}<input class="inp" id="qMer" placeholder="${ty==='Income'?'e.g. Acme Pvt Ltd':ty==='Tax'?'e.g. Income Tax Dept':'e.g. Swiggy'}" autocomplete="off" list="merchants"></label>
    ${ty==='Expense'?`<label>GST rate<select class="inp" id="qGst"><option value="auto">Suggest from category</option>${opt([0,5,12,18,28,40].map(r=>[r,r+'%']))}</select></label><label>Supply<select class="inp" id="qMode"><option value="intra">Same state (CGST+SGST)</option><option value="inter">Other state / online (IGST)</option></select></label>`:''}
    <label class="full">Description<input class="inp" id="qDesc" placeholder="Optional"></label>
    <label class="chk full"><input type="checkbox" id="qRec"> Repeats monthly (rent, EMI, subscription, salary)</label>
    <label class="full">Tags<input class="inp" id="qTags" placeholder="Optional, comma separated (e.g. side-gig, family)"></label>
    <label class="full">Notes<textarea class="inp" id="qNotes" rows="2" placeholder="Optional"></textarea></label>
    <label class="full">Receipt name<input class="inp" type="file" id="qFile" accept="image/*,application/pdf"></label>
    <datalist id="merchants">${[...new Set(TX.map(t=>t.merchant))].slice(0,200).map(m=>`<option value="${esc(m)}">`).join('')}</datalist>`;
  } else if(ty==='Investment'){
    f=`<label class="full">Holding<select class="inp" id="qHold"><option value="new">+ New holding</option>${opt(HOLDINGS.map(h=>[h.id,h.name]))}</select></label>
    <div class="full form" id="newHold" style="padding:0">
      <label class="full">Name<input class="inp" id="qName" placeholder="e.g. HDFC Bank, Nifty 50 ETF, SGB"></label>
      <label>Ticker / code<input class="inp" id="qTicker" placeholder="Optional"></label>
      <label>Type<select class="inp" id="qCls">${opt(HOLDING_CLASSES)}</select></label>
    </div>
    <label>Units / quantity<input class="inp" id="qQty" inputmode="decimal" placeholder="e.g. 10"></label>
    <label>Price per unit<input class="inp" id="qPrice" inputmode="decimal" placeholder="₹"></label>
    <label>Paid from<select class="inp" id="qAcc"><option value="">Not from an account (existing holding)</option>${accOpts(defAcc)}</select></label>
    <label>Date<input class="inp" type="date" id="qDate" value="${TODAY}" max="${TODAY}"></label>
    <div class="full mu" style="font-size:12px" id="qTotal">Total: ₹0</div>`;
  } else if(ty==='Transfer'){
    const targets=[...ACCOUNTS.map(a=>[a.id,a.kind==='Credit card'?`${a.name} (pay card bill)`:a.name]), ...LIABS.map(l=>['L:'+l.id,`${l.name} (loan repayment)`])];
    f=`<label class="full">Amount<input class="inp amtin" id="qAmt" inputmode="decimal" placeholder="₹0"></label>
    <label>From<select class="inp" id="qFrom">${accOpts(defAcc,a=>a.kind!=='Credit card')}</select></label><label>To<select class="inp" id="qTo">${opt(targets, (ACCOUNTS.find(a=>a.id!==defAcc)||{}).id)}</select></label>
    <label>Date<input class="inp" type="date" id="qDate" value="${TODAY}" max="${TODAY}"></label><label>Note<input class="inp" id="qDesc" placeholder="Optional"></label>
    <label class="chk full"><input type="checkbox" id="qRec"> Repeats monthly (e.g. EMI)</label>`;
  } else if(ty==='Asset'){
    f=`<label class="full">Asset name<input class="inp" id="qName" placeholder="e.g. Flat in Saibaba Colony"></label>
    <label>Type<select class="inp" id="qCls">${opt(ASSET_CLASSES)}</select></label>
    <label>Date acquired<input class="inp" type="date" id="qDate" value="${TODAY}"></label>
    <label>Purchase cost<input class="inp" id="qCost" inputmode="decimal" placeholder="₹"></label><label>Current value<input class="inp" id="qAmt" inputmode="decimal" placeholder="₹"></label>
    <label class="full">Notes<input class="inp" id="qNotes" placeholder="Optional"></label>
    <div class="full mu" style="font-size:12px">Bank, cash and card balances live under Money → Accounts. Stocks and funds go under Add investment.</div>`;
  } else {
    f=`<label class="full">Liability name<input class="inp" id="qName" placeholder="e.g. Home loan — SBI"></label>
    <label>Type<select class="inp" id="qCls">${opt(LIAB_TYPES)}</select></label>
    <label>Outstanding now<input class="inp" id="qAmt" inputmode="decimal" placeholder="₹"></label>
    <label>Original amount<input class="inp" id="qCost" inputmode="decimal" placeholder="₹"></label><label>Interest rate %<input class="inp" id="qRate" inputmode="decimal" placeholder="e.g. 9.5"></label>
    <label>Monthly payment<input class="inp" id="qEmi" inputmode="decimal" placeholder="₹"></label><label>Next due date<input class="inp" type="date" id="qDue"></label>
    <label class="full">Remaining term<input class="inp" id="qTerm" placeholder="e.g. 48 months"></label>
    <div class="full mu" style="font-size:12px">Credit cards are tracked as accounts: Money → Accounts → Add, type “Credit card”.</div>`;
  }
  return modal('New entry', `<div style="padding:12px 16px 0;overflow-x:auto">${seg(types,ty,'qtype')}</div><div class="form">${f}</div>`,
    `<span class="mu" style="font-size:12px">${['Asset','Liability'].includes(ty)?'Updates your net worth':'Updates balances and reports'}</span><div style="display:flex;gap:8px"><button type="button" class="btn ghost" data-act="closeLayer">Cancel</button><button type="submit" class="btn pri">Save</button></div>`);
}
function saveQuick(){
  const ty=S.layer.type;
  if(ty==='Asset'){ const v=num(val('qAmt')); if(!val('qName')) return err('Give the asset a name.'); if(!(v>=0)) return err('Enter the current value.');
    OTHER_ASSETS.push({id:uid('A'),name:val('qName'),cls:val('qCls'),cost:num(val('qCost'))||v,value:v,date:val('qDate'),notes:val('qNotes')}); return done(`Asset added · ${inr(v)}`); }
  if(ty==='Liability'){ const v=num(val('qAmt')); if(!val('qName')) return err('Give the liability a name.'); if(!(v>=0)) return err('Enter the outstanding amount.');
    LIABS.push({id:uid('L'),name:val('qName'),type:val('qCls'),outstanding:v,original:num(val('qCost'))||v,rate:num(val('qRate'))||0,emi:num(val('qEmi'))||0,due:val('qDue')||null,term:val('qTerm')||''}); return done(`Liability added · ${inr(v)}`); }
  if(ty==='Investment'){
    const q=num(val('qQty')), p=num(val('qPrice')), hid=val('qHold'); if(!(q>0)) return err('Enter the number of units.'); if(!(p>0)) return err('Enter the price per unit.');
    let h; if(hid==='new'){ if(!val('qName')) return err('Name the holding.'); h={id:uid('H'),name:val('qName'),ticker:val('qTicker'),cls:val('qCls'),qty:0,avg:0,price:p,prev:p,date:val('qDate'),live:val('qCls')!=='Private Equity'}; HOLDINGS.push(h); }
    else h=HOLDINGS.find(x=>x.id===hid);
    const cost=q*p; h.avg=(h.avg*h.qty+cost)/(h.qty+q); h.qty+=q; if(hid!=='new'){ h.prev=h.price; h.price=p; }
    const acc=val('qAcc'); if(acc){ const t=add({date:val('qDate'),merchant:h.name,desc:`Bought ${q} @ ₹${p}`,amount:Math.round(cost*100)/100,type:'Investment',cat:h.cls,sub:hid==='new'?'New holding':'Top-up',account:acc,method:'Bank',ai:false}); if(t) applyTx(t); }
    sortTx(); return done(`Investment saved · ${inr(cost)}`);
  }
  const amt=num(val('qAmt')); if(!(amt>0)) return err('Enter an amount greater than zero.');
  if(val('qDate')>TODAY) return err('The date can’t be in the future.');
  if(ty==='Transfer'){
    const from=val('qFrom'), to=val('qTo'); if(from===to) return err('Choose two different accounts.');
    const L_= to.startsWith('L:') ? LIABS.find(l=>l.id===to.slice(2)) : null, toAcc = L_?null:ACCOUNTS.find(a=>a.id===to);
    const t=add({date:val('qDate'),merchant:L_?L_.name:toAcc.kind==='Credit card'?`${toAcc.name} bill`:'Self transfer',desc:val('qDesc')||(L_?'Repayment':`${accName(from)} → ${toAcc.name}`),amount:amt,type:'Transfer',
      cat:L_?'Loan repayment':toAcc.kind==='Credit card'?'Card payment':'Self transfer',sub:L_?L_.name:'Internal',account:from,method:'Bank',to:L_?null:to,liab:L_?L_.id:null,recurring:document.getElementById('qRec')?.checked||false,ai:false});
    if(t) applyTx(t); sortTx(); return done(`Transfer saved · ${inr(amt)}`);
  }
  const cat=val('qCat'); let rate=0, mode='none', ai=true;
  if(ty==='Expense'){ const g=val('qGst'); if(g==='auto') rate=GST_GUESS[cat]??18; else { rate=+g; ai=false; } mode=rate?val('qMode'):'none'; }
  const file=document.getElementById('qFile')?.files?.[0]; const acc=ACCOUNTS.find(a=>a.id===val('qAcc'));
  const t=add({date:val('qDate'),merchant:val('qMer')||cat,desc:val('qDesc')||val('qSub')||cat,amount:amt,type:ty,cat,sub:val('qSub'),account:val('qAcc'),
    method:acc?.kind==='Credit card'?'Card':acc?.kind==='Cash'?'Cash':'UPI',gstRate:rate,gstMode:mode,itc:rate?(document.getElementById('qTags')?.value.includes('side-gig')?'Review':'Not eligible'):'N/A',
    notes:val('qNotes'),tags:val('qTags')?val('qTags').split(',').map(s=>s.trim()).filter(Boolean):[],recurring:document.getElementById('qRec')?.checked||false,attach:file?1:0,file:file?file.name:'',ai});
  if(t) applyTx(t); sortTx(); return done(`${ty} saved · ${inr(amt)}`);
}
function done(msg){ S.layer=null; renderLayer(); render(); toast(msg); return true; }

/* ---------- edit dialogs (accounts, holdings, assets, liabilities, gigs) ---------- */
function editHTML(){
  const {ek,id}=S.layer; const foot=(canDel)=>`${canDel?delBtn(ek):'<span></span>'}<div style="display:flex;gap:8px"><button type="button" class="btn ghost" data-act="closeLayer">Cancel</button><button type="submit" class="btn pri">Save</button></div>`;
  if(ek==='account'){ const a=ACCOUNTS.find(x=>x.id===id)||{name:'',kind:'Bank account',bal:0};
    return modal(id?'Edit account':'New account', `<div class="form"><label class="full">Account name<input class="inp" id="eName" value="${esc(a.name)}" placeholder="e.g. HDFC Savings"></label>
      <label>Type<select class="inp" id="eKind">${opt(ACCOUNT_KINDS,a.kind)}</select></label><label>${a.kind==='Credit card'?'Amount owed':'Current balance'}<input class="inp" id="eBal" inputmode="decimal" value="${id?a.bal:''}" placeholder="₹"></label>
      <div class="full mu" style="font-size:12px">For a credit card, enter what you currently owe. Card spending adds to it; paying the bill (Transfer → card) reduces it.</div></div>`, foot(!!id)); }
  if(ek==='holding'){ const h=HOLDINGS.find(x=>x.id===id);
    return modal('Update holding', `<div class="form"><label class="full">Name<input class="inp" id="eName" value="${esc(h.name)}"></label>
      <label>Ticker / code<input class="inp" id="eTicker" value="${esc(h.ticker||'')}"></label><label>Type<select class="inp" id="eCls">${opt(HOLDING_CLASSES,h.cls)}</select></label>
      <label>Units<input class="inp" id="eQty" inputmode="decimal" value="${h.qty}"></label><label>Average buy price<input class="inp" id="eAvg" inputmode="decimal" value="${h.avg}"></label>
      <label class="full">Current price per unit<input class="inp amtin" id="ePrice" inputmode="decimal" value="${h.price}"></label>
      <div class="full eyebrow" style="margin-top:6px">Sell units (optional)</div>
      <label>Units sold<input class="inp" id="eSellQ" inputmode="decimal" placeholder="0"></label><label>Sale price per unit<input class="inp" id="eSellP" inputmode="decimal" placeholder="₹"></label>
      <label class="full">Proceeds go to<select class="inp" id="eSellAcc">${accOpts('',a=>a.kind!=='Credit card')}</select></label></div>`, foot(true)); }
  if(ek==='asset'){ const a=OTHER_ASSETS.find(x=>x.id===id);
    return modal('Edit asset', `<div class="form"><label class="full">Name<input class="inp" id="eName" value="${esc(a.name)}"></label><label>Type<select class="inp" id="eCls">${opt(ASSET_CLASSES,a.cls)}</select></label>
      <label>Date acquired<input class="inp" type="date" id="eDate" value="${a.date||''}"></label><label>Purchase cost<input class="inp" id="eCost" inputmode="decimal" value="${a.cost}"></label><label>Current value<input class="inp" id="eVal" inputmode="decimal" value="${a.value}"></label>
      <label class="full">Notes<input class="inp" id="eNotes" value="${esc(a.notes||'')}"></label></div>`, foot(true)); }
  if(ek==='liab'){ const l=LIABS.find(x=>x.id===id);
    return modal('Edit liability', `<div class="form"><label class="full">Name<input class="inp" id="eName" value="${esc(l.name)}"></label><label>Type<select class="inp" id="eCls">${opt(LIAB_TYPES,l.type)}</select></label>
      <label>Outstanding<input class="inp" id="eOut" inputmode="decimal" value="${l.outstanding}"></label><label>Original amount<input class="inp" id="eOrig" inputmode="decimal" value="${l.original}"></label><label>Interest rate %<input class="inp" id="eRate" inputmode="decimal" value="${l.rate??''}"></label>
      <label>Monthly payment<input class="inp" id="eEmi" inputmode="decimal" value="${l.emi||''}"></label><label>Next due date<input class="inp" type="date" id="eDue" value="${l.due||''}"></label><label class="full">Remaining term<input class="inp" id="eTerm" value="${esc(l.term||'')}"></label></div>`, foot(true)); }
  if(ek==='gig'){ const g=GIGS.find(x=>x.id===id)||{client:'',project:'',revenue:'',expenses:'',hours:'',status:'Invoiced',date:TODAY,account:(ACCOUNTS.find(a=>a.kind==='Bank account')||ACCOUNTS[0]||{}).id};
    return modal(id?'Edit side gig':'New side gig', `<div class="form"><label>Client<input class="inp" id="eClient" value="${esc(g.client)}" placeholder="e.g. Zenith Dental"></label><label>Project<input class="inp" id="eProj" value="${esc(g.project)}" placeholder="e.g. Booking site"></label>
      <label>Revenue (₹)<input class="inp" id="eRev" inputmode="decimal" value="${g.revenue}"></label><label>Expenses (₹)<input class="inp" id="eExp" inputmode="decimal" value="${g.expenses}"></label>
      <label>Hours spent<input class="inp" id="eHrs" inputmode="decimal" value="${g.hours}"></label><label>Status<select class="inp" id="eStat">${opt(['Invoiced','Paid'],g.status)}</select></label>
      <label>Date<input class="inp" type="date" id="eDate" value="${g.date}"></label><label>Paid into<select class="inp" id="eAcc">${accOpts(g.account,a=>a.kind!=='Credit card')}</select></label>
      <div class="full mu" style="font-size:12px">When status is Paid, Artha records the income in your ledger and account.</div></div>`, foot(!!id)); }
  return '';
}
function syncGig(g){
  const t=TX.find(x=>x.gigId===g.id);
  if(t){ applyTx(t,-1); TX=TX.filter(x=>x!==t); }
  if(g.status==='Paid'){ const n=add({date:g.date>TODAY?TODAY:g.date,merchant:g.client,desc:g.project,amount:g.revenue,type:'Income',cat:'Side Gig',sub:'Client project',account:g.account,method:'Bank',gigId:g.id,tags:['side-gig'],ai:false}); if(n) applyTx(n); }
  sortTx();
}
function saveEdit(){
  const {ek,id}=S.layer;
  if(ek==='account'){ const b=num(val('eBal')); if(!val('eName')) return err('Name the account.'); if(!fin(b)) return err('Enter the balance (0 is fine).');
    if(id){ Object.assign(ACCOUNTS.find(x=>x.id===id),{name:val('eName'),kind:val('eKind'),bal:b}); } else ACCOUNTS.push({id:uid('ac'),name:val('eName'),kind:val('eKind'),bal:b});
    return done('Account saved'); }
  if(ek==='holding'){ const h=HOLDINGS.find(x=>x.id===id), p=num(val('ePrice')), q=num(val('eQty')), av=num(val('eAvg')); if(!(p>0)||!(q>=0)||!(av>=0)) return err('Check units and prices.');
    if(p!==h.price){ h.prev=h.price; h.price=p; }
    Object.assign(h,{name:val('eName')||h.name,ticker:val('eTicker'),cls:val('eCls'),qty:q,avg:av});
    const sq=num(val('eSellQ')), sp=num(val('eSellP'));
    if(sq>0){ if(!(sp>0)) return err('Enter the sale price.'); if(sq>h.qty) return err('You can’t sell more units than you hold.');
      META.realized=(META.realized||0)+sq*(sp-h.avg); META.realizedNote='From sales you recorded'; h.qty-=sq;
      const t=add({date:TODAY,merchant:h.name,desc:`Sold ${sq} @ ₹${sp}`,amount:Math.round(sq*sp*100)/100,type:'Transfer',cat:'Investment sale',sub:h.cls,account:'invest',to:val('eSellAcc'),method:'Bank',ai:false}); if(t) applyTx(t);
      if(h.qty<=0) HOLDINGS.splice(HOLDINGS.indexOf(h),1); sortTx(); }
    return done('Holding updated'); }
  if(ek==='asset'){ const a=OTHER_ASSETS.find(x=>x.id===id), v=num(val('eVal')); if(!fin(v)) return err('Enter the current value.');
    Object.assign(a,{name:val('eName')||a.name,cls:val('eCls'),date:val('eDate'),cost:num(val('eCost'))||0,value:v,notes:val('eNotes')}); return done('Asset updated'); }
  if(ek==='liab'){ const l=LIABS.find(x=>x.id===id), o=num(val('eOut')); if(!fin(o)) return err('Enter the outstanding amount.');
    Object.assign(l,{name:val('eName')||l.name,type:val('eCls'),outstanding:o,original:num(val('eOrig'))||o,rate:num(val('eRate'))||0,emi:num(val('eEmi'))||0,due:val('eDue')||null,term:val('eTerm')}); return done('Liability updated'); }
  if(ek==='gig'){ const r=num(val('eRev')); if(!val('eClient')) return err('Enter the client.'); if(!(r>0)) return err('Enter the revenue.');
    let g=GIGS.find(x=>x.id===id); const data={client:val('eClient'),project:val('eProj'),revenue:r,expenses:num(val('eExp'))||0,hours:num(val('eHrs'))||0,status:val('eStat'),date:val('eDate')||TODAY,account:val('eAcc')};
    if(g) Object.assign(g,data); else { g={id:uid('G'),...data}; GIGS.push(g); }
    syncGig(g); return done('Side gig saved'); }
}
function deleteEdit(){
  const {ek,id}=S.layer;
  if(ek==='account'){ if(TX.some(t=>t.account===id||t.to===id)) { S.layer=null; renderLayer(); toast('This account has transactions. Delete them first or rename the account.'); return; } ACCOUNTS.splice(ACCOUNTS.findIndex(x=>x.id===id),1); }
  if(ek==='holding') HOLDINGS.splice(HOLDINGS.findIndex(x=>x.id===id),1);
  if(ek==='asset') OTHER_ASSETS.splice(OTHER_ASSETS.findIndex(x=>x.id===id),1);
  if(ek==='liab') LIABS.splice(LIABS.findIndex(x=>x.id===id),1);
  if(ek==='gig'){ const g=GIGS.find(x=>x.id===id); g.status='Invoiced'; syncGig(g); GIGS.splice(GIGS.indexOf(g),1); }
  done('Deleted');
}

/* ---------- transaction drawer (view + edit) ---------- */
function drawerHTML(){
  const t=TX.find(x=>x.id===S.layer.id); if(!t) return ''; const g=gstOf(t);
  const f=(l,v)=>`<div class="kv"><span>${l}</span><b style="font-family:var(--f);font-weight:400;text-align:right">${v}</b></div>`;
  const editable = ['Expense','Income','Tax','Refund'].includes(t.type);
  if(S.layer.edit){
    const cats = t.type==='Expense'||t.type==='Refund'?Object.keys(EXP_CATS): t.type==='Income'?INC_CATS:['Taxes'];
    return `<div class="scrim" data-act="closeLayer" data-self="1" style="padding:0"></div><aside class="drawer"><form id="dForm" novalidate><div class="mh" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--line)"><h3 style="font-size:14px">Edit transaction</h3><button type="button" class="ibtn" data-act="closeLayer" aria-label="Close">${icon('x',16)}</button></div>
    <div class="form"><label class="full">Amount<input class="inp amtin" id="xAmt" inputmode="decimal" value="${t.amount}"></label>
    <label class="full">Merchant<input class="inp" id="xMer" value="${esc(t.merchant)}"></label>
    <label>Category<select class="inp" id="xCat" data-sub="xSub">${opt(cats,t.cat)}</select></label>
    ${EXP_CATS[t.cat]?`<label>Subcategory<select class="inp" id="xSub">${opt(EXP_CATS[t.cat],t.sub)}</select></label>`:`<label>Subcategory<input class="inp" id="xSub" value="${esc(t.sub)}"></label>`}
    <label>Account<select class="inp" id="xAcc">${accOpts(t.account)}</select></label><label>Date<input class="inp" type="date" id="xDate" value="${t.date}" max="${TODAY}"></label>
    <label class="full">Description<input class="inp" id="xDesc" value="${esc(t.desc)}"></label>
    <label class="chk full"><input type="checkbox" id="xRec" ${t.recurring?'checked':''}> Repeats monthly</label>
    <label class="full">Tags<input class="inp" id="xTags" value="${esc((t.tags||[]).join(', '))}"></label>
    <label class="full">Notes<textarea class="inp" id="xNotes" rows="2">${esc(t.notes)}</textarea></label></div>
    <div id="qErr" class="dn" style="padding:0 16px 8px;font-size:12.5px"></div>
    <div class="mf"><button type="button" class="btn ghost" data-act="tx" data-id="${t.id}">Cancel</button><button type="submit" class="btn pri">Save changes</button></div></form></aside>`;
  }
  return `<div class="scrim" data-act="closeLayer" data-self="1" style="padding:0"></div><aside class="drawer"><div class="mh" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--line)"><span class="pill ${t.type}">${t.type}</span><button class="ibtn" data-act="closeLayer" aria-label="Close">${icon('x',16)}</button></div>
  <div style="padding:20px 16px"><div class="mu" style="font-size:12px">${fdateY(t.date)} · ${t.time}</div><h2 style="font-size:20px;margin-top:4px">${esc(t.merchant)}</h2><div class="num ${amtCls(t)}" style="font-size:34px;font-weight:300;margin-top:8px;letter-spacing:-.03em">${sign(t)}${inr(t.amount)}</div>
  <div style="margin-top:18px">${f('Description',esc(t.desc)||'—')}${f('Category',esc(t.cat))}${f('Subcategory',esc(t.sub)||'—')}${f('Account',esc(t.account==='invest'?'Investments':accName(t.account)))}${t.to?f('To',esc(accName(t.to))):''}${f('Payment method',esc(t.method))}${f('Recurring',t.recurring?'Yes · monthly':'No')}${f('Tags',(t.tags||[]).length?t.tags.map(x=>`<span class="chip">${esc(x)}</span>`).join(' '):'—')}${f('Receipt',t.file?'📎 '+esc(t.file):t.attach?'📎 Attached':'None')}${f('Notes',esc(t.notes)||'—')}${f('Reference',`<span class="num">${t.id}</span>`)}</div>
  ${t.type==='Expense'?`<div class="eyebrow" style="margin-top:22px;margin-bottom:6px">GST classification ${t.ai?'<span class="chip cyan" style="margin-left:6px">Auto</span>':'<span class="chip" style="margin-left:6px">Set by you</span>'}</div>
    <div class="form" style="padding:0;margin-bottom:10px"><label>Rate<select class="inp" id="dRate" data-bind="rate" data-id="${t.id}">${opt([0,5,12,18,28,40].map(r=>[r,r+'%']),+t.gstRate)}</select></label>
    <label>Supply<select class="inp" id="dMode" data-bind="mode" data-id="${t.id}"><option value="intra" ${t.gstMode!=='inter'?'selected':''}>Same state</option><option value="inter" ${t.gstMode==='inter'?'selected':''}>Other state / online</option></select></label>
    <label class="full">Input tax credit<select class="inp" id="dItc" data-bind="itc" data-id="${t.id}">${opt(['Eligible','Review','Not eligible','N/A'],t.itc)}</select></label></div>
    ${f('Base amount',inr(g.base))}${f('GST',`<span class="gd">${inr(g.gst)}</span>`)}${f('CGST / SGST',`${inr(g.c)} / ${inr(g.s)}`)}${f('IGST',inr(g.i))}`:''}
  <div style="display:flex;gap:8px;margin-top:22px;flex-wrap:wrap" id="delZone">${editable?`<button class="btn" data-act="txEdit">Edit</button>`:''}<button class="btn" data-act="similar" data-m="${esc(t.merchant)}">Similar</button><button class="btn ghost dn" data-act="delAsk" data-k="tx">Delete</button></div></div></aside>`;
}
function saveTxEdit(){
  const t=TX.find(x=>x.id===S.layer.id), amt=num(val('xAmt')); if(!(amt>0)) return err('Enter an amount greater than zero.'); if(val('xDate')>TODAY) return err('The date can’t be in the future.');
  applyTx(t,-1);
  const catChanged = t.cat!==val('xCat');
  Object.assign(t,{amount:amt,merchant:val('xMer')||t.merchant,cat:val('xCat'),sub:val('xSub'),account:val('xAcc'),date:val('xDate'),desc:val('xDesc'),recurring:document.getElementById('xRec').checked,tags:val('xTags')?val('xTags').split(',').map(s=>s.trim()).filter(Boolean):[],notes:val('xNotes')});
  if(catChanged && t.type==='Expense' && t.ai){ t.gstRate=GST_GUESS[t.cat]??18; t.gstMode=t.gstRate?(t.gstMode==='none'?'intra':t.gstMode):'none'; }
  applyTx(t,1); sortTx(); S.layer={kind:'tx',id:t.id}; renderLayer(); render(); toast('Transaction updated');
}

/* ---------- search ---------- */
function searchHTML(){
  return `<div class="scrim" data-act="closeLayer" data-self="1"><div class="modal search"><input class="inp" id="sIn" placeholder="Search transactions, merchants, holdings, assets…" autocomplete="off" value="${esc(S.layer.q||'')}"><div class="sres" id="sRes">${searchResults(S.layer.q||'')}</div></div></div>`;
}
function searchResults(q){
  q=q.trim().toLowerCase(); if(!q) return TX.length?`<div class="sgrp">Recent merchants</div>${[...new Set(TX.slice(0,40).map(t=>t.merchant))].slice(0,6).map(x=>`<div class="sitem" data-act="sTry" data-v="${esc(x)}">${esc(x)}<span>search</span></div>`).join('')}`:'<div class="sitem mu">Type to search everything in Artha.</div>';
  const has=s=>String(s??'').toLowerCase().includes(q); const out=[];
  const tx=TX.filter(t=>has(t.merchant)||has(t.desc)||has(t.notes)||has(t.cat)||(t.tags||[]).some(has)||(q.endsWith('%')&&t.gstRate+'%'===q)).slice(0,8);
  if(tx.length) out.push(`<div class="sgrp">Transactions</div>`+tx.map(t=>`<div class="sitem" data-act="tx" data-id="${t.id}">${esc(t.merchant)} <span>${fdate(t.date)} · ${esc(t.cat)}</span><b class="num ${amtCls(t)}" style="margin-left:auto;font-weight:400">${sign(t)}${inr(t.amount)}</b></div>`).join(''));
  const mer=[...new Set(TX.filter(t=>has(t.merchant)).map(t=>t.merchant))].slice(0,5);
  if(mer.length) out.push(`<div class="sgrp">Merchants</div>`+mer.map(m=>`<div class="sitem" data-act="goLedger" data-f="${esc(JSON.stringify({q:m}))}">${esc(m)}<span>${TX.filter(t=>t.merchant===m).length} txns · ${sh(sum(TX.filter(t=>t.merchant===m),t=>t.amount))}</span></div>`).join(''));
  const cats=Object.keys(EXP_CATS).concat(INC_CATS).filter(has); if(cats.length) out.push(`<div class="sgrp">Categories</div>`+cats.map(c=>`<div class="sitem" data-act="goLedger" data-f="${esc(JSON.stringify({cat:c}))}">${c}<span>category</span></div>`).join(''));
  const ac=ACCOUNTS.filter(x=>has(x.name)||has(x.kind)); if(ac.length) out.push(`<div class="sgrp">Accounts</div>`+ac.map(x=>`<div class="sitem" data-act="editAccount" data-id="${x.id}">${esc(x.name)}<span>${x.kind} · ${sh(x.bal)}</span></div>`).join(''));
  const h=HOLDINGS.filter(x=>has(x.name)||has(x.ticker)||has(x.cls)); if(h.length) out.push(`<div class="sgrp">Investments</div>`+h.map(x=>`<div class="sitem" data-act="editHolding" data-id="${x.id}">${esc(x.name)}<span>${esc(x.ticker||x.cls)} · ${sh(hv(x))}</span></div>`).join(''));
  const as=OTHER_ASSETS.filter(x=>has(x.name)||has(x.cls)); if(as.length) out.push(`<div class="sgrp">Assets</div>`+as.map(x=>`<div class="sitem" data-act="editAsset" data-id="${x.id}">${esc(x.name)}<span>${sh(x.value)}</span></div>`).join(''));
  const li=LIABS.filter(x=>has(x.name)||has(x.type)); if(li.length) out.push(`<div class="sgrp">Liabilities</div>`+li.map(x=>`<div class="sitem" data-act="editLiab" data-id="${x.id}">${esc(x.name)}<span>${sh(x.outstanding)}</span></div>`).join(''));
  const gg=GIGS.filter(x=>has(x.client)||has(x.project)); if(gg.length) out.push(`<div class="sgrp">Side gigs</div>`+gg.map(x=>`<div class="sitem" data-act="editGig" data-id="${x.id}">${esc(x.client)} — ${esc(x.project)}<span>${sh(x.revenue)} · ${x.status}</span></div>`).join(''));
  const tr=TX.filter(t=>t.gstRate>0&&(has(t.merchant)||has(t.cat))); if(tr.length) out.push(`<div class="sgrp">Tax records</div><div class="sitem" data-act="nav" data-v="tax">GST entries matching “${esc(q)}”<span>${tr.length} records · ${sh(sum(tr,t=>gstOf(t).gst))} GST</span></div>`);
  const ins=insights().filter(x=>has(x.text)); if(ins.length) out.push(`<div class="sgrp">Insights</div>`+ins.map(x=>`<div class="sitem" data-act="nav" data-v="ai">${x.text}</div>`).join(''));
  return out.join('') || `<div class="sitem mu">No matches for “${esc(q)}”.</div>`;
}

/* ---------- layer + shell ---------- */
function renderLayer(){
  const L=document.getElementById('layer'); if(!S.layer){ L.innerHTML=''; return; }
  L.innerHTML = S.layer.kind==='quick'?quickHTML(): S.layer.kind==='edit'?editHTML(): S.layer.kind==='tx'?drawerHTML(): S.layer.kind==='search'?searchHTML():'';
  if(S.layer.kind==='search'){ const i=document.getElementById('sIn'); i.focus(); i.setSelectionRange(i.value.length,i.value.length); i.oninput=()=>{S.layer.q=i.value; document.getElementById('sRes').innerHTML=searchResults(i.value);}; }
  const mf=document.getElementById('mForm'); if(mf) mf.onsubmit=e=>{ e.preventDefault(); S.layer.kind==='quick'?saveQuick():saveEdit(); };
  const df=document.getElementById('dForm'); if(df) df.onsubmit=e=>{ e.preventDefault(); saveTxEdit(); };
  if(S.layer.kind==='quick' && S.layer.type==='Investment'){
    const upd=()=>{ document.getElementById('newHold').hidden = val('qHold')!=='new'; const q=num(val('qQty')),p=num(val('qPrice')); document.getElementById('qTotal').textContent='Total: '+inr((q>0&&p>0)?q*p:0); };
    ['qHold','qQty','qPrice'].forEach(id=>document.getElementById(id).addEventListener('input',upd)); document.getElementById('qHold').addEventListener('change',upd); upd();
  }
}
let toastT; function toast(m){ let el=document.getElementById('toast'); if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el);} el.innerHTML=`<span class="up">●</span>${esc(m)}`; el.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>el.hidden=true,2600); }

function shell(){
  const al = META.mode ? alerts() : [];
  document.getElementById('side').innerHTML = `<div class="brand"><div class="mark"></div><div class="wm">ARTHA<small>FINANCE OS</small></div></div>
    <div class="navl">${TABS.map(([k,l,ic,n])=>`<button class="navi ${S.tab===k?'on':''}" data-act="nav" data-v="${k}">${icon(ic,17)}<span>${l}</span><span class="k">${n}</span></button>`).join('')}</div>
    <div class="foot"><b>Your money, understood.</b><br>by Faaz Dev Labs · v1.1<br><span style="opacity:.8">${META.mode==='demo'?'Demo data · ':''}Saved on this device</span></div>`;
  document.getElementById('top').innerHTML = `<div class="mbrand"><div class="mark"></div></div>
    <button class="sbtn" data-act="search">${icon('search',16)}<span>Search transactions, merchants, holdings…</span><kbd>⌘K</kbd></button>
    <div style="margin-left:auto;display:flex;gap:8px;position:relative">
      <button class="ibtn" data-act="bell" aria-label="Alerts">${icon('bell',17)}${al.length?'<span class="dot"></span>':''}</button>
      <button class="btn pri" data-act="quick" data-type="Expense">${icon('plus',15)} New</button>
      ${S.bell?`<div class="pop"><div class="phd" style="padding-bottom:6px"><h3>Alerts</h3><span class="meta">${al.length} active</span></div><div class="pb" style="padding-top:4px">${al.length?al.map((a,i)=>`<div class="ins clk" data-act="alert" data-i="${i}"><i style="background:var(--${a.tone})"></i><p>${esc(a.t)}<small>${esc(a.d)}</small></p></div>`).join(''):empty('No alerts right now.')}</div></div>`:''}
    </div>`;
  document.getElementById('bnav').innerHTML = TABS.map(([k,l,ic])=>`<button class="${S.tab===k?'on':''}" data-act="nav" data-v="${k}">${icon(ic,19)}<span>${SHORT[k]}</span></button>`).join('');
  document.querySelector('.fab').innerHTML = icon('plus',24);
}
function render(){
  CH=[];
  document.body.classList.toggle('onboard', !META.mode);
  const v=document.getElementById('view');
  if(!META.mode){ v.innerHTML=vWelcome(); return; }
  shell();
  v.innerHTML = ({cc:vCommand, money:vMoney, tax:vTax, portfolio:vPortfolio, accounting:vAccounting, analytics:vAnalytics, ai:vAI})[S.tab]();
  drawCharts();
  if(S.tab==='ai'){ const m=document.getElementById('msgs'); m.scrollTop=m.scrollHeight;
    document.getElementById('chatForm').onsubmit=e=>{e.preventDefault(); const i=document.getElementById('chatIn'); if(i.value.trim()) chat(i.value.trim());}; }
  try{ localStorage.setItem('artha.tab',S.tab); }catch(e){}
  saveData();
}
function chat(q){ S.chat.push({role:'u',text:q}); const a=ask(q); S.chat.push({role:'a',html:a.html,refs:a.refs}); render(); document.getElementById('chatIn')?.focus(); }
function go(tab,opts={}){ S.tab=tab; S.bell=false; if(opts.sub){ if(tab==='money') S.money.sub=opts.sub; if(tab==='accounting') S.acct.sub=opts.sub; } if(opts.taxMonth) S.tax.month=opts.taxMonth; S.layer=null; renderLayer(); render(); window.scrollTo(0,0); }
function goLedger(f){ Object.assign(S.money,{sub:'ledger',q:'',type:'All',cat:'All',month:'All'},f); go('money'); }
function downloadBackup(){
  const blob=new Blob([backupJSON()],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`artha-backup-${TODAY}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
const openEdit = (ek,id) => { S.layer={kind:'edit',ek,id}; S.bell=false; renderLayer(); };

/* ---------- events ---------- */
const ACT = {
  nav:d=>go(d.v), quick:d=>openQuick(d.type), qtype:d=>{S.layer.type=d.v; renderLayer(); document.getElementById('qAmt')?.focus();},
  closeLayer:(d,el,e)=>{ if(d.self && e.target!==el) return; S.layer=null; renderLayer(); },
  tx:d=>{S.layer={kind:'tx',id:d.id}; renderLayer();}, txEdit:()=>{ S.layer.edit=true; renderLayer(); },
  search:()=>{S.layer={kind:'search',q:''}; renderLayer();}, sTry:d=>{S.layer.q=d.v; renderLayer();},
  bell:()=>{S.bell=!S.bell; shell();},
  range:d=>{S.range=d.v; render();},
  sumMonth:d=>{S.money.sumMonth=d.v; render();}, msub:d=>{S.money.sub=d.v; render();}, msubGo:d=>go('money',{sub:d.v}),
  clearF:()=>{Object.assign(S.money,{q:'',type:'All',cat:'All',month:'All'}); render();},
  goLedger:d=>goLedger(JSON.parse(d.f)), taxMonth:d=>{S.tax.month=d.v; render();},
  asub:d=>{S.acct.sub=d.v; render();}, asubGo:d=>go('accounting',{sub:d.v}), acctMonth:d=>{S.acct.month=d.v; render();},
  anPer:d=>{S.an.period=d.v; render();},
  dcat:d=>{S.an.cat=d.v; S.an.sub=S.an.merchant=null; render();}, dsub:d=>{S.an.sub=d.v; S.an.merchant=null; render();}, dmer:d=>{S.an.merchant=d.v; render();},
  dcatTop:d=>{S.an.cat=d.v; S.an.sub=S.an.merchant=null; render(); window.scrollTo({top:0,behavior:'smooth'});},
  drill:d=>{const l=+d.l; if(l<1) S.an.cat=null; if(l<2) S.an.sub=null; S.an.merchant=null; render();},
  anAsk:d=>{ const q=d.q||document.getElementById('anq').value; if(!q.trim()) return; S.an.q=q; S.an.answer=ask(q); render(); },
  chatQ:d=>chat(d.q),
  ref:d=>{ const r=JSON.parse(d.r); if(r.tx){S.layer={kind:'tx',id:r.tx}; renderLayer(); return;} if(r.f) return goLedger(r.f); go(r.tab,r); },
  insight:d=>{ const x=insights()[+d.i]?.act; if(!x) return; if(x.f) goLedger(x.f); else go(x.tab,x); },
  alert:d=>{ const a=alerts()[+d.i]; S.bell=false; if(!a) return shell(); if(a.f) goLedger(a.f); else go(a.tab,{sub:a.sub}); },
  refreshPrices:()=>{ HOLDINGS.filter(h=>h.live).forEach(h=>{ h.prev=h.price; h.price=Math.round(h.price*(1+(Math.random()-.47)*.02)*100)/100; }); S.priceTime=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); render(); toast('Prices refreshed (demo feed)'); },
  similar:d=>goLedger({q:d.m}),
  editAccount:d=>openEdit('account',d.id), editHolding:d=>openEdit('holding',d.id), editAsset:d=>openEdit('asset',d.id), editLiab:d=>openEdit('liab',d.id), editGig:d=>openEdit('gig',d.id),
  gigPaid:(d,el,e)=>{ e.stopPropagation(); const g=GIGS.find(x=>x.id===d.id); g.status='Paid'; if(g.date>TODAY) g.date=TODAY; syncGig(g); render(); toast(`Marked paid · ${inr(g.revenue)} added to income`); },
  delAsk:d=>{ document.getElementById('delZone').innerHTML=`<span style="font-size:13px;align-self:center">Delete permanently?</span><button type="button" class="btn pri sm" data-act="delYes" data-k="${d.k}">Delete</button><button type="button" class="btn sm ghost" data-act="delNo">Keep</button>`; },
  delNo:()=>renderLayer(),
  delYes:d=>{ if(d.k==='tx'){ const t=TX.find(x=>x.id===S.layer.id); if(t){ applyTx(t,-1); if(t.gigId){ const g=GIGS.find(x=>x.id===t.gigId); if(g) g.status='Invoiced'; } TX=TX.filter(x=>x!==t); } done('Transaction deleted'); } else deleteEdit(); },
  exportData:()=>{ if(window.NATIVE) nativeShareBackup(); else { downloadBackup(); toast('Backup downloaded'); } },
  importPick:()=>document.getElementById('importFile').click(),
  eraseAsk:()=>{ document.getElementById('eraseZone').innerHTML=`<span style="font-size:12px">Erase everything on this device?</span> <button class="btn sm pri" data-act="eraseYes">Yes, erase</button> <button class="btn sm ghost" data-act="eraseNo">Cancel</button>`; },
  eraseNo:()=>render(),
  eraseYes:()=>{ eraseData(); S.chat=[]; S.tab='cc'; S.an.answer=null; render(); window.scrollTo(0,0); },
  startFresh:()=>{ seedFresh(); S.chat=[]; S.tab='cc'; saveData(); render(); },
  startDemo:()=>{ seedDemo(); S.chat=[]; S.tab='cc'; saveData(); render(); toast('Demo data loaded. Erase it from Command Center any time.'); }
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');
  if(S.bell && !e.target.closest('.pop') && !(el&&el.dataset.act==='bell')){ S.bell=false; shell(); if(!el) return; }
  if(!el) return; const f=ACT[el.dataset.act]; if(f) f(el.dataset,el,e);
});
document.addEventListener('input',e=>{
  const el=e.target; const b=el.dataset?.bind; if(!b) return;
  if(b==='mq'){ S.money.q=el.value; const pos=el.selectionStart; render(); const i=document.getElementById('lq'); i.focus(); i.setSelectionRange(pos,pos); return; }
  if(b==='anq'){ S.an.q=el.value; return; }
});
const BIND = { mtype:v=>{S.money.type=v;}, mcat:v=>{S.money.cat=v;}, mmonth:v=>{S.money.month=v;}, from:v=>{S.from=v;}, to:v=>{S.to=v;} };
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='importFile'&&el.files[0]){ importData(el.files[0], ok=>{ el.value=''; if(ok){ S.chat=[]; S.tab='cc'; } render(); toast(ok?'Backup imported':'That file is not an Artha backup'); }); return; }
  if(el.dataset?.sub){ const sub=document.getElementById(el.dataset.sub); if(sub&&sub.tagName==='SELECT'&&EXP_CATS[el.value]) sub.innerHTML=opt(EXP_CATS[el.value]); return; }
  const b=el.dataset?.bind; if(!b||b==='mq'||b==='anq') return;
  if(b==='rate'||b==='itc'||b==='mode'){ const t=TX.find(x=>x.id===el.dataset.id); if(b==='rate'){t.gstRate=+el.value; t.gstMode=t.gstRate?(t.gstMode==='none'?'intra':t.gstMode):'none'; if(t.gstRate&&t.itc==='N/A') t.itc='Not eligible';} if(b==='itc') t.itc=el.value; if(b==='mode') t.gstMode=el.value; t.ai=false; render(); if(S.layer?.kind==='tx') renderLayer(); toast('Classification updated'); return; }
  if(BIND[b]){ BIND[b](el.value); render(); }
});
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); if(META.mode) ACT.search(); return; }
  if(e.key==='Escape'&&(S.layer||S.bell)){ S.layer=null; S.bell=false; renderLayer(); shell(); return; }
  if(e.key==='Enter'&&e.target.dataset?.enter){ e.preventDefault(); ACT[e.target.dataset.enter]({}); return; }
  const tag=(e.target.tagName||'').toLowerCase(); if(!META.mode||['input','textarea','select'].includes(tag)||S.layer||e.metaKey||e.ctrlKey||e.altKey) return;
  const n=+e.key; if(n>=1&&n<=7) go(TABS[n-1][0]);
  if(e.key==='n'){ e.preventDefault(); openQuick('Expense'); }
  if(e.key==='/'){ e.preventDefault(); ACT.search(); }
});
let rz; window.addEventListener('resize',()=>{ clearTimeout(rz); rz=setTimeout(drawCharts,120); });

/* ---------- boot ---------- */
(function(){ let t=null; try{ t=localStorage.getItem('artha.tab'); }catch(e){}
  const h=(location.hash||'').slice(1); if(TABS.some(x=>x[0]===h)) t=h;
  if(t && TABS.some(x=>x[0]===t)) S.tab=t; render(); })();
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(drawCharts);
