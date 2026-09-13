# PLAN — Portal web del curso de Machine Learning (`ml.delanyr.dev`)

> Bitácora de construcción del sitio. Se lee al inicio de cada sesión de trabajo y se actualiza
> en el mismo commit que cierra cada fase. Misma lógica que `PLAN.md` del repositorio de
> contenido `machine_learning`.

---

## 1. Qué estamos construyendo

Portal web estático del curso **Machine Learning** (Maestría en Ingeniería de Sistemas y
Computación, UTP — 48 h, 14 sesiones, 6 módulos), publicado en `https://ml.delanyr.dev`.

El sitio **no contiene el curso**: lo consume desde el repositorio de contenido
`delany-ramirez/machine_learning` (público), montado como submodule en `content/`. Toma de
`leogaviria` la estructura de portal de curso (sidebar por módulos, progreso, bloques
Explora/Practica/Comprueba, widgets en iframe) y del portafolio `dr_webpage` la identidad
visual y el stack (Astro 5, colecciones Zod, tokens CSS, Cloudflare Workers Static Assets).

### Decisiones tomadas (no volver a discutirlas sin motivo)

| Decisión | Valor |
|---|---|
| Framework | Astro 5 estático, sin framework UI; islas con `<script>` TS vanilla |
| Contenido | Submodule `content/` → `machine_learning`; colecciones `glob` sobre él. **Nunca se copia contenido al repo web** |
| Metadatos de lección | Derivados de ruta + H1 + línea `**Módulo N · Sesión S**` en `src/lib/curso.ts`. Sin frontmatter obligatorio en el contenido |
| Soluciones | `*-sol.md` excluidos por patrón del loader **y** por un check que rompe el build si aparecen en `dist/` |
| Progreso | Sin cuentas ni backend: `localStorage` + exportar/importar código base64 |
| Quizzes | Dos cosas distintas: **quiz formal** (respuesta abierta, del repo de contenido, solo enunciado) y **autoevaluación** (opción múltiple autocalificada, JSON en `src/data/autoevaluacion/`, vive en este repo) |
| Interactivos | Híbrido: quizzes/ejercicios nativos en Astro; visualizadores como HTML aislado en `public/widgets/` dentro de `<WidgetFrame>` (iframe) |
| Tema | Oscuro por defecto con la paleta del portafolio + claro con toggle; `data-theme` en `<html>`; se propaga a iframes por `postMessage` |
| Math / código | `remark-math` + `rehype-katex`; Shiki con dos temas |
| Búsqueda | Pagefind (post-build), atajo Ctrl+K |
| Dominio | Subdominio `ml.delanyr.dev`, Worker propio `ml-delanyr` |
| Deploy | Workers Builds conectado a GitHub, deploy automático en `git push` (igual que el portafolio). Build: `git submodule update --init --recursive && npm run build` |
| Idioma | Español en UI y contenido; términos técnicos en inglés entre paréntesis la primera vez |
| Commits | En español, imperativo, sin coautor. `Fase N: ...` al cerrar fase |

### Referencias (solo lectura)

| Repo | Ruta local | Qué se toma |
|---|---|---|
| `machine_learning` | `../machine_learning/` | Contenido (submodule). Convenciones en `docs/convenciones.md`; malla en `docs/programa.md` |
| `leogaviria` | `../leogaviria/` | Estructura: `src/js/app.js` (sidebar, lección, widgets), `src/js/utils/storage.js` (progreso), `widgets/*.html` (contrato iframe) |
| `dr_webpage` | `../../dr_webpage/` | `src/styles/global.css` (tokens, `.eyebrow`, `.chip`, `.btn*`), `src/layouts/Layout.astro` (fuentes), `src/content.config.ts` (patrón Zod), `wrangler.jsonc` (deploy) |

### Arquitectura objetivo

