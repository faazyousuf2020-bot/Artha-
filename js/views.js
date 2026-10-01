/* ---------- views ---------- */
function vCommand(){
  const nw=netWorth(), A=assetsTotal(), L=liabTotal(), jan=NW_HISTORY[0][1], s=monthStats(CUR);
  const fyGst = sum(TX.filter(isSpend), t=>gstOf(t).gst);
  const hist = [...NW_HISTORY, ['Sep', nw]];
  const ins = insights();
  const sp = spendSeries();
  const qa = [['Expense','minus','+ Expense'],['Income','plus','+ Income'],['Transfer','swap','+ Transfer'],['Investment','port','Add investment'],['Asset','asset','Add asset'],['Liability','liab','Add liability'],['Tax','tax','Tax entry']];
  return `
  <div class="ph1"><div><div class="eyebrow">Command Center</div><h1>What is happening with your money</h1><p>As of ${fdateY(TODAY)} · all figures are demo data</p></div>
    <div style="display:flex;gap:8px"><button class="btn" data-act="nav" data-v="ai">${icon('ai',15)} Ask Artha</button><button class="btn pri" data-act="quick" data-type="Expense">${icon('plus',15)} New entry</button></div></div>

  <section class="hero">
    <div class="l">
      <div class="eyebrow">Net worth</div>
      <div class="nw"><span class="cur">₹</span>${sh(nw).replace('₹','')}</div>
      <div style="margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip green">▲ ${((nw/jan-1)*100).toFixed(1)}% this year</span><span class="mu" style="font-size:12px">${inr(nw)}</span></div>
      <div class="eq"><div>Total assets<b>${sh(A)}</b></div><div>− Liabilities<b>${sh(L)}</b></div><div>= Equity<b style="color:var(--gold)">${sh(nw)}</b></div></div>
    </div>
    <div class="r"><div style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px 0"><span class="eyebrow">Net worth · 2026</span><span class="meta mu" style="font-size:11.5px">month-end snapshots</span></div>
      ${chartSlot({kind:'line',labels:hist.map(h=>h[0]),series:[{values:hist.map(h=>h[1]),color:'#E50914',area:true,endLabel:true}]},210)}</div>
  </section>

  <div class="g c4 mt">
    ${tile('Cash', sh(cashTotal()), `${ACCOUNTS.filter(a=>a.kind!=='Credit card').length} accounts`)}
    ${tile('Investments', sh(invTotal()), `<span class="up">▲ ${((invTotal()/sum(HOLDINGS,hi)-1)*100).toFixed(1)}%</span> unrealised`)}
    ${tile('Side income', sh(s.gig), `${ml(CUR)} · ${sh(sum(GIGS.filter(g=>g.status==='Paid'),g=>g.revenue))} since Apr`,'green')}
    ${tile('GST paid', sh(fyGst), 'Estimated · FY 26–27 to date','gold')}
  </div>

  <div class="g c21 mt">
    ${panel('Financial Radar', `
      <div class="g c3" style="gap:20px">
        <div><div class="eyebrow">Cash flow · ${ml(CUR)}</div>
          <div class="kv"><span>Income</span><b class="up">${sh(s.income)}</b></div>
          <div class="kv"><span>Expenses</span><b>${sh(s.expense)}</b></div>
          <div class="kv"><span>Tax</span><b>${sh(s.tax)}</b></div>
          <div class="kv"><span>Net</span><b class="${s.savings>=0?'up':'dn'}">${s.savings>=0?'+':''}${sh(s.savings)}</b></div></div>
        <div><div class="eyebrow">Savings rate</div>
          <div class="num" style="font-size:34px;font-weight:300;margin-top:6px;letter-spacing:-.03em">${(s.rate*100).toFixed(1)}%</div>
          <div class="meter"><i style="width:${Math.min(100,s.rate*100)}%;background:var(--green)"></i></div>
          <div class="mu" style="font-size:12px;margin-top:8px">Target 40% · 6-mo avg ${(sum(MK,m=>monthStats(m).rate)/6*100).toFixed(1)}%</div></div>
        <div><div class="eyebrow">Balance sheet</div>
          <div class="kv"><span>Assets</span><b>${sh(A)}</b></div>
          <div class="kv"><span>Liabilities</span><b class="dn">${sh(L)}</b></div>
          <div class="kv"><span>Equity</span><b class="gd">${sh(nw)}</b></div>
          <div class="stack" style="margin-top:10px"><i style="width:${nw/A*100}%;background:var(--gold)"></i><i style="width:${L/A*100}%;background:var(--red)"></i></div>
          <div class="mu" style="font-size:11.5px;margin-top:6px">Debt-to-assets ${(L/A*100).toFixed(1)}%</div></div>
      </div>
      <div style="border-top:1px solid var(--line2);margin-top:14px;padding-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span class="eyebrow" style="margin-right:4px">Alerts</span>
        ${alerts().slice(0,4).map(a=>`<button class="chip ${a.tone}" style="cursor:pointer" data-act="alert" data-i="${alerts().indexOf(a)}">${esc(a.t)}</button>`).join('')}
      </div>`, {meta:'live from your ledger'})}
    ${panel(`${icon('ai',15)} Artha AI insight`, ins.slice(0,3).map(x=>`<div class="ins"><i style="background:var(--${x.tone})"></i><p>${x.text}<small>${x.why}</small>${x.act?` <button class="lnk" data-act="insight" data-i="${ins.indexOf(x)}">${x.act.label} →</button>`:''}</p></div>`).join(''), {cls:'ai', actions:`<button class="lnk" data-act="nav" data-v="ai">All insights</button>`})}
  </div>

  <div class="mt"><div class="eyebrow" style="margin-bottom:8px">Quick actions</div>
    <div class="qa">${qa.map(q=>`<button data-act="quick" data-type="${q[0]}">${icon(q[1],18)}<span>${q[2]}</span></button>`).join('')}</div></div>

  <div class="g c21 mt">
    ${panel('Spending', `${S.range==='Custom'?`<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap"><input type="date" class="inp" id="rFrom" value="${S.from}" min="2026-04-01" max="${TODAY}" data-bind="from"><input type="date" class="inp" id="rTo" value="${S.to}" min="2026-04-01" max="${TODAY}" data-bind="to"></div>`:''}
      ${chartSlot({kind:'bar',labels:sp.labels,values:sp.values,hi:sp.values.length-1},220)}
      <div class="mu" style="font-size:12px;margin-top:6px">${sp.note}</div>`,
      {actions: seg(['7D','30D','3M','6M','1Y','Custom'], S.range, 'range'), meta: `Total ${sh(sum(sp.values))}`})}
    ${panel('Recent activity', TX.slice(0,7).map(txRow).join(''), {actions:`<button class="lnk" data-act="nav" data-v="money">Ledger →</button>`})}
  </div>
  <section class="panel mt"><div class="pb" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12.5px">
    <span class="eyebrow">Your data</span><span class="mu" style="flex:1 1 220px">Entries are saved on this device. Export a backup regularly; import it on another device.</span>
    <button class="btn sm" data-act="exportData">Export backup</button><button class="btn sm" data-act="importPick">Import backup</button><button class="btn sm ghost" data-act="resetAsk">Reset to demo data</button>
  </div></section>`;
}
function spendSeries(){
  const exp = TX.filter(isSpend);
  const daily = (from,to) => { const labels=[],values=[]; let d=new Date(from+'T00:00:00Z'); const e=new Date(to+'T00:00:00Z');
    while(d<=e){ const iso=d.toISOString().slice(0,10); labels.push(fdate(iso)); values.push(sum(exp.filter(t=>t.date===iso),t=>t.amount)); d.setUTCDate(d.getUTCDate()+1); } return {labels,values}; };
  const monthly = mks => ({labels:mks.map(ml), values:mks.map(m=>sum(exp.filter(t=>inMonth(t,m)),t=>t.amount))});
  if(S.range==='7D') return {...daily('2026-09-24',TODAY), note:'Daily spend · last 7 days'};
  if(S.range==='30D') return {...daily('2026-09-01',TODAY), note:'Daily spend · last 30 days'};
  if(S.range==='3M') return {...monthly(MK.slice(-3)), note:'Monthly spend · last 3 months'};
  if(S.range==='1Y') return {...monthly(MK), note:'Monthly spend · ledger starts April 2026, so 1Y shows 6 months'};
  if(S.range==='Custom'){ const f=S.from<S.to?S.from:S.to, t=S.from<S.to?S.to:S.from; const days=(new Date(t)-new Date(f))/864e5;
    if(days<=45) return {...daily(f,t), note:`Daily spend · ${fdateY(f)} – ${fdateY(t)}`};
    return {...monthly(MK.filter(m=>m>=f.slice(0,7)&&m<=t.slice(0,7))), note:`Monthly spend · ${fdateY(f)} – ${fdateY(t)}`}; }
  return {...monthly(MK), note:'Monthly spend · April – September 2026'};
}

