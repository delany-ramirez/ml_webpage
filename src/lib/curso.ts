/**
 * Metadatos del curso derivados del repositorio de contenido (`content/`).
 *
 * El contenido no lleva frontmatter: cada archivo empieza con `# NN · Título` y una línea
 * `**Módulo N · Sesión S** — tema`. Aquí se parsea eso una sola vez y se expone un modelo
 * uniforme (módulo, orden, sesión, título, ruta pública) para páginas, sidebar y navegación.
 */
import { getCollection, type CollectionEntry } from "astro:content";

// ---------------------------------------------------------------------------
// Malla del curso (espejo de content/docs/programa.md — fuente de verdad)
// ---------------------------------------------------------------------------

export interface Modulo {
  numero: number;
  carpeta: string;
  nombre: string;
  corto: string;
  sesiones: [number, number];
  horas: number;
}

export const MODULOS: Modulo[] = [
  { numero: 1, carpeta: "modulo-1-fundamentos-ciclo-vida", nombre: "Fundamentos y ciclo de vida", corto: "Fundamentos", sesiones: [1, 3], horas: 10.5 },
  { numero: 2, carpeta: "modulo-2-datos-caracteristicas", nombre: "Datos: preprocesamiento e ingeniería de características", corto: "Datos", sesiones: [4, 5], horas: 7 },
  { numero: 3, carpeta: "modulo-3-regresion-evaluacion", nombre: "Supervisado I: regresión y evaluación", corto: "Regresión", sesiones: [6, 8], horas: 10.5 },
  { numero: 4, carpeta: "modulo-4-clasificacion-ensambles", nombre: "Supervisado II: clasificación y ensambles", corto: "Clasificación", sesiones: [9, 11], horas: 10.5 },
  { numero: 5, carpeta: "modulo-5-no-supervisado-deep-learning", nombre: "No supervisado y deep learning", corto: "No supervisado", sesiones: [12, 13], horas: 7 },
  { numero: 6, carpeta: "modulo-6-mlops-despliegue", nombre: "MLOps: trazabilidad y despliegue", corto: "MLOps", sesiones: [14, 14], horas: 3.5 },
];

export function moduloPorNumero(n: number): Modulo | undefined {
  return MODULOS.find((m) => m.numero === n);
}

export function moduloPorCarpeta(carpeta: string): Modulo | undefined {
  return MODULOS.find((m) => m.carpeta === carpeta);
}

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
  /** Ruta pública */
  ruta: string;
}

const RE_H1 = /^#\s+(.+?)\s*$/m;
const RE_META = /^\*\*(?:Módulo\s+\d+\s+·\s+)?Sesi(?:ón|ones)\s+([\d–-]+)\*\*(?:\s*—\s*(.+?))?(?:\s*·.*)?$/im;
const RE_TIEMPO = /Tiempo (?:estimado|sugerido):\s*\*\*([^*]+)\*\*/i;

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
