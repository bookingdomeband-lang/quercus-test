// Cloudflare Pages Function — API de la carte
// GET  /api/menu   -> renvoie la carte (publique)
// POST /api/menu   -> enregistre la carte (protégé par mot de passe)
//
// Réglages requis dans Cloudflare Pages :
//   - Variable KV liée sous le nom : MENU
//   - Variable d'environnement (secret) : ADMIN_KEY = le mot de passe

const KEY = "carte";

const DEFAULT = {"platDuJour": {"nom": "", "desc": "", "prix": "", "date": ""}, "sections": [{"titre": "Entrées", "sous": "Pour commencer", "plats": [{"nom": "Velouté de potimarron", "desc": "Huile de noisette torréfiée, éclats de châtaigne.", "prix": "9"}, {"nom": "Œuf parfait, champignons des bois", "desc": "Crème de champignons, copeaux de comté.", "prix": "11"}, {"nom": "Terrine de campagne maison", "desc": "Pickles de légumes, pain de seigle grillé.", "prix": "10"}]}, {"titre": "Plats", "sous": "Le cœur du repas", "plats": [{"nom": "Suprême de volaille fermière", "desc": "Jus au thym, purée fumée au bois de chêne.", "prix": "19"}, {"nom": "Filet de bœuf, sauce aux morilles", "desc": "Gratin dauphinois, légumes de saison.", "prix": "26"}, {"nom": "Pavé de cabillaud rôti", "desc": "Beurre blanc, écrasé de pommes de terre.", "prix": "21"}, {"nom": "Risotto d'automne aux cèpes", "desc": "Noisettes torréfiées, parmesan. Végétarien.", "prix": "17"}]}, {"titre": "Desserts", "sous": "La douceur", "plats": [{"nom": "Tarte fine aux pommes", "desc": "Caramel au beurre salé, glace vanille.", "prix": "8"}, {"nom": "Fondant au chocolat", "desc": "Cœur coulant, crème anglaise.", "prix": "8"}, {"nom": "Fromages affinés", "desc": "Sélection du moment, confiture de saison.", "prix": "9"}]}], "formule": {"titre": "Formule du midi", "lignes": [{"label": "Entrée + Plat", "prix": "22 €"}, {"label": "Plat + Dessert", "prix": "22 €"}, {"label": "Entrée + Plat + Dessert", "prix": "27 €"}], "note": "Du lundi au samedi, le midi"}};

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
  } catch (e) {}
  return json(DEFAULT);
}

export async function onRequestPost({ request, env }) {
  const key = request.headers.get("x-admin-key") || "";

  if (!env.ADMIN_KEY) {
    return json({ error: "Le mot de passe (ADMIN_KEY) n'est pas configuré sur Cloudflare." }, 500);
  }
  if (key !== env.ADMIN_KEY) {
    return json({ error: "Mot de passe incorrect." }, 401);
  }
  // Requête de simple vérification du mot de passe (depuis l'écran de connexion)
  if (request.headers.get("x-check") === "1") {
    return json({ ok: true });
  }
  if (!env.MENU) {
    return json({ error: "La base de données (KV « MENU ») n'est pas liée sur Cloudflare." }, 500);
  }
  let data;
  try { data = await request.json(); } catch (e) { return json({ error: "Données invalides." }, 400); }
  if (!data || !Array.isArray(data.sections)) {
    return json({ error: "Format de carte invalide." }, 400);
  }
  await env.MENU.put(KEY, JSON.stringify(data));
  return json({ ok: true });
}
