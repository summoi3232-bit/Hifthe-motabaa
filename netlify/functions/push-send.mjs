// دالة مجدولة: كل 15 دقيقة تفحص المشتركين وترسل إشعار الغفلة مرة واحدة يومياً
import { getStore } from "@netlify/blobs";
import webpush from "web-push";

function localNow(tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    }).formatToParts(new Date()).map(x => [x.type, x.value])
  );
  return { date: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}` };
}

export default async () => {
  const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subj } = process.env;
  if (!pub || !priv) { console.log("VAPID keys missing"); return; }
  webpush.setVapidDetails(subj || "mailto:admin@example.com", pub, priv);

  const store = getStore("subs");
  const { blobs } = await store.list();
  let sent = 0, removed = 0;

  for (const { key } of blobs) {
    const rec = await store.get(key, { type: "json" }).catch(() => null);
    if (!rec) continue;
    const now = localNow(rec.tz);
    if (rec.sent === now.date || now.hm < rec.hr) continue;
    const due = rec.gaps.filter(g => g.d <= now.date);
    if (!due.length) continue;

    const payload = JSON.stringify({
      title: "⚠ غفلة عن المراجعة",
      body: `${due.length} من محفوظك يحتاج مراجعة: ${due[0].m}`
    });
    try {
      await webpush.sendNotification(rec.sub, payload, { TTL: 43200, urgency: "high" });
      rec.sent = now.date;
      await store.setJSON(key, rec);
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { await store.delete(key); removed++; }
      else console.log("push failed", e.statusCode, e.body);
    }
  }
  console.log(`push-send: sent=${sent} removed=${removed} total=${blobs.length}`);
};
export const config = { schedule: "*/15 * * * *" };
