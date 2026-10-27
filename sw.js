// غيّر رقم الإصدار عند كل تحديث لملفات التطبيق ليُحدَّث الكاش
const VERSION = 'hifz-merged-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/favicon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});

// تنبيه الغفلة في الخلفية (Periodic Sync) من بيانات IndexedDB
self.addEventListener('periodicsync', e => {
  if (e.tag !== 'hifz-check') return;
  e.waitUntil(new Promise(ok => {
    const q = indexedDB.open('hifz', 1);
    q.onupgradeneeded = () => q.result.createObjectStore('k');
    q.onerror = () => ok();
    q.onsuccess = () => {
      const g = q.result.transaction('k').objectStore('k').get('g');
      g.onerror = () => ok();
      g.onsuccess = () => {
        const o = g.result, t = new Date(), p = n => String(n).padStart(2, '0');
        const d = t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
        const l = o && o.rm ? o.g.filter(x => x.d <= d) : [];
        if (l.length && p(t.getHours()) + ':' + p(t.getMinutes()) >= o.hr)
          self.registration.showNotification('⚠ غفلة عن المراجعة', { body: l.length + ' من محفوظك يحتاج مراجعة: ' + l[0].m, icon: 'icons/icon-192.png', tag: 'hifz', lang: 'ar', dir: 'rtl' }).then(ok, ok);
        else ok();
      };
    };
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(c => c.length ? c[0].focus() : clients.openWindow('./index.html')));
});
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || '⚠ غفلة عن المراجعة', { body: d.body || 'لديك مراجعة مستحقة', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'hifz', lang: 'ar', dir: 'rtl' }));
});
