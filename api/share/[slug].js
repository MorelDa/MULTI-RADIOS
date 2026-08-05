const fs = require('fs');
const path = require('path');

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

    // Al llamarse [slug].js, Vercel lee la variable directamente de req.query.slug
    let slug = slugify(req.query.slug || '');

    // Lectura rápida de radios.json desde el disco local
    let data = { site: {}, stations: [] };
    try {
      const jsonPath = path.join(process.cwd(), 'radios.json');
      const publicJsonPath = path.join(process.cwd(), 'public', 'radios.json');
      
      let rawJson = '';
      if (fs.existsSync(jsonPath)) {
        rawJson = fs.readFileSync(jsonPath, 'utf8');
      } else if (fs.existsSync(publicJsonPath)) {
        rawJson = fs.readFileSync(publicJsonPath, 'utf8');
      }

      if (rawJson) {
        data = JSON.parse(rawJson);
      } else {
        const r = await fetch(`${origin}/radios.json?v=${Date.now()}`);
        if (r.ok) data = await r.json();
      }
    } catch (e) {
      console.error('Error cargando radios.json:', e);
    }

    const stations = Array.isArray(data.stations) ? data.stations : [];
    const s = stations.find((x) => slugify(x.name) === slug) || null;

    const siteName = (data.site && (data.site.footerText || data.site.title)) || 'MultiRadios.es';
    const deepLink = `${origin}/index.html?station=${encodeURIComponent(slug)}`;

    let title, description, image;
    if (s) {
      const lugar = [s.city, s.country].filter(Boolean).join(', ');
      title = `${s.name} · En vivo | ${siteName}`;
      description = ` Te invito a escuchar "${s.name}"${lugar ? ' desde ' + lugar : ''} en directo por ${siteName}. ¡Dale play!`;
      
      let cleanImg = s.img ? s.img.trim() : '';
      if (cleanImg.startsWith('\\/\\/')) cleanImg = 'https:' + cleanImg.replace(/\\/g, '');
      image = cleanImg || `${origin}/icon-512.png`;
    } else {
      title = `${siteName} | Escucha radios en vivo`;
      description = `Te invito a escuchar las mejores radios online en directo.`;
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
<style>
  body{font-family:system-ui,sans-serif;background:#0B0A0F;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;flex-direction:column;gap:14px}
  img{width:120px;height:120px;border-radius:16px;object-fit:cover;box-shadow:0 8px 24px rgba(0,0,0,0.5)}
  a{color:#A78BFA;text-decoration:none;font-weight:bold}
</style>
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
