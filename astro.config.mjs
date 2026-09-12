// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkQuitarH1 from "./src/plugins/remark-quitar-h1.ts";
import remarkEnlacesContenido from "./src/plugins/remark-enlaces-contenido.ts";
import remarkEnlacesCruzados from "./src/plugins/remark-enlaces-cruzados.ts";
import notebooks from "./src/integrations/notebooks.ts";

// https://astro.build/config
export default defineConfig({
  site: "https://ml.delanyr.dev",
  trailingSlash: "always",
  integrations: [mdx(), sitemap(), notebooks()],
  markdown: {
    remarkPlugins: [remarkMath, remarkQuitarH1, remarkEnlacesContenido, remarkEnlacesCruzados],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      // Dos temas: el CSS del sitio elige uno según [data-theme] (ver global.css).
      themes: { dark: "github-dark-default", light: "github-light-default" },
      defaultColor: false,
    },
  },
});
