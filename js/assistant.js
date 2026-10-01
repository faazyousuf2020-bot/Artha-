/* ---------- Artha AI engine (computes from the ledger, never invents numbers) ---------- */
function periodOf(q,def){
  if(/last month/.test(q)) return {mks:[PREV],label:mlong(PREV)};
  if(/this month|current month/.test(q)) return {mks:[CUR],label:mlong(CUR)};
  if(/(3|three) months/.test(q)) return {mks:MK.slice(-3),label:'the last 3 months'};
  if(/last year/.test(q)) return {mks:[],label:'last year',none:true};
  if(/(6|six) months|this year|year|fy|ytd|ever|total|lifetime/.test(q)) return {mks:MK,label:'April–September 2026'};
  return def==='cur'?{mks:[CUR],label:mlong(CUR)}:{mks:MK,label:'April–September 2026'};
}
const CATMAP = {food:['Food','Dining'],grocer:['Food'],dining:['Dining'],restaurant:['Dining'],travel:['Travel'],housing:['Housing'],rent:['Housing'],shopping:['Shopping'],saas:['SaaS'],software:['SaaS'],electronic:['Electronics'],transport:['Transportation'],fuel:['Transportation'],health:['Healthcare'],entertainment:['Entertainment'],education:['Education'],insurance:['Insurance']};
function ask(raw){
  const q=raw.toLowerCase(); const r=(html,refs=[])=>({html,refs});
  const inP=(p)=>TX.filter(t=>p.mks.some(mk=>inMonth(t,mk)));
  if(/net ?worth/.test(q)){
    const nw=netWorth(), jan=NW_HISTORY[0][1], aug=NW_HISTORY[NW_HISTORY.length-1][1];
    return r(`Your net worth is <b class="num">${inr(nw)}</b> (${sh(assetsTotal())} assets − ${sh(liabTotal())} liabilities). It changed <b class="num up">+${sh(nw-aug)}</b> since August and <b class="num up">+${sh(nw-jan)}</b> (${pct(nw/jan-1)}) since January.`,[{label:'Balance sheet',tab:'accounting'},{label:'Command Center',tab:'cc'}]);
  }
  if(/\bcash\b/.test(q) && !/cash ?flow/.test(q)) return r(`You hold <b class="num">${inr(cashTotal())}</b> in cash: ${ACCOUNTS.filter(a=>a.kind!=='Credit card').map(a=>`${a.name} ${sh(a.bal)}`).join(', ')}. That covers about <b class="num">${(cashTotal()/(sum(MK,m=>monthStats(m).expense)/6)).toFixed(1)} months</b> of average spending.`,[{label:'Accounts',tab:'money',sub:'accounts'}]);
  if(/gst|tax/.test(q)){
    const p=periodOf(q,'all'); if(p.none) return r('The ledger starts in April 2026, so there is no GST data for last year yet.');
    const tx=inP(p).filter(isSpend), g=tx.map(gstOf), tot=sum(g,x=>x.gst); const top=Object.entries(tx.reduce((m,t)=>(m[t.cat]=(m[t.cat]||0)+gstOf(t).gst,m),{})).sort((a,b)=>b[1]-a[1])[0];
    const it=sum(inP(p).filter(t=>t.type==='Tax'),t=>t.amount);
    return r(`Estimated GST paid in ${p.label}: <b class="num gd">${inr(tot)}</b> (CGST ${sh(sum(g,x=>x.c))}, SGST ${sh(sum(g,x=>x.s))}, IGST ${sh(sum(g,x=>x.i))}). Largest share: <b>${top?top[0]:'—'}</b>${top?` at ${sh(top[1])}`:''}.${it?` Income-tax payments in the same period: <b class="num">${inr(it)}</b>.`:''} <span class="mu">Mock estimate.</span>`,[{label:'Tax ledger',tab:'tax',taxMonth:p.mks.length===1?p.mks[0]:'All'}]);
  }
  if(/side ?gig|freelanc|client/.test(q)){
    const p=periodOf(q,'all'); const tx=inP(p); const gig=sum(tx.filter(t=>t.cat==='Side Gig'),t=>t.amount), inc=sum(tx.filter(t=>t.type==='Income'),t=>t.amount);
    return r(`Side gigs brought in <b class="num up">${inr(gig)}</b> in ${p.label}, which is <b class="num">${(gig/inc*100).toFixed(1)}%</b> of your total income (${sh(inc)}). Another ${sh(sum(GIGS.filter(g=>g.status!=='Paid'),g=>g.revenue))} is invoiced and unpaid.`,[{label:'Gig income transactions',f:{cat:'Side Gig'}},{label:'Side gig tracker',tab:'money',sub:'gigs'}]);
  }
  if(/subscription|saas/.test(q)){
    const cats=/saas/.test(q)?['SaaS']:['Subscriptions','SaaS'];
    if(/increas|rise|went up|grow/.test(q)){
      const by={}; TX.filter(t=>cats.includes(t.cat)).forEach(t=>(by[t.merchant]=by[t.merchant]||[]).push(t));
      const up=Object.entries(by).map(([m,a])=>{a.sort((x,y)=>x.date.localeCompare(y.date));return [m,a[0].amount,a[a.length-1].amount]}).filter(x=>x[2]>x[1]);
      return r(up.length?`${up.length} recurring tools increased since April: ${up.map(x=>`<b>${x[0]}</b> ${inr(x[1])} → ${inr(x[2])} (${pct(x[2]/x[1]-1,0)})`).join('; ')}.`:'No subscription increased in price.',up.map(x=>({label:x[0],f:{q:x[0]}})));
    }
    const p=periodOf(q,'cur'); const tx=inP(p).filter(t=>cats.includes(t.cat)); const g=groupBy(tx,'merchant');
    return r(`You spent <b class="num">${inr(sum(tx,t=>t.amount))}</b> on ${cats.join(' and ')} in ${p.label}. Biggest: ${g.slice(0,4).map(x=>`${x[0]} ${sh(x[1])}`).join(', ')}.`,[{label:'Subscriptions',f:{cat:'Subscriptions'}},{label:'SaaS',f:{cat:'SaaS'}},{label:'Recurring',tab:'money',sub:'recurring'}]);
  }
  if(/recurring/.test(q)){
    const rec={}; TX.filter(t=>t.recurring&&t.type!=='Income'&&inMonth(t,CUR)).forEach(t=>rec[t.merchant]=t.amount);
    const top=Object.entries(rec).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return r(`Your biggest recurring commitments each month: ${top.map(x=>`<b>${x[0]}</b> ${inr(x[1])}`).join(', ')}. Total recurring outflow is <b class="num">${inr(sum(Object.values(rec)))}</b>/month.`,[{label:'Recurring view',tab:'money',sub:'recurring'}]);
  }
  if(/portfolio|invest|stock|holding/.test(q)){
    const val=invTotal(), inv=sum(HOLDINGS,hi), best=HOLDINGS.slice().sort((a,b)=>(hv(b)/hi(b))-(hv(a)/hi(a)))[0];
    return r(`Your portfolio is worth <b class="num">${inr(val)}</b> against <b class="num">${inr(inv)}</b> invested: an unrealised gain of <b class="num up">${inr(val-inv)}</b> (${pct(val/inv-1)}). Best performer: <b>${best.name}</b> at ${pct(hv(best)/hi(best)-1)}. Since April the market value grew about ${pct(1/0.862-1,0)} including new SIP money.`,[{label:'Holdings',tab:'portfolio'}]);
  }
  if(/highest|biggest|largest/.test(q) && /expense|spend|purchase/.test(q)){
    const p=periodOf(q,'all'); const t=inP(p).filter(isSpend).sort((a,b)=>b.amount-a.amount)[0];
    return t?r(`Your highest expense in ${p.label} was <b>${esc(t.merchant)}</b> — ${esc(t.desc)} — for <b class="num">${inr(t.amount)}</b> on ${fdateY(t.date)} (${t.cat}).`,[{label:'Open transaction',tx:t.id}]):r('No expenses found in that period.');
  }
  if(/change|what happened|differ/.test(q)){
    const c=monthStats(CUR), p=monthStats(PREV); const mv=Object.keys(EXP_CATS).map(k=>[k,sum(TX.filter(t=>isSpend(t)&&t.cat===k&&inMonth(t,CUR)),t=>t.amount)-sum(TX.filter(t=>isSpend(t)&&t.cat===k&&inMonth(t,PREV)),t=>t.amount)]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3);
    return r(`Compared with ${mlong(PREV)}: income ${c.income>=p.income?'rose':'fell'} to <b class="num">${sh(c.income)}</b> (${pct(c.income/p.income-1)}), expenses moved to <b class="num">${sh(c.expense)}</b> (${pct(c.expense/p.expense-1)}), and your savings rate is <b class="num">${(c.rate*100).toFixed(1)}%</b> vs ${(p.rate*100).toFixed(1)}%. Biggest category moves: ${mv.map(x=>`${x[0]} ${x[1]>=0?'+':'−'}${sh(Math.abs(x[1]))}`).join(', ')}.`,[{label:'P&L comparison',tab:'accounting',sub:'pl'},{label:`${ml(CUR)} ledger`,f:{month:CUR}}]);
  }
  for(const k in CATMAP){ if(q.includes(k)){
    const cats=CATMAP[k], p=periodOf(q,'all'); const tx=inP(p).filter(t=>isSpend(t)&&cats.includes(t.cat));
    const per=p.mks.map(mk=>[ml(mk),sum(tx.filter(t=>inMonth(t,mk)),t=>t.amount)]);
    return r(`You spent <b class="num">${inr(sum(tx,t=>t.amount))}</b> on ${cats.join(' + ')} in ${p.label} across ${tx.length} transactions.${per.length>1?`<table class="mini-t"><tbody>${per.map(x=>`<tr><td class="mu">${x[0]}</td><td class="num">${inr(x[1])}</td></tr>`).join('')}</tbody></table>`:''}`, cats.map(c=>({label:`${c} transactions`,f:{cat:c,month:p.mks.length===1?p.mks[0]:'All'}})));
  }}
  if(/spen|most|where/.test(q)){
    const p=periodOf(q,'cur'); const tx=inP(p); const c=spendByCat(tx), m=groupBy(tx.filter(isSpend),'merchant');
    return r(`In ${p.label} you spent most on <b>${c[0][0]}</b> (${inr(c[0][1])}), then ${c[1][0]} (${sh(c[1][1])}) and ${c[2][0]} (${sh(c[2][1])}). Top merchant: <b>${m[0][0]}</b> at ${inr(m[0][1])}.`,[{label:`${c[0][0]} transactions`,f:{cat:c[0][0],month:p.mks.length===1?p.mks[0]:'All'}},{label:'Category drill-down',tab:'analytics'}]);
  }
  if(/income|earn/.test(q)){ const p=periodOf(q,'cur'); const tx=inP(p).filter(t=>t.type==='Income'); const g=groupBy(tx,'cat');
    return r(`Income in ${p.label}: <b class="num up">${inr(sum(tx,t=>t.amount))}</b> — ${g.map(x=>`${x[0]} ${sh(x[1])}`).join(', ')}.`,[{label:'Income transactions',f:{type:'Income',month:p.mks.length===1?p.mks[0]:'All'}}]); }
  if(/sav/.test(q)){ const s=monthStats(CUR); return r(`In ${mlong(CUR)} you saved <b class="num">${inr(s.savings)}</b>, a savings rate of <b class="num">${(s.rate*100).toFixed(1)}%</b>.`,[{label:'Money summary',tab:'money'}]); }
  return r(`I answer from your ledger, so I need a question about your data. Try: spending by category, subscriptions, GST, net worth, cash, side gigs, portfolio, or what changed this month.`);
}
function refs(list){ if(!list||!list.length) return ''; return `<div class="refs">${list.map((x,i)=>`<button class="ref" data-act="ref" data-r='${esc(JSON.stringify(x))}'>${esc(x.label)} →</button>`).join('')}</div>`; }

