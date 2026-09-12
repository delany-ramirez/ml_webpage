/**
 * Publica los notebooks del contenido en `/notebooks/modulo-N/<archivo>.ipynb` para que el
 * botón «Descargar» funcione (misma origen → el atributo `download` guarda el archivo; GitHub
 * raw lo serviría como texto). En build se copian a `dist/`; en `astro dev` se sirven desde
 * el submodule con un middleware. No se copia nada al repositorio.
 */
import fs from "node:fs";
import path from "node:path";
import type { AstroIntegration } from "astro";
import { listarNotebooks, RAIZ_CONTENIDO } from "../lib/notebooks-fs";

export default function notebooks(): AstroIntegration {
  return {
    name: "ml-notebooks",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const m = req.url?.match(/^\/notebooks\/modulo-(\d)\/([a-z0-9-]+\.ipynb)$/);
          if (!m) return next();
          const nb = listarNotebooks().find((n) => n.modulo === Number(m[1]) && n.archivo === m[2]);
          if (!nb) return next();
          res.setHeader("Content-Type", "application/x-ipynb+json");
          fs.createReadStream(path.join(RAIZ_CONTENIDO, nb.rutaContenido)).pipe(res);
        });
      },
      "astro:build:done": ({ dir, logger }) => {
        const salida = new URL("notebooks/", dir);
        let n = 0;
        for (const nb of listarNotebooks()) {
          const destino = new URL(`modulo-${nb.modulo}/${nb.archivo}`, salida);
          fs.mkdirSync(new URL("./", destino), { recursive: true });
          fs.copyFileSync(path.join(RAIZ_CONTENIDO, nb.rutaContenido), destino);
          n++;
        }
        logger.info(`${n} notebooks copiados a /notebooks/`);
      },
    },
  };
}