```
ml_webpage/
├── content/                         submodule → machine_learning (solo lectura)
├── public/
│   ├── widgets/                     visualizadores HTML autocontenidos (iframe)
│   │   └── _plantilla.html          contrato: tokens, tema por ?theme= y postMessage
│   ├── favicon.svg  robots.txt
├── scripts/
│   └── verificar-sin-soluciones.mjs falla el build si dist/ contiene material del docente
├── src/
│   ├── content.config.ts            colecciones: teoria, ejercicios, quizzes, modulos, docs, autoevaluacion
│   ├── lib/curso.ts                 parseo de metadatos, orden global, prev/next, rutas
│   ├── plugins/                     remark: quitar H1 duplicado; enlazar `NN-tema.md` → ruta
│   ├── data/autoevaluacion/*.json   preguntas MC por módulo (schema Zod)
│   ├── data/widgets.json            registro widget ↔ lección
│   ├── layouts/Base.astro           head, fuentes, tema pre-paint, nav, footer
│   ├── layouts/Leccion.astro        sidebar + cuerpo + TOC + prev/next
│   ├── components/                  Nav, Sidebar, Progreso, Quiz, WidgetFrame, Buscador, Chip…
│   ├── pages/                       ver rutas
│   ├── scripts/                     progress.ts, theme.ts, sidebar.ts, search.ts
│   └── styles/global.css            tokens (oscuro + claro) y componentes
├── astro.config.mjs                 site: https://ml.delanyr.dev, remark/rehype, shiki
├── wrangler.jsonc                   name: ml-delanyr, assets.directory: ./dist
├── package.json  tsconfig.json  .gitignore  .gitmodules
├── README.md
└── PLAN.md                          este archivo
```

### Rutas

```
/                                    landing: ficha, módulos con progreso, "empieza aquí"
/programa/                           docs/programa.md
/instalacion/                        modulo-0-instalacion/README.md
/modulo/[n]/                         índice del módulo (README + listas de teoría/notebooks/ejercicios/quiz)
/modulo/[n]/teoria/[slug]/           lección (página central)
/modulo/[n]/ejercicios/[slug]/       enunciado de ejercicio
/modulo/[n]/quiz/                    quiz formal (enunciado, sin clave)
/modulo/[n]/autoevaluacion/          quiz interactivo del módulo
/proyecto-integrador/  /recursos/  /progreso/  /404
```

---

## 2. Estado de las fases

| Fase | Contenido | Estado | Commit |
|---|---|---|---|
| 0 | **Esqueleto** — repo, Astro, submodule, colecciones, `lib/curso.ts`, KaTeX/Shiki, layout base con tokens y toggle de tema, una lección real renderizada | ✅ hecha | `a213220` · `ad34528` |
| 1 | **Navegación** — sidebar acordeón, índice de módulo, landing, programa, instalación, prev/next, píldoras + TOC, rutas de ejercicios y quiz formal, check anti-soluciones | ✅ hecha | `87b05a1` |
| 2 | **Progreso** — `progress.ts`, marcar completada, barras por módulo y global, página `/progreso/` con exportar/importar/reiniciar | ✅ hecha | `3c6e7ca` |
| 3 | **Interactivos** — `<Quiz>` + schema JSON + autoevaluación de ejemplo; `<WidgetFrame>` + plantilla + primer widget (descenso del gradiente); bloques Explora/Practica/Comprueba en la lección | ✅ hecha | `c591f9c` |
| 4 | **Búsqueda y pulido** — Pagefind + Ctrl+K, 404, sitemap, robots, favicon, revisión responsive (400 px) y accesibilidad | ✅ hecha | `a6a43c0` |
| 5 | **Deploy** — `wrangler.jsonc`, repo en GitHub, Workers Builds, dominio `ml.delanyr.dev`, verificación en producción; enlace desde el portafolio | ✅ hecha | `c337350` · `db98b24` |
| 6 | **Contenido interactivo** (continua) — autoevaluaciones por módulo, más widgets, remark plugin de enlaces cruzados, notebooks con botón Colab | ✅ primer hito (2026-09-12); sigue abierta al ritmo del contenido | `e34d969` |
| 7 | *(opcional)* Render estático de notebooks (nbconvert en build), modo presentación de lección | ⬜ no planificada | |
| 8 | *(al final)* **Automatizar la actualización del contenido** — GitHub Action en `machine_learning` que, en cada push a `main`, mueva el submodule `content/` de este repo y haga push (dispara el deploy). Requiere un token con permiso de escritura en `ml_webpage` guardado como secret en el repo de contenido | ⬜ pendiente, se hace de último | |

