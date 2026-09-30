// Bump VERSION for each deployment that changes any app asset.
const VERSION='leluma-v1.3.0';
// Scope-specific caches cannot delete another app's cache on the same GitHub host.
const PREFIX='leluma-'+self.registration.scope+'-';
const CACHE=PREFIX+VERSION;
const FILTER_IDS=["original", "clean", "crisp", "daylight", "linen", "vivid", "lift", "balance", "clarity", "airy", "softlight", "petal", "porcelain", "honeyglow", "freshface", "rosy", "softfocus", "studio", "peach", "pearl", "trueyou", "golden", "amber", "sunset", "copper", "sand", "candle", "apricot", "terracotta", "sundaze", "maple", "arctic", "glacier", "bluehour", "mint", "slate", "moonlight", "coast", "lavender", "rain", "chrome", "retro70", "vhs", "polaroid", "cinema", "faded", "sepia", "noir", "silver", "newsprint", "1977", "silk", "satin", "radiance", "velvet", "warmbalance", "softbronze", "freshlight", "calm", "dewdrop", "naturalskin", "sculpt", "athlete", "chisel", "form", "power", "bronzeedge", "feature", "precision", "contour", "steel", "cover", "runway", "spotlight", "espresso", "afterglow"];
const FILES=['./','./index.html','./styles.css','./bundle.js','./pixels.js','./pixel-worker.bundle.js','./demo.png','./repair.html','./repair.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png',...FILTER_IDS.map(id=>'./thumbnails/'+id+'.jpg')];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
  // Activate the complete repair release promptly. No page is forcibly reloaded;
  // an unsaved photo remains in the existing page until its user reloads it.
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{for(const name of await caches.keys()){if((name.startsWith(PREFIX)||name.startsWith('luma-'+self.registration.scope+'-')||name.startsWith('evcam-'+self.registration.scope+'-'))&&name!==CACHE)await caches.delete(name);}await self.clients.claim();})());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(request.mode==='navigate'){
      // Keep the HTML and JS from one tested version together, including offline.
      const repair=url.pathname===new URL('./repair.html',self.registration.scope).pathname;
      return await cache.match(repair?'./repair.html':'./index.html')||await fetch(request);
    }
    const cached=await cache.match(request,{ignoreSearch:true});return cached||fetch(request);
  })());
});
