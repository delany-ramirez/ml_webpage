/**
 * Segunda barrera contra la publicación de material del docente.
 * Falla (exit 1) si en dist/ hay rutas `-sol` o páginas con el texto de las claves.
 * El loader ya excluye `*-sol.md`; esto comprueba el resultado final del build.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const MARCAS = ["Material del docente", "Clave · Quiz", "Clave · Ejercicio"];

function* archivos(dir) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) yield* archivos(ruta);
    else yield ruta;
  }
}

const problemas = [];
for (const ruta of archivos(DIST)) {
  if (/-sol[\\/.]/i.test(ruta)) problemas.push(`ruta sospechosa: ${ruta}`);
  if (ruta.endsWith(".html")) {
    const html = readFileSync(ruta, "utf8");
    for (const marca of MARCAS) {
      if (html.includes(marca)) problemas.push(`"${marca}" en ${ruta}`);
    }
  }
}

if (problemas.length > 0) {
  console.error("✖ Material del docente detectado en el build:\n  " + problemas.join("\n  "));
  process.exit(1);
}
console.log("✓ dist/ sin material del docente");
