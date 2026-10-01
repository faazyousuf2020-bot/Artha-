/* ---------- overlays ---------- */
function openQuick(type='Expense'){ S.layer={kind:'quick', type}; renderLayer(); setTimeout(()=>document.getElementById('qAmt')?.focus(),30); }
function quickHTML(){
  const ty=S.layer.type; const types=['Expense','Income','Transfer','Investment','Asset','Liability','Tax'];
  const accOpts=ACCOUNTS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  let fields='';
  if(['Expense','Income','Investment','Tax'].includes(ty)){
    const cats= ty==='Expense'?Object.keys(EXP_CATS): ty==='Income'?INC_CATS: ty==='Investment'?['Stocks','ETF','Mutual fund SIP','Gold','Startup equity','Other']:['Advance tax','Self-assessment','TDS','GST payment'];
    fields=`<label class="full">Amount<input class="inp amtin" id="qAmt" inputmode="decimal" placeholder="₹0" required></label>
    <label>Category<select class="inp" id="qCat">${cats.map(c=>`<option>${c}</option>`).join('')}</select></label>
    <label>Account<select class="inp" id="qAcc">${accOpts}</select></label>
    <label>Date<input class="inp" type="date" id="qDate" value="${TODAY}" required></label>
    <label>Merchant / source<input class="inp" id="qMer" placeholder="${ty==='Income'?'Client or payer':'e.g. Swiggy'}"></label>
    ${ty==='Expense'?`<label>GST rate<select class="inp" id="qGst"><option value="auto">Auto-classify (AI)</option>${[0,5,12,18,28,40].map(r=>`<option value="${r}">${r}%</option>`).join('')}</select></label><label>Supply<select class="inp" id="qMode"><option value="intra">Intra-state (CGST+SGST)</option><option value="inter">Inter-state (IGST)</option></select></label>`:''}
    <label class="full">Description<input class="inp" id="qDesc" placeholder="Optional"></label>
    <label class="full">Notes<textarea class="inp" id="qNotes" rows="2" placeholder="Optional"></textarea></label>
    <label class="full">Attachment<input class="inp" type="file" id="qFile" accept="image/*,application/pdf"></label>`;
  } else if(ty==='Transfer'){
    fields=`<label class="full">Amount<input class="inp amtin" id="qAmt" inputmode="decimal" placeholder="₹0" required></label>
    <label>From<select class="inp" id="qFrom">${accOpts}</select></label><label>To<select class="inp" id="qTo">${ACCOUNTS.map((a,i)=>`<option value="${a.id}" ${i===1?'selected':''}>${a.name}</option>`).join('')}<option value="L1">SBI car loan (repayment)</option><option value="L3">Family loan (repayment)</option></select></label>
    <label>Date<input class="inp" type="date" id="qDate" value="${TODAY}"></label><label>Note<input class="inp" id="qDesc" placeholder="Optional"></label>`;
  } else if(ty==='Asset'){
    fields=`<label class="full">Asset name<input class="inp" id="qName" placeholder="e.g. Plot in Pollachi" required></label>
    <label>Class<select class="inp" id="qCls">${['Property','Vehicles','Digital Assets','Business Equity','Other Assets'].map(c=>`<option>${c}</option>`).join('')}</select></label>
    <label>Date acquired<input class="inp" type="date" id="qDate" value="${TODAY}"></label>
    <label>Purchase cost<input class="inp" id="qCost" inputmode="decimal" placeholder="₹" required></label><label>Current value<input class="inp" id="qAmt" inputmode="decimal" placeholder="₹" required></label>
    <label class="full">Notes<input class="inp" id="qNotes" placeholder="Optional"></label>`;
  } else {
    fields=`<label class="full">Liability name<input class="inp" id="qName" placeholder="e.g. Home loan — LIC HFL" required></label>
    <label>Type<select class="inp" id="qCls">${['Loans','Credit Cards','EMIs','Personal Debt','Business Debt','Other'].map(c=>`<option>${c}</option>`).join('')}</select></label>
    <label>Outstanding<input class="inp" id="qAmt" inputmode="decimal" placeholder="₹" required></label>
    <label>Original amount<input class="inp" id="qCost" inputmode="decimal" placeholder="₹"></label><label>Interest rate %<input class="inp" id="qRate" inputmode="decimal" placeholder="e.g. 9.5"></label>
    <label>Monthly payment<input class="inp" id="qEmi" inputmode="decimal" placeholder="₹"></label><label>Next due<input class="inp" type="date" id="qDate" value="2026-10-15"></label>
    <label class="full">Remaining term<input class="inp" id="qTerm" placeholder="e.g. 48 months"></label>`;
  }
  return `<div class="scrim" data-act="closeLayer" data-self="1"><form class="modal" id="quickForm"><div class="mh"><h3>New entry</h3><button type="button" class="ibtn" data-act="closeLayer" aria-label="Close">${icon('x',16)}</button></div>
  <div style="padding:12px 16px 0">${seg(types,ty,'qtype')}</div><div class="form">${fields}</div><div id="qErr" class="dn" style="padding:0 16px;font-size:12.5px"></div>
  <div class="mf"><span class="mu" style="font-size:12px">Required: amount, category, account, date</span><div style="display:flex;gap:8px"><button type="button" class="btn ghost" data-act="closeLayer">Cancel</button><button type="submit" class="btn pri">Save ${ty.toLowerCase()}</button></div></div></form></div>`;
}
function saveQuick(){
  const ty=S.layer.type, v=id=>document.getElementById(id)?.value?.trim()??'', num=id=>parseFloat(v(id).replace(/[₹,\s]/g,''));
  const err=m=>{document.getElementById('qErr').textContent=m;};
  const amt=num('qAmt'); if(!(amt>0)) return err('Enter an amount greater than zero.');
  if(ty==='Asset'){ if(!v('qName')) return err('Give the asset a name.'); OTHER_ASSETS.push({id:'A'+Date.now(),name:v('qName'),cls:v('qCls'),cost:num('qCost')||amt,value:amt,date:v('qDate'),notes:v('qNotes')}); }
  else if(ty==='Liability'){ if(!v('qName')) return err('Give the liability a name.'); LIABS.push({id:'L'+Date.now(),name:v('qName'),type:v('qCls'),outstanding:amt,original:num('qCost')||amt,rate:num('qRate')||0,emi:num('qEmi')||0,due:v('qDate'),term:v('qTerm')||'—'}); }
  else if(ty==='Transfer'){ const from=v('qFrom'), to=v('qTo'); if(from===to) return err('Choose two different accounts.');
    const loan=to.startsWith('L'); const L_=LIABS.find(l=>l.id===to);
    add({date:v('qDate'),merchant:loan?L_.name:'Self transfer',desc:v('qDesc')||(loan?'Repayment':`${accName(from)} → ${accName(to)}`),amount:amt,type:'Transfer',cat:loan?'Loan repayment':'Self transfer',sub:loan?(to==='L1'?'Car loan':'Personal debt'):'Internal',account:from,method:'IMPS',ai:false});
    const fa=ACCOUNTS.find(a=>a.id===from); if(fa.kind!=='Credit card') fa.bal-=amt;
    if(loan) L_.outstanding=Math.max(0,L_.outstanding-amt); else { const ta=ACCOUNTS.find(a=>a.id===to); if(ta.kind!=='Credit card') ta.bal+=amt; }
  } else {
    const cat=v('qCat'); let rate=0, mode='none', ai=true;
    if(ty==='Expense'){ const g=v('qGst'); if(g==='auto'){ rate=({Housing:0,Food:5,Dining:5,Transportation:5,Travel:5,Healthcare:5,Insurance:0,Taxes:0,Other:18})[cat]??18; } else { rate=+g; ai=false; } mode=rate?v('qMode'):'none'; }
    const f=document.getElementById('qFile')?.files?.[0];
    add({date:v('qDate'),merchant:v('qMer')||cat,desc:v('qDesc')||cat,amount:amt,type:ty,cat,sub:(EXP_CATS[cat]||[''])[0],account:v('qAcc'),method:v('qAcc')==='card'?'Card':v('qAcc')==='cash'?'Cash':'UPI',gstRate:rate,gstMode:mode,notes:v('qNotes')+(f?` [${f.name}]`:''),attach:f?1:0,ai});
    const a=ACCOUNTS.find(x=>x.id===v('qAcc')); const dir=ty==='Income'?1:-1; if(a.kind==='Credit card') LIABS.find(l=>l.id==='L2').outstanding-=dir*amt; else a.bal+=dir*amt;
    if(ty==='Investment'){ const h=HOLDINGS.find(h=>h.cls==='Mutual Funds'); h.qty+=amt/h.price; h.avg=(h.avg*(h.qty-amt/h.price)+amt)/h.qty; }
    sortTx();
  }
  S.layer=null; renderLayer(); render(); toast(`${ty} saved · ${inr(amt)}`);
}
function drawerHTML(){
  const t=TX.find(x=>x.id===S.layer.id); if(!t) return ''; const g=gstOf(t);
  const f=(l,v)=>`<div class="kv"><span>${l}</span><b style="font-family:var(--f);font-weight:400;text-align:right">${v}</b></div>`;
  return `<div class="scrim" data-act="closeLayer" data-self="1" style="padding:0"></div><aside class="drawer"><div class="mh" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--line)"><span class="pill ${t.type}">${t.type}</span><button class="ibtn" data-act="closeLayer" aria-label="Close">${icon('x',16)}</button></div>
  <div style="padding:20px 16px"><div class="mu" style="font-size:12px">${fdateY(t.date)} · ${t.time}</div><h2 style="font-size:20px;margin-top:4px">${esc(t.merchant)}</h2><div class="num ${amtCls(t)}" style="font-size:34px;font-weight:300;margin-top:8px;letter-spacing:-.03em">${sign(t)}${inr(t.amount)}</div>
  <div style="margin-top:18px">${f('Description',esc(t.desc)||'—')}${f('Category',esc(t.cat))}${f('Subcategory',esc(t.sub)||'—')}${f('Account',esc(accName(t.account)))}${f('Payment method',t.method)}${f('Recurring',t.recurring?'Yes · monthly':'No')}${f('Tags',t.tags.length?t.tags.map(x=>`<span class="chip">${x}</span>`).join(' '):'—')}${f('Attachments',t.attach?'📎 1 invoice':'None')}${f('Notes',esc(t.notes)||'—')}${f('Reference',`<span class="num">${t.id}</span>`)}</div>
  ${t.type==='Expense'?`<div class="eyebrow" style="margin-top:22px;margin-bottom:6px">GST classification ${t.ai?'<span class="chip cyan" style="margin-left:6px">AI</span>':'<span class="chip" style="margin-left:6px">Overridden by you</span>'}</div>
    <div class="form" style="padding:0;margin-bottom:10px"><label>Rate<select class="inp" id="dRate" data-bind="rate" data-id="${t.id}">${[0,5,12,18,28,40].map(r=>`<option value="${r}" ${r===+t.gstRate?'selected':''}>${r}%</option>`).join('')}</select></label>
    <label>Supply<select class="inp" id="dMode" data-bind="mode" data-id="${t.id}"><option value="intra" ${t.gstMode!=='inter'?'selected':''}>Intra-state</option><option value="inter" ${t.gstMode==='inter'?'selected':''}>Inter-state</option></select></label>
    <label class="full">Input tax credit<select class="inp" id="dItc" data-bind="itc" data-id="${t.id}">${['Eligible','Review','Not eligible','N/A'].map(r=>`<option ${r===t.itc?'selected':''}>${r}</option>`).join('')}</select></label></div>
    ${f('Base amount',inr(g.base))}${f('GST',`<span class="gd">${inr(g.gst)}</span>`)}${f('CGST / SGST',`${inr(g.c)} / ${inr(g.s)}`)}${f('IGST',inr(g.i))}`:''}
  <div style="display:flex;gap:8px;margin-top:22px;flex-wrap:wrap" id="delZone"><button class="btn" data-act="similar" data-m="${esc(t.merchant)}">Similar transactions</button><button class="btn ghost dn" data-act="delAsk">Delete</button></div></div></aside>`;
}
function searchHTML(){
  return `<div class="scrim" data-act="closeLayer" data-self="1"><div class="modal search"><input class="inp" id="sIn" placeholder="Search transactions, merchants, holdings, assets, tax records…" autocomplete="off" value="${esc(S.layer.q||'')}"><div class="sres" id="sRes">${searchResults(S.layer.q||'')}</div></div></div>`;
}
function searchResults(q){
  q=q.trim().toLowerCase(); if(!q) return `<div class="sgrp">Try</div>${['Apple','AWS','Kovai','Netflix','18%','gold'].map(x=>`<div class="sitem" data-act="sTry" data-v="${x}">${x}<span>search</span></div>`).join('')}`;
  const has=s=>String(s).toLowerCase().includes(q); const out=[];
  const tx=TX.filter(t=>has(t.merchant)||has(t.desc)||has(t.notes)||has(t.cat)||t.tags.some(has)||(q.endsWith('%')&&t.gstRate+'%'===q)).slice(0,8);
  if(tx.length) out.push(`<div class="sgrp">Transactions</div>`+tx.map(t=>`<div class="sitem" data-act="tx" data-id="${t.id}">${esc(t.merchant)} <span>${fdate(t.date)} · ${t.cat}</span><b class="num ${amtCls(t)}" style="margin-left:auto;font-weight:400">${sign(t)}${inr(t.amount)}</b></div>`).join(''));
  const mer=[...new Set(TX.filter(t=>has(t.merchant)).map(t=>t.merchant))].slice(0,5);
  if(mer.length) out.push(`<div class="sgrp">Merchants</div>`+mer.map(m=>`<div class="sitem" data-act="goLedger" data-f='${esc(JSON.stringify({q:m}))}'>${esc(m)}<span>${TX.filter(t=>t.merchant===m).length} txns · ${sh(sum(TX.filter(t=>t.merchant===m),t=>t.amount))}</span></div>`).join(''));
  const cats=Object.keys(EXP_CATS).concat(INC_CATS).filter(has); if(cats.length) out.push(`<div class="sgrp">Categories</div>`+cats.map(c=>`<div class="sitem" data-act="goLedger" data-f='${esc(JSON.stringify({cat:c}))}'>${c}<span>category</span></div>`).join(''));
  const h=HOLDINGS.filter(x=>has(x.name)||has(x.ticker)||has(x.cls)); if(h.length) out.push(`<div class="sgrp">Investments</div>`+h.map(x=>`<div class="sitem" data-act="nav" data-v="portfolio">${esc(x.name)}<span>${x.ticker} · ${sh(hv(x))}</span></div>`).join(''));
  const as=OTHER_ASSETS.filter(x=>has(x.name)||has(x.cls)); if(as.length) out.push(`<div class="sgrp">Assets</div>`+as.map(x=>`<div class="sitem" data-act="asubGo" data-v="assets">${esc(x.name)}<span>${sh(x.value)}</span></div>`).join(''));
  const li=LIABS.filter(x=>has(x.name)||has(x.type)); if(li.length) out.push(`<div class="sgrp">Liabilities</div>`+li.map(x=>`<div class="sitem" data-act="asubGo" data-v="liabs">${esc(x.name)}<span>${sh(x.outstanding)}</span></div>`).join(''));
  const gg=GIGS.filter(x=>has(x.client)||has(x.project)); if(gg.length) out.push(`<div class="sgrp">Side gigs</div>`+gg.map(x=>`<div class="sitem" data-act="msubGo" data-v="gigs">${esc(x.client)} — ${esc(x.project)}<span>${sh(x.revenue)} · ${x.status}</span></div>`).join(''));
  const tr=TX.filter(t=>t.gstRate>0&&(has(t.merchant)||has(t.cat))).slice(0,1); if(tr.length) out.push(`<div class="sgrp">Tax records</div><div class="sitem" data-act="nav" data-v="tax">GST entries matching “${esc(q)}”<span>${TX.filter(t=>t.gstRate>0&&(has(t.merchant)||has(t.cat))).length} records · ${sh(sum(TX.filter(t=>t.gstRate>0&&(has(t.merchant)||has(t.cat))),t=>gstOf(t).gst))} GST</span></div>`);
  const ins=insights().filter(x=>has(x.text)); if(ins.length) out.push(`<div class="sgrp">AI insights</div>`+ins.map(x=>`<div class="sitem" data-act="nav" data-v="ai">${x.text}</div>`).join(''));
  return out.join('') || `<div class="sitem mu">No matches for “${esc(q)}”.</div>`;
}
function renderLayer(){
  const L=document.getElementById('layer'); if(!S.layer){ L.innerHTML=''; return; }
  L.innerHTML = S.layer.kind==='quick'?quickHTML(): S.layer.kind==='tx'?drawerHTML(): S.layer.kind==='search'?searchHTML():'';
  if(S.layer.kind==='search'){ const i=document.getElementById('sIn'); i.focus(); i.setSelectionRange(i.value.length,i.value.length); i.oninput=()=>{S.layer.q=i.value; document.getElementById('sRes').innerHTML=searchResults(i.value);}; }
  if(S.layer.kind==='quick') document.getElementById('quickForm').onsubmit=e=>{e.preventDefault(); saveQuick();};
}
let toastT; function toast(m){ let el=document.getElementById('toast'); if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el);} el.innerHTML=`<span class="up">●</span>${esc(m)}`; el.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>el.hidden=true,2600); }

