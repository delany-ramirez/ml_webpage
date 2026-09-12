# ml.delanyr.dev — Portal del curso de Machine Learning

Sitio estático (Astro 5) del curso **Machine Learning** de la Maestría en Ingeniería de
Sistemas y Computación (UTP). El contenido del curso **no vive aquí**: se consume desde el
repositorio [`delany-ramirez/machine_learning`](https://github.com/delany-ramirez/machine_learning),
montado como submodule en `content/`.

La bitácora de construcción y las decisiones de diseño están en [`PLAN.md`](PLAN.md).

## Puesta en marcha

```bash
git clone --recurse-submodules https://github.com/delany-ramirez/ml_webpage.git
cd ml_webpage
npm install
npm run dev          # http://localhost:4321
```

Si ya clonaste sin submodules: `git submodule update --init --recursive`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run check` | Diagnóstico de tipos en `.astro`/`.ts` |
| `npm run e2e` | Pruebas end-to-end por CDP (requiere `npm run preview` levantado) |
| `git submodule update --remote content` | Trae la última versión del contenido |

## Estructura

```
content/            submodule → machine_learning (solo lectura)
public/             favicon, robots, widgets HTML aislados (public/widgets/, contrato en _plantilla.html)
src/
  content.config.ts colecciones (teoria, ejercicios, quizzes, modulos, docs) sobre content/
  lib/curso.ts      metadatos derivados de ruta + H1; orden global; prev/next
  plugins/          remark: quitar H1, reescribir enlaces del contenido, enlazar referencias en backticks
  integrations/     publica los notebooks del submodule en /notebooks/
  data/             autoevaluaciones (JSON por módulo) y registro de widgets
  layouts/          Base.astro
  components/       Nav, Footer, …
  pages/            rutas
  scripts/          theme.ts, progress.ts, …
  styles/global.css tokens (oscuro + claro) y componentes
scripts/            check anti-soluciones y pruebas e2e
wrangler.jsonc      Worker `ml-delanyr` (Cloudflare Workers Static Assets)
```

## Despliegue

El sitio se publica en **Cloudflare Workers** (Static Assets) con el Worker `ml-delanyr`,
conectado a este repositorio mediante *Workers Builds*: cada `git push` a `main` construye y
despliega. Configuración del proyecto en Cloudflare:

| Campo | Valor |
|---|---|
| Build command | `git submodule update --init --recursive && npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Node | `24` (leído de `.node-version`) |

El submodule `content/` queda fijado al commit registrado en este repo. Para publicar
contenido nuevo: `git submodule update --remote content`, commit y push.

Deploy manual (requiere `npx wrangler login`): `npm run build && npx wrangler deploy`.

## Material del docente

Los archivos `*-sol.md` del contenido (claves de quiz y soluciones) se excluyen del build por
patrón en `content.config.ts`. Nunca deben aparecer en `dist/`.
