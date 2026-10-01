/* =========================================================
   ARTHA — assistant: turns a question into a calculation.
   It never invents numbers; every figure comes from the ledger.
   ========================================================= */
function periodOf(q,def){
  if(/last month|previous month/.test(q)) return {mks:[PREV],label:mlong(PREV)};
  if(/this month|current month/.test(q)) return {mks:[CUR],label:mlong(CUR)};
  if(/(3|three) months|quarter/.test(q)) return {mks:MK.slice(-3),label:'the last 3 months'};
  if(/last year/.test(q)) { const y=[-23,-22,-21,-20,-19,-18,-17,-16,-15,-14,-13,-12].map(monthKey); return {mks:y,label:'the same months last year',none:!TX.some(t=>y.some(m=>inMonth(t,m)))}; }
  if(/(6|six) months|this year|year|fy|ytd|ever|total|lifetime|so far/.test(q)) return {mks:MK,label:P6()};
  return def==='cur'?{mks:[CUR],label:mlong(CUR)}:{mks:MK,label:P6()};
}
const CATMAP = {food:['Food','Dining'],grocer:['Food'],dining:['Dining'],restaurant:['Dining'],swiggy:['Dining'],zomato:['Dining'],travel:['Travel'],flight:['Travel'],hotel:['Travel'],housing:['Housing'],rent:['Housing'],electric:['Housing'],shopping:['Shopping'],amazon:['Shopping'],saas:['SaaS'],software:['SaaS'],electronic:['Electronics'],gadget:['Electronics'],transport:['Transportation'],fuel:['Transportation'],petrol:['Transportation'],cab:['Transportation'],health:['Healthcare'],medic:['Healthcare'],entertainment:['Entertainment'],movie:['Entertainment'],education:['Education'],course:['Education'],insurance:['Insurance'],business:['Business']};
function ask(raw){
  const q=raw.toLowerCase(); const r=(html,refs=[])=>({html,refs});
  const inP=(p)=>TX.filter(t=>p.mks.some(mk=>inMonth(t,mk)));
  const noData = 'There are no entries in that period yet, so there is nothing to calculate.';
  if(/net ?worth|worth/.test(q)){
    const nw=netWorth(), keys=Object.keys(SNAP).filter(k=>k<CUR).sort(), last=keys[keys.length-1], first=keys[0];
    let ch=''; if(last) ch+=` It changed <b class="num ${nw>=SNAP[last]?'up':'dn'}">${nw>=SNAP[last]?'+':'−'}${sh(Math.abs(nw-SNAP[last]))}</b> since ${mlong(last)}`;
    if(first && first!==last) ch+=` and <b class="num">${pct(SNAP[first]?nw/SNAP[first]-1:NaN)}</b> since ${mlong(first)}`;
    return r(`Your net worth is <b class="num">${inr(nw)}</b> (${sh(assetsTotal())} assets − ${sh(liabTotal())} liabilities).${ch?ch+'.':' History builds up month by month from today.'}`,[{label:'Balance sheet',tab:'accounting',sub:'bs'},{label:'Command Center',tab:'cc'}]);
  }
  if(/\bcash\b|balance|bank/.test(q) && !/cash ?flow/.test(q)){ const avgE=avgMonthlyExpense();
    return r(`You hold <b class="num">${inr(cashTotal())}</b> in cash and bank: ${cashAccounts().map(a=>`${esc(a.name)} ${sh(a.bal)}`).join(', ')||'no accounts yet'}.${avgE?` That covers about <b class="num">${(cashTotal()/avgE).toFixed(1)} months</b> of average spending.`:''}`,[{label:'Accounts',tab:'money',sub:'accounts'}]); }
  if(/gst|tax/.test(q)){
    const p=periodOf(q,'all'); if(p.none) return r('Your ledger has no entries from last year, so there is no GST to report for it yet.');
    const tx=inP(p).filter(isSpend); if(!tx.length) return r(noData);
    const g=tx.map(gstOf), tot=sum(g,x=>x.gst); const top=Object.entries(tx.reduce((m,t)=>(m[t.cat]=(m[t.cat]||0)+gstOf(t).gst,m),{})).sort((a,b)=>b[1]-a[1])[0];
    const it=sum(inP(p).filter(t=>t.type==='Tax'),t=>t.amount);
    return r(`Estimated GST paid in ${p.label}: <b class="num gd">${inr(tot)}</b> (CGST ${sh(sum(g,x=>x.c))}, SGST ${sh(sum(g,x=>x.s))}, IGST ${sh(sum(g,x=>x.i))}).${top&&top[1]>0?` Largest share: <b>${top[0]}</b> at ${sh(top[1])}.`:''}${it?` Income-tax payments in the same period: <b class="num">${inr(it)}</b>.`:''} <span class="mu">Estimate.</span>`,[{label:'Tax ledger',tab:'tax',taxMonth:p.mks.length===1?p.mks[0]:'All'}]);
  }
  if(/side ?gig|freelanc|client|gig/.test(q)){
    const p=periodOf(q,'all'); const tx=inP(p); const gig=sum(tx.filter(t=>t.cat==='Side Gig'),t=>t.amount), inc=sum(tx.filter(t=>t.type==='Income'),t=>t.amount);
    if(!inc) return r(noData);
    const unpaid=sum(GIGS.filter(g=>g.status!=='Paid'),g=>g.revenue);
    return r(`Side gigs brought in <b class="num up">${inr(gig)}</b> in ${p.label}, which is <b class="num">${pcs(gig,inc)}</b> of your total income (${sh(inc)}).${unpaid?` Another ${sh(unpaid)} is invoiced and unpaid.`:''}`,[{label:'Gig income',f:{cat:'Side Gig'}},{label:'Side gig tracker',tab:'money',sub:'gigs'}]);
  }
  if(/subscription|saas/.test(q)){
    const cats=/saas/.test(q)?['SaaS']:['Subscriptions','SaaS'];
    if(/increas|rise|went up|grow|hike/.test(q)){
      const by={}; TX.filter(t=>cats.includes(t.cat)).forEach(t=>(by[t.merchant]=by[t.merchant]||[]).push(t));
      const up=Object.entries(by).map(([m,a])=>{a.sort((x,y)=>x.date.localeCompare(y.date));return [m,a[0].amount,a[a.length-1].amount]}).filter(x=>x[2]>x[1]);
      return r(up.length?`${up.length} recurring tool${up.length>1?'s':''} increased: ${up.map(x=>`<b>${esc(x[0])}</b> ${inr(x[1])} → ${inr(x[2])} (${pct(x[2]/x[1]-1,0)})`).join('; ')}.`:'None of your subscriptions has gone up in price.',up.map(x=>({label:x[0],f:{q:x[0]}})));
    }
    const p=periodOf(q,'cur'); const tx=inP(p).filter(t=>cats.includes(t.cat)); const g=groupBy(tx,'merchant');
    if(!tx.length) return r(`No ${cats.join(' or ')} payments in ${p.label}.`);
    return r(`You spent <b class="num">${inr(sum(tx,t=>t.amount))}</b> on ${cats.join(' and ')} in ${p.label}. Biggest: ${g.slice(0,4).map(x=>`${esc(x[0])} ${sh(x[1])}`).join(', ')}.`,[{label:'Subscriptions',f:{cat:'Subscriptions'}},{label:'SaaS',f:{cat:'SaaS'}},{label:'Recurring',tab:'money',sub:'recurring'}]);
  }
  if(/recurring|emi|commitment/.test(q)){
    const rec={}; TX.filter(t=>t.recurring&&t.type!=='Income').forEach(t=>{ if(!rec[t.merchant]||rec[t.merchant].date<t.date) rec[t.merchant]=t; });
    const top=Object.values(rec).sort((a,b)=>b.amount-a.amount).slice(0,5);
    if(!top.length) return r('No recurring payments are marked yet. Tick “Repeats monthly” when you log rent, EMIs or subscriptions.');
    return r(`Your biggest recurring commitments: ${top.map(x=>`<b>${esc(x.merchant)}</b> ${inr(x.amount)}`).join(', ')}. Together <b class="num">${inr(sum(Object.values(rec),t=>t.amount))}</b> a month.`,[{label:'Recurring view',tab:'money',sub:'recurring'}]);
  }
  if(/portfolio|invest|stock|holding|mutual|share/.test(q)){
    if(!HOLDINGS.length) return r('You have no investments recorded yet. Add one from Portfolio → Add investment.',[{label:'Portfolio',tab:'portfolio'}]);
    const val=invTotal(), inv=sum(HOLDINGS,hi), best=HOLDINGS.slice().sort((a,b)=>ratio(hv(b),hi(b))-ratio(hv(a),hi(a)))[0];
    return r(`Your portfolio is worth <b class="num">${inr(val)}</b> against <b class="num">${inr(inv)}</b> invested: ${val>=inv?'a gain':'a loss'} of <b class="num ${val>=inv?'up':'dn'}">${inr(Math.abs(val-inv))}</b> (${pct(ratio(val,inv)-1)}). Best performer: <b>${esc(best.name)}</b> at ${pct(ratio(hv(best),hi(best))-1)}.`,[{label:'Holdings',tab:'portfolio'}]);
  }
  if(/highest|biggest|largest|most expensive/.test(q) && /expense|spend|purchase|bought|payment/.test(q)){
    const p=periodOf(q,'all'); const t=inP(p).filter(isSpend).sort((a,b)=>b.amount-a.amount)[0];
    return t?r(`Your highest expense in ${p.label} was <b>${esc(t.merchant)}</b> (${esc(t.desc)}) for <b class="num">${inr(t.amount)}</b> on ${fdateY(t.date)}, filed under ${t.cat}.`,[{label:'Open transaction',tx:t.id}]):r(noData);
  }
  if(/change|what happened|differ|compare/.test(q)){
    const c=monthStats(CUR), p=monthStats(PREV); if(!c.income&&!c.expense&&!p.income&&!p.expense) return r(noData);
    const mv=Object.keys(EXP_CATS).map(k=>[k,sum(TX.filter(t=>isSpend(t)&&t.cat===k&&inMonth(t,CUR)),t=>t.amount)-sum(TX.filter(t=>isSpend(t)&&t.cat===k&&inMonth(t,PREV)),t=>t.amount)]).filter(x=>x[1]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3);
    return r(`Compared with ${mlong(PREV)}: income is <b class="num">${sh(c.income)}</b> (${pct(p.income?c.income/p.income-1:NaN)}), expenses are <b class="num">${sh(c.expense)}</b> (${pct(p.expense?c.expense/p.expense-1:NaN)}), and your savings rate is <b class="num">${c.income?(c.rate*100).toFixed(1)+'%':'—'}</b> vs ${p.income?(p.rate*100).toFixed(1)+'%':'—'}.${mv.length?` Biggest category moves: ${mv.map(x=>`${x[0]} ${x[1]>=0?'+':'−'}${sh(Math.abs(x[1]))}`).join(', ')}.`:''} <span class="mu">${ml(CUR)} is still in progress.</span>`,[{label:'P&L comparison',tab:'accounting',sub:'pl'},{label:`${ml(CUR)} ledger`,f:{month:CUR}}]);
  }
  for(const k in CATMAP){ if(q.includes(k)){
    const cats=CATMAP[k], p=periodOf(q,'all'); const tx=inP(p).filter(t=>isSpend(t)&&cats.includes(t.cat));
    if(!tx.length) return r(`No ${cats.join(' or ')} expenses in ${p.label}.`);
    const per=p.mks.map(mk=>[ml(mk),sum(tx.filter(t=>inMonth(t,mk)),t=>t.amount)]);
    return r(`You spent <b class="num">${inr(sum(tx,t=>t.amount))}</b> on ${cats.join(' + ')} in ${p.label} across ${tx.length} transactions.${per.length>1?`<table class="mini-t"><tbody>${per.map(x=>`<tr><td class="mu">${x[0]}</td><td class="num">${inr(x[1])}</td></tr>`).join('')}</tbody></table>`:''}`, cats.map(c=>({label:`${c} transactions`,f:{cat:c,month:p.mks.length===1?p.mks[0]:'All'}})));
  }}
  if(/spen|most|where|expense/.test(q)){
    const p=periodOf(q,'cur'); const tx=inP(p); const c=spendByCat(tx), m=groupBy(tx.filter(isSpend),'merchant');
    if(!c.length) return r(`No expenses in ${p.label} yet.`);
    return r(`In ${p.label} you spent <b class="num">${inr(sum(c,x=>x[1]))}</b>, most on <b>${c[0][0]}</b> (${inr(c[0][1])})${c[1]?`, then ${c[1][0]} (${sh(c[1][1])})`:''}${c[2]?` and ${c[2][0]} (${sh(c[2][1])})`:''}. Top merchant: <b>${esc(m[0][0])}</b> at ${inr(m[0][1])}.`,[{label:`${c[0][0]} transactions`,f:{cat:c[0][0],month:p.mks.length===1?p.mks[0]:'All'}},{label:'Category drill-down',tab:'analytics'}]);
  }
  if(/income|earn|salary/.test(q)){ const p=periodOf(q,'cur'); const tx=inP(p).filter(t=>t.type==='Income'); if(!tx.length) return r(`No income recorded in ${p.label}.`); const g=groupBy(tx,'cat');
    return r(`Income in ${p.label}: <b class="num up">${inr(sum(tx,t=>t.amount))}</b>, from ${g.map(x=>`${x[0]} ${sh(x[1])}`).join(', ')}.`,[{label:'Income transactions',f:{type:'Income',month:p.mks.length===1?p.mks[0]:'All'}}]); }
  if(/sav/.test(q)){ const p=periodOf(q,'cur'); const inc=sum(p.mks,m=>monthStats(m).income), sv=sum(p.mks,m=>monthStats(m).savings); if(!inc) return r(noData);
    return r(`In ${p.label} you saved <b class="num">${inr(sv)}</b>, a savings rate of <b class="num">${pcs(sv,inc)}</b>.`,[{label:'Money summary',tab:'money'}]); }
  if(/debt|loan|owe|liabilit/.test(q)){ const L=allLiabs(); if(!L.length) return r('You have no loans or card balances recorded.');
    return r(`You owe <b class="num dn">${inr(liabTotal())}</b> in total: ${L.map(l=>`${esc(l.name)} ${sh(l.outstanding)}`).join(', ')}. Debt-to-assets is <b class="num">${pcs(liabTotal(),assetsTotal())}</b>.`,[{label:'Liabilities',tab:'accounting',sub:'liabs'}]); }
  return r(`I answer from your own records. Try asking about spending in a category, subscriptions, GST, net worth, cash, loans, side gigs, your portfolio, or what changed this month.`);
}
function refs(list){ if(!list||!list.length) return ''; return `<div class="refs">${list.map(x=>`<button class="ref" data-act="ref" data-r="${esc(JSON.stringify(x))}">${esc(x.label)} →</button>`).join('')}</div>`; }

