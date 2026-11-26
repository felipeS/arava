# Aravá POC — home estilo arquitecturacivil.com

Prueba de concepto local de la home corporativa de Aravá Construcciones S.A.S.
Replica la estructura y el lenguaje visual de [arquitecturacivil.com](https://arquitecturacivil.com/), con contenido, marca e imágenes de Aravá.

- Brief para el agente: `FABLE_BRIEF.md`
- Estudio de la referencia: `REFERENCE.md` y capturas en `reference/`
- Imágenes: `assets/` (ver lista más abajo)

Repo local, sin remoto. No publicar.

## Assets

- `assets/brand/` — logos oficiales de Aravá (SVG/PNG, sin modificar)
- `assets/bremen/` — renders de Montes de Bremen (Manuela) y logos del proyecto
- `assets/hito18/` — renders y fotos de Hito 18. **No usar en la home** lo que está en `assets/hito18/excluded/` (fotos de zonas sociales: salón, jacuzzis, sauna, y obras no identificadas)
- `assets/obras/` — miniaturas de obras entregadas
- `assets/equipo/` — 12 retratos del equipo (solo en `nosotros.html`, sin nombres ni cargos)
- `assets/salas/` — imagen de cabecera de cada tarjeta de sala de ventas (ver «Salas de ventas: reemplazar la imagen por la foto real»)

### Imágenes WebP en varios tamaños

Las fotos del sitio se sirven en WebP y en varios anchos (`<nombre>-<ancho>.webp`, p. ej. `assets/bremen/hero-640.webp` … `hero-2200.webp`), con `srcset` y `sizes` en cada `<img>`: el navegador baja solo el tamaño que necesita la pantalla. Los archivos sin ancho en el nombre (`assets/bremen/hero.webp`, `assets/hito18/torre-noche.jpg`, `assets/hito18/coworking.avif`…) son los originales: se conservan para regenerar, pero el sitio no los usa y no van en el ZIP. La excepción es `assets/hito18/hero-poster.jpg`: es la imagen para redes (`og:image`) de todas las páginas y sí va en el ZIP (ver «Publicación en Hostinger»).

- Para regenerar: `python3 tools/variantes-webp.py` (usa `cwebp` o Pillow; `--solo-faltantes` genera únicamente las variantes que falten). Ahí están las imágenes, los anchos (incluidos `768w` para tarjetas/galerías móviles) y las calidades: fotos q80 hasta 1024 px y q78 por encima; retratos q80; premios q88 con alfa sin pérdida, BAQ sin pérdida y Camacol q90.
- Hero de la home: cada slide es un `<picture>` con un recorte vertical 3:4 (`*-vertical-*.webp`) para pantallas verticales (`max-aspect-ratio: 2/3`). Es el centro de la imagen a resolución completa: en el teléfono se ve el mismo encuadre de siempre y pesa menos. Las diapositivas 2–5 se hidratan tras `window.load` (o al tocar su indicador) para no competir con la primera imagen.
- Heroes de páginas internas (`.pageHero`) y `404.html`: `<picture>` con recortes cuadrados 1:1 (`*-cuadro-{640,820,1195|1200}.webp`) para pantallas verticales (`max-aspect-ratio: 3/4`), conservando el mismo encuadre con menos peso en móvil.
- `sizes` describe el ancho con que se dibuja el contenido de la imagen. Con `object-fit: cover` en cajas de alto fijo (hero, tarjetas de proyecto) es más que el ancho de la caja. Si cambia el CSS de esas cajas, revisa sus `sizes`.
- Premios (`assets/premios/`): un solo archivo por logo, del ancho justo para 2× en escritorio y 3× en móvil, sin `srcset` (el CSS los dibuja a su tamaño intrínseco).
- Las imágenes de las salas de ventas siguen siendo un solo archivo (ver más abajo).
- `assets/bremen/project.mp4` va sin la pista de audio (el video se reproduce `muted`); la imagen es la misma, cuadro a cuadro.

## Sitio

Sitio estático, sin build. Abra `index.html` en el navegador o sirva la carpeta (`python3 -m http.server`).

- `index.html` — home (hero, Montes de Bremen y Hito 18 destacados, cifras, carrusel de obras, compra desde el exterior, reconocimientos)
- `nosotros.html`, `proyectos.html`, `portafolio.html`, `compra-exterior.html`, `contacto.html` — páginas internas
- `404.html`, `.htaccess`, `robots.txt`, `sitemap.xml` — página de error y archivos para Hostinger (ver «Publicación en Hostinger»)
- `css/site.css`, `css/fonts/`, `js/site.js` — estilos, fuentes locales (`Gantari` y `Open Sans`, WOFF2 subconjunto latin, SIL OFL 1.1) y comportamiento (header, hero, carrusel, menú móvil, botón flotante de WhatsApp)
- Montes de Bremen: su landing es `https://montesdebremen.com/es` (botones «Ver proyecto» y píldora del footer). `FABLE_BRIEF.md` aún dice `montes-de-bremen.vercel.app`: es el brief histórico y no se corrige.
- Contacto (confirmado por Timoteo el 21 nov 2026): WhatsApp de ventas +57 313 625 9484 (`https://wa.me/573136259484`) y salas de ventas en Armenia (Carrera 18 #29 Norte 00, Hito 18 Coliving Studios) y Circasia (Cl. 6 #15-25, junto a la Casa de la Cultura). Están en `contacto.html`, `compra-exterior.html`, el footer y el botón flotante (`.wspFloat`, último hijo de `<main>` en las 6 páginas y en `404.html`). No hay teléfono fijo, correo ni horarios: no los agregues.
- Tiempos de Montes de Bremen (fuente: Timoteo, 21 nov 2026): «Armenia · 10 min» y «800 m · 8 min a pie» al parque de Circasia. El sitio solo usa «a 10 minutos de Armenia» (`proyectos.html`). `FABLE_BRIEF.md` aún dice «12 minutos del norte de Armenia»: es el brief histórico y no se corrige. No uses otros tiempos.
- `favicon.svg` — derivado de la «A» del logo
- WhatsApp en verde: los botones y el botón flotante usan el ícono oficial de WhatsApp (SVG en línea de Simple Icons, CC0) y los colores `--wa*` de `css/site.css`. El verde oficial `#25D366` con blanco encima da 1,98:1, así que solo se usa como color de ícono sobre carbón. Donde lleva blanco encima se usa una variante más oscura del mismo tono: `--wa-fab` (`#1CA14E`, ícono blanco 3,36:1) en el botón flotante y `--wa-btn` (`#17823F`, texto blanco 4,88:1) en los botones con texto. No uses `#25D366` de fondo con blanco encima.

## Publicación en Hostinger

El sitio vive en `https://aravaconstrucciones.com` (Hostinger, con su CDN delante).

- **URL públicas sin `.html` ni barra final:** `/`, `/nosotros`, `/proyectos`, `/portafolio`, `/compra-exterior` y `/contacto`. Así aparecen en el `canonical`, en `og:url` y en `sitemap.xml`. Los enlaces internos siguen apuntando a `*.html` para que el sitio funcione abierto desde el disco: `/contacto` y `/contacto.html` sirven la misma página y el `canonical` señala la primera.
- **`.htaccess`** (Apache / LiteSpeed; solo `ErrorDocument`, `mod_rewrite` y `mod_expires`):
  1. `www.aravaconstrucciones.com/…` → `https://aravaconstrucciones.com/…` (301, misma ruta y query).
  2. `/index.html` e `/index` → `/` (301).
  3. `/pagina/` → `/pagina` (301). Con la barra final, las rutas relativas (`css/site.css`) se rompían y la página salía sin estilos.
  4. `/pagina` → `pagina.html`, por dentro (sin redirección).
  5. `ErrorDocument 404 /404.html`.
  6. `mod_expires`: HTML con 0 s (siempre revalida), imágenes/fuentes/video 1 año, CSS y JS 1 mes.

  No fuerza HTTPS en el dominio sin www: con el CDN delante, una regla con `%{HTTPS}` puede entrar en bucle. Eso se activa en hPanel.
- **`404.html`** se sirve en cualquier ruta que no exista (p. ej. `/a/b/c`), así que todas sus rutas son absolutas desde la raíz (`/css/site.css`, `/assets/…`, `/contacto.html`). Lleva `noindex` y no está en el sitemap. Repite el header y el footer de las demás páginas: si cambian, cámbialos también aquí.
- **SEO y redes:** cada página lleva `canonical` y Open Graph; `og:title` y `og:description` repiten su `<title>` y su `description`. La imagen para redes es `assets/hito18/hero-poster.jpg` (render de Hito 18, JPEG de 1280 × 720 y 137 KB), en JPEG porque WhatsApp, Facebook y LinkedIn lo leen siempre.
- **`robots.txt`** apunta a `sitemap.xml`. Si se agrega una página pública, súmala al sitemap y dale su `canonical`.
- **En el ZIP**, además de las páginas, `css/`, `js/`, `favicon.svg` y las imágenes que usan, van `404.html`, `.htaccess` (es un archivo oculto: revisa que se suba), `robots.txt`, `sitemap.xml` y `assets/hito18/hero-poster.jpg`.
- **Después de subirlo**, purga la caché del CDN en hPanel y revisa:

  ```
  curl -sI "https://www.aravaconstrucciones.com/contacto?x=1"  # 301 → https://aravaconstrucciones.com/contacto?x=1
  curl -sI https://aravaconstrucciones.com/index.html           # 301 → https://aravaconstrucciones.com/
  curl -sI https://aravaconstrucciones.com/contacto/            # 301 → https://aravaconstrucciones.com/contacto
  curl -sI https://aravaconstrucciones.com/contacto             # 200
  curl -sI https://aravaconstrucciones.com/a/b/c                # 404, y en el navegador la página 404 con estilos
  ```

## Salas de ventas: reemplazar la imagen por la foto real

Las tarjetas de las salas de ventas (`contacto.html` y `compra-exterior.html`, sección `#visitanos`) abren con una imagen. Cada sala tiene un solo archivo, y las dos páginas lo comparten:

| Sala | Archivo | Imagen actual |
|---|---|---|
| Armenia · Hito 18 | `assets/salas/tarjeta-armenia.webp` | Render de la torre de Hito 18 de día (`assets/hito18/hito-18-torre-dia-1280.webp`, reducida a 960 × 640) |
| Circasia · Montes de Bremen | `assets/salas/tarjeta-circasia.webp` | Render aéreo de Montes de Bremen (recorte 3:2 de `assets/bremen/hero.webp`, a 960 × 640) |

Hoy las dos son renders de los proyectos, no fotos de las salas. Por eso llevan la etiqueta «Imagen ilustrativa» y su `alt` describe el render. No escribas que muestran la sala de ventas.

Cuando llegue la foto real de una sala:

1. Expórtala en WebP de 960 px de ancho, idealmente recortada a 3:2 (960 × 640) y por debajo de 150 KB. Por ejemplo: `cwebp -q 78 -resize 960 0 foto-sala.jpg -o assets/salas/tarjeta-armenia.webp` (el `0` conserva la proporción). Si la foto no es 3:2, la tarjeta la recorta igual (`object-fit: cover`).
2. Sobrescribe el archivo de esa sala en `assets/salas/`, con el mismo nombre.
3. En `contacto.html` y en `compra-exterior.html`, busca el comentario `<!-- foto real de la sala: reemplazar aquí … -->` de esa sala (`grep -n "foto real de la sala" *.html`). Justo debajo:
   - cambia el `alt` para que describa la foto (por ejemplo, «Fachada de la sala de ventas en Armenia»);
   - borra `<figcaption>Imagen ilustrativa</figcaption>`, porque ya no es un render;
   - si la foto no mide 960 × 640, pon sus medidas reales en `width` y `height`.
4. Si el encuadre no queda bien, ajusta `object-position` en `.salesMedia img` (`css/site.css`). Hoy vale `50% 65%`. En móvil la cabecera es 3:2 y en escritorio 16:9.
