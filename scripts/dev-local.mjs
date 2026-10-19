// Desarrollo local en un solo comando: prende la base PGlite (si no está prendida) y después `next dev`.
// Al cortar (Ctrl-C) se apagan las dos. Uso: npm run dev:local
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";

const DB_PORT = 54329;
const require = createRequire(import.meta.url);

const isOpen = (port) =>
  new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });

async function waitFor(port, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await isOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const children = [];
const stopAll = () => {
  for (const c of children) if (!c.killed) c.kill();
};
process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});
process.on("exit", stopAll);

if (await isOpen(DB_PORT)) {
  console.log("Base local ya estaba prendida.");
} else {
  const db = spawn(process.execPath, ["scripts/local-db.mjs"], { stdio: "inherit" });
  children.push(db);
  db.on("exit", (code) => {
    console.error(`La base local se apagó (código ${code}).`);
    stopAll();
    process.exit(1);
  });
  if (!(await waitFor(DB_PORT, 20_000))) {
    console.error("La base local no arrancó a tiempo.");
    stopAll();
    process.exit(1);
  }
}

const next = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...process.argv.slice(2)], { stdio: "inherit" });
children.push(next);
next.on("exit", (code) => {
  stopAll();
  process.exit(code ?? 0);
});
