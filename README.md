# MultiRadios.es — Spotube Edition 🎧

Reproductor de radios online en vivo, **PWA instalable** (Android, iOS, PC y Mac), con un
diseño completamente nuevo inspirado en **Spotube** (barra lateral, reproductor inferior a
todo el ancho, pantalla "Reproduciendo ahora") y una paleta violeta oscura mejorada.

100% estático: se despliega en cualquier hosting (Vercel, Netlify, GitHub Pages, tu propio
servidor…). No necesita base de datos.

## 📁 Estructura

```
index.html          → App principal (reproductor + búsqueda + favoritos)
admin.html          → Panel de administración (contraseña: kevin6)
radios.json         → TODOS los datos: emisoras, tema, banners, notificaciones
sw.js               → Service Worker (PWA offline)
manifest.json       → Manifiesto PWA (instalación)
icon-192/512.png    → Iconos de la app
favicon.png         → Favicon
vercel.json         → Reescrituras para el enlace de compartir
api/share/[slug].js → Función serverless (Open Graph al compartir en WhatsApp/Facebook)
proxy/              → Proxy CORS opcional para streams sin CORS (Node.js)
```

## 🚀 Desplegar en Vercel (recomendado)

1. Sube esta carpeta a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **New Project** → importa el repo.
3. Framework preset: **Other**. Sin build command. Output: raíz del repo.
4. Deploy. ¡Listo! Tu radio queda en `https://tu-proyecto.vercel.app`.

## 🛠️ Administrar emisoras

1. Abre la app y pulsa **Administrar** (barra lateral) → contraseña **`kevin6`**.
2. Edita emisoras, colores, banners y notificaciones.
3. Pulsa **Guardar** (queda en tu navegador) y luego **Exportar** para descargar `radios.json`.
4. Sube ese `radios.json` a tu hosting/repo para publicarlo para todos.

> La contraseña se cambia en `index.html` y `admin.html`, en la constante `ADMIN_PASS`.

## 🔊 Soporte de streams M3U8 (HLS)

- Los streams `.m3u8` se reproducen con **hls.js** en Chrome/Firefox/Android y de forma
  nativa en Safari/iOS. Reintentos automáticos y recuperación ante cortes de red.
- Si alguna emisora **no** envía cabeceras CORS y no suena, despliega el `proxy/` (Render,
  Railway, Fly.io o un VPS), pon su URL en `PROXY_BASE` dentro de `index.html`, y marca esa
  emisora con `"proxy": true` en `radios.json`.

## 📲 Instalar como app (PWA)

- **Android/Chrome:** menú ⋮ → "Instalar aplicación" (o el botón "Instalar app").
- **iOS/Safari:** Compartir → "Añadir a pantalla de inicio".
- **PC/Mac (Chrome/Edge):** icono de instalar en la barra de direcciones.

---
Hecho con ♥ · MultiRadios.es