function ledgerFiltered(){
  const f=S.money; const q=f.q.trim().toLowerCase();
  return TX.filter(t=> (f.type==='All'||t.type===f.type) && (f.cat==='All'||t.cat===f.cat) && (f.month==='All'||inMonth(t,f.month)) &&
    (!q || [t.merchant,t.desc,t.cat,t.sub,t.notes,accName(t.account),t.tags.join(' ')].join(' ').toLowerCase().includes(q)));
}
function vMoney(){
  const m=S.money, s=monthStats(m.sumMonth);
  const head = `<div class="ph1"><div><div class="eyebrow">Money</div><h1>Transactions & cash flow</h1><p>${TX.length} entries across ${ACCOUNTS.length} accounts</p></div>
    ${seg(MK.map(k=>[k,ml(k)]), m.sumMonth, 'sumMonth')}</div>
  <div class="g c5">
    ${tile('Income', sh(s.income), mlong(m.sumMonth),'green')}
    ${tile('Expenses', sh(s.expense), `${delta(s.expense/monthStats(MK[Math.max(0,MK.indexOf(m.sumMonth)-1)]).expense-1,true)} vs prior month`)}
    ${tile('Savings', sh(s.savings), 'After expenses and tax')}
    ${tile('Savings rate', (s.rate*100).toFixed(1)+'%', 'Savings ÷ income', s.rate>=.4?'green':'')}
    ${tile('Cash flow', (s.income-s.expense-s.tax-s.invest-s.debt>=0?'+':'')+sh(s.income-s.expense-s.tax-s.invest-s.debt), 'Net of SIPs & EMIs','cyan')}
  </div>
  <div class="tabs mt" style="margin-top:20px">${[['ledger','Ledger'],['gigs','Side gigs'],['recurring','Recurring'],['accounts','Accounts'],['cats','Categories']].map(([k,l])=>`<button data-act="msub" data-v="${k}" class="${m.sub===k?'on':''}">${l}</button>`).join('')}</div>`;
  let body='';
  if(m.sub==='ledger'){
    const rows=ledgerFiltered(); const cats=[...new Set(TX.map(t=>t.cat))].sort();
    body = `<section class="panel"><div class="fbar">
      <input class="inp grow" id="lq" placeholder="Search merchant, note, tag…" value="${esc(m.q)}" data-bind="mq">
      <select class="inp" id="lt" data-bind="mtype">${['All','Expense','Income','Transfer','Investment','Refund','Tax'].map(o=>`<option ${o===m.type?'selected':''}>${o}</option>`).join('')}</select>
      <select class="inp" id="lc" data-bind="mcat"><option value="All">All categories</option>${cats.map(o=>`<option ${o===m.cat?'selected':''}>${esc(o)}</option>`).join('')}</select>
      <select class="inp" id="lm" data-bind="mmonth"><option value="All">All months</option>${MK.map(o=>`<option value="${o}" ${o===m.month?'selected':''}>${mlong(o)}</option>`).join('')}</select>
      ${(m.q||m.type!=='All'||m.cat!=='All'||m.month!=='All')?`<button class="btn sm ghost" data-act="clearF">Clear</button>`:''}
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px 16px;font-size:12px;color:var(--mut);border-bottom:1px solid var(--line2);flex-wrap:wrap;gap:8px"><span>${rows.length} transactions</span><span class="num">Out ${inr(sum(rows.filter(t=>t.type==='Expense'||t.type==='Tax'),t=>t.amount))} · In <span class="up">${inr(sum(rows.filter(t=>t.type==='Income'||t.type==='Refund'),t=>t.amount))}</span></span></div>
    <div class="tw tmax"><table><thead><tr><th>Date</th><th>Merchant</th><th>Type</th><th>Category</th><th>Account</th><th>Method</th><th class="r">GST</th><th class="r">Amount</th></tr></thead><tbody>
    ${rows.slice(0,250).map(t=>`<tr class="clk" data-act="tx" data-id="${t.id}"><td class="n mu">${fdate(t.date)} <span style="opacity:.6">${t.time}</span></td><td><b style="font-weight:500">${esc(t.merchant)}</b><div class="mu" style="font-size:11.5px">${esc(t.desc)}${t.recurring?' · ↻ recurring':''}${t.attach?' · 📎':''}</div></td><td><span class="pill ${t.type}">${t.type}</span></td><td>${esc(t.cat)}<div class="mu" style="font-size:11.5px">${esc(t.sub)}</div></td><td class="mu">${esc(accName(t.account))}</td><td class="mu">${t.method}</td><td class="r n mu">${t.gstRate?t.gstRate+'%':'—'}</td><td class="r n ${amtCls(t)}">${sign(t)}${inr(t.amount)}</td></tr>`).join('') || `<tr><td colspan="8" class="mu" style="padding:30px;text-align:center">No transactions match these filters.</td></tr>`}
    </tbody></table></div></section>`;
  }
  if(m.sub==='gigs'){
    const rev=sum(GIGS,g=>g.revenue), ex=sum(GIGS,g=>g.expenses), hrs=sum(GIGS,g=>g.hours), paid=sum(GIGS.filter(g=>g.status==='Paid'),g=>g.revenue);
    const inc=sum(MK,mk=>monthStats(mk).income);
    body = `<div class="g c5">${tile('Gig revenue',sh(rev),`${GIGS.length} projects`,'green')}${tile('Gig expenses',sh(ex),'Tools, assets, travel')}${tile('Gig profit',sh(rev-ex),`${((rev-ex)/rev*100).toFixed(1)}% margin`,'gold')}${tile('Effective rate',inr((rev-ex)/hrs)+'/h',`${hrs} hours logged`,'cyan')}${tile('Share of income',(sum(MK,mk=>monthStats(mk).gig)/inc*100).toFixed(1)+'%',`${sh(rev-paid)} awaiting payment`)}</div>
    <div class="g c21 mt">
    <section class="panel"><div class="phd"><h3>Projects</h3><span class="meta">Revenue − expenses = profit</span></div><div class="tw" style="margin-top:10px"><table><thead><tr><th>Date</th><th>Client</th><th>Project</th><th class="r">Revenue</th><th class="r">Expenses</th><th class="r">Profit</th><th class="r">GST @18%</th><th class="r">Hours</th><th class="r">₹/hour</th><th>Status</th></tr></thead><tbody>
    ${GIGS.slice().reverse().map(g=>`<tr><td class="n mu">${fdate(g.date)}</td><td>${esc(g.client)}</td><td class="mu">${esc(g.project)}</td><td class="r n">${inr(g.revenue)}</td><td class="r n mu">${inr(g.expenses)}</td><td class="r n up">${inr(g.revenue-g.expenses)}</td><td class="r n gd">${inr(g.revenue*.18)}</td><td class="r n">${g.hours}</td><td class="r n">${inr((g.revenue-g.expenses)/g.hours)}</td><td><span class="chip ${g.status==='Paid'?'green':'gold'}">${g.status}</span></td></tr>`).join('')}
    </tbody></table></div></section>
    ${panel('Gig revenue by month', chartSlot({kind:'bar',labels:MK.map(ml),values:MK.map(mk=>monthStats(mk).gig),color:'#31D07C',hi:-1},200)+`<div class="mu" style="font-size:12px;margin-top:8px">GST column shows output tax if invoices are GST-registered (mock).</div>`)}
    </div>`;
  }
  if(m.sub==='recurring'){
    const rec={}; TX.filter(t=>t.recurring).forEach(t=>{ (rec[t.merchant]=rec[t.merchant]||{m:t.merchant,cat:t.cat,type:t.type,items:[]}).items.push(t); });
    const list=Object.values(rec).map(r=>{ r.items.sort((a,b)=>a.date.localeCompare(b.date)); r.last=r.items[r.items.length-1].amount; r.first=r.items[0].amount; r.avg=sum(r.items,t=>t.amount)/r.items.length; return r; }).sort((a,b)=>b.last-a.last);
    const outflow=list.filter(r=>r.type!=='Income');
    body = `<div class="g c3">${tile('Recurring outflow / month',sh(sum(outflow,r=>r.last)),`${outflow.length} commitments`)}${tile('Subscriptions + SaaS',sh(sum(outflow.filter(r=>r.cat==='SaaS'||r.cat==='Subscriptions'),r=>r.last)),'per month','gold')}${tile('Annualised',sh(sum(outflow,r=>r.last)*12),'at current amounts')}</div>
    <section class="panel mt"><div class="tw"><table><thead><tr><th>Merchant</th><th>Category</th><th>Type</th><th class="r">First seen</th><th class="r">Latest</th><th class="r">Change</th><th class="r">Usage signal</th></tr></thead><tbody>
    ${list.map(r=>`<tr class="clk" data-act="goLedger" data-f='${JSON.stringify({q:r.m})}'><td>${esc(r.m)}</td><td class="mu">${esc(r.cat)}</td><td><span class="pill ${r.type}">${r.type}</span></td><td class="r n mu">${inr(r.first)}</td><td class="r n">${inr(r.last)}</td><td class="r n">${r.last===r.first?'<span class="mu">—</span>':delta(r.last/r.first-1,true)}</td><td class="r">${SUB_USAGE[r.m]!==undefined?(SUB_USAGE[r.m]>=30?`<span class="chip gold">Unused ${SUB_USAGE[r.m]}d</span>`:'<span class="chip green">Active</span>'):'<span class="mu">—</span>'}</td></tr>`).join('')}
    </tbody></table></div></section>`;
  }
  if(m.sub==='accounts'){
    body = `<div class="g c4">${ACCOUNTS.map(a=>tile(a.name, a.kind==='Credit card'?sh(LIABS.find(l=>l.id==='L2').outstanding):sh(a.bal), `${a.kind} · ${TX.filter(t=>t.account===a.id).length} txns`, a.kind==='Credit card'?'red':'')).join('')}</div>
    <div class="g c2 mt">${panel('Spend by account', hbars(groupBy(TX.filter(isSpend),'account').map(([k,v])=>[accName(k),v])))}${panel('Spend by payment method', hbars(groupBy(TX.filter(isSpend),'method'),{color:'var(--cyan)'}))}</div>`;
  }
  if(m.sub==='cats'){
    body = `<div class="g c2">${panel('Expense categories', Object.entries(EXP_CATS).map(([c,subs])=>`<div class="kv"><span style="color:var(--fg)">${c}</span><span style="text-align:right">${subs.join(' · ')}</span></div>`).join(''), {meta:'Editable in production'})}
    ${panel('Income categories', INC_CATS.map(c=>`<div class="kv"><span style="color:var(--fg)">${c}</span><b>${inr(sum(TX.filter(t=>t.type==='Income'&&t.cat===c),t=>t.amount))}</b></div>`).join(''))}</div>`;
  }
  return head+body;
}

