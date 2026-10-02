// يعيد المفتاح العام لـ VAPID حتى لا يُكتب داخل index.html
export default async () => {
  const key = process.env.VAPID_PUBLIC_KEY || "";
  return new Response(JSON.stringify({ key }), {
    status: key ? 200 : 503,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
};
export const config = { path: "/api/vapid" };
