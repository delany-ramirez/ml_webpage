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
| 0 | **Esqueleto** — repo, Astro, submodule, colecciones, `lib/curso.ts`, KaTeX/Shiki, layout base con tokens y toggle de tema, una lección real renderizada | ✅ hecha | |
| 1 | **Navegación** — sidebar acordeón, índice de módulo, landing, programa, instalación, prev/next, píldoras + TOC, rutas de ejercicios y quiz formal, check anti-soluciones | ✅ hecha | |
| 2 | **Progreso** — `progress.ts`, marcar completada, barras por módulo y global, página `/progreso/` con exportar/importar/reiniciar | ⬜ pendiente | |
| 3 | **Interactivos** — `<Quiz>` + schema JSON + autoevaluación de ejemplo; `<WidgetFrame>` + plantilla + primer widget (descenso del gradiente); bloques Explora/Practica/Comprueba en la lección | ⬜ pendiente | |
| 4 | **Búsqueda y pulido** — Pagefind + Ctrl+K, 404, sitemap, robots, favicon, revisión responsive (400 px) y accesibilidad | ⬜ pendiente | |
| 5 | **Deploy** — `wrangler.jsonc`, repo en GitHub, Workers Builds, dominio `ml.delanyr.dev`, verificación en producción; enlace desde el portafolio | ⬜ pendiente | |
| 6 | **Contenido interactivo** (continua) — autoevaluaciones por módulo, más widgets, remark plugin de enlaces cruzados, notebooks con botón Colab | ⬜ pendiente | |
| 7 | *(opcional)* Render estático de notebooks (nbconvert en build), modo presentación de lección | ⬜ no planificada | |

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


### ⬜ Fase 2 — Progreso

- [ ] `src/scripts/progress.ts`: clave `ml.delanyr.dev/progress/v1`;
      `{ completadas: string[], autoevaluacion: Record<id,{score,total,fecha}>, actualizado }`;
      `isDone`, `toggle`, `saveQuiz`, `summary()`, `exportar()` / `importar(code)`;
      evento `progress:change`. Referencia: `leogaviria/src/js/utils/storage.js`.
- [ ] Sidebar y cabecera reaccionan al evento: check por lección, `N/M` por módulo, barra global.
- [ ] Landing: progreso por módulo en las tarjetas.
- [ ] `/progreso/`: resumen, *Copiar código*, *Restaurar desde código*, *Reiniciar* (confirmación).

### ⬜ Fase 3 — Interactivos

- [ ] Schema Zod de autoevaluación en `content.config.ts` (loader `file`/`glob` sobre
      `src/data/autoevaluacion/*.json`): `{ id, leccion?, pregunta, opciones[], correcta, explicacion }`.
- [ ] `<Quiz>`: feedback inmediato, explicación, puntaje, reintentar, `saveQuiz()`.
      Referencia de comportamiento: `leogaviria/widgets/programacion/u01_fundamentos_quiz.html`.
- [ ] `/modulo/[n]/autoevaluacion/` + bloque *Comprueba* en cada lección con sus preguntas.
- [ ] `public/widgets/_plantilla.html`: tokens del sitio, lectura de `?theme=`, listener
      `postMessage {type:"THEME_CHANGE"}`, sin dependencias externas.
- [ ] `<WidgetFrame src title height>`: barra (título, pantalla completa, abrir aparte),
      `loading="lazy"`, ajuste de altura, envío del tema al cargar y al cambiar.
- [ ] Primer widget: descenso del gradiente 1D/2D con tasa de aprendizaje (M3·S6).
- [ ] `src/data/widgets.json` y bloque *Explora* en la lección; bloque *Practica* con los
      ejercicios del módulo.
- [ ] Una autoevaluación de ejemplo (M3, 8–10 preguntas) para probar el flujo completo.

### ⬜ Fase 4 — Búsqueda y pulido

- [ ] Pagefind en `postbuild`; modal Ctrl+K con resultados agrupados por módulo.
- [ ] `404.astro`, sitemap, `robots.txt`, `favicon.svg` (marca dorada del portafolio).
- [ ] Revisión responsive a 400 px (sin scroll horizontal; tablas y código con `overflow-x`).
- [ ] Accesibilidad: foco visible dorado, `aria-*` en sidebar/acordeón/toggle, contraste AA en
      tema claro. Lighthouse ≥ 95 en accesibilidad en una lección.

### ⬜ Fase 5 — Deploy

- [ ] `wrangler.jsonc`: `name: "ml-delanyr"`, `assets: { directory: "./dist", not_found_handling: "404-page" }`.
- [ ] Repo `delany-ramirez/ml_webpage` en GitHub; push.
- [ ] Cloudflare → Workers → conectar repo; build command
      `git submodule update --init --recursive && npm run build`; deploy `npx wrangler deploy`.
- [ ] Custom domain `ml.delanyr.dev` en el Worker.
- [ ] Verificar en producción: HTTPS, 404 propio, sitemap, lección con LaTeX, progreso, widget.
- [ ] `dr_webpage`: enlace a `ml.delanyr.dev` desde la sección Docencia (commit aparte en ese repo).

### ⬜ Fase 6 — Contenido interactivo (continua)

Avanza en paralelo al repo de contenido. Cada ítem es un commit pequeño.

- [ ] Autoevaluación de los módulos 1, 2, 4 (y 5, 6 cuando existan).
- [ ] Widgets: sub/sobreajuste polinómico (M3·S8), frontera logística + umbral con matriz de
      confusión y ROC (M4·S9), k-means paso a paso (M5·S12), PCA 2D (M5·S12).
- [ ] `src/plugins/remark-enlaces-cruzados.ts`: convierte `` `NN-tema.md` `` en enlace a la
      lección si existe en la colección; `` `NN-tema.ipynb` `` en enlace a GitHub/Colab.
- [ ] Botones *Abrir en Colab* / *Ver en GitHub* / *Descargar* en las tarjetas de notebook.

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
