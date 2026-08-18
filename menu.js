// Cloudflare Pages Function — /api/menu
// Réglages requis : KV namespace lié sous le nom MENU + variable d'environnement ADMIN_KEY

const KEY = "carte";
const DEFAULT = {"platDuJour": {"nom": "", "desc": "", "prix": "", "date": ""}, "sections": [{"titre": "Entrées", "sous": "Pour commencer", "plats": [{"nom": "Velouté de potimarron", "desc": "Huile de noisette torréfiée, éclats de châtaigne.", "prix": "9"}, {"nom": "Œuf parfait, champignons des bois", "desc": "Crème de champignons, copeaux de comté.", "prix": "11"}, {"nom": "Terrine de campagne maison", "desc": "Pickles de légumes, pain de seigle grillé.", "prix": "10"}]}, {"titre": "Plats", "sous": "Le cœur du repas", "plats": [{"nom": "Suprême de volaille fermière", "desc": "Jus au thym, purée fumée au bois de chêne.", "prix": "19"}, {"nom": "Filet de bœuf, sauce aux morilles", "desc": "Gratin dauphinois, légumes de saison.", "prix": "26"}, {"nom": "Pavé de cabillaud rôti", "desc": "Beurre blanc, écrasé de pommes de terre.", "prix": "21"}, {"nom": "Risotto d'automne aux cèpes", "desc": "Noisettes torréfiées, parmesan. Végétarien.", "prix": "17"}]}, {"titre": "Desserts", "sous": "La douceur", "plats": [{"nom": "Tarte fine aux pommes", "desc": "Caramel au beurre salé, glace vanille.", "prix": "8"}, {"nom": "Fondant au chocolat", "desc": "Cœur coulant, crème anglaise.", "prix": "8"}, {"nom": "Fromages affinés", "desc": "Sélection du moment, confiture de saison.", "prix": "9"}]}, {"titre": "Desserts glacés", "sous": "Glaces & sorbets", "plats": [{"nom": "Coupe vanille-caramel", "desc": "Glace vanille, sauce caramel maison, éclats de praline.", "prix": "7"}, {"nom": "Sorbet fruits rouges", "desc": "Coulis de framboise, menthe fraîche.", "prix": "6"}, {"nom": "Café liégeois", "desc": "Glace café, chantilly maison.", "prix": "7"}]}, {"titre": "Menu enfant", "sous": "Pour les petits · jusqu'à 12 ans", "plats": [{"nom": "Steak haché frites", "desc": "Viande fraîche, frites maison.", "prix": "9"}, {"nom": "Nuggets de poulet", "desc": "Frites maison, sauce tomate.", "prix": "9"}, {"nom": "Pâtes au beurre", "desc": "Parmesan, option sauce tomate.", "prix": "7"}]}], "formule": {"titre": "Formule du midi", "lignes": [{"label": "Entrée + Plat", "prix": "22 €"}, {"label": "Plat + Dessert", "prix": "22 €"}, {"label": "Entrée + Plat + Dessert", "prix": "27 €"}], "note": "Du lundi au samedi, le midi"}};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestGet({ env }) {
  try {
    if (env.MENU) {
      const saved = await env.MENU.get(KEY);
      if (saved) return json(JSON.parse(saved));
    }
  } catch (_) {}
  return json(DEFAULT);
}

export async function onRequestPost({ request, env }) {
  const key = request.headers.get("x-admin-key") || "";
  if (!env.ADMIN_KEY)
    return json({ error: "Variable ADMIN_KEY non configurée sur Cloudflare." }, 500);
  if (key !== env.ADMIN_KEY)
    return json({ error: "Mot de passe incorrect." }, 401);
  if (request.headers.get("x-check") === "1")
    return json({ ok: true });
  if (!env.MENU)
    return json({ error: "KV namespace MENU non lié sur Cloudflare." }, 500);
  let data;
  try { data = await request.json(); } catch (_) { return json({ error: "JSON invalide." }, 400); }
  if (!data || !Array.isArray(data.sections))
    return json({ error: "Format de carte invalide." }, 400);
  await env.MENU.put(KEY, JSON.stringify(data));
  return json({ ok: true });
}
