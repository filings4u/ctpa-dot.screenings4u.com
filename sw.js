'use strict';
// One application: retire obsolete cached DOT/NON-DOT page shells.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k.startsWith('s4u-ctpa-')).map(k=>caches.delete(k)));
 await self.registration.unregister();
 await self.clients.claim();
})()));
