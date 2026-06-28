# MULTI-RADIOS · Premium Black Edition + Admin Panel

Reproductor de radio online con panel de administración profesional y soporte PWA (instalable en PC y móvil).

## 📦 Estructura del proyecto

```
multi-radios/
├── index.html         # Reproductor principal (página pública)
├── admin.html         # Panel de administración profesional
├── radios.json        # Datos por defecto (logo, tema, banners, emisoras)
├── manifest.json      # Manifiesto PWA
├── sw.js              # Service Worker (cache + offline)
├── icon-192.png       # Icono PWA 192x192
├── icon-512.png       # Icono PWA 512x512
├── favicon.ico        # Favicon del sitio
└── README.md
```

## 🚀 Despliegue en GitHub Pages

1. Sube todo el contenido a tu repositorio (rama `main`).
2. Ve a **Settings → Pages → Source: `main` / root**.
3. Espera 1-2 minutos y tu sitio estará disponible en:
   `https://<tu-usuario>.github.io/<tu-repo>/`
4. Accede al panel admin en `/admin.html`.

> **Importante:** el sitio funciona también con cualquier hosting estático (Netlify, Vercel, Cloudflare Pages, etc.) o servidor local (`python3 -m http.server`).

## 🎛️ Panel de Administración (`admin.html`)

Funcionalidades:

- **Identidad**: título, logo (texto o imagen), favicon, texto del pie.
- **Tema y colores**: 12 paletas preparadas + 7 colores 100% personalizables (primario, claro, texto, borde, fondo, reproductor, texto reproductor).
- **Tipografía**: 20 fuentes Google Fonts seleccionables con vista previa en vivo.
- **Publicidades** (carrusel): añadir/editar/reordenar/eliminar banners con enlace clickable opcional.
- **Emisoras**: gestión completa (nombre, URL del stream, imagen, género, país, ciudad/identificación), búsqueda, drag & drop para reordenar, duplicar, eliminar.
- **Exportar/Importar JSON**: descarga `radios.json` listo para subir al repo, o carga uno anterior para restaurar.
- **Historial automático**: las últimas 10 versiones guardadas se conservan en el navegador y se pueden restaurar con un click.
- **Memoria persistente**: todos los cambios quedan guardados en `localStorage` y se aplican automáticamente al `index.html`.

## 💾 Cómo funciona la persistencia

1. Editas y guardas en `admin.html` → todo se guarda en `localStorage`.
2. El `index.html` lee primero `localStorage`. Si no encuentra nada, carga `radios.json` (lo que has commiteado en GitHub).
3. **Para publicar tu configuración para todos los visitantes:** exporta el JSON desde el admin → reemplaza `radios.json` en tu repositorio → commit & push.

## 📱 PWA (instalable en PC y móvil)

- En PC (Chrome/Edge/Brave): aparecerá un botón **"Instalar App"** arriba a la derecha en el index, o el icono de instalación en la barra de direcciones.
- En móvil Android: menú del navegador → "Añadir a pantalla de inicio".
- En iOS Safari: botón compartir → "Añadir a pantalla de inicio".
- Funciona offline una vez visitada (gracias al service worker).
- Incluye **shortcut directo al panel admin** desde el icono de la app.

## 🎨 Paletas incluidas

Violeta · Medianoche · Neón Cyber · Atardecer · Océano · Bosque · Carmesí · Rosa Pastel · Oro Premium · Monocromo · Dark Pro · Cielo Suave

## 📋 Esquema JSON

```jsonc
{
  "site":  { "title": "...", "logoText": "Multi", "logoAccent": "RADIOS", "logoImage": "", "favicon": "", "footerText": "" },
  "theme": { "preset": "purple", "primary": "#...", "light": "#...", "textDark": "#...", "border": "#...",
             "background": "#...", "playerBg": "#...", "playerText": "#...", "font": "Plus Jakarta Sans" },
  "banners":  [ { "img": "https://...", "link": "https://..." } ],
  "stations": [ { "name": "...", "url": "https://...stream", "img": "...", "genre": "", "country": "ES", "city": "Madrid" } ]
}
```

Compatible con el `radios.json` antiguo (banners como array de strings).

## 🛠️ Atajos

- Click en el icono ⚙️ "Admin" (esquina superior izquierda del index) → abre el panel.
- Botón "Ver Radio" en el admin → abre el index en una nueva pestaña.
- Sincronización entre pestañas: si tienes el index abierto y guardas en el admin, el index se actualiza automáticamente.

---

Hecho con ❤️ sobre la base del repositorio original [MorelDa/MULTI-RADIOS](https://github.com/MorelDa/MULTI-RADIOS).
