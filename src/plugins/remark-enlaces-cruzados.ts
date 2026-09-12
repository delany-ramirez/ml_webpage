/**
 * Convierte las referencias en backticks sin enlace del contenido — `01-regresion-lineal.md`,
 * `02-clasificacion-aplicado.ipynb`, `../docs/guia-entorno.md` — en enlaces: a la página del
 * sitio si el archivo se publica, o a GitHub si no (notebooks, docs internos).
 *
 * Resolución de un nombre suelto (`NN-tema.md`): primero en la carpeta del archivo actual,
 * luego en el mismo módulo, y por último en todo el contenido si el nombre es único. Si no se
 * resuelve, o es material del docente (`*-sol.md`), el código queda como está.
 */
import fs from "node:fs";
import path from "node:path";
import type { Root, InlineCode, Link } from "mdast";
import type { VFile } from "vfile";
import { destinoDeContenido } from "../lib/rutas";

const RAIZ_CONTENIDO = path.resolve(process.cwd(), "content");
const EXTENSIONES = /\.(md|ipynb)$/i;
// `NN-tema.md`, `ejNN-tema.md`, `quiz-modulo-N.md`, `../docs/x.md`, `notebooks/x.ipynb`
const RE_REFERENCIA = /^(?:\.\.\/|\.\/)*[A-Za-z0-9_./-]+\.(?:md|ipynb)$/;

/** Índice basename → rutas relativas al contenido (se construye una vez por build). */
let indice: Map<string, string[]> | null = null;

function construirIndice(): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  const recorrer = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) recorrer(abs);
      else if (EXTENSIONES.test(e.name)) {
        const rel = path.relative(RAIZ_CONTENIDO, abs).split(path.sep).join("/");
        const lista = mapa.get(e.name) ?? [];
        lista.push(rel);
        mapa.set(e.name, lista);
      }
    }
  };
  if (fs.existsSync(RAIZ_CONTENIDO)) recorrer(RAIZ_CONTENIDO);
  return mapa;
}

function resolver(referencia: string, dirArchivo: string): string | null {
  if (!indice) indice = construirIndice();

  // Con carpeta explícita: se resuelve relativo al archivo actual y debe existir.
  if (referencia.includes("/")) {
    const rel = path.posix.normalize(path.posix.join(dirArchivo, referencia));
    if (rel.startsWith("..")) return null;
    return fs.existsSync(path.join(RAIZ_CONTENIDO, rel)) ? rel : null;
  }

  const candidatos = indice.get(referencia);
  if (!candidatos || candidatos.length === 0) return null;
  if (candidatos.length === 1) return candidatos[0];

  const enMismaCarpeta = candidatos.find((c) => path.posix.dirname(c) === dirArchivo);
  if (enMismaCarpeta) return enMismaCarpeta;
  const modulo = dirArchivo.split("/")[0];
  const enMismoModulo = candidatos.filter((c) => c.split("/")[0] === modulo);
  return enMismoModulo.length === 1 ? enMismoModulo[0] : null;
}

function visitar(nodo: any, dentroDeEnlace: boolean, fn: (code: InlineCode, padre: any, i: number) => void) {
  const hijos = nodo.children;
  if (!Array.isArray(hijos)) return;
  for (let i = 0; i < hijos.length; i++) {
    const h = hijos[i];
    if (h.type === "inlineCode" && !dentroDeEnlace) fn(h, nodo, i);
    visitar(h, dentroDeEnlace || h.type === "link" || h.type === "linkReference", fn);
  }
}

export default function remarkEnlacesCruzados() {
  return (tree: Root, file: VFile) => {
    if (!file.path) return;
    const relArchivo = path.relative(RAIZ_CONTENIDO, file.path);
    if (relArchivo.startsWith("..")) return;
    const dirArchivo = path.posix.dirname(relArchivo.split(path.sep).join("/"));

    visitar(tree, false, (code, padre, i) => {
      const ref = code.value.trim();
      if (!RE_REFERENCIA.test(ref) || /[<>{}*]/.test(ref)) return;
      if (/-sol\.md$/i.test(ref)) return;

      const rel = resolver(ref, dirArchivo);
      if (!rel) return;
      const destino = destinoDeContenido(rel);
      if (!destino) return;

      const link: Link = {
        type: "link",
        url: destino,
        title: null,
        children: [code],
        data: /^https?:/.test(destino)
          ? { hProperties: { target: "_blank", rel: ["noopener"], class: "ref-externa" } }
          : { hProperties: { class: "ref-interna" } },
      };
      padre.children.splice(i, 1, link);
    });
  };
}
