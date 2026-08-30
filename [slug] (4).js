/**
 * MULTI-RADIOS · Endpoint de compartir con Open Graph dinámico
 * -------------------------------------------------------------
 * Ruta: /api/share/<slug>   (Vercel Serverless Function, Node.js)
 *
 * Por qué existe: WhatsApp, Facebook, Telegram, etc. NO ejecutan
 * JavaScript cuando generan la vista previa de un enlace. Por eso una
 * web estática no puede mostrar la portada + descripción de cada radio.
 * Esta función devuelve HTML con las etiquetas Open Graph correctas de la
 * emisora compartida y luego redirige al usuario real a la emisora exacta.
 *
 * El botón "compartir" del reproductor genera: /api/share/<slug-del-nombre>
 */

function slugify(str) {
  return String(str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'radio';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = async (req, res) => {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const origin = `${proto}://${host}`;

    // slug desde la ruta /api/share/<slug> o desde ?slug=
    let slug = '';
    if (req.query && req.query.slug) slug = String(req.query.slug);
    if (!slug) {
      const parts = (req.url || '').split('?')[0].split('/').filter(Boolean);
      slug = decodeURIComponent(parts[parts.length - 1] || '');
    }
    slug = slugify(slug);

    // Cargar radios.json publicado
    let data = { site: {}, stations: [] };
    try {
      const r = await fetch(`${origin}/radios.json?v=${Date.now()}`);
      if (r.ok) data = await r.json();
    } catch (_) {}

    const stations = Array.isArray(data.stations) ? data.stations : [];
    const s = stations.find((x) => slugify(x.name) === slug) || null;

    const siteName = (data.site && data.site.footerText) || 'MultiRadios.es';
    const deepLink = `${origin}/index.html?station=${encodeURIComponent(slug)}`;

    let title, description, image;
    if (s) {
      const lugar = [s.city, s.country].filter(Boolean).join(', ');
      title = `${s.name} · En vivo | ${siteName}`;
      description = `📻 Te invito a escuchar "${s.name}"${lugar ? ' desde ' + lugar : ''} en directo por ${siteName}. ¡Dale play y disfruta la mejor radio online!`;
      image = s.img || `${origin}/icon-512.png`;
    } else {
      title = `${siteName} | Escucha radios en vivo`;
      description = `Te invito a escuchar las mejores radios online en directo. ¡Reproductor premium gratis!`;
      image = `${origin}/icon-512.png`;
    }

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="music.radio_station">
<meta property="og:site_name" content="${esc(siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(origin)}/api/share/${esc(slug)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="icon" type="image/png" href="/favicon.png">
<meta http-equiv="refresh" content="0; url=${esc(deepLink)}">
<style>body{font-family:'Segoe UI',system-ui,sans-serif;background:#0B0A0F;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;flex-direction:column;gap:14px}img{width:120px;height:120px;border-radius:16px;object-fit:cover}a{color:#A78BFA}</style>
</head>
<body>
<img src="${esc(image)}" alt="${esc(s ? s.name : siteName)}" onerror="this.style.display='none'">
<h2>${esc(s ? s.name : siteName)}</h2>
<p>Abriendo la emisora… <a href="${esc(deepLink)}">Entrar ahora</a></p>
<script>location.replace(${JSON.stringify(deepLink)});</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    res.status(200).send(html);
  } catch (e) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send('<script>location.replace("/index.html");</script>');
  }
};
