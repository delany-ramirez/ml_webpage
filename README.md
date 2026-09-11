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
| `git submodule update --remote content` | Trae la última versión del contenido |

## Estructura

```
content/            submodule → machine_learning (solo lectura)
public/             favicon, robots, widgets HTML aislados
src/
  content.config.ts colecciones (teoria, ejercicios, quizzes, modulos, docs) sobre content/
  lib/curso.ts      metadatos derivados de ruta + H1; orden global; prev/next
  plugins/          remark: quitar H1 y línea de metadatos
  layouts/          Base.astro
  components/       Nav, Footer, …
  pages/            rutas
  scripts/          theme.ts, …
  styles/global.css tokens (oscuro + claro) y componentes
```

## Material del docente

Los archivos `*-sol.md` del contenido (claves de quiz y soluciones) se excluyen del build por
patrón en `content.config.ts`. Nunca deben aparecer en `dist/`.
