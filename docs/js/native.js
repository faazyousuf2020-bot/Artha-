/* =========================================================
   ARTHA — Android integration (only runs inside the app)
   Uses the Capacitor bridge directly; no bundler needed.
   ========================================================= */
window.NATIVE = !!(window.Capacitor && typeof Capacitor.isNativePlatform==='function' && Capacitor.isNativePlatform());
const callNative = (plugin, method, opts={}) => (window.Capacitor && Capacitor.nativePromise) ? Capacitor.nativePromise(plugin, method, opts) : Promise.reject(new Error('no bridge'));

async function nativeShareBackup(){
  const name = `artha-backup-${TODAY}.json`;
  try{
    const r = await callNative('Filesystem','writeFile',{path:name, data:backupJSON(), directory:'CACHE', encoding:'utf8'});
    await callNative('Share','share',{title:'Artha backup', text:'Artha Finance OS backup', files:[r.uri], dialogTitle:'Save or send your Artha backup'});
  }catch(e){
    if(String(e&&e.message||e).toLowerCase().includes('cancel')) return;
    try{ const r2 = await callNative('Filesystem','writeFile',{path:name, data:backupJSON(), directory:'DOCUMENTS', encoding:'utf8'}); toast('Backup saved to Documents'); }
    catch(_){ toast('Could not export the backup on this phone'); }
  }
}

if(window.NATIVE){
  document.documentElement.classList.add('native');
  callNative('StatusBar','setStyle',{style:'DARK'}).catch(()=>{});
  callNative('StatusBar','setBackgroundColor',{color:'#030303'}).catch(()=>{});
  // Android back button: close what's open, then go home, then leave the app
  try{
    Capacitor.nativeCallback('App','addListener',{eventName:'backButton'},()=>{
      if(S.layer){ S.layer=null; renderLayer(); return; }
      if(S.bell){ S.bell=false; shell(); return; }
      if(META.mode && S.tab!=='cc'){ go('cc'); return; }
      callNative('App','exitApp').catch(()=>{});
    });
    Capacitor.nativeCallback('App','addListener',{eventName:'pause'},()=>saveData());
  }catch(e){}
}else if('serviceWorker' in navigator && location.protocol==='https:'){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
