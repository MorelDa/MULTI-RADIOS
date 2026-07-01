# MULTI-RADIOS · Premium Black Edition

Reproductor de radio online con **panel de administración protegido con contraseña**, **reproductor individual estilo Spotify** (color adaptado al logo, redes sociales y volumen), **botón de WhatsApp para agregar radios**, y soporte **PWA** (instalable en PC y móvil).

## 📦 Estructura del proyecto

```
multi-radios/
├── index.html         # Reproductor principal (página pública)
├── admin.html         # Panel de administración (protegido con contraseña)
├── radios.json        # Datos por defecto (logo, tema, banners, emisoras)
├── manifest.json      # Manifiesto PWA
├── sw.js              # Service Worker (cache + offline)
├── icon-192.png       # Icono PWA 192x192
├── icon-512.png       # Icono PWA 512x512
├── favicon.png        # Favicon del sitio
└── README.md
```

## 🔐 Acceso al panel de administración

- En la página principal hay un **icono de llave discreto** arriba a la izquierda.
- Al pulsarlo pide una **contraseña**. La contraseña es: **`kevin6`**
- También puedes entrar directamente abriendo `admin.html` (también pedirá la contraseña).
- El acceso se recuerda durante la sesión del navegador.

> Para cambiar la contraseña: edita la constante `ADMIN_PASS = 'kevin6'` en **index.html** y en **admin.html**.

## 🎛️ Panel de administración (`admin.html`)

- **Identidad**: título, logo (texto o imagen), favicon, texto del pie.
- **Colores y fuente**: 12 paletas + 7 colores personalizables + 20 tipografías.
- **Publicidad**: banners del carrusel con enlace opcional.
- **Emisoras**: nombre, URL del stream, imagen/logo, género, país, ciudad, **redes sociales por emisora** (Facebook, Instagram, X, YouTube, TikTok, WhatsApp, Telegram, Spotify, Web).
  - **Reordenar**: arrastra el tirador `⠿` (o usa las flechas ↑↓ en móvil). Duplicar y eliminar disponibles.
- **Exportar / Importar JSON** e **Historial** en el navegador.

## 🎧 Reproductor individual estilo Spotify

- Al pulsar cualquier emisora se abre un reproductor a pantalla completa.
- El **fondo se adapta al color del logo** de la emisora.
- Muestra las **redes sociales** de esa emisora, **control de volumen**, play/pausa, anterior/siguiente y un botón de **compartir**.
- La **barra reproductora del pie** se mantiene siempre (no cambia).

## 📲 Botón de WhatsApp

- Botón flotante verde (abajo a la derecha) para que los interesados pidan **agregar su radio**.
- Número configurado: **+34 604875068**.
- Para cambiarlo: edita `wa.me/34604875068` en el enlace `#waFab` dentro de **index.html**.

## 💾 Sincronización GLOBAL (todos los visitantes ven tus cambios)

Ahora el proyecto tiene **backend + base de datos**:

1. Editas y pulsas **Guardar** en `admin.html` → se guarda **en el servidor** (protegido con la contraseña `kevin6`).
2. `index.html` lee la configuración **del servidor** al abrir, así que **todos los visitantes (cualquier móvil o PC) ven tus emisoras, colores, banners y ajustes automáticamente**, sin exportar nada.
3. Si el servidor no está disponible, la web usa una **caché local** y, como último recurso, el `radios.json`.

### Endpoints del backend
- `GET /api/config` → devuelve la configuración global.
- `PUT /api/config` → guarda la configuración (requiere cabecera `X-Admin-Password: kevin6`).

### ⚠️ Importante para el despliegue
La sincronización global **necesita el backend en marcha**. Por eso:
- **Con backend (recomendado, p. ej. desplegando esta app completa):** funciona la sincronización global automática. Las páginas llaman a `/api/config` en el mismo dominio.
- **Solo estático (GitHub Pages, sin backend):** NO hay sincronización global; la web usará `radios.json` / caché local. En ese caso, para publicar cambios para todos: **Exportar** el JSON y reemplazar `radios.json`.
- Si tu frontend y tu backend están en dominios distintos, edita la constante `API_BASE` (en `index.html` y `admin.html`) poniendo la URL de tu backend, p. ej. `const API_BASE = 'https://mi-backend.com';`.


## 🚀 Despliegue (GitHub Pages / Netlify / Vercel / Cloudflare Pages)

1. Sube todos los archivos a tu repositorio.
2. En GitHub: **Settings → Pages → Source: `main` / root**.
3. Tu sitio quedará en `https://<usuario>.github.io/<repo>/`. El panel en `/admin.html`.

También funciona con cualquier servidor estático local: `python3 -m http.server`.

---

Hecho sobre la base del repositorio original [MorelDa/MULTI-RADIOS](https://github.com/MorelDa/MULTI-RADIOS).
