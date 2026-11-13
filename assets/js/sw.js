'use strict';
// This portal is an authenticated, realtime application. Never serve cached
// HTML, JS, CSS or API responses: a previous cache-first service worker caused
// old authorization code and page content to survive releases.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('s4u-ctpa-')).map(k=>caches.delete(k))))
 .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith(fetch(request));
});
