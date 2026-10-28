/* Horizon HDV PWA - static app shell only. Never cache Google Drive responses or personal backups. */
const CACHE = 'horizon-hdv-pwa-drive-v3-auto';
const SHELL = ['./','./index.html','./app.js','./style.css','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./as332-armee-terre.jpg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('horizon-hdv-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch', event => {
  const req=event.request, url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin||!SHELL.some(p=>new URL(p,self.registration.scope).pathname===url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try { const response=await fetch(req);if(response.ok)await cache.put(req,response.clone());return response; }
    catch(error){const copy=await cache.match(req);if(copy)return copy;throw error;}
  })());
});