function vTax(){
  const scope = S.tax.month==='All' ? TX.filter(isSpend) : TX.filter(t=>isSpend(t)&&inMonth(t,S.tax.month));
  const taxable = scope.filter(t=>t.gstRate>0);
  const g = taxable.map(t=>({t,...gstOf(t)}));
  const tot=sum(g,x=>x.gst), base=sum(g,x=>x.base), c=sum(g,x=>x.c), s_=sum(g,x=>x.s), i=sum(g,x=>x.i);
  const itc=sum(g.filter(x=>x.t.itc==='Eligible'),x=>x.gst), itcR=sum(g.filter(x=>x.t.itc==='Review'),x=>x.gst);
  const life=sum(TX.filter(isSpend),t=>gstOf(t).gst), mon=sum(TX.filter(t=>isSpend(t)&&inMonth(t,CUR)),t=>gstOf(t).gst);
  const slabs=[0,5,12,18,28,40].map(r=>[r+'%', sum(scope.filter(t=>(+t.gstRate||0)===r),t=>gstOf(t).gst), scope.filter(t=>(+t.gstRate||0)===r).length]);
  const maxSlab=Math.max(...taxable.map(t=>t.gstRate),0);
  const byCat={}; g.forEach(x=>byCat[x.t.cat]=(byCat[x.t.cat]||0)+x.gst);
  const byMer={}; g.forEach(x=>byMer[x.t.merchant]=(byMer[x.t.merchant]||0)+x.gst);
  return `<div class="ph1"><div><div class="eyebrow">Tax Intelligence</div><h1>GST on your spending</h1><p>Estimated from invoice-inclusive amounts · override any classification</p></div>
    ${seg([['All','FY to date'],...MK.map(k=>[k,ml(k)])], S.tax.month, 'taxMonth')}</div>
  <div class="notice">${icon('tax',16)}<div><b style="color:var(--gold);font-weight:500">Mock estimates.</b> Rates here are demo classifications (mostly the 5% and 18% slabs used after the 2025 rate rationalisation). Real figures need current GST notifications, HSN/SAC codes from actual invoices, and review by a qualified accountant.</div></div>
  <div class="g c4">
    ${tile('Lifetime GST estimate', sh(life), `On ${sh(sum(TX.filter(isSpend),t=>t.amount))} of spend`,'gold')}
    ${tile(`GST · ${ml(CUR)}`, sh(mon), `${delta(mon/sum(TX.filter(t=>isSpend(t)&&inMonth(t,PREV)),t=>gstOf(t).gst)-1,true)} vs ${ml(PREV)}`)}
    ${tile('Average GST rate', (base?tot/base*100:0).toFixed(2)+'%', `Effective on all spend ${(tot/sum(scope,t=>t.amount)*100).toFixed(2)}%`)}
    ${tile('Potential ITC', sh(itc), `${sh(itcR)} more under review`,'green')}
    ${tile('CGST', sh(c), 'Intra-state (Tamil Nadu)')}
    ${tile('SGST', sh(s_), 'Intra-state (Tamil Nadu)')}
    ${tile('IGST', sh(i), 'Inter-state & online services','cyan')}
    ${tile('Highest slab used', maxSlab+'%', `${taxable.filter(t=>t.gstRate===maxSlab).length} transactions`)}
  </div>
  <div class="g c21 mt">
    ${panel('Tax timeline', chartSlot({kind:'bar',labels:MK.map(ml),values:MK.map(mk=>sum(TX.filter(t=>isSpend(t)&&inMonth(t,mk)),t=>gstOf(t).gst)),color:'#F4C542',dim:'#4a3d14',hi:S.tax.month==='All'?MK.length-1:MK.indexOf(S.tax.month)},220), {meta:'Estimated GST by month'})}
    ${panel('CGST · SGST · IGST', donut([{label:'CGST',value:c,color:'#F4C542'},{label:'SGST',value:s_,color:'#a88524'},{label:'IGST',value:i,color:'#25D9FF'}].filter(x=>x.value>0),150,sh(tot)))}
  </div>
  <div class="g c3 mt">
    ${panel('GST by category', hbars(Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,8),{color:'var(--gold)',total:tot}))}
    ${panel('GST by merchant', hbars(Object.entries(byMer).sort((a,b)=>b[1]-a[1]).slice(0,8),{color:'var(--gold)'}))}
    ${panel('GST by slab', slabs.map(([r,v,n])=>`<div class="kv"><span>${r} slab <span style="opacity:.7">· ${n} txns</span></span><b class="${v>0?'gd':'mu'}">${n?inr(v):'—'}</b></div>`).join(''), {meta:'Supported slabs'})}
  </div>
  <section class="panel mt"><div class="phd"><h3>Tax ledger</h3><span class="meta">${taxable.length} taxable transactions · change rate or ITC to override AI</span></div>
  <div class="tw tmax" style="margin-top:10px"><table><thead><tr><th>Date</th><th>Transaction</th><th>Merchant</th><th class="r">Base</th><th>Rate</th><th class="r">GST</th><th class="r">CGST</th><th class="r">SGST</th><th class="r">IGST</th><th>ITC</th><th>Source</th></tr></thead><tbody>
  ${g.map(x=>`<tr><td class="n mu">${fdate(x.t.date)}</td><td>${esc(x.t.desc)}</td><td><button class="lnk" style="color:var(--fg);font-size:13px" data-act="tx" data-id="${x.t.id}">${esc(x.t.merchant)}</button></td><td class="r n">${inr(x.base)}</td>
    <td><select class="inp" style="padding:3px 6px;font-size:12px" id="r-${x.t.id}" data-bind="rate" data-id="${x.t.id}">${[0,5,12,18,28,40].map(r=>`<option value="${r}" ${r===+x.t.gstRate?'selected':''}>${r}%</option>`).join('')}</select></td>
    <td class="r n gd">${inr(x.gst)}</td><td class="r n mu">${x.c?inr(x.c):'—'}</td><td class="r n mu">${x.s?inr(x.s):'—'}</td><td class="r n mu">${x.i?inr(x.i):'—'}</td>
    <td><select class="inp" style="padding:3px 6px;font-size:12px" id="i-${x.t.id}" data-bind="itc" data-id="${x.t.id}">${['Eligible','Review','Not eligible'].map(r=>`<option ${r===x.t.itc?'selected':''}>${r}</option>`).join('')}</select></td>
    <td>${x.t.ai?'<span class="chip cyan">AI</span>':'<span class="chip">You</span>'}</td></tr>`).join('')}
  </tbody></table></div></section>`;
}

