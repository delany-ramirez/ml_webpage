/**
 * Metadatos del curso derivados del repositorio de contenido (`content/`).
 *
 * El contenido no lleva frontmatter: cada archivo empieza con `# NN · Título` y una línea
 * `**Módulo N · Sesión S** — tema`. Aquí se parsea eso una sola vez y se expone un modelo
 * uniforme (módulo, orden, sesión, título, ruta pública) para páginas, sidebar y navegación.
 */
import { getCollection, type CollectionEntry } from "astro:content";

import { MODULOS, moduloPorCarpeta, moduloPorNumero, DOCS, type Modulo } from "./rutas";
export { MODULOS, moduloPorCarpeta, moduloPorNumero, DOCS, type Modulo };

// ---------------------------------------------------------------------------
// Parseo de una entrada
// ---------------------------------------------------------------------------

export type TipoEntrada = "teoria" | "ejercicios" | "quizzes" | "modulos";

export interface Leccion {
  /** id de la colección, p. ej. `modulo-3-regresion-evaluacion/teoria/02-descenso-gradiente` */
  id: string;
  tipo: TipoEntrada;
  modulo: Modulo;
  /** `NN` del nombre de archivo (1 para READMEs y quizzes) */
  orden: number;
  /** último segmento de la ruta, p. ej. `02-descenso-gradiente` */
  slug: string;
  /** Título sin el prefijo `NN ·`, tal cual en Markdown (puede traer `código`) */
  titulo: string;
  /** Sesión (o rango) leída de la línea `**Módulo N · Sesión S**` */
  sesion: string | null;
  /** Texto libre tras el guion largo de la línea de sesión, p. ej. "Regresión lineal" */
  tema: string | null;
  /** Tiempo estimado si aparece en la línea de metadatos, p. ej. "75 min" */
  duracion: string | null;
  /** Ejercicios: "Con código" | "Sin código" */
  modalidad: string | null;
  /** Quizzes: número de preguntas */
  preguntas: number | null;
  /** Ruta pública */
  ruta: string;
}

const RE_H1 = /^#\s+(.+?)\s*$/m;
const RE_META = /^\*\*(?:Módulo\s+\d+\s+·\s+)?Sesi(?:ón|ones)\s+([\d–-]+)\*\*(?:\s*—\s*(.+?))?(?:\s*·.*)?$/im;
const RE_TIEMPO = /Tiempo (?:estimado|sugerido):\s*\*\*([^*]+)\*\*/i;
const RE_MODALIDAD = /·\s*((?:Con|Sin) código)/i;
const RE_PREGUNTAS = /(\d+)\s+preguntas/i;

function quitarPrefijoNumero(titulo: string): string {
  // "02 · Título" | "Ejercicio 01 · Título" | "Quiz · Módulo 3 — Título"
  return titulo
    .replace(/^(?:Ejercicio\s+)?\d{2}\s+·\s+/, "")
    .replace(/^Quiz\s+·\s+Módulo\s+\d+\s+—\s+/, "");
}

function ordenDesdeSlug(slug: string): number {
  const m = slug.match(/^(?:ej)?(\d{2})-/);
  return m ? parseInt(m[1], 10) : 1;
}

function rutaPublica(tipo: TipoEntrada, modulo: Modulo, slug: string): string {
  switch (tipo) {
    case "teoria":
      return `/modulo/${modulo.numero}/teoria/${slug}/`;
    case "ejercicios":
      return `/modulo/${modulo.numero}/ejercicios/${slug}/`;
    case "quizzes":
      return `/modulo/${modulo.numero}/quiz/`;
    case "modulos":
      return `/modulo/${modulo.numero}/`;
  }
}

export function parseLeccion(
  entry: CollectionEntry<"teoria" | "ejercicios" | "quizzes" | "modulos">,
  tipo: TipoEntrada,
): Leccion | null {
  const [carpeta, ...resto] = entry.id.split("/");
  const modulo = moduloPorCarpeta(carpeta);
  if (!modulo) return null;

  const slug = resto[resto.length - 1] ?? "";
  const body = entry.body ?? "";
  const cabecera = body.slice(0, 600);

  const h1 = cabecera.match(RE_H1)?.[1] ?? slug;
  const meta = cabecera.match(RE_META);
  const duracion = cabecera.match(RE_TIEMPO)?.[1]?.trim() ?? null;
  const modalidad = cabecera.match(RE_MODALIDAD)?.[1] ?? null;
  const preguntas = cabecera.match(RE_PREGUNTAS)?.[1];

  return {
    id: entry.id,
    tipo,
    modulo,
    orden: ordenDesdeSlug(slug),
    slug,
    titulo: entry.data.title ?? quitarPrefijoNumero(h1),
    sesion: meta?.[1]?.replace("-", "–") ?? null,
    tema: meta?.[2]?.trim() ?? null,
    duracion: entry.data.duracion ?? duracion,
    modalidad,
    preguntas: preguntas ? parseInt(preguntas, 10) : null,
    ruta: rutaPublica(tipo, modulo, slug),
  };
}