Cada fase cierra con un commit `Fase N: ...` que incluye la actualización de este archivo.

---

## 3. Detalle de cada fase

### ✅ Fase 0 — Esqueleto (2026-09-11)

Objetivo: ver **una lección real** (`modulo-3/teoria/02-descenso-gradiente.md`) renderizada con
LaTeX, tablas y Python coloreado, en tema oscuro y claro, con la tipografía del portafolio.
Sin sidebar todavía.

- [x] `git init`, `.gitignore` (node_modules, dist, .astro), `npm create astro` mínimo
      (`astro`, `@astrojs/sitemap`, `@astrojs/mdx`, `remark-math`, `rehype-katex`, `katex`).
- [x] `git submodule add https://github.com/delany-ramirez/machine_learning content`.
- [x] `src/content.config.ts`: colecciones `teoria`, `ejercicios`, `quizzes`, `modulos`, `docs`
      con `glob({ base: "./content", pattern: [...] })`, schemas con todos los campos opcionales,
      patrón `!**/*-sol.md` donde aplique.
- [x] `src/lib/curso.ts`: `parseLeccion(entry)` → `{ modulo, orden, slug, titulo, sesion,
      ruta }` desde `entry.id` (`modulo-3-regresion-evaluacion/teoria/02-descenso-gradiente`)
      y las primeras líneas del `body`; `MODULOS` (número → carpeta, nombre corto, sesiones)
      leído de `docs/programa.md` o declarado a mano; `ordenGlobal()`, `prevNext(id)`.
- [x] `src/plugins/remark-quitar-h1.ts`: elimina el primer H1 (la página pone su propio título).
- [x] `astro.config.mjs`: `site`, `markdown.remarkPlugins/rehypePlugins`, `shikiConfig.themes`
      `{ dark: "github-dark-default", light: "github-light-default" }` (ajustar después).
- [x] `src/styles/global.css`: copiar tokens `:root` de `dr_webpage/src/styles/global.css`;
      añadir bloque `[data-theme="light"]`; añadir `--ok/--warn/--err` y acentos de bloque;
      reglas `.prose` para el cuerpo de lección (h2 numerado en mono dorado, tablas, `pre`,
      KaTeX `color: inherit`, `max-width: 72ch`).
- [x] `src/layouts/Base.astro`: head (fuentes Google como el portafolio, KaTeX CSS), script
      inline pre-paint de tema, `<Nav>` con marca `● Délany Ramírez del Río / Machine Learning`
      y toggle, footer.
- [x] `src/pages/modulo/[n]/teoria/[slug].astro` con `getStaticPaths` desde la colección.
- [x] `src/pages/index.astro` provisional (lista plana de lecciones para navegar).
- [x] Verificación: `npm run build` y `npx astro check` limpios; abrir la lección M3·02 y
      revisar `$…$`, `$$…$$`, tabla, código, ambos temas, ancho móvil.

Resultado: 22 lecciones (módulos 1–4) generadas desde el submodule en `f3d7492`. Verificado en
Chrome: KaTeX en bloque e inline, tablas con `overflow-x`, Shiki con dos temas, toggle
oscuro/claro sin parpadeo, sin scroll horizontal a 400 px, `astro check` con 0 errores.
Notas para las fases siguientes:
- `npm install` en npm 11 bloquea los scripts de `esbuild`/`sharp`; ya quedaron aprobados en
  `package.json` (`allowScripts`). En Cloudflare puede requerir `npm ci --ignore-scripts=false`
  o el mismo `allowScripts` — comprobar en la Fase 5.
- Las referencias cruzadas del contenido (`01-regresion-lineal.md`) se ven como código inline;
  el plugin que las convierte en enlaces queda en la Fase 6.
- `src/pages/index.astro` es provisional (lista plana); se reemplaza en la Fase 1.

### ✅ Fase 1 — Navegación (2026-09-11)

- [x] `Leccion.astro`: grid sidebar / cuerpo / TOC (TOC solo ≥ 1280 px).
- [x] `Sidebar.astro`: acordeón por módulo (abierto el activo), lista de lecciones con
      indicador de completada (placeholder hasta Fase 2), colapsable, drawer en móvil, estado
      en `localStorage`. Referencia: `renderSidebar()` en `leogaviria/src/js/app.js`.
