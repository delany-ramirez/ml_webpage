/**
 * Inventario de notebooks del contenido leído del sistema de archivos (sin `astro:content`,
 * para poder usarse desde la integración de build). La descripción y el tipo se toman de la
 * tabla «Notebooks» del README de cada módulo, que es la fuente que el docente mantiene.
 */
import fs from "node:fs";
import path from "node:path";
import { MODULOS, urlGitHub, urlColab } from "./rutas";

export const RAIZ_CONTENIDO = path.resolve(process.cwd(), "content");

export interface Notebook {
  modulo: number;
  orden: number;
  archivo: string;
  /** Título del primer H1 del notebook (`# NN · Título`), sin el prefijo; el nombre de archivo si no hay */
  titulo: string;
  /** ruta relativa al repositorio de contenido */
  rutaContenido: string;
  /** "intuición" | "aplicado" | otro texto del README */
  tipo: string | null;
  /** Markdown inline del README (puede traer `código`) */
  descripcion: string | null;
  github: string;
  colab: string;
  /** ruta pública del archivo en este sitio */
  descarga: string;
}

// | 01 | [`notebooks/x.ipynb`](notebooks/x.ipynb) | tipo | contenido |
const RE_FILA = /^\|\s*\d+\s*\|\s*\[`notebooks\/([^`]+\.ipynb)`\][^|]*\|\s*([^|]*?)\s*\|\s*(.*?)\s*\|\s*$/;

function filasReadme(carpeta: string): Map<string, { tipo: string; descripcion: string }> {
  const mapa = new Map<string, { tipo: string; descripcion: string }>();
  const ruta = path.join(RAIZ_CONTENIDO, carpeta, "README.md");
  if (!fs.existsSync(ruta)) return mapa;
  for (const linea of fs.readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const m = linea.match(RE_FILA);
    if (m) mapa.set(m[1], { tipo: m[2], descripcion: m[3] });
  }
  return mapa;
}

/** Lee el H1 de la primera celda Markdown del notebook. */
function tituloDesdeNotebook(rutaAbs: string, archivo: string): string {
  try {
    const nb = JSON.parse(fs.readFileSync(rutaAbs, "utf8"));
    for (const celda of nb.cells ?? []) {
      if (celda.cell_type !== "markdown") continue;
      const texto = Array.isArray(celda.source) ? celda.source.join("") : String(celda.source ?? "");
      const h1 = texto.match(/^#\s+(.+?)\s*$/m)?.[1];
      if (h1) return h1.replace(/^\d{2}\s+·\s+/, "");
    }
  } catch {
    /* notebook ilegible: se usa el nombre de archivo */
  }
  return archivo.replace(/\.ipynb$/, "");
}

let cache: Notebook[] | null = null;

export function listarNotebooks(): Notebook[] {
  if (cache) return cache;
  const lista: Notebook[] = [];
  for (const modulo of MODULOS) {
    const dir = path.join(RAIZ_CONTENIDO, modulo.carpeta, "notebooks");
    if (!fs.existsSync(dir)) continue;
    const filas = filasReadme(modulo.carpeta);
    for (const archivo of fs.readdirSync(dir).filter((f) => /^[a-z0-9-]+\.ipynb$/.test(f)).sort()) {
      const rutaContenido = `${modulo.carpeta}/notebooks/${archivo}`;
      const fila = filas.get(archivo);
      lista.push({
        modulo: modulo.numero,
        orden: parseInt(archivo.match(/^(\d+)-/)?.[1] ?? "0", 10),
        archivo,
        titulo: tituloDesdeNotebook(path.join(dir, archivo), archivo),
        rutaContenido,
        tipo: fila?.tipo ?? null,
        descripcion: fila?.descripcion ?? null,
        github: urlGitHub(rutaContenido),
        colab: urlColab(rutaContenido),
        descarga: `/notebooks/modulo-${modulo.numero}/${archivo}`,
      });
    }
  }
  cache = lista;
  return lista;
}

export function notebooksDe(numeroModulo: number): Notebook[] {
  return listarNotebooks().filter((n) => n.modulo === numeroModulo);
}

/** Notebooks del módulo citados en un texto (por nombre de archivo, con o sin ruta). */
export function notebooksCitados(texto: string, numeroModulo: number): Notebook[] {
  const citados = new Set(Array.from(texto.matchAll(/([a-z0-9-]+\.ipynb)/g), (m) => m[1]));
  return notebooksDe(numeroModulo).filter((nb) => citados.has(nb.archivo));
}
