// Cloudflare Pages Function — /api/news
// Réglages : même KV namespace MENU, même variable ADMIN_KEY

const KEY = "news";
const DEFAULT = [];

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  });
}

export async function onRequest({ request, env }) {
  const m = request.method.toUpperCase();

  if (m === "OPTIONS") return new Response(null, { status: 204, headers: {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-admin-key,x-check"
  }});

  if (m === "GET") {
    try {
      if (env.MENU) {
        const saved = await env.MENU.get(KEY);
        if (saved) return json(JSON.parse(saved));
      }
    } catch(_) {}
    return json(DEFAULT);
  }

  if (m === "POST") {
    const key = request.headers.get("x-admin-key") || "";
    if (!env.ADMIN_KEY) return json({ error: "ADMIN_KEY non configurée." }, 500);
    if (key !== env.ADMIN_KEY) return json({ error: "Mot de passe incorrect." }, 401);
    if (request.headers.get("x-check") === "1") return json({ ok: true });
    if (!env.MENU) return json({ error: "KV MENU non lié." }, 500);
    let data;
    try { data = await request.json(); } catch(_) { return json({ error: "JSON invalide." }, 400); }
    if (!Array.isArray(data)) return json({ error: "Format invalide : tableau attendu." }, 400);
    await env.MENU.put(KEY, JSON.stringify(data));
    return json({ ok: true });
  }

  return json({ error: "Méthode non supportée." }, 405);
}