// ---------------------------------------------------------------------------
// Índice del curso (orden global módulo → NN) y navegación
// ---------------------------------------------------------------------------

function porModuloYOrden(a: Leccion, b: Leccion): number {
  return a.modulo.numero - b.modulo.numero || a.orden - b.orden;
}

export async function lecciones(): Promise<Leccion[]> {
  const entradas = await getCollection("teoria");
  return entradas
    .map((e) => parseLeccion(e, "teoria"))
    .filter((l): l is Leccion => l !== null)
    .sort(porModuloYOrden);
}

export async function ejerciciosDe(numeroModulo: number): Promise<Leccion[]> {
  const entradas = await getCollection("ejercicios");
  return entradas
    .map((e) => parseLeccion(e, "ejercicios"))
    .filter((l): l is Leccion => l !== null && l.modulo.numero === numeroModulo)
    .sort(porModuloYOrden);
}

export async function quizDe(numeroModulo: number): Promise<{ entry: CollectionEntry<"quizzes">; leccion: Leccion } | null> {
  const entradas = await getCollection("quizzes");
  for (const entry of entradas) {
    const l = parseLeccion(entry, "quizzes");
    if (l && l.modulo.numero === numeroModulo) return { entry, leccion: l };
  }
  return null;
}

export async function ejerciciosPorModulo(): Promise<Map<number, Leccion[]>> {
  const entradas = await getCollection("ejercicios");
  const mapa = new Map<number, Leccion[]>();
  for (const m of MODULOS) mapa.set(m.numero, []);
  for (const e of entradas) {
    const l = parseLeccion(e, "ejercicios");
    if (l) mapa.get(l.modulo.numero)!.push(l);
  }
  for (const lista of mapa.values()) lista.sort(porModuloYOrden);
  return mapa;
}

export async function modulosConQuiz(): Promise<Set<number>> {
  const entradas = await getCollection("quizzes");
  const set = new Set<number>();
  for (const e of entradas) {
    const l = parseLeccion(e, "quizzes");
    if (l) set.add(l.modulo.numero);
  }
  return set;
}

/** Documento suelto (programa, instalación, proyecto, recursos) por id de colección. */
export function docDeEntrada(entry: CollectionEntry<"docs">) {
  const clave = Object.keys(DOCS).find((k) => k.toLowerCase() === entry.id.toLowerCase());
  return clave ? DOCS[clave] : null;
}

export async function leccionesPorModulo(): Promise<Map<number, Leccion[]>> {
  const todas = await lecciones();
  const mapa = new Map<number, Leccion[]>();
  for (const m of MODULOS) mapa.set(m.numero, []);
  for (const l of todas) mapa.get(l.modulo.numero)!.push(l);
  return mapa;
}

export async function prevNext(id: string): Promise<{ prev: Leccion | null; next: Leccion | null }> {
  const todas = await lecciones();
  const i = todas.findIndex((l) => l.id === id);
  return {
    prev: i > 0 ? todas[i - 1] : null,
    next: i >= 0 && i < todas.length - 1 ? todas[i + 1] : null,
  };
}

// ---------------------------------------------------------------------------
// Utilidades de presentación
// ---------------------------------------------------------------------------

/** Convierte `código` inline del título a <code>, escapando el resto. */
export function tituloHtml(titulo: string): string {
  const esc = titulo.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/`([^`]+)`/g, "<code>$1</code>");
}

/** Título plano (para <title>, aria-label, búsqueda). */
export function tituloTexto(titulo: string): string {
  return titulo.replace(/`/g, "");
}

export function etiquetaSesion(l: Pick<Leccion, "sesion">): string {
  if (!l.sesion) return "";
  return l.sesion.includes("–") ? `Sesiones ${l.sesion}` : `Sesión ${l.sesion}`;
}

export function nn(n: number): string {
  return String(n).padStart(2, "0");
}
