// Prueba end-to-end del progreso con Chrome headless vía CDP (sin dependencias).
// Uso: npm run preview (en otra terminal) y luego `node scripts/e2e-progreso.mjs`.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const perfil = mkdtempSync(join(tmpdir(), "ml-e2e-"));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9333", `--user-data-dir=${perfil}`, "--no-first-run", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pendientes = new Map();
async function conectar() {
  for (let i = 0; i < 40; i++) {
    try {
      const lista = await (await fetch("http://127.0.0.1:9333/json")).json();
      const pag = lista.find((p) => p.type === "page");
      if (pag) { ws = new WebSocket(pag.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); break; }
    } catch {}
    await espera(250);
  }
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pendientes.has(d.id)) { pendientes.get(d.id)(d); pendientes.delete(d.id); } };
}
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pendientes.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ir = async (url) => { await cmd("Page.navigate", { url }); await espera(900); };
const js = async (expr) => { const r = await cmd("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };
const ok = (c, m) => { if (!c) { console.error("✖", m); chrome.kill(); process.exit(1); } console.log("✓", m); };

await conectar();
await cmd("Page.enable");
const B = "http://localhost:4321";

await ir(`${B}/modulo/3/teoria/02-descenso-gradiente/`);
ok((await js(`document.querySelectorAll('[data-completar]').length`)) === 2, "lección: 2 botones completar");
ok((await js(`document.querySelector('[data-progreso-texto]').textContent`)) === "0 / 22 · 0%", "sidebar: 0 / 22 · 0% inicial");
await js(`document.querySelector('[data-completar]').click()`);
await espera(200);
ok((await js(`document.querySelector('[data-completar]').getAttribute('aria-pressed')`)) === "true", "clic → aria-pressed=true");
ok((await js(`document.querySelector('[data-completar-texto]').textContent`)) === "Completada", "clic → texto 'Completada'");
ok((await js(`document.querySelector('[data-marca="3/02-descenso-gradiente"]').classList.contains('hecha')`)), "sidebar: marca .hecha");
ok((await js(`document.querySelector('[data-cuenta-modulo="3"]').textContent`)) === "1/6", "sidebar: cuenta módulo 1/6");
ok((await js(`document.querySelector('[data-progreso-texto]').textContent`)) === "1 / 22 · 5%", "sidebar: 1 / 22 · 5%");

await ir(`${B}/modulo/3/teoria/01-regresion-lineal/`);
ok((await js(`document.querySelector('[data-marca="3/02-descenso-gradiente"]').classList.contains('hecha')`)), "persistencia tras navegar");
await js(`document.querySelectorAll('[data-completar]')[1].click()`);
await espera(200);

await ir(`${B}/`);
ok((await js(`document.querySelector('[data-porcentaje-modulo="3"]').textContent`)) === "33%", "landing: módulo 3 al 33%");
ok((await js(`document.querySelector('[data-progreso-modulo="3"]').style.width`)) === "33%", "landing: barra 33%");
ok((await js(`document.querySelector('[data-progreso-texto]').textContent`)) === "2 / 22 · 9%", "landing: 2 / 22 · 9%");

await ir(`${B}/progreso/`);
const codigo = await js(`document.getElementById('codigo-exportar').value`);
ok(codigo.startsWith("MLDR1-"), "progreso: textarea con código exportado");
ok((await js(`document.querySelector('[data-cuenta-modulo="3"]').textContent`)) === "2/6", "progreso: módulo 3 → 2/6");
// reiniciar (confirm → true) e importar
await cmd("Runtime.evaluate", { expression: `window.confirm = () => true; document.getElementById('btn-reiniciar').click()` });
await espera(200);
ok((await js(`document.querySelector('[data-progreso-texto]').textContent`)) === "0 / 22 · 0%", "reiniciar → 0 / 22");
await js(`document.getElementById('codigo-importar').value = ${JSON.stringify(codigo)}; document.getElementById('btn-importar').click()`);
await espera(200);
ok((await js(`document.querySelector('[data-progreso-texto]').textContent`)) === "2 / 22 · 9%", "importar → 2 / 22 restauradas");
ok((await js(`document.getElementById('estado-importar').textContent`)).includes("2 lecciones"), "importar: mensaje de estado");
await js(`document.getElementById('codigo-importar').value = 'xx'; document.getElementById('btn-importar').click()`);
ok((await js(`document.getElementById('estado-importar').textContent`)) === "Código no válido.", "importar: código inválido");

// captura para revisión visual
await js(`window.scrollTo(0,0)`);
const shot = await cmd("Page.captureScreenshot", { format: "jpeg", quality: 70 });
(await import("node:fs")).writeFileSync("dist/_e2e-progreso.jpg", Buffer.from(shot.result.data, "base64"));
chrome.kill();
console.log("listo");