- [x] Cabecera de lección: eyebrow `MÓDULO N · SESIÓN S`, chips Núcleo/Opcional (mapeo de ✅/🔵
      del README del módulo), botón *Marcar como completada* (placeholder).
- [x] Píldoras de sección (H2) + TOC derecho con scroll-spy.
- [x] Prev/Next con `prevNext()` de `lib/curso.ts`.
- [x] `/modulo/[n]/`: README del módulo + tablas generadas (teoría → rutas internas; notebooks
      → GitHub + Colab; ejercicios → rutas internas; quiz formal → ruta interna).
- [x] `/`, `/programa/`, `/instalacion/`, `/proyecto-integrador/`, `/recursos/`.
- [x] `/modulo/[n]/ejercicios/[slug]/` y `/modulo/[n]/quiz/` (aviso: "se entrega al docente").
- [x] `scripts/verificar-sin-soluciones.mjs` en `postbuild`: falla si `dist/` contiene rutas
      `-sol` o el texto "Material del docente".
- [x] Módulos sin contenido (5 y 6 hoy): estado "en construcción" en sidebar e índice.

Resultado: 48 páginas. Layout `src/layouts/Curso.astro` (tres columnas: temario · contenido ·
TOC; dos columnas en 960–1279; drawer en <960 con barra "Temario"). Componentes `Sidebar`,
`Toc` (scroll-spy en `scripts/toc.ts`), `Pildoras`, `Cabecera`, `PrevNext`. Rutas nuevas:
`/modulo/[n]/`, `/modulo/[n]/ejercicios/[slug]/`, `/modulo/[n]/quiz/`, y `[...ruta].astro`
para los documentos de `DOCS` (`/programa/`, `/instalacion/`, `/instalacion/resumen/`,
`/proyecto-integrador/`, `/recursos/`). `postbuild` ejecuta el check anti-soluciones.
Decisiones y hallazgos:
- `src/lib/rutas.ts` (sin `astro:content`) concentra `MODULOS`, `DOCS` y
  `destinoDeContenido()`; `curso.ts` lo reexporta. Así el plugin remark puede usarlo.
- **`remark-enlaces-contenido.ts`** (adelantado de la Fase 6): reescribe los enlaces
  relativos del contenido — teoría/ejercicios/quiz/README → ruta del sitio; notebooks, datos y
  demás archivos → GitHub (`blob`/`tree`); `*-sol.md` → texto plano. Los READMEs de módulo se
  renderizan tal cual y sus tablas de materiales quedan enlazadas sin generar nada a mano.
  Queda para la Fase 6 el caso de las referencias en backticks sin enlace (`01-x.md`).
- Chips Núcleo/Opcional por lección: **descartado**. El README clasifica por sesión, no por
  archivo; no hay forma fiable de derivarlo. Si se quiere, va como frontmatter `tipo:` en el
  contenido (el schema ya lo acepta).
- El id del loader `glob` normaliza `README.md` → `readme`; `docDeEntrada()` compara sin
  mayúsculas.
- El drawer móvil es `position: fixed` dentro de `.wrap` (que tiene `z-index: 1`); hay que
  anular ese z-index en `.curso-grid` o el drawer queda bajo la nav.
- Al detener el preview no usar `taskkill node.exe` (mata también el MCP de Chrome); matar
  solo el proceso del puerto 4321.


### ✅ Fase 2 — Progreso (2026-09-11)

- [x] `src/scripts/progress.ts`: clave `ml.delanyr.dev/progress/v1`;
      `{ completadas: string[], autoevaluacion: Record<id,{score,total,fecha}>, actualizado }`;
      `isDone`, `toggle`, `saveQuiz`, `summary()`, `exportar()` / `importar(code)`;
      evento `progress:change`. Referencia: `leogaviria/src/js/utils/storage.js`.
- [x] Sidebar y cabecera reaccionan al evento: check por lección, `N/M` por módulo, barra global.
- [x] Landing: progreso por módulo en las tarjetas.
- [x] `/progreso/`: resumen, *Copiar código*, *Restaurar desde código*, *Reiniciar* (confirmación).

