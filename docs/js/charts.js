/* ---------- charts (drawn at measured width) ---------- */
let CH = [];
const chartSlot = (spec,h=200) => { CH.push(spec); return `<div class="chart" data-ch="${CH.length-1}" style="height:${h}px"></div>`; };
function niceMax(v){ if(v<=0) return 1; const p=Math.pow(10,Math.floor(Math.log10(v))); const n=v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }
function drawCharts(){
  document.querySelectorAll('[data-ch]').forEach(el=>{
    const spec=CH[+el.dataset.ch]; if(!spec) return;
    const W=Math.max(240, el.clientWidth), H=el.clientHeight;
    el.innerHTML = spec.kind==='line' ? lineSVG(spec,W,H) : barSVG(spec,W,H);
  });
}
function axis(max,W,H,pl,pt,ih,fmt){
  let s=''; for(let k=0;k<=4;k++){ const v=max*k/4, y=pt+ih-ih*k/4;
    s+=`<line x1="${pl}" x2="${W}" y1="${y}" y2="${y}" stroke="#1d1d23" stroke-width="1" ${k?'stroke-dasharray="2 4"':''}/>`+
       `<text x="${pl-8}" y="${y+3.5}" text-anchor="end">${fmt(v)}</text>`; }
  return s;
}
function barSVG({labels,values,color='#E50914',fmt=sh,hi=-1,dim='#3a1013'},W,H){
  const pl=52,pb=22,pt=8, iw=W-pl, ih=H-pt-pb, n=values.length, max=niceMax(Math.max(...values,1)), slot=iw/n, bw=Math.min(38,slot*.62);
  const every = Math.ceil(n/ Math.max(1,Math.floor(iw/46)));
  let s=`<svg viewBox="0 0 ${W} ${H}" height="${H}">`+axis(max,W,H,pl,pt,ih,fmt);
  values.forEach((v,i)=>{ const h=ih*v/max, x=pl+slot*i+(slot-bw)/2, y=pt+ih-h;
    const c = hi<0 || i===hi ? color : dim;
    s+=`<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h,v>0?1:0)}" fill="${c}" rx="1"><title>${labels[i]}: ${inr(v)}</title></rect>`;
    if(i%every===0||i===n-1) s+=`<text x="${x+bw/2}" y="${H-5}" text-anchor="middle">${labels[i]}</text>`;
    if(i===hi) s+=`<text x="${x+bw/2}" y="${y-6}" text-anchor="middle" style="fill:#F5F5F7">${fmt(v)}</text>`;
  });
  return s+'</svg>';
}
function lineSVG({labels,series,fmt=sh,min0=false},W,H){
  const pl=56,pb=22,pt=14,pr=20, iw=W-pl-pr, ih=H-pt-pb;
  const all=series.flatMap(s=>s.values); let mx=Math.max(...all), mn=min0?0:Math.min(...all);
  const pad=(mx-mn)*.15||Math.abs(mx)*.1||1; mn=min0?0:mn-pad; mx=mx+pad;
  const X=i=>pl+iw*(labels.length===1?0.5:i/(labels.length-1)), Y=v=>pt+ih-ih*(v-mn)/(mx-mn);
  let s=`<svg viewBox="0 0 ${W} ${H}" height="${H}">`;
  for(let k=0;k<=3;k++){ const v=mn+(mx-mn)*k/3, y=Y(v); s+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="#1d1d23" ${k?'stroke-dasharray="2 4"':''}/><text x="${pl-8}" y="${y+3.5}" text-anchor="end">${fmt(v)}</text>`; }
  labels.forEach((l,i)=> s+=`<text x="${X(i)}" y="${H-5}" text-anchor="middle">${l}</text>`);
  series.forEach(se=>{
    const pts=se.values.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
    if(se.area) s+=`<path d="M${X(0)},${pt+ih} L${pts.join(' L')} L${X(se.values.length-1)},${pt+ih} Z" fill="${se.color}" opacity=".09"/>`;
    s+=`<polyline points="${pts.join(' ')}" fill="none" stroke="${se.color}" stroke-width="1.8" ${se.dash?'stroke-dasharray="4 4"':''}/>`;
    se.values.forEach((v,i)=> s+=`<circle cx="${X(i)}" cy="${Y(v)}" r="${i===se.values.length-1?4:2.2}" fill="${i===se.values.length-1?se.color:'#0B0B0D'}" stroke="${se.color}" stroke-width="1.5"><title>${labels[i]}: ${inr(v)}</title></circle>`);
    const lv=se.values[se.values.length-1]; if(se.endLabel) s+=`<text x="${X(se.values.length-1)-8}" y="${Y(lv)-10}" text-anchor="end" style="fill:#F5F5F7">${fmt(lv)}</text>`;
  });
  return s+'</svg>';
}
function donut(items,size=150,center=''){
  items=items.filter(x=>x.value>0); if(!items.length) return empty('Nothing to show yet.');
  const tot=sum(items,x=>x.value), r=size/2-10, C=2*Math.PI*r; let off=0;
  let s=`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#17171C" stroke-width="14"/>`;
  items.forEach(it=>{ const len=C*it.value/tot; s+=`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${it.color}" stroke-width="14" stroke-dasharray="${Math.max(len-2,0)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size/2} ${size/2})"><title>${it.label}: ${inr(it.value)}</title></circle>`; off+=len; });
  s+=`<text x="50%" y="50%" text-anchor="middle" dy="4" style="fill:#F5F5F7;font-family:var(--m);font-size:13px">${center}</text></svg>`;
  const lg = items.map(it=>`<div><span><i style="background:${it.color}"></i>${it.label}</span><span class="num">${(it.value/tot*100).toFixed(1)}%</span></div>`).join('');
  return `<div class="donutw">${s}<div class="legend">${lg}</div></div>`;
}
function hbars(rows,{color='var(--red)',fmt=sh,act=null,total=null}={}){
  if(!rows.length) return empty('Nothing to show yet.');
  const mx=Math.max(...rows.map(r=>r[1]),1);
  return rows.map(([n,v,extra])=>`<div class="hb ${act?'clk':''}" ${act?`data-act="${act}" data-v="${esc(n)}"`:''}><span class="n" title="${esc(n)}">${esc(n)}</span><span class="t"><i style="width:${(v/mx*100).toFixed(1)}%;background:${color}"></i></span><span class="v">${fmt(v)}${total?` <span class="mu">${(v/total*100).toFixed(0)}%</span>`:''}</span></div>`).join('');
}

/* ---------- shared fragments ---------- */
const empty = (msg, btn='') => `<div class="empty"><span>${msg}</span>${btn}</div>`;
const tile = (l,v,sub='',tone='') => `<div class="tile ${tone}"><div class="lbl">${l}</div><div class="val num">${v}</div>${sub?`<div class="sub">${sub}</div>`:''}</div>`;
const panel = (title,body,{meta='',cls='',actions=''}={}) => `<section class="panel ${cls}"><div class="phd"><h3>${title}</h3><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${meta?`<span class="meta">${meta}</span>`:''}${actions}</div></div><div class="pb">${body}</div></section>`;
const seg = (opts,cur,act,extra='') => `<div class="seg">${opts.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<button type="button" data-act="${act}" data-v="${v}" ${extra} class="${v===cur?'on':''}">${l}</button>`}).join('')}</div>`;
const sign = t => t.type==='Income'||t.type==='Refund' ? '+' : t.type==='Expense'||t.type==='Tax' ? '−' : '';
const amtCls = t => t.type==='Income'||t.type==='Refund' ? 'up' : '';
function txRow(t){
  return `<div class="row clk" data-act="tx" data-id="${t.id}" style="padding-inline:8px;margin-inline:-8px;border-radius:2px">
    <div class="ic">${initials(t.merchant)}</div>
    <div class="tx"><b>${esc(t.merchant)}</b><span>${esc(t.cat)} · ${fdate(t.date)}</span></div>
    <div class="amt ${amtCls(t)}">${sign(t)}${inr(t.amount)}</div></div>`;
}
