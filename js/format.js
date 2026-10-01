/* =========================================================
   ARTHA FINANCE OS — interactive prototype (demo data)
   ========================================================= */
const TODAY = '2026-09-30';
const MK = ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'];
const MNAME = {'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'};
const ml = mk => MNAME[mk.slice(5,7)];
const mlong = mk => ({'04':'April','05':'May','06':'June','07':'July','08':'August','09':'September'})[mk.slice(5,7)] + ' ' + mk.slice(0,4);

/* ---------- icons ---------- */
const IC = {
  cc:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  money:'M2.5 6.5h19v11h-19zM12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5M6 9.5v5M18 9.5v5',
  tax:'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  port:'M3 17l6-6 4 4 8-8M15 7h6v6',
  acct:'M12 4v16M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0zM8 20h8',
  ana:'M4 20V11M10 20V5M16 20v-8M21 20H3',
  ai:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  search:'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M20 20l-4.2-4.2',
  plus:'M12 5v14M5 12h14',
  bell:'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0',
  x:'M6 6l12 12M18 6L6 18',
  arrow:'M5 12h14M13 6l6 6-6 6',
  minus:'M5 12h14',
  swap:'M4 8h14l-3-3M20 16H6l3 3',
  asset:'M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6',
  liab:'M4 7h16v12H4zM4 11h16M8 15h3',
  clip:'M8 12l6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l7-7'
};
const icon = (n,s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[n]}"/></svg>`;

/* ---------- formatting ---------- */
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr = n => (n<0?'−':'') + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
function sh(n){
  const a=Math.abs(n), s=n<0?'−':'';
  const f=(x)=>x.toFixed(1).replace(/\.0$/,'');
  if(a>=1e7) return s+'₹'+(a/1e7).toFixed(2)+'Cr';
  if(a>=1e5) return s+'₹'+f(a/1e5)+'L';
  if(a>=1e3) return s+'₹'+f(a/1e3)+'K';
  return s+'₹'+Math.round(a);
}
const pct = (x,d=1) => (x>=0?'+':'−')+Math.abs(x*100).toFixed(d)+'%';
const delta = (x,inv=false) => { const good = inv ? x<=0 : x>=0; return `<span class="${good?'up':'dn'}">${x>=0?'▲':'▼'} ${Math.abs(x*100).toFixed(1)}%</span>`; };
const fdate = d => { const [y,m,dd]=d.split('-'); return `${+dd} ${MNAME[m]}`; };
const fdateY = d => { const [y,m,dd]=d.split('-'); return `${+dd} ${MNAME[m]} ${y}`; };
const sum = (a,f=x=>x) => a.reduce((s,x)=>s+f(x),0);
const initials = s => s.replace(/[^A-Za-z ]/g,'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() || '₹';