Resultado: `scripts/progress.ts` (datos: leer/marcar/alternar/guardarQuiz/reiniciar/
exportar/importar) y `scripts/progress-ui.ts` (pinta el DOM y escucha `progress:change` y
`storage`). Contrato de marcado documentado en la cabecera de `progress-ui.ts`:
`[data-marca]`, `[data-completar]`, `[data-cuenta-modulo]`, `[data-progreso-modulo]`,
`[data-porcentaje-modulo]`, `[data-progreso-global]`, `[data-progreso-texto]` y el JSON
`#curso-indice` (componente `IndiceCurso.astro`) para páginas sin temario.
- Clave de progreso: `"N/slug"` (`claveProgreso()` en `lib/curso.ts`), no el id largo de la
  colección — el código exportado queda corto (≈10 chars por lección).
- Código exportado: `MLDR1-` + base64url de `{c, q, t}`; `importar()` fusiona (unión de
  completadas, mejor puntaje por quiz) y devuelve `null` si el prefijo o el JSON no valen.
- `BotonCompletar.astro` aparece dos veces en la lección (cabecera y bloque de cierre con
  enlace a la siguiente); `/progreso/` permite alternar cualquier lección desde la lista.
- **Prueba e2e sin dependencias**: `scripts/e2e-progreso.mjs` lanza Chrome headless por CDP
  contra `npm run preview` y verifica 17 aserciones (marcar, persistencia entre páginas,
  contadores del sidebar/landing, exportar, reiniciar, importar válido e inválido). Alias
  `npm run e2e`. Reutilizable para la Fase 3 (quiz) y 4.
- El MCP de Chrome DevTools se cayó al matar `node.exe`; el e2e por CDP lo reemplaza sin
  depender de él.


### ✅ Fase 3 — Interactivos (2026-09-11)

- [x] Schema Zod de autoevaluación en `content.config.ts` (loader `file`/`glob` sobre
      `src/data/autoevaluacion/*.json`): `{ id, leccion?, pregunta, opciones[], correcta, explicacion }`.
- [x] `<Quiz>`: feedback inmediato, explicación, puntaje, reintentar, `saveQuiz()`.
      Referencia de comportamiento: `leogaviria/widgets/programacion/u01_fundamentos_quiz.html`.
- [x] `/modulo/[n]/autoevaluacion/` + bloque *Comprueba* en cada lección con sus preguntas.
- [x] `public/widgets/_plantilla.html`: tokens del sitio, lectura de `?theme=`, listener
      `postMessage {type:"THEME_CHANGE"}`, sin dependencias externas.
- [x] `<WidgetFrame src title height>`: barra (título, pantalla completa, abrir aparte),
      `loading="lazy"`, ajuste de altura, envío del tema al cargar y al cambiar.
- [x] Primer widget: descenso del gradiente 1D/2D con tasa de aprendizaje (M3·S6).
- [x] `src/data/widgets.json` y bloque *Explora* en la lección; bloque *Practica* con los
      ejercicios del módulo.
- [x] Una autoevaluación de ejemplo (M3, 8–10 preguntas) para probar el flujo completo.

Resultado: 50 páginas. Nuevo: colección `autoevaluacion` (`src/data/autoevaluacion/modulo-N.json`,
schema Zod con `id mN-NN`, `leccion` opcional, `correcta` dentro de rango), `lib/interactivos.ts`
(autoevaluación por módulo/lección, `WIDGETS` validado desde `src/data/widgets.json`),
componentes `Quiz`, `WidgetFrame`, `Complementos`; ruta `/modulo/[n]/autoevaluacion/`;
`public/widgets/_plantilla.html` y `descenso-gradiente.html`; resultados de autoevaluación en
`/progreso/`; chips «Autoevaluación» en temario e índice de módulo; el quiz formal enlaza a la
autoevaluación cuando existe.
- **Contrato de widget** (en la cabecera de `_plantilla.html`): tema inicial por `?theme=`, en
  vivo por `postMessage {type:"THEME_CHANGE"}`; el widget reporta `WIDGET_HEIGHT` y el iframe
  se ajusta (200–1200 px). `WidgetFrame` asigna el `src` en cliente con el tema actual para
  evitar parpadeo; `sandbox="allow-scripts allow-same-origin"`.
