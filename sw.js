const CACHE = "hifz-pipeline-v4";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).pathname.startsWith("/api/")) return;
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => hit || (r.mode === "navigate" ? caches.match("./index.html") : undefined));
      return hit || net;
    })
  );
});
self.addEventListener("periodicsync",e=>{if(e.tag==="hifz-check")e.waitUntil(new Promise(ok=>{const q=indexedDB.open("hifz",1);q.onupgradeneeded=()=>q.result.createObjectStore("k");q.onerror=()=>ok();q.onsuccess=()=>{const g=q.result.transaction("k").objectStore("k").get("g");g.onerror=()=>ok();g.onsuccess=()=>{const o=g.result,t=new Date(),d=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"),l=o&&o.rm?o.g.filter(x=>x.d<=d):[];if(l.length&&String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0")>=o.hr)self.registration.showNotification("⚠ غفلة عن المراجعة",{body:l.length+" من محفوظك يحتاج مراجعة: "+l[0].m,icon:"icon-192.png",tag:"hifz",lang:"ar",dir:"rtl"}).then(ok,ok);else ok()}}}))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window"}).then(c=>c.length?c[0].focus():clients.openWindow("./index.html")))});
self.addEventListener("push",e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={body:e.data&&e.data.text()}}e.waitUntil(self.registration.showNotification(d.title||"⚠ غفلة عن المراجعة",{body:d.body||"لديك مراجعة مستحقة",icon:"icon-192.png",badge:"icon-192.png",tag:"hifz",lang:"ar",dir:"rtl"}))});