function vAI(){
  if(!S.chat.length){ const s=monthStats(CUR);
    S.chat.push({role:'a', html:`Good morning. Here is ${mlong(CUR)} at a glance: income <b class="num up">${sh(s.income)}</b>, expenses <b class="num">${sh(s.expense)}</b>, savings rate <b class="num">${(s.rate*100).toFixed(1)}%</b>, net worth <b class="num gd">${sh(netWorth())}</b>. Ask me anything about your money; every number comes from your records.`, refs:[{label:'Command Center',tab:'cc'}]}); }
  const ins=insights(), al=alerts(), s=monthStats(CUR);
  const sugg=['Where did I spend the most this month?','How much did I spend on subscriptions?','What was my highest expense this year?','How much GST did I pay last month?','What is my current net worth?','How much income came from side gigs?','What changed in my finances this month?','Show me my biggest recurring expenses.','How much did my portfolio grow?','How much cash do I have?'];
  return `<div class="ph1"><div><div class="eyebrow">Artha AI</div><h1>Your financial analyst</h1><p>Answers are computed from your ledger, with links to the records behind them</p></div></div>
  <div class="g c21">
    <section class="panel ai chat"><div class="msgs" id="msgs">${S.chat.map(m=>m.role==='u'?`<div class="msg u">${esc(m.text)}</div>`:`<div class="msg a"><div class="who">Artha</div>${m.html}${refs(m.refs)}</div>`).join('')}</div>
      <div class="sugg">${sugg.map(q=>`<button data-act="chatQ" data-q="${esc(q)}">${q}</button>`).join('')}</div>
      <form class="cbar" id="chatForm"><input class="inp" id="chatIn" placeholder="Ask about spending, GST, portfolio, net worth…" autocomplete="off"><button class="btn pri" type="submit">Ask</button></form></section>
    <div class="g" style="align-content:start">
      ${panel(`${icon('ai',15)} Proactive insights`, ins.map((x,i)=>`<div class="ins"><i style="background:var(--${x.tone})"></i><p>${x.text}<small>${x.why}</small>${x.act?`<button class="lnk" data-act="insight" data-i="${i}">${x.act.label} →</button>`:''}</p></div>`).join(''),{cls:'ai'})}
      ${panel('Alerts', al.map((a,i)=>`<div class="ins clk" data-act="alert" data-i="${i}"><i style="background:var(--${a.tone})"></i><p>${a.t}<small>${a.d}</small></p></div>`).join(''))}
      ${panel(`Summary · ${ml(CUR)}`, `<div class="kv"><span>Income</span><b class="up">${inr(s.income)}</b></div><div class="kv"><span>Expenses</span><b>${inr(s.expense)}</b></div><div class="kv"><span>Taxes paid</span><b>${inr(s.tax)}</b></div><div class="kv"><span>Invested</span><b class="cy">${inr(s.invest)}</b></div><div class="kv"><span>Debt repaid</span><b>${inr(s.debt)}</b></div><div class="kv"><span>GST (est.)</span><b class="gd">${inr(s.gst)}</b></div>`)}
    </div>
  </div>`;
}