- **Claves de progreso de quizzes**: `autoevaluacion/N` (módulo completo) y
  `autoevaluacion/N/slug` (bloque Comprueba de una lección). Se guarda solo si mejora.
- **Practica**: muestra los ejercicios del módulo que citan la lección (`slug.md` en el
  cuerpo); si ninguno la cita, muestra todos los del módulo.
- Hallazgos: (1) los elementos creados en cliente (`.q-opcion`) no reciben el `data-astro-cid`
  → sus estilos van como `.quiz :global(...)`; (2) `.btn { display:inline-flex }` ganaba al
  atributo `hidden` → `[hidden] { display:none !important }` en `global.css`; (3) el grid del
  curso ahora es `max-width: 1320px` para que la columna de contenido (≈760 px) dé espacio a
  los widgets.
- `npm run e2e` corre los dos e2e (progreso + interactivos: 17 + 22 aserciones).
- Pendiente de contenido (Fase 6): autoevaluaciones de los módulos 1, 2 y 4; más widgets.


### ✅ Fase 4 — Búsqueda y pulido (2026-09-11)

- [x] Pagefind en `postbuild`; modal Ctrl+K con resultados agrupados por módulo.
- [x] `404.astro`, sitemap, `robots.txt`, `favicon.svg` (marca dorada del portafolio).
- [x] Revisión responsive a 400 px (sin scroll horizontal; tablas y código con `overflow-x`).
- [x] Accesibilidad: foco visible dorado, `aria-*` en sidebar/acordeón/toggle, contraste AA en
      tema claro. Lighthouse ≥ 95 en accesibilidad en una lección.

Resultado: 51 páginas. `Buscador.astro` (modal Ctrl+K / botón en la nav; carga
`/pagefind/pagefind.js` solo al abrir; resultados agrupados por módulo con tipo y extracto
resaltado; ↑↓↵ y Esc). Pagefind corre en `postbuild` con `pagefind.yml` (excluye el MathML
oculto de KaTeX). Solo se indexa `main#contenido` (`data-pagefind-body`); metadatos `tipo` y
`modulo` como **un atributo `data-pagefind-meta` por metadato** (no admite varios separados
por coma). Fuera del índice: chips/botón de la cabecera, complementos, cierre y avisos.
`404.astro`, `robots.txt` (con sitemap), skip-link «Saltar al contenido» → `#contenido`,
foco gestionado en el drawer (abre → botón cerrar; cierra → botón Temario).
- **Accesibilidad: Lighthouse 100** en landing, lección, índice de módulo y /progreso/ (tema
  claro, el más exigente). Para llegar hubo que subir el contraste del tema claro:
  `--gold #8a6318` (≈5:1 sobre papel), `--muted #4f5a67`, `--muted-2 #66707e`,
  `--silver #5f6a78`, `--bronze #8c5f33`, `--ok #27874d`, `--gold-soft` al 10 %; en oscuro
  `--muted-2 #76818f`. Tarjetas de módulos vacíos sin `opacity` (bajaba el contraste);
  enlaces dentro de párrafos con subrayado; `/progreso/` con h2 (orden de encabezados).
- **Responsive**: `.prose { overflow-wrap: anywhere; overflow-x: clip }` evita el scroll
  horizontal por `code` inline largo o MathML de KaTeX. `scripts/e2e-busqueda.mjs` recorre las
  50 páginas a 400 px y comprueba `scrollWidth ≤ 400`.
- El import dinámico de `/pagefind/pagefind.js` debe ir en una variable con `/* @vite-ignore */`
  o Rollup falla al resolverlo en build.
- Pagefind hace coincidencia difusa; el e2e prueba varias cadenas hasta obtener el estado vacío.
- Se corrigió un error de tipos latente desde la Fase 1 (`rel` en hProperties debe ser array).
- `npm run e2e` ahora encadena 3 suites (17 + 22 + 18 aserciones). Lighthouse se corre a mano
  con `npx lighthouse@12 <url> --only-categories=accessibility --chrome-flags=--headless=new`.