function vPortfolio(){
  const val=invTotal(), inv=sum(HOLDINGS,hi), un=val-inv, day=sum(HOLDINGS.filter(h=>h.live),h=>h.qty*(h.price-h.prev));
  const cls={}; HOLDINGS.forEach(h=>cls[h.cls]=(cls[h.cls]||0)+hv(h));
  const col={'Equities':'#E50914','ETF':'#25D9FF','Private Equity':'#F5F5F7','Gold':'#F4C542','Mutual Funds':'#31D07C','Cash':'#777781'};
  const alloc=[...Object.entries(cls).map(([k,v])=>({label:k,value:v,color:col[k]})),{label:'Cash',value:cashTotal(),color:'#4b4b55'}];
  const hist=[.862,.887,.905,.938,.968,1].map(f=>val*f);
  return `<div class="ph1"><div><div class="eyebrow">Portfolio</div><h1>Investments & wealth assets</h1><p>Prices from the demo market feed · last refreshed <span id="pts">${S.priceTime||'09:15 IST'}</span></p></div>
    <div style="display:flex;gap:8px"><button class="btn" data-act="refreshPrices">↻ Refresh prices</button><button class="btn pri" data-act="quick" data-type="Investment">${icon('plus',15)} Add investment</button></div></div>
  <div class="g c4">
    ${tile('Portfolio value', sh(val), `${HOLDINGS.length} holdings`)}
    ${tile('Invested capital', sh(inv), 'Cost basis')}
    ${tile('Unrealised gain', (un>=0?'+':'')+sh(un), `<span class="${un>=0?'up':'dn'}">${pct(un/inv)}</span> return`, un>=0?'green':'red')}
    ${tile('Realised gain', '+'+sh(REALIZED.amount), REALIZED.note,'green')}
    ${tile("Today's change", (day>=0?'+':'')+sh(day), 'Listed holdings only', day>=0?'green':'red')}
    ${tile('Return %', pct((un+REALIZED.amount)/inv), 'Total, incl. realised')}
    ${tile('Number of holdings', HOLDINGS.length, `${HOLDINGS.filter(h=>h.live).length} listed · ${HOLDINGS.filter(h=>!h.live).length} private`)}
    ${tile('Largest weight', (Math.max(...HOLDINGS.map(hv))/val*100).toFixed(1)+'%', 'Private equity','gold')}
  </div>
  <div class="g c21 mt">
    ${panel('Portfolio value', chartSlot({kind:'line',labels:MK.map(ml),series:[{values:hist,color:'#25D9FF',area:true,endLabel:true},{values:MK.map((_,k)=>inv*(0.93+k*0.014)),color:'#777781',dash:true}]},230)+`<div class="legend" style="margin-top:6px"><span><i style="background:#25D9FF"></i>Market value</span><span><i style="background:#777781"></i>Invested capital</span></div>`, {meta:'Month-end valuations (demo)'})}
    ${panel('Allocation', donut(alloc,160,sh(val+cashTotal())), {meta:'Incl. cash'})}
  </div>
  <section class="panel mt"><div class="phd"><h3>Holdings</h3><span class="meta">Click a price feed column to see provider data</span></div>
  <div class="tw" style="margin-top:10px"><table><thead><tr><th>Asset</th><th>Ticker</th><th>Class</th><th class="r">Qty</th><th class="r">Avg buy</th><th class="r">Price</th><th class="r">Day</th><th class="r">Invested</th><th class="r">Current</th><th class="r">P/L</th><th class="r">Return</th><th class="r">Alloc.</th><th>Bought</th></tr></thead><tbody>
  ${HOLDINGS.map(h=>{const pl=hv(h)-hi(h), dc=(h.price/h.prev-1);return `<tr><td>${esc(h.name)}${h.note?`<div class="mu" style="font-size:11.5px">${h.note}</div>`:''}</td><td class="n mu">${h.ticker}</td><td><span class="legend"><span><i style="background:${col[h.cls]}"></i>${h.cls}</span></span></td><td class="r n">${h.qty.toLocaleString('en-IN')}</td><td class="r n mu">${inr(h.avg)}</td><td class="r n">${h.live?'₹'+h.price.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}):inr(h.price)}</td><td class="r n">${h.live?`<span class="${dc>=0?'up':'dn'}">${pct(dc,2)}</span>`:'<span class="mu">—</span>'}</td><td class="r n mu">${sh(hi(h))}</td><td class="r n">${sh(hv(h))}</td><td class="r n ${pl>=0?'up':'dn'}">${pl>=0?'+':''}${sh(pl)}</td><td class="r n ${pl>=0?'up':'dn'}">${pct(pl/hi(h))}</td><td class="r n">${(hv(h)/val*100).toFixed(1)}%</td><td class="n mu">${fdateY(h.date)}</td></tr>`}).join('')}
  </tbody></table></div></section>
  <div class="g c2 mt">
    ${panel('Market data provider', `<div class="kv"><span>Provider</span><b>Demo feed (adapter: <span class="cy">MarketDataProvider</span>)</b></div><div class="kv"><span>Fields</span><b>price · prevClose · change · history</b></div><div class="kv"><span>Coverage</span><b>NSE / BSE equities, ETFs, MF NAV, SGB</b></div><div class="kv"><span>Private holdings</span><b>Manual marks</b></div><div class="mu" style="font-size:12px;margin-top:10px">In production, prices come from a swappable provider; nothing in valuation logic depends on a specific vendor.</div>`)}
    ${panel('Wealth assets outside the market', OTHER_ASSETS.map(a=>`<div class="kv"><span>${esc(a.name)} <span style="opacity:.7">· ${a.cls}</span></span><b>${sh(a.value)} <span class="${a.value>=a.cost?'up':'dn'}" style="font-size:11.5px">${pct(a.value/a.cost-1,0)}</span></b></div>`).join(''), {actions:`<button class="lnk" data-act="quick" data-type="Asset">+ Add asset</button>`})}
  </div>`;
}

