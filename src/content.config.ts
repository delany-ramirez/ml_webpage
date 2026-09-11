import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Todas las colecciones leen del submodule `content/` (repo machine_learning).
// El contenido NO lleva frontmatter obligatorio: los metadatos (módulo, orden, sesión,
// título) se derivan de la ruta y del cuerpo en `src/lib/curso.ts`. Por eso los schemas
// son opcionales: si algún día el contenido añade frontmatter, se acepta sin romper nada.
//
// Los archivos `*-sol.md` (claves de quiz, soluciones de ejercicios) son material del
// docente y se excluyen aquí por patrón. `scripts/verificar-sin-soluciones.mjs` vuelve a
// comprobarlo sobre `dist/` después del build.

const BASE = "./content";

const metaOpcional = z.object({
  title: z.string().optional(),
  sesion: z.number().optional(),
  duracion: z.string().optional(),
  tipo: z.enum(["nucleo", "opcional"]).optional(),
});

const teoria = defineCollection({
  loader: glob({ base: BASE, pattern: ["modulo-*/teoria/*.md", "!**/*-sol.md"] }),
  schema: metaOpcional,
});

const ejercicios = defineCollection({
  loader: glob({ base: BASE, pattern: ["modulo-*/ejercicios/*.md", "!**/*-sol.md"] }),
  schema: metaOpcional,
});

const quizzes = defineCollection({
  loader: glob({ base: BASE, pattern: ["modulo-*/quiz/quiz-modulo-*.md", "!**/*-sol.md"] }),
  schema: metaOpcional,
});

// README de cada módulo: objetivos, núcleo/opcional, tablas de materiales.
const modulos = defineCollection({
  loader: glob({ base: BASE, pattern: ["modulo-*/README.md"] }),
  schema: metaOpcional,
});

// Documentos sueltos del curso que se publican como páginas propias.
const docs = defineCollection({
  loader: glob({
    base: BASE,
    pattern: [
      "docs/programa.md",
      "modulo-0-instalacion/README.md",
      "proyecto-integrador/README.md",
      "recursos/README.md",
    ],
  }),
  schema: metaOpcional,
});

export const collections = { teoria, ejercicios, quizzes, modulos, docs };