### ✅ Fase 5 — Deploy (2026-09-12)

- [x] `wrangler.jsonc`: `name: "ml-delanyr"`, `assets: { directory: "./dist", not_found_handling: "404-page" }`.
      Validado con `npx wrangler@4 deploy --dry-run` (257 archivos de `dist/`).
- [x] `.node-version` = `24` (misma versión que en local) y `engines.node >= 22` en `package.json`.
- [x] Repo `delany-ramirez/ml_webpage` en GitHub (público); `main` sincronizado.
- [x] Sección «Despliegue» en el README con los valores exactos del proyecto en Cloudflare.
- [x] `dr_webpage`: campo `url`/`urlLabel` opcional en la colección `docencia`, entrada
      «Machine Learning · Maestría en Ingeniería de Sistemas y Computación · 2026» primera
      en la pestaña Docencia con botón «Portal del curso →» (commit en ese repo).
- [x] **(usuario, panel de Cloudflare)** Workers & Pages → Create → *Import a repository* →
      `delany-ramirez/ml_webpage`. Nombre del Worker `ml-delanyr`; build command
      `git submodule update --init --recursive && npm run build`; deploy command
      `npx wrangler deploy`; rama `main`. Alternativa desde la terminal:
      `npx wrangler@4 login` y `npm run build && npx wrangler@4 deploy` crea el Worker; luego
      en Settings → Builds se conecta el repo.
- [x] **(usuario)** Custom domain `ml.delanyr.dev` en el Worker (Settings → Domains → Add → Custom domain).
      La zona `delanyr.dev` ya está en Cloudflare (la usa el portafolio), así que el registro
      DNS lo crea el propio panel.
- [x] Verificado en producción (curl + Chrome): HTTPS, `/404` propio (404 real), `/sitemap-index.xml`,
      `/robots.txt`, lección M3·02 con 29 fórmulas KaTeX, Shiki en `/instalacion/` (32 bloques),
      progreso persistente entre páginas, widget de descenso del gradiente (2 canvas, altura
      ajustada), búsqueda Ctrl+K con 20 resultados para «gradiente». Rutas `-sol` → 404.
- [x] Push de `dr_webpage` (`922409b`); el enlace «Portal del curso →» sale con el deploy del portafolio.

Hallazgos:
- **Static Assets redirige `/x.html` → `/x` (307)** por el `html_handling` por defecto. Afecta
  a los widgets (`/widgets/*.html`): la redirección conserva `?theme=` y el iframe la sigue, así
  que funciona. No se quita el `.html` del `src` porque `astro dev`/`preview` sirven `public/`
  por ruta exacta. Si molesta el salto extra, la opción es `html_handling: "none"` **no** (rompe
  los `index.html` de las rutas) sino renombrar los widgets a carpetas `widgets/<nombre>/index.html`.
- El check anti-soluciones y Pagefind corren en `postbuild` también en Cloudflare; Pagefind
  trae su binario para linux-x64 como dependencia opcional, sin pasos extra.
- `allowScripts` de `package.json` solo lo interpreta npm ≥ 11; si el builder trae npm 10 lo
  ignora y ejecuta los scripts de `esbuild`/`sharp` con normalidad. En ambos casos el build es
  el mismo.
- No se añade `wrangler` como devDependency (igual que en el portafolio): Workers Builds lo
  aporta en `npx wrangler deploy` y en local `npx wrangler@4` basta para validar.

### ✅ Fase 6 — Contenido interactivo (primer hito 2026-09-12; continua)

Avanza en paralelo al repo de contenido. Cada ítem es un commit pequeño.

- [x] Autoevaluación de los módulos 1, 2 y 4 (`05a2ce9`… `e2e39f1`): 10, 10 y 12 preguntas,
      todas ligadas a una lección (`leccion`) para que aparezcan en el bloque *Comprueba*.
      Escritas a partir de las lecciones, con escenarios y explicaciones que citan cifras del
      contenido. La posición de la opción correcta sigue un patrón variado (no siempre «B»).
