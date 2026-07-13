# MULTI-RADIOS Proxy

Proxy ligero (Node.js nativo, cero dependencias) que reenvía streams Icecast/Shoutcast añadiendo cabeceras **CORS** para que puedan reproducirse desde cualquier web/PWA.

## Endpoint

```
GET /stream?url=<URL_DEL_STREAM_ENCODED>
```

Ejemplo:

```
https://mi-proxy.onrender.com/stream?url=https%3A%2F%2Fcast1.asurahosting.com%2Fproxy%2Fpopularnew%2Fstream
```

## Correr localmente

```bash
cd proxy
node server.js
# -> http://localhost:8787
```

Prueba en el navegador:
```
http://localhost:8787/stream?url=https%3A%2F%2Fcast1.asurahosting.com%2Fproxy%2Fpopularnew%2Fstream
```

## Deploy en Render (gratis, recomendado)

1. Sube todo el repo a GitHub.
2. En [render.com](https://render.com) → **New → Web Service** → conecta el repo.
3. **Root Directory**: `proxy`
4. **Build Command**: (vacío)
5. **Start Command**: `node server.js`
6. Deploy. Toma nota de la URL pública, ej: `https://multiradios-proxy.onrender.com`.

## Deploy en Railway

1. **New Project → Deploy from GitHub**.
2. Selecciona la carpeta `proxy` como raíz (o crea un servicio con `cd proxy && node server.js`).
3. Railway asigna `PORT` automáticamente.

## Deploy en Fly.io

```bash
cd proxy
fly launch --dockerfile
```

## Configurar el frontend

Abre `index.html` y edita:

```js
const PROXY_BASE = 'https://multiradios-proxy.onrender.com';
```

Luego, en `radios.json`, marca las emisoras que quieres enrutar por el proxy:

```json
{
  "name": "Radio Popular 103.1 FM",
  "url": "https://cast1.asurahosting.com/proxy/popularnew/stream",
  "proxy": true
}
```

Solo las emisoras con `"proxy": true` pasarán por el proxy. El resto sigue en directo.

## Variables de entorno opcionales

| Variable          | Descripción                                                                    |
|-------------------|--------------------------------------------------------------------------------|
| `PORT`            | Puerto en el que escucha (por defecto 8787; en Render/Railway se asigna solo)  |
| `ALLOWED_HOSTS`   | Lista blanca separada por coma. Ej: `cast1.asurahosting.com,stream.zeno.fm`   |

Si no defines `ALLOWED_HOSTS`, se permite cualquier host (útil al arrancar; luego restrínjelo).