function vAI(){
  if(!S.chat.length){ const s=monthStats(CUR);
    S.chat.push({role:'a', html: TX.length||ACCOUNTS.some(a=>a.bal) ? `Here is ${mlong(CUR)} so far: income <b class="num up">${sh(s.income)}</b>, expenses <b class="num">${sh(s.expense)}</b>, savings rate <b class="num">${s.income?(s.rate*100).toFixed(1)+'%':'—'}</b>, net worth <b class="num gd">${sh(netWorth())}</b>. Ask me anything about your money; every number comes from your records.` : `Your ledger is empty. Add balances and a few entries, then ask me where your money goes. I only answer from your own records.`, refs:[{label:'Command Center',tab:'cc'}]}); }
  const ins=insights(), al=alerts(), s=monthStats(CUR);
  const sugg=['Where did I spend the most this month?','How much did I spend on subscriptions?','What was my highest expense this year?','How much GST did I pay last month?','What is my current net worth?','How much income came from side gigs?','What changed in my finances this month?','Show me my biggest recurring expenses.','How much did my portfolio grow?','How much cash do I have?'];
  return `<div class="ph1"><div><div class="eyebrow">Artha AI</div><h1>Your financial analyst</h1><p>Answers are calculated from your ledger, with links to the records behind them</p></div></div>
  <div class="g c21">
    <section class="panel ai chat"><div class="msgs" id="msgs">${S.chat.map(m=>m.role==='u'?`<div class="msg u">${esc(m.text)}</div>`:`<div class="msg a"><div class="who">Artha</div>${m.html}${refs(m.refs)}</div>`).join('')}</div>
      <div class="sugg">${sugg.map(q=>`<button data-act="chatQ" data-q="${esc(q)}">${q}</button>`).join('')}</div>
      <form class="cbar" id="chatForm"><input class="inp" id="chatIn" placeholder="Ask about spending, GST, portfolio, net worth…" autocomplete="off"><button class="btn pri" type="submit">Ask</button></form></section>
    <div class="g" style="align-content:start">
      ${panel(`${icon('ai',15)} Proactive insights`, insList(ins),{cls:'ai'})}
      ${panel('Alerts', al.length?al.map((a,i)=>`<div class="ins clk" data-act="alert" data-i="${i}"><i style="background:var(--${a.tone})"></i><p>${esc(a.t)}<small>${esc(a.d)}</small></p></div>`).join(''):empty('No alerts right now.'))}
      ${panel(`Summary · ${ml(CUR)}`, `<div class="kv"><span>Income</span><b class="up">${inr(s.income)}</b></div><div class="kv"><span>Expenses</span><b>${inr(s.expense)}</b></div><div class="kv"><span>Taxes paid</span><b>${inr(s.tax)}</b></div><div class="kv"><span>Invested</span><b class="cy">${inr(s.invest)}</b></div><div class="kv"><span>Debt repaid</span><b>${inr(s.debt)}</b></div><div class="kv"><span>GST (est.)</span><b class="gd">${inr(s.gst)}</b></div>`)}
    </div>
  </div>`;
}