- [ ] Autoevaluación de los módulos 5 y 6 (el contenido ya está publicado desde `3832866`).
- [x] Widgets (`c4d9e0b`): `sobreajuste-polinomico.html` (M3·05), `umbral-clasificacion.html`
      (M4·03: frontera, umbral, matriz de confusión, ROC, AP y umbral de mínimo costo),
      `kmeans.html` (M5·01) y `pca-2d.html` (M5·03). Los dos del módulo 5 están registrados
      con el slug previsto en el README del módulo (`01-clustering`, `03-reduccion-dimensionalidad`)
      y aparecen en su lección desde que el contenido del módulo 5 se publicó (`3832866`); el
      bloque **Visualizadores** del índice de módulo (`790a804`) los lista en todos los módulos.
- [x] `src/plugins/remark-enlaces-cruzados.ts` (`05a2ce9`): `` `NN-tema.md` `` → lección,
      `` `ejNN-x.md` `` → ejercicio, `` `NN-x.ipynb` `` → GitHub. Resuelve un nombre suelto en
      la carpeta del archivo, luego en el módulo, luego en todo el contenido si es único; deja
      intactos `*-sol.md`, plantillas con `<…>` y archivos que aún no existen.
- [x] Tarjetas de notebooks por módulo (`ce63842`): componente `Notebooks.astro` con
      *Abrir en Colab* / *Ver en GitHub* / *Descargar*. Datos de `lib/notebooks-fs.ts` (lee el
      submodule por `fs`, el título del primer H1 del notebook y tipo/descripción de la tabla
      «Notebooks» del README del módulo). La integración `src/integrations/notebooks.ts`
      publica los `.ipynb` en `/notebooks/modulo-N/` (copia en build, middleware en dev) para
      que *Descargar* funcione en la misma origen — GitHub raw los serviría como texto.

Hallazgos:
- El e2e de interactivos solo cubre el flujo del módulo 3; los quizzes nuevos usan el mismo
  componente y se comprobaron a mano en el navegador.
- Widgets nuevos siguen el contrato de `_plantilla.html` y comparten estructura con
  `descenso-gradiente.html` (`prep()`, `dibujar()`, `leer()`, `estado`). Todos generan datos
  con semilla (mulberry32) para que «Nueva muestra» sea reproducible. Puntos de ruptura:
  controles a 2 columnas < 720–760 px (el iframe en la lección mide ≈ 640 px), todo a 1
  columna < 560 px.
- **Actualización de contenido 2026-09-13** (`f3d7492` → `3832866`): el repo de contenido migró
  el entorno de Miniconda a uv (`pyproject.toml`, `uv.lock`, `.python-version`; desaparece
  `environment.yml`) y publicó completos los módulos 5 y 6. El sitio pasó de 54 a 70 páginas y de
  22 a 31 lecciones **sin tocar código**: solo el puntero del submodule. Los slugs previstos para
  los widgets de M5 coincidieron. `scripts/e2e-progreso.mjs` ahora lee el total de lecciones del
  temario en vez de tenerlo fijo.
- Tras cambiar el contenido, el primer `astro build` puede avisar «Duplicate id» por la caché del
  content layer en `.astro/`; desaparece al borrar esa carpeta (en Cloudflare no ocurre, el build
  parte de cero).
- Ideas para siguientes hitos: widget de árbol de decisión (M4·04) y de retropropagación
  (M5·04); autoevaluaciones 5 y 6; botón *Abrir en Colab* también en el bloque Practica de la
  lección cuando el ejercicio cite un notebook.

---

## 4. Flujo de trabajo por sesión

1. Leer este archivo; ubicar la fase abierta y el último ítem marcado.
2. `git submodule update --remote content` si el contenido avanzó (commit propio:
   `Actualiza contenido a <sha>`).
3. Trabajar los ítems de la fase; `npm run dev` para revisar; `npm run build` antes de commit.
4. Marcar ítems, actualizar la tabla de estado y cerrar con `Fase N: ...` (o un hito dentro
   de la fase).

## 5. Comandos

```bash
npm run dev        # http://localhost:4321
npm run build      # astro build → dist/ (+ postbuild: pagefind y check anti-soluciones)
npm run preview
npx astro check
git submodule update --init --recursive   # tras clonar
git submodule update --remote content     # traer contenido nuevo
```
