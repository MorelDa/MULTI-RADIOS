/**
 * MULTI-RADIOS · Proxy de streams (CORS bypass)
 * ---------------------------------------------
 * Puro Node.js, cero dependencias externas.
 *
 * Uso:
 *   GET /stream?url=<URL_DEL_STREAM_ENCODED>
 *
 * Añade cabeceras CORS y reenvía el audio en tiempo real (streaming),
 * permitiendo reproducir Icecast/Shoutcast que no exponen CORS.
 *
 * Deploy sugerido: Render / Railway / Fly.io / VPS propio.
 *   PORT lo asigna la plataforma (env). Localmente usa 8787.
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 8787;

// Lista blanca opcional (evita que abusen del proxy). Vacía = permitir todo.
// Ejemplo: ['cast1.asurahosting.com', 'stream.zeno.fm']
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Accept-Ranges, icy-name, icy-genre, icy-br',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

function writeCors(res, extra = {}) {
  for (const [k, v] of Object.entries({ ...CORS_HEADERS, ...extra })) {
    res.setHeader(k, v);
  }
}

const server = http.createServer((req, res) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    writeCors(res);
    res.writeHead(204);
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (reqUrl.pathname === '/' || reqUrl.pathname === '/health') {
    writeCors(res, { 'Content-Type': 'application/json' });
    res.writeHead(200);
    return res.end(JSON.stringify({ ok: true, service: 'multiradios-proxy' }));
  }

  if (reqUrl.pathname !== '/stream') {
    writeCors(res);
    res.writeHead(404);
    return res.end('Not Found');
  }

  const target = reqUrl.searchParams.get('url');
  if (!target) {
    writeCors(res);
    res.writeHead(400);
    return res.end('Missing ?url= parameter');
  }

  let upstream;
  try {
    upstream = new URL(target);
  } catch (e) {
    writeCors(res);
    res.writeHead(400);
    return res.end('Invalid URL');
  }

  if (!/^https?:$/.test(upstream.protocol)) {
    writeCors(res);
    res.writeHead(400);
    return res.end('Only http/https allowed');
  }

  if (ALLOWED_HOSTS.length && !ALLOWED_HOSTS.includes(upstream.hostname.toLowerCase())) {
    writeCors(res);
    res.writeHead(403);
    return res.end('Host not allowed');
  }

  const client = upstream.protocol === 'https:' ? https : http;

  const options = {
    method: req.method === 'HEAD' ? 'HEAD' : 'GET',
    hostname: upstream.hostname,
    port: upstream.port || (upstream.protocol === 'https:' ? 443 : 80),
    path: upstream.pathname + upstream.search,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MultiRadiosProxy/1.0)',
      Accept: '*/*',
      'Icy-MetaData': '1',
      // Reenvía Range si el cliente lo pide (algunos móviles usan Range: bytes=0-)
      ...(req.headers.range ? { Range: req.headers.range } : {}),
    },
    // Icecast puede tardar en responder; sin timeout para no cortar el stream
    timeout: 0,
  };

  const upstreamReq = client.request(options, (upstreamRes) => {
    // Reenvía cabeceras útiles del stream original
    const passthrough = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'icy-name',
      'icy-genre',
      'icy-br',
      'icy-description',
      'icy-url',
    ];
    writeCors(res);
    for (const h of passthrough) {
      if (upstreamRes.headers[h]) res.setHeader(h, upstreamRes.headers[h]);
    }

    // Si el content-type no viene, asumimos audio/mpeg (Icecast default)
    if (!upstreamRes.headers['content-type']) {
      res.setHeader('Content-Type', 'audio/mpeg');
    }

    res.writeHead(upstreamRes.statusCode || 200);
    upstreamRes.pipe(res);
  });

  upstreamReq.on('error', (err) => {
    console.error('[proxy] upstream error:', err.message, '->', target);
    if (!res.headersSent) {
      writeCors(res);
      res.writeHead(502);
    }
    res.end('Upstream error: ' + err.message);
  });

  // Cliente cerró la conexión -> cerrar upstream también (ahorra datos)
  req.on('close', () => {
    try { upstreamReq.destroy(); } catch (_) {}
  });

  upstreamReq.end();
});

server.listen(PORT, () => {
  console.log(`[multiradios-proxy] listening on :${PORT}`);
  if (ALLOWED_HOSTS.length) {
    console.log(`[multiradios-proxy] allowed hosts: ${ALLOWED_HOSTS.join(', ')}`);
  } else {
    console.log('[multiradios-proxy] allowed hosts: * (all)');
  }
});
