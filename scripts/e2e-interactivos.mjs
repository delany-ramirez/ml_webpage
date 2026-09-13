// E2E de la Fase 3 (quiz de autoevaluación y widget) con Chrome headless vía CDP.
// Uso: npm run preview (en otra terminal) y luego `node scripts/e2e-interactivos.mjs`.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const perfil = mkdtempSync(join(tmpdir(), "ml-e2e-"));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9334", `--user-data-dir=${perfil}`, "--no-first-run", "--window-size=1440,1000", "about:blank"], { stdio: "ignore" });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pendientes = new Map();
async function conectar() {
  for (let i = 0; i < 40; i++) {
    try {
      const lista = await (await fetch("http://127.0.0.1:9334/json")).json();
      const pag = lista.find((p) => p.type === "page");
      if (pag) { ws = new WebSocket(pag.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); break; }
    } catch {}
    await espera(250);
  }
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pendientes.has(d.id)) { pendientes.get(d.id)(d); pendientes.delete(d.id); } };
}
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pendientes.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ir = async (url) => { await cmd("Page.navigate", { url }); await espera(1200); };
const js = async (expr) => { const r = await cmd("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };
const ok = (c, m) => { if (!c) { console.error("✖", m); chrome.kill(); process.exit(1); } console.log("✓", m); };
const foto = async (nombre) => { const s = await cmd("Page.captureScreenshot", { format: "jpeg", quality: 70 }); writeFileSync(`dist/_e2e-${nombre}.jpg`, Buffer.from(s.result.data, "base64")); };
const W = "document.querySelector('iframe.widget-iframe')";

await conectar();
await cmd("Page.enable");
const B = "http://localhost:4321";

// --- quiz completo del módulo ---
await ir(`${B}/modulo/3/autoevaluacion/`);
ok((await js(`document.querySelectorAll('[data-quiz] .q-opcion').length`)) === 4, "quiz: 4 opciones en la primera pregunta");
ok((await js(`document.querySelector('[data-q-contador]').textContent`)) === "1 / 10", "quiz: contador 1 / 10");
await js(`document.querySelectorAll('[data-quiz] .q-opcion')[0].click()`); // m3-01: la 0 es incorrecta
ok((await js(`document.querySelector('[data-q-feedback]').classList.contains('err')`)), "quiz: feedback de error");
ok((await js(`document.querySelectorAll('[data-quiz] .q-opcion.correcta').length`)) === 1, "quiz: se resalta la correcta");
ok((await js(`document.querySelectorAll('[data-quiz] .q-opcion:disabled').length`)) === 4, "quiz: opciones bloqueadas tras responder");
await foto("quiz-feedback");
await js(`(async () => {
  const datos = JSON.parse(document.querySelector('[data-quiz-datos]').textContent);
  const sig = document.querySelector('[data-q-siguiente]');
  for (let i = 1; i < datos.length; i++) {
    sig.click(); await new Promise(r => setTimeout(r, 30));
    document.querySelectorAll('[data-quiz] .q-opcion')[datos[i].correcta].click();
    await new Promise(r => setTimeout(r, 30));
  }
  sig.click();
})()`);
await espera(300);
ok(!(await js(`document.querySelector('[data-q-final]').hidden`)), "quiz: pantalla final visible");
ok((await js(`document.querySelector('[data-q-score]').textContent`)) === "9", "quiz: puntaje 9");
ok((await js(`JSON.parse(localStorage.getItem('ml.delanyr.dev/progress/v1')).autoevaluacion['autoevaluacion/3'].score`)) === 9, "quiz: puntaje guardado en el progreso");
await foto("quiz-final");
await js(`document.querySelector('[data-q-reintentar]').click()`);
await espera(100);
ok((await js(`document.querySelector('[data-q-contador]').textContent`)) === "1 / 10", "quiz: reintentar vuelve a 1 / 10");
await js(`(async () => {
  const datos = JSON.parse(document.querySelector('[data-quiz-datos]').textContent);
  const sig = document.querySelector('[data-q-siguiente]');
  for (let i = 0; i < datos.length; i++) {
    document.querySelectorAll('[data-quiz] .q-opcion')[(datos[i].correcta + 1) % 4].click();
    await new Promise(r => setTimeout(r, 30)); sig.click(); await new Promise(r => setTimeout(r, 30));
  }
})()`);
await espera(300);
ok((await js(`JSON.parse(localStorage.getItem('ml.delanyr.dev/progress/v1')).autoevaluacion['autoevaluacion/3'].score`)) === 9, "quiz: 0/10 no pisa el mejor puntaje (9)");
ok(!(await js(`document.querySelector('[data-q-mejor]').hidden`)), "quiz: muestra el mejor puntaje guardado");

// --- lección con bloques complementarios y widget ---
await ir(`${B}/modulo/3/teoria/02-descenso-gradiente/`);
ok((await js(`document.querySelectorAll('.complementos .bloque').length`)) === 3, "lección: bloques Explora/Practica/Comprueba");
ok(/\/widgets\/descenso-gradiente\.html\?theme=(dark|light)$/.test(await js(`${W}.src`)), "widget: src con ?theme=");
await js(`${W}.scrollIntoView({block:'center'})`);
await espera(1500); // lazy load
ok(await js(`${W}.contentDocument?.getElementById('c1') !== null`), "widget: iframe cargado con el canvas");
const temaAntes = await js(`${W}.contentDocument.documentElement.dataset.theme`);
await js(`document.querySelector('[data-theme-toggle]').click()`);
await espera(200);
const temaDespues = await js(`${W}.contentDocument.documentElement.dataset.theme`);
ok(temaAntes !== temaDespues, `widget: cambia de tema con el toggle (${temaAntes} → ${temaDespues})`);
await js(`${W}.contentDocument.getElementById('paso').click()`);
ok((await js(`${W}.contentDocument.getElementById('it').textContent`)) === "1", "widget: un paso avanza la iteración");
await js(`(() => { const d = ${W}.contentDocument; d.getElementById('eta').value = 1.15; d.getElementById('eta').dispatchEvent(new Event('input')); for (let i = 0; i < 30; i++) d.getElementById('paso').click(); })()`);
ok((await js(`${W}.contentDocument.getElementById('estado').className`)).includes("err"), "widget: eta = 1.15 diverge");
const alto = await js(`parseInt(${W}.style.height)`);
ok(alto >= 400 && alto <= 1200, `widget: alto ajustado por WIDGET_HEIGHT (${alto}px)`);
ok((await js(`document.querySelectorAll('.comprueba [data-quiz] .q-opcion').length`)) === 4, "lección: quiz Comprueba presente");
ok((await js(`document.querySelector('.comprueba [data-q-contador]').textContent`)) === "1 / 2", "lección: 2 preguntas etiquetadas para esta lección");
await foto("leccion-explora");

// --- progreso lista las autoevaluaciones ---
await ir(`${B}/progreso/`);
ok(!(await js(`document.getElementById('autoevaluaciones').hidden`)), "progreso: sección de autoevaluaciones visible");
ok((await js(`document.querySelector('#auto-lista .al-score').textContent`)) === "9 / 10 · 90%", "progreso: 9 / 10 · 90%");

// --- otra autoevaluación (módulo 6, 10 preguntas): todas correctas, guardado, y el bloque Comprueba de una lección del módulo 1 ---
await ir(`${B}/modulo/6/autoevaluacion/`);
const n6 = await js(`JSON.parse(document.querySelector('[data-quiz-datos]').textContent).length`);
ok(n6 === 10, `quiz M6: ${n6} preguntas`);
ok((await js(`JSON.parse(document.querySelector('[data-quiz-datos]').textContent).every(q => q.correcta >= 0 && q.correcta < q.opciones.length)`)), "quiz M6: índices de la correcta dentro de rango");
ok((await js(`new Set(JSON.parse(document.querySelector('[data-quiz-datos]').textContent).map(q => q.correcta)).size`)) >= 3, "quiz M6: la opción correcta cambia de posición");
await js(`(async () => {
  const datos = JSON.parse(document.querySelector('[data-quiz-datos]').textContent);
  const sig = document.querySelector('[data-q-siguiente]');
  for (let i = 0; i < datos.length; i++) {
    document.querySelectorAll('[data-quiz] .q-opcion')[datos[i].correcta].click();
    await new Promise(r => setTimeout(r, 30)); sig.click(); await new Promise(r => setTimeout(r, 30));
  }
})()`);
await espera(300);
ok((await js(`document.querySelector('[data-q-score]').textContent`)) === "10", "quiz M6: 10 / 10");
ok((await js(`JSON.parse(localStorage.getItem('ml.delanyr.dev/progress/v1')).autoevaluacion['autoevaluacion/6'].score`)) === 10, "quiz M6: guardado en el progreso");
await ir(`${B}/modulo/1/teoria/01-que-es-machine-learning/`);
ok((await js(`document.querySelector('.comprueba [data-q-contador]').textContent`)) === "1 / 2", "lección M1·01: bloque Comprueba con sus 2 preguntas");
ok((await js(`document.querySelectorAll('.practica .b-nbs').length`)) === 0, "lección M1·01: Practica sin notebooks (los ejercicios de M1 no citan ninguno)");
await ir(`${B}/modulo/6/teoria/04-monitoreo-y-drift/`);
ok((await js(`${W}.dataset.src`)) === "/widgets/drift-psi.html", "lección M6·04: widget de drift registrado");
await js(`${W}.scrollIntoView({block:'center'})`);
await espera(1500);
ok((await js(`${W}.contentDocument?.getElementById('l-al')?.textContent`) ?? "").includes("PSI mes"), "widget drift: alarma de PSI calculada");
await ir(`${B}/modulo/1/teoria/05-calculo-y-probabilidad/`);
ok((await js(`${W}.dataset.src`)) === "/widgets/bayes-clase-rara.html", "lección M1·05: widget de Bayes registrado");
await js(`${W}.scrollIntoView({block:'center'})`);
await espera(1500);
ok((await js(`${W}.contentDocument?.getElementById('l-ppv')?.textContent`) ?? "") === "16.7 %", "widget Bayes: P(condición | +) = 16.7 % en el caso de la lección");
await ir(`${B}/progreso/`);
ok((await js(`document.querySelectorAll('#auto-lista .al-score').length`)) === 2, "progreso: dos autoevaluaciones listadas");

chrome.kill();
console.log("listo");
