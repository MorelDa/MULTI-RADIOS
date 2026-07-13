# MULTI-RADIOS · Solución definitiva de reproducción

PWA de radios online con **solución definitiva al problema CORS** que impedía reproducir
streams como `https://cast1.asurahosting.com/proxy/popularnew/stream`.

## Qué se arregló

### 1. Se eliminó `crossorigin="anonymous"` del `<audio>` (raíz del error CORS)
El atributo `crossorigin` obliga al navegador a exigir cabeceras CORS al servidor de streaming.
Los servidores Icecast/Shoutcast (Asurahosting, radiosenlinea, etc.) **NO envían** esas
cabeceras, por lo que el navegador rechazaba el audio en silencio. Al quitarlo, el elemento
`<audio>` reproduce sin restricción CORS — como lo haría cualquier reproductor nativo.

### 2. Cache-buster dinámico en cada Play
Cada vez que el usuario pulsa Play, la URL se llama con `?_cb=<timestamp>` fresco.
Esto obliga al navegador (y a los proxies intermedios) a **abrir una conexión nueva** en
lugar de reutilizar un buffer/cache viejo. Es la razón principal por la que un stream
"muerto" vuelve a funcionar al recargar la página.

### 3. Corte total de datos al pausar
Cuando el usuario pulsa Pausa:
```js
audio.pause();
audio.removeAttribute('src');
audio.src = '';
audio.load();
```
Esto cierra la conexión con el servidor de streaming → **cero consumo de datos en pausa**,
crítico en móviles. Al pulsar Play de nuevo, se reconecta con cache-buster fresco.

### 4. Auto-retry con nuevo cache-buster ante errores
Si el `<audio>` dispara un `error` (stream caído momentáneamente), se reintenta
automáticamente tras 800 ms con cache-buster fresco.

### 5. Proxy CORS de respaldo (Node.js, cero dependencias)
Carpeta `/proxy/` con un microservicio que reenvía streams añadiendo cabeceras CORS.
Solo necesario para casos extremos donde el stream valida `Referer` o el navegador
sigue bloqueando (raro, pero cubierto). Ver `proxy/README.md`.

---

## Estructura

```
MULTI-RADIOS/
├── index.html          # Web principal (PWA)
├── admin.html          # Panel admin
├── radios.json         # Emisoras + tema + banners
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (NO cachea streams)
├── favicon.png, icon-*.png
└── proxy/              # Proxy Node.js opcional (CORS bypass)
    ├── server.js
    ├── package.json
    ├── Dockerfile
    └── README.md
```

---

## Uso

### A) Sin proxy (recomendado para empezar)

Con los arreglos del `index.html` la mayoría de streams ya reproducen bien.
Simplemente sube el proyecto a tu hosting (GitHub Pages, Netlify, Vercel, tu VPS, etc.).

### B) Con proxy (solo para streams que sigan bloqueados)

1. Despliega la carpeta `/proxy/` en Render/Railway/Fly.io (ver `proxy/README.md`).
2. Copia la URL pública, ej: `https://multiradios-proxy.onrender.com`.
3. En `index.html`, edita esta línea:
   ```js
   const PROXY_BASE = 'https://multiradios-proxy.onrender.com';
   ```
4. En `radios.json`, añade `"proxy": true` a las emisoras que quieras enrutar por el proxy:
   ```json
   {
     "name": "Radio Popular 103.1 FM",
     "url": "https://cast1.asurahosting.com/proxy/popularnew/stream",
     "proxy": true
   }
   ```
5. Sube los cambios. **Listo**.

> Ya dejamos `"proxy": true` en Radio Popular 103.1 FM. Solo tienes que configurar
> `PROXY_BASE` cuando despliegues el proxy. Si dejas `PROXY_BASE = ''`, esa emisora
> se reproducirá en directo igualmente (sin proxy).

---

## Compatibilidad

| Navegador       | Estado                                     |
|-----------------|--------------------------------------------|
| Chrome/Edge     | ✅ Funciona directo                        |
| Firefox         | ✅ Funciona directo                        |
| Safari iOS/mac  | ✅ Funciona directo                        |
| PWA instalada   | ✅ Funciona directo (sw.js no cachea streams) |
| Móviles 4G/5G   | ✅ Pausa corta datos, Play reabre limpio   |

---

## Panel admin

Acceso: botón discreto de llave arriba a la izquierda.
Contraseña por defecto: `kevin6` (cámbiala en `index.html` y `admin.html`).

---

## Deploy rápido a GitHub Pages

```bash
git init
git add .
git commit -m "Fix CORS + pause data cut + cache-buster"
git branch -M main
git remote add origin <tu-repo>
git push -u origin main
```

En GitHub → Settings → Pages → Source: `main` / root → Save.

---

## Changelog

- **v1.4.0** — Solución definitiva CORS
  - Eliminado `crossorigin="anonymous"` del `<audio>`
  - Cache-buster dinámico en cada play
  - Corte total de descarga al pausar (ahorro de datos)
  - Auto-retry ante error de stream
  - Añadido campo `proxy: true` por emisora
  - Nuevo microservicio `/proxy/` (Node.js, cero dependencias)