/* ---------- shell render ---------- */
function shell(){
  document.getElementById('side').innerHTML = `<div class="brand"><div class="mark"></div><div class="wm">ARTHA<small>FINANCE OS</small></div></div>
    <div class="navl">${TABS.map(([k,l,ic,n])=>`<button class="navi ${S.tab===k?'on':''}" data-act="nav" data-v="${k}">${icon(ic,17)}<span>${l}</span><span class="k">${n}</span></button>`).join('')}</div>
    <div class="foot"><b>Your money, understood.</b><br>by Faaz Dev Labs · v1.0<br><span style="opacity:.8">Saved on this device</span>
      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"><button class="lnk" data-act="exportData">Export</button><button class="lnk" data-act="importPick">Import</button><button class="lnk" data-act="resetAsk" style="color:var(--mut2)">Reset demo</button></div></div>`;
  document.getElementById('top').innerHTML = `<div class="mbrand"><div class="mark"></div></div>
    <button class="sbtn" data-act="search">${icon('search',16)}<span>Search transactions, merchants, holdings…</span><kbd>⌘K</kbd></button>
    <div style="margin-left:auto;display:flex;gap:8px;position:relative">
      <button class="ibtn" data-act="bell" aria-label="Alerts">${icon('bell',17)}<span class="dot"></span></button>
      <button class="btn pri" data-act="quick" data-type="Expense">${icon('plus',15)} New</button>
      ${S.bell?`<div class="pop"><div class="phd" style="padding-bottom:6px"><h3>Alerts</h3><span class="meta">${alerts().length} active</span></div><div class="pb" style="padding-top:4px">${alerts().map((a,i)=>`<div class="ins clk" data-act="alert" data-i="${i}"><i style="background:var(--${a.tone})"></i><p>${a.t}<small>${a.d}</small></p></div>`).join('')}</div></div>`:''}
    </div>`;
  document.getElementById('bnav').innerHTML = TABS.map(([k,l,ic])=>`<button class="${S.tab===k?'on':''}" data-act="nav" data-v="${k}">${icon(ic,19)}<span>${SHORT[k]}</span></button>`).join('');
  document.querySelector('.fab').innerHTML = icon('plus',24);
}
function render(keepScroll){
  CH=[]; shell();
  const v=document.getElementById('view');
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

/* ---------- events ---------- */
const ACT = {
  nav:d=>go(d.v), quick:d=>openQuick(d.type), qtype:d=>{S.layer.type=d.v; renderLayer(); document.getElementById('qAmt')?.focus();},
  closeLayer:(d,el,e)=>{ if(d.self && e.target!==el) return; S.layer=null; renderLayer(); },
  tx:d=>{S.layer={kind:'tx',id:d.id}; renderLayer();},
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
  insight:d=>{ const x=insights()[+d.i].act; if(x.f) goLedger(x.f); else go(x.tab); },
  alert:d=>{ const a=alerts()[+d.i]; S.bell=false; if(a.f) goLedger(a.f); else go(a.tab, a.tab==='accounting'?{sub:'liabs'}:{}); },
  refreshPrices:()=>{ HOLDINGS.filter(h=>h.live).forEach(h=>{ h.price=Math.round(h.price*(1+(Math.random()-.47)*.02)*100)/100; }); const n=new Date(); S.priceTime=n.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'})+' IST'; render(); toast('Prices refreshed from demo feed'); },
  similar:d=>goLedger({q:d.m}),
  exportData:()=>{ exportData(); toast('Backup downloaded'); },
  importPick:()=>document.getElementById('importFile').click(),
  resetAsk:(d,el)=>{ el.outerHTML=`<span style="font-size:11.5px">Erase your entries? <button class="lnk" data-act="resetYes">Yes, reset</button></span>`; },
  resetYes:()=>resetData(),
  delAsk:()=>{ document.getElementById('delZone').innerHTML=`<span style="font-size:13px">Delete this transaction?</span><button class="btn pri sm" data-act="delYes">Delete</button><button class="btn sm ghost" data-act="tx" data-id="${S.layer.id}">Keep</button>`; },
  delYes:()=>{ TX=TX.filter(t=>t.id!==S.layer.id); S.layer=null; renderLayer(); render(); toast('Transaction deleted'); }
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');
  if(S.bell && !e.target.closest('.pop') && !(el&&el.dataset.act==='bell')){ S.bell=false; shell(); if(!el) return; }
  if(!el) return; const f=ACT[el.dataset.act]; if(f) f(el.dataset,el,e);
});
const BIND = {
  mq:v=>{S.money.q=v;}, mtype:v=>{S.money.type=v;}, mcat:v=>{S.money.cat=v;}, mmonth:v=>{S.money.month=v;},
  from:v=>{S.from=v;}, to:v=>{S.to=v;}, anq:v=>{S.an.q=v;}
};
document.addEventListener('input',e=>{
  const el=e.target; const b=el.dataset?.bind; if(!b) return;
  if(b==='mq'){ S.money.q=el.value; const pos=el.selectionStart; render(); const i=document.getElementById('lq'); i.focus(); i.setSelectionRange(pos,pos); return; }
  if(b==='anq'){ S.an.q=el.value; return; }
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='importFile'&&el.files[0]){ importData(el.files[0], ok=>{ el.value=''; render(); toast(ok?'Backup imported':'That file is not an Artha backup'); }); return; } const b=el.dataset?.bind; if(!b||b==='mq'||b==='anq') return;
  if(b==='rate'||b==='itc'||b==='mode'){ const t=TX.find(x=>x.id===el.dataset.id); if(b==='rate'){t.gstRate=+el.value; if(t.gstRate&&t.gstMode==='none') t.gstMode='intra';} if(b==='itc') t.itc=el.value; if(b==='mode') t.gstMode=el.value; t.ai=false; render(); if(S.layer?.kind==='tx') renderLayer(); toast('Classification overridden'); return; }
  if(BIND[b]){ BIND[b](el.value); render(); }
});
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); ACT.search(); return; }
  if(e.key==='Escape'&&(S.layer||S.bell)){ S.layer=null; S.bell=false; renderLayer(); shell(); return; }
  if(e.key==='Enter'&&e.target.dataset?.enter){ e.preventDefault(); ACT[e.target.dataset.enter]({}); return; }
  const tag=(e.target.tagName||'').toLowerCase(); if(['input','textarea','select'].includes(tag)||S.layer||e.metaKey||e.ctrlKey||e.altKey) return;
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
if('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