function vAccounting(){
  const a=S.acct, A=assetsTotal(), L=liabTotal(), E=A-L;
  const tabs=`<div class="tabs">${[['bs','Balance sheet'],['pl','Profit & loss'],['cf','Cash flow'],['assets','Assets'],['liabs','Liabilities'],['journal','Journal']].map(([k,l])=>`<button data-act="asub" data-v="${k}" class="${a.sub===k?'on':''}">${l}</button>`).join('')}</div>`;
  const head=`<div class="ph1"><div><div class="eyebrow">Personal Accounting</div><h1>Your books, double-entry</h1><p>Assets = Liabilities + Equity</p></div>
    ${['pl','cf'].includes(a.sub)?seg(MK.map(k=>[k,ml(k)]),a.month,'acctMonth'):''}</div>
    <div class="eqline"><span>Assets <b class="num">${inr(A)}</b></span><span class="mu">=</span><span>Liabilities <b class="num dn">${inr(L)}</b></span><span class="mu">+</span><span>Equity <b class="num gd">${inr(E)}</b></span><span class="chip green" style="margin-left:auto">Balanced</span></div><div style="height:16px"></div>`+tabs;
  const groups=[
    ['Cash', ACCOUNTS.filter(x=>x.kind==='Cash').map(x=>[x.name,x.bal])],
    ['Bank accounts', ACCOUNTS.filter(x=>x.kind==='Bank account').map(x=>[x.name,x.bal])],
    ['Stocks & ETFs', HOLDINGS.filter(h=>h.cls==='Equities'||h.cls==='ETF').map(h=>[h.name,hv(h)])],
    ['Mutual funds', HOLDINGS.filter(h=>h.cls==='Mutual Funds').map(h=>[h.name,hv(h)])],
    ['Gold', HOLDINGS.filter(h=>h.cls==='Gold').map(h=>[h.name,hv(h)])],
    ['Business equity', HOLDINGS.filter(h=>h.cls==='Private Equity').map(h=>[h.name,hv(h)])],
    ...['Property','Vehicles','Digital Assets','Other Assets'].map(c=>[c, OTHER_ASSETS.filter(x=>x.cls===c).map(x=>[x.name,x.value])])
  ].filter(g=>g[1].length);
  const block=(title,rows,tone='')=>`<div style="margin-bottom:14px"><div class="kv" style="border-bottom:1px solid var(--line)"><span style="color:var(--fg);font-weight:500">${title}</span><b class="${tone}">${inr(sum(rows,r=>r[1]))}</b></div>${rows.map(r=>`<div class="kv" style="padding-left:12px"><span>${esc(r[0])}</span><b style="font-weight:400">${inr(r[1])}</b></div>`).join('')}</div>`;
  if(a.sub==='bs'){
    const lg={}; LIABS.forEach(l=>(lg[l.type]=lg[l.type]||[]).push([l.name,l.outstanding]));
    return head+`<div class="g c2">
      ${panel('Assets', groups.map(g=>block(g[0],g[1])).join('')+`<div class="kv" style="border-top:1px solid var(--line);padding-top:12px"><span style="color:var(--fg);font-weight:600">Total assets</span><b style="font-size:15px">${inr(A)}</b></div>`, {meta:fdateY(TODAY)})}
      <div class="g" style="align-content:start">
      ${panel('Liabilities', Object.entries(lg).map(([k,v])=>block(k,v,'dn')).join('')+`<div class="kv" style="border-top:1px solid var(--line);padding-top:12px"><span style="color:var(--fg);font-weight:600">Total liabilities</span><b class="dn" style="font-size:15px">${inr(L)}</b></div>`)}
      ${panel("Owner's equity", `<div class="kv"><span>Total assets</span><b>${inr(A)}</b></div><div class="kv"><span>Less: total liabilities</span><b class="dn">−${inr(L)}</b></div><div class="kv"><span style="color:var(--fg);font-weight:600">Equity (net worth)</span><b class="gd" style="font-size:18px">${inr(E)}</b></div>
        <div class="stack" style="margin-top:14px;height:14px"><i style="width:${E/A*100}%;background:var(--gold)"></i><i style="width:${L/A*100}%;background:var(--red)"></i></div><div class="legend" style="margin-top:8px"><span><i style="background:var(--gold)"></i>Equity ${(E/A*100).toFixed(1)}%</span><span><i style="background:var(--red)"></i>Liabilities ${(L/A*100).toFixed(1)}%</span></div>`)}
      </div></div>`;
  }
  if(a.sub==='assets'){
    const rows=[...ACCOUNTS.filter(x=>x.kind!=='Credit card').map(x=>({name:x.name,cls:x.kind==='Cash'?'Cash':'Bank Accounts',cost:x.bal,value:x.bal,date:'—',notes:'Live balance'})),
      ...HOLDINGS.map(h=>({name:h.name,cls:h.cls,cost:hi(h),value:hv(h),date:h.date,notes:h.note||h.ticker})), ...OTHER_ASSETS];
    return head+`<section class="panel"><div class="phd"><h3>Asset register</h3><button class="btn sm" data-act="quick" data-type="Asset">${icon('plus',13)} Add asset</button></div><div class="tw" style="margin-top:10px"><table><thead><tr><th>Asset</th><th>Class</th><th class="r">Purchase cost</th><th class="r">Current value</th><th class="r">Change</th><th>Date</th><th>Notes</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td>${esc(r.name)}</td><td class="mu">${esc(r.cls)}</td><td class="r n mu">${inr(r.cost)}</td><td class="r n">${inr(r.value)}</td><td class="r n">${r.cost===r.value?'<span class="mu">—</span>':`<span class="${r.value>=r.cost?'up':'dn'}">${pct(r.value/r.cost-1)}</span>`}</td><td class="n mu">${r.date==='—'?'—':fdateY(r.date)}</td><td class="mu">${esc(r.notes)}</td></tr>`).join('')}
    <tr><td style="font-weight:600">Total</td><td></td><td class="r n">${inr(sum(rows,r=>r.cost))}</td><td class="r n" style="font-weight:600">${inr(sum(rows,r=>r.value))}</td><td></td><td></td><td></td></tr></tbody></table></div></section>`;
  }
  if(a.sub==='liabs'){
    return head+`<section class="panel"><div class="phd"><h3>Liabilities</h3><button class="btn sm" data-act="quick" data-type="Liability">${icon('plus',13)} Add liability</button></div><div class="tw" style="margin-top:10px"><table><thead><tr><th>Liability</th><th>Type</th><th class="r">Outstanding</th><th class="r">Original</th><th>Repaid</th><th class="r">Rate</th><th class="r">Monthly</th><th>Next due</th><th>Remaining</th></tr></thead><tbody>
    ${LIABS.map(l=>`<tr><td>${esc(l.name)}</td><td class="mu">${l.type}</td><td class="r n dn">${inr(l.outstanding)}</td><td class="r n mu">${inr(l.original)}</td><td style="min-width:120px"><div class="meter" style="margin:0"><i style="width:${(1-l.outstanding/l.original)*100}%;background:var(--green)"></i></div><span class="mu" style="font-size:11px">${((1-l.outstanding/l.original)*100).toFixed(0)}%</span></td><td class="r n">${l.rate}%</td><td class="r n">${inr(l.emi)}</td><td class="n">${fdateY(l.due)}</td><td class="mu">${l.term}</td></tr>`).join('')}
    </tbody></table></div></section>
    <div class="g c3 mt">${tile('Total outstanding',sh(L),'','red')}${tile('Monthly obligations',sh(sum(LIABS.filter(l=>l.type!=='Credit Cards'),l=>l.emi)),'EMIs + repayments')}${tile('Debt-to-assets',(L/A*100).toFixed(1)+'%','Healthy below 20%','green')}</div>`;
  }
  if(a.sub==='pl'){
    const pl=mk=>{ const tx=TX.filter(t=>!mk||inMonth(t,mk)); const S_=(f)=>sum(tx.filter(f),t=>t.amount);
      const ops=['Housing','Food','Transportation','Insurance','Healthcare','Education','Business','SaaS'];
      const r={ salary:S_(t=>t.type==='Income'&&t.cat==='Salary'), gig:S_(t=>t.cat==='Side Gig'), invInc:S_(t=>t.type==='Income'&&['Dividends','Interest','Investment Income'].includes(t.cat)),
        opex:S_(t=>isSpend(t)&&ops.includes(t.cat)), other:S_(t=>isSpend(t)&&!ops.includes(t.cat))-S_(t=>t.type==='Refund'), tax:S_(t=>t.type==='Tax') };
      r.income=r.salary+r.gig; r.net=r.income+r.invInc-r.opex-r.other-r.tax; return r; };
    const idx=MK.indexOf(a.month), c=pl(a.month), p=idx>0?pl(MK[idx-1]):null, y=pl(null);
    const line=(l,k,neg=false,bold=false)=>`<tr${bold?' style="font-weight:600"':''}><td${bold?'':' style="padding-left:24px"'}>${l}</td><td class="r n">${neg?'−':''}${inr(c[k])}</td><td class="r n mu">${p?(neg?'−':'')+inr(p[k]):'—'}</td><td class="r n">${p&&p[k]?delta(c[k]/p[k]-1,neg):'—'}</td><td class="r n mu">${neg?'−':''}${inr(y[k])}</td></tr>`;
    return head+`<section class="panel"><div class="tw"><table><thead><tr><th>Profit & loss</th><th class="r">${mlong(a.month)}</th><th class="r">${p?mlong(MK[idx-1]):'Prior'}</th><th class="r">Change</th><th class="r">FY to date</th></tr></thead><tbody>
    <tr><td colspan="5" class="eyebrow" style="padding-top:16px">Income</td></tr>${line('Salary','salary')}${line('Side gigs','gig')}${line('Total operating income','income',false,true)}
    <tr><td colspan="5" class="eyebrow" style="padding-top:16px">Expenses</td></tr>${line('Operating expenses (housing, food, transport, SaaS…)','opex',true)}${line('Other expenses (dining, shopping, travel…)','other',true)}
    <tr><td colspan="5" class="eyebrow" style="padding-top:16px">Other</td></tr>${line('Investment income','invInc')}${line('Taxes','tax',true)}
    <tr style="font-weight:600;font-size:14px"><td>Net result</td><td class="r n ${c.net>=0?'up':'dn'}">${inr(c.net)}</td><td class="r n mu">${p?inr(p.net):'—'}</td><td class="r n">${p?delta(c.net/p.net-1):'—'}</td><td class="r n ${y.net>=0?'up':'dn'}">${inr(y.net)}</td></tr>
    </tbody></table></div></section>
    ${panel('Net result by month', chartSlot({kind:'bar',labels:MK.map(ml),values:MK.map(mk=>Math.max(0,pl(mk).net)),color:'#31D07C',dim:'#123d27',hi:idx},200),{cls:'mt'})}`;
  }
  if(a.sub==='cf'){
    const cf=mk=>{ const tx=TX.filter(t=>!mk||inMonth(t,mk)); const S_=f=>sum(tx.filter(f),t=>t.amount);
      const op=S_(t=>t.type==='Income')+S_(t=>t.type==='Refund')-S_(isSpend)-S_(t=>t.type==='Tax'); const inv=-S_(t=>t.type==='Investment'); const fin=-S_(t=>t.type==='Transfer'&&t.cat==='Loan repayment');
      return {op,inv,fin,net:op+inv+fin}; };
    const c=cf(a.month), y=cf(null);
    const line=(l,k,d)=>`<tr><td>${l}<div class="mu" style="font-size:11.5px">${d}</div></td><td class="r n ${c[k]>=0?'up':'dn'}">${c[k]>=0?'+':''}${inr(c[k])}</td><td class="r n ${y[k]>=0?'up':'dn'}">${y[k]>=0?'+':''}${inr(y[k])}</td></tr>`;
    return head+`<div class="g c21"><section class="panel"><div class="tw"><table><thead><tr><th>Cash flow statement</th><th class="r">${mlong(a.month)}</th><th class="r">FY to date</th></tr></thead><tbody>
      ${line('Operating cash flow','op','Income + refunds − expenses − taxes')}${line('Investing cash flow','inv','SIPs, ETF and stock purchases')}${line('Financing cash flow','fin','Loan EMIs and debt repayment')}
      <tr style="font-weight:600;font-size:14px"><td>Net cash movement</td><td class="r n ${c.net>=0?'up':'dn'}">${c.net>=0?'+':''}${inr(c.net)}</td><td class="r n ${y.net>=0?'up':'dn'}">${y.net>=0?'+':''}${inr(y.net)}</td></tr></tbody></table></div></section>
      ${panel('Where the cash went · '+ml(a.month), hbars([['Operating',Math.abs(c.op)],['Investing',Math.abs(c.inv)],['Financing',Math.abs(c.fin)]],{color:'var(--cyan)'})+`<div class="mu" style="font-size:12px;margin-top:10px">Self-transfers between your own accounts are excluded.</div>`)}</div>`;
  }
  if(a.sub==='journal'){
    const je=t=>{ const acc='Asset:'+accName(t.account);
      if(t.type==='Expense') return [`Expense:${t.cat}`,acc]; if(t.type==='Income') return [acc,`Income:${t.cat}`]; if(t.type==='Refund') return [acc,`Expense:${t.cat}`];
      if(t.type==='Investment') return ['Asset:Investments',acc]; if(t.type==='Tax') return ['Expense:Taxes',acc];
      if(t.cat==='Loan repayment') return [`Liability:${t.sub}`,acc]; return ['Asset:HDFC Savings',acc]; };
    return head+`<section class="panel"><div class="phd"><h3>General journal</h3><span class="meta">Latest 30 entries · every entry debits and credits the same amount</span></div><div class="tw" style="margin-top:10px"><table><thead><tr><th>Date</th><th>Ref</th><th>Narration</th><th>Account</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>
    ${TX.slice(0,30).map(t=>{const [dr,cr]=je(t); return `<tr><td class="n mu" rowspan="2">${fdate(t.date)}</td><td class="n mu" rowspan="2">${t.id}</td><td rowspan="2">${esc(t.merchant)}<div class="mu" style="font-size:11.5px">${esc(t.desc)}</div></td><td>${esc(dr)}</td><td class="r n">${inr(t.amount)}</td><td></td></tr><tr><td style="padding-left:28px" class="mu">${esc(cr)}</td><td></td><td class="r n">${inr(t.amount)}</td></tr>`}).join('')}
    </tbody></table></div></section>`;
  }
  return head;
}

function vAnalytics(){
  const an=S.an; const per = an.period==='3M'?MK.slice(-3):an.period==='1M'?[CUR]:MK;
  const base=TX.filter(t=>isSpend(t)&&per.some(mk=>inMonth(t,mk)));
  const total=sum(base,t=>t.amount);
  let lvl=base, crumbs=[`<button data-act="drill" data-l="0">All categories</button>`], view='';
  if(an.cat){ lvl=lvl.filter(t=>t.cat===an.cat); crumbs.push(`<span class="mu">/</span><button data-act="drill" data-l="1">${esc(an.cat)}</button>`); }
  if(an.sub){ lvl=lvl.filter(t=>t.sub===an.sub); crumbs.push(`<span class="mu">/</span><button data-act="drill" data-l="2">${esc(an.sub)}</button>`); }
  if(an.merchant){ lvl=lvl.filter(t=>t.merchant===an.merchant); crumbs.push(`<span class="mu">/</span><span>${esc(an.merchant)}</span>`); }
  const lt=sum(lvl,t=>t.amount);
  if(!an.cat) view=hbars(groupBy(lvl,'cat'),{act:'dcat',total:lt});
  else if(!an.sub) view=hbars(groupBy(lvl,'sub'),{act:'dsub',total:lt,color:'#ff5a62'});
  else if(!an.merchant) view=hbars(groupBy(lvl,'merchant'),{act:'dmer',total:lt,color:'#ff8a8f'});
  else view=lvl.map(txRow).join('');
  // trends
  const catM=(c,mk)=>sum(TX.filter(t=>isSpend(t)&&t.cat===c&&inMonth(t,mk)),t=>t.amount);
  const cats=[...new Set(TX.filter(isSpend).map(t=>t.cat))].sort((a,b)=>catM(b,CUR)-catM(a,CUR));
  const avg=(c,mks)=>sum(mks,m=>catM(c,m))/mks.length;
  // health
  const s6=MK.map(monthStats), sr=sum(s6,x=>x.savings)/sum(s6,x=>x.income), A=assetsTotal(), L=liabTotal();
  const avgExp=sum(s6,x=>x.expense)/6, liq=cashTotal()/avgExp, invShare=invTotal()/A, pos=s6.filter(x=>x.savings>0).length/6;
  const mean=avgExp, sd=Math.sqrt(sum(s6,x=>(x.expense-mean)**2)/6), cv=sd/mean;
  const comps=[
    ['Savings rate', `${(sr*100).toFixed(1)}%`, 'Target ≥ 40%', Math.min(1,sr/.4), 25],
    ['Debt-to-assets', `${(L/A*100).toFixed(1)}%`, 'Lower is better; 40% scores 0', Math.max(0,1-(L/A)/.4), 20],
    ['Emergency liquidity', `${liq.toFixed(1)} months`, 'Cash ÷ avg monthly expense; target 6', Math.min(1,liq/6), 20],
    ['Investment allocation', `${(invShare*100).toFixed(1)}%`, 'Investments ÷ assets; target 40%', Math.min(1,invShare/.4), 15],
    ['Cash-flow consistency', `${Math.round(pos*6)}/6 months`, 'Months with positive savings', pos, 10],
    ['Expense volatility', `CV ${(cv*100).toFixed(0)}%`, 'Std-dev ÷ mean; 50% scores 0', Math.max(0,1-cv/.5), 10]
  ];
  const score=Math.round(sum(comps,c=>c[3]*c[4]));
  return `<div class="ph1"><div><div class="eyebrow">Analytics</div><h1>Patterns in your spending</h1><p>${base.length} expense transactions · ${sh(total)}</p></div>${seg([['1M','This month'],['3M','3 months'],['6M','6 months']],an.period,'anPer')}</div>
  <section class="panel ai" style="margin-bottom:14px"><div class="pb" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <span class="cy" style="display:flex">${icon('ai',16)}</span>
    <input class="inp" style="flex:1 1 260px" id="anq" placeholder="Ask: How much did I spend on food in the last 6 months?" value="${esc(an.q)}" data-bind="anq" data-enter="anAsk">
    <button class="btn" data-act="anAsk">Analyse</button>
    <div style="display:flex;gap:6px;flex-wrap:wrap;width:100%">${['How much did I spend on food in the last 6 months?','Which subscriptions increased?','How much GST did I pay last month?','What percentage of my income came from side gigs?','How much did my net worth change?'].map(q=>`<button class="chip" style="cursor:pointer" data-act="anAsk" data-q="${esc(q)}">${q}</button>`).join('')}</div>
    ${an.answer?`<div class="msg a" style="max-width:100%;margin-top:6px"><div class="who">Artha AI</div>${an.answer.html}${refs(an.answer.refs)}</div>`:''}
  </div></section>
  <div class="g c21">
    ${panel('Spending by category', `<div class="crumbs">${crumbs.join('')}</div>${view}`, {meta:'Click to drill down: category → subcategory → merchant → transactions'})}
    ${panel('Spending by month', chartSlot({kind:'bar',labels:MK.map(ml),values:MK.map(mk=>sum(TX.filter(t=>isSpend(t)&&inMonth(t,mk)&&(!an.cat||t.cat===an.cat)),t=>t.amount)),hi:MK.length-1},200)+`<div class="mu" style="font-size:12px;margin-top:6px">${an.cat?esc(an.cat)+' only':'All categories'}</div>`)}
  </div>
  <div class="g c3 mt">
    ${panel('Top merchants', hbars(groupBy(base,'merchant').slice(0,8)))}
    ${panel('By payment method', hbars(groupBy(base,'method'),{color:'var(--cyan)',total}))}
    ${panel('By account', hbars(groupBy(base,'account').map(([k,v])=>[accName(k),v]),{color:'var(--cyan)',total}))}
  </div>
  <section class="panel mt"><div class="phd"><h3>Trend analysis</h3><span class="meta">${ml(CUR)} compared with earlier periods</span></div><div class="tw" style="margin-top:10px"><table><thead><tr><th>Category</th><th class="r">This month</th><th class="r">Last month</th><th class="r">vs last</th><th class="r">3-mo avg</th><th class="r">vs 3-mo</th><th class="r">6-mo avg</th><th class="r">vs 6-mo</th><th class="r">vs last year</th></tr></thead><tbody>
  ${cats.map(c=>{const n=catM(c,CUR),l=catM(c,PREV),a3=avg(c,MK.slice(2,5)),a6=avg(c,MK);const d=(x,y)=>y?delta(x/y-1,true):'<span class="mu">new</span>';return `<tr class="clk" data-act="dcatTop" data-v="${esc(c)}"><td>${esc(c)}</td><td class="r n">${inr(n)}</td><td class="r n mu">${inr(l)}</td><td class="r n">${d(n,l)}</td><td class="r n mu">${inr(a3)}</td><td class="r n">${d(n,a3)}</td><td class="r n mu">${inr(a6)}</td><td class="r n">${d(n,a6)}</td><td class="r mu">no data</td></tr>`}).join('')}
  </tbody></table></div><div class="mu" style="font-size:12px;padding:0 16px 14px">Year-on-year comparison becomes available once the ledger has 12+ months (starts April 2026).</div></section>
  <section class="panel mt"><div class="phd"><h3>Financial health</h3><span class="meta">Transparent, weighted score · weights are configurable</span></div><div class="pb">
    <div class="g c12" style="align-items:center;gap:24px"><div><div class="score num ${score>=70?'up':score>=50?'gd':'dn'}">${score}<span class="mu" style="font-size:20px">/100</span></div><div class="mu" style="margin-top:8px;font-size:12.5px">Σ (component score × weight). Each component scales 0–1 against its stated target.</div></div>
    <div class="tw"><table><thead><tr><th>Metric</th><th class="r">Value</th><th>Rule</th><th class="r">Score</th><th class="r">Weight</th><th class="r">Points</th></tr></thead><tbody>
    ${comps.map(c=>`<tr><td>${c[0]}</td><td class="r n">${c[1]}</td><td class="mu">${c[2]}</td><td class="r n">${(c[3]*100).toFixed(0)}%</td><td class="r n mu">${c[4]}</td><td class="r n">${(c[3]*c[4]).toFixed(1)}</td></tr>`).join('')}
    </tbody></table></div></div></div></section>`;
}
