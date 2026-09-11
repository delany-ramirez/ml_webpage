/**
 * Mapa entre rutas del repositorio de contenido (`content/...`) y rutas públicas del sitio.
 *
 * Sin dependencias de `astro:content` para poder usarse también desde plugins remark
 * (que corren en el proceso de build de Vite, fuera del runtime de Astro).
 */

export const REPO_CONTENIDO = "https://github.com/delany-ramirez/machine_learning";
export const RAMA_CONTENIDO = "main";

export interface Modulo {
  numero: number;
  carpeta: string;
  nombre: string;
  corto: string;
  sesiones: [number, number];
  horas: number;
}

/** Espejo de content/docs/programa.md (fuente de verdad). */
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

/** Documentos sueltos del contenido publicados como página propia (clave: ruta sin `.md`). */
export const DOCS: Record<string, { ruta: string; titulo: string; nav: string }> = {
  "docs/programa": { ruta: "/programa/", titulo: "Programa del curso", nav: "Programa" },
  "modulo-0-instalacion/README": { ruta: "/instalacion/", titulo: "Instalación del software", nav: "Instalación" },
  "docs/guia-entorno": { ruta: "/instalacion/resumen/", titulo: "Guía corta del entorno", nav: "Guía corta" },
  "proyecto-integrador/README": { ruta: "/proyecto-integrador/", titulo: "Proyecto integrador", nav: "Proyecto" },
  "recursos/README": { ruta: "/recursos/", titulo: "Recursos generales", nav: "Recursos" },
};

export function docPorRuta(rutaContenido: string) {
  const clave = rutaContenido.replace(/\.md$/i, "").replace(/\/$/, "");
  const directa = DOCS[clave];
  if (directa) return directa;
  // Una carpeta enlaza a su README: `proyecto-integrador/` → `proyecto-integrador/README`
  return DOCS[`${clave}/README`];
}

export function urlGitHub(rutaContenido: string, esDirectorio = false): string {
  const tipo = esDirectorio ? "tree" : "blob";
  return `${REPO_CONTENIDO}/${tipo}/${RAMA_CONTENIDO}/${rutaContenido.replace(/^\/+/, "")}`;
}

export function urlColab(rutaNotebook: string): string {
  return `https://colab.research.google.com/github/delany-ramirez/machine_learning/blob/${RAMA_CONTENIDO}/${rutaNotebook}`;
}

/**
 * Traduce una ruta relativa al repositorio de contenido a un destino público.
 * Devuelve `null` cuando el destino no debe enlazarse (material del docente).
 */
export function destinoDeContenido(rutaContenido: string): string | null {
  const ruta = rutaContenido.replace(/^\.?\//, "").replace(/\\/g, "/");
  const esDir = ruta.endsWith("/") || !/\.[a-z0-9]+$/i.test(ruta);

  if (/-sol\.md$/i.test(ruta)) return null;

  const doc = docPorRuta(ruta);
  if (doc) return doc.ruta;

  const m = ruta.match(/^(modulo-\d-[^/]+)\/?(.*)$/);
  if (m) {
    const modulo = moduloPorCarpeta(m[1]);
    const resto = m[2];
    if (modulo) {
      if (resto === "" || /^README\.md$/i.test(resto)) return `/modulo/${modulo.numero}/`;
      let t = resto.match(/^teoria\/([^/]+)\.md$/i);
      if (t) return `/modulo/${modulo.numero}/teoria/${t[1]}/`;
      t = resto.match(/^ejercicios\/([^/]+)\.md$/i);
      if (t) return `/modulo/${modulo.numero}/ejercicios/${t[1]}/`;
      if (/^quiz\/quiz-modulo-\d\.md$/i.test(resto)) return `/modulo/${modulo.numero}/quiz/`;
    }
  }

  return urlGitHub(ruta, esDir);
}
