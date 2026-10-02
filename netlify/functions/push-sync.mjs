// يستقبل اشتراك الجهاز + جدول مواعيد المراجعة، ويحفظه في Netlify Blobs
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
const idOf = ep => createHash("sha256").update(ep).digest("hex").slice(0, 40);
const okTz = tz => { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; } };

export default async req => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const raw = await req.text();
  if (raw.length > 60000) return json({ error: "size" }, 413);
  let b;
  try { b = JSON.parse(raw); } catch { return json({ error: "json" }, 400); }

  const store = getStore("subs");

  if (b.action === "unsub") {
    if (typeof b.endpoint === "string") await store.delete(idOf(b.endpoint));
    return json({ ok: true });
  }

  const sub = b.sub;
  if (!sub || typeof sub.endpoint !== "string" || !sub.endpoint.startsWith("https://") ||
      sub.endpoint.length > 600 || !sub.keys || !sub.keys.p256dh || !sub.keys.auth)
    return json({ error: "sub" }, 400);
  if (!/^\d{2}:\d{2}$/.test(b.hr || "") || !okTz(b.tz)) return json({ error: "fields" }, 400);

  const gaps = (Array.isArray(b.gaps) ? b.gaps : [])
    .filter(g => g && /^\d{4}-\d{2}-\d{2}$/.test(g.d) && typeof g.m === "string")
    .slice(0, 200)
    .map(g => ({ d: g.d, m: g.m.slice(0, 120) }));

  const id = idOf(sub.endpoint);
  const old = await store.get(id, { type: "json" }).catch(() => null);
  await store.setJSON(id, {
    sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
    hr: b.hr, tz: b.tz, gaps,
    sent: old?.sent || null,      // آخر يوم أُرسل فيه إشعار (يُحفظ عبر المزامنات)
    updated: new Date().toISOString()
  });
  return json({ ok: true });
};
export const config = { path: "/api/push-sync" };
