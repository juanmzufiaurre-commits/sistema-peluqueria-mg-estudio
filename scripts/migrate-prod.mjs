// Aplica las migraciones pendientes a la base REAL de Supabase, pidiendo la contraseña por teclado
// (no se muestra ni se guarda en ningún archivo). Uso: node scripts/migrate-prod.mjs
// 1) muestra qué migraciones faltan, 2) pregunta si aplicarlas, 3) las aplica.
import { spawnSync } from "node:child_process";
import readline from "node:readline";

// Conexión "Session pooler" de Supabase (no es secreta; la contraseña se pide aparte).
const USER = process.env.SUPABASE_DB_USER ?? "postgres.wndfacfzxuyplalnupdx";
const HOST = process.env.SUPABASE_DB_HOST ?? "aws-0-us-east-1.pooler.supabase.com";
const PORT = process.env.SUPABASE_DB_PORT ?? "5432";

/** Pregunta por consola. Con `hidden`, no muestra lo que se escribe. */
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
        else if (s !== "\r\n" && s !== "\n") rl.output.write("*");
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

function prisma(args, env) {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  return spawnSync(npx, ["prisma", ...args], { stdio: "inherit", env, shell: process.platform === "win32" });
}

const password = await ask("Contraseña de la base de Supabase: ", true);
if (!password) {
  console.log("No ingresaste contraseña. No se hizo nada.");
  process.exit(1);
}

const url = `postgresql://${USER}:${encodeURIComponent(password)}@${HOST}:${PORT}/postgres`;
const env = { ...process.env, DIRECT_URL: url, DATABASE_URL: url };

console.log("\n1) Migraciones pendientes en la base real:\n");
const status = prisma(["migrate", "status"], env);
// `migrate status` sale con código 1 cuando hay migraciones pendientes: no es un error.
if (status.error) {
  console.error("No se pudo ejecutar Prisma:", status.error.message);
  process.exit(1);
}

const answer = await ask("\n2) ¿Aplicar las migraciones pendientes a la base real? (s/n): ");
if (answer.toLowerCase() !== "s") {
  console.log("Cancelado. No se cambió nada.");
  process.exit(0);
}

console.log("\n3) Aplicando…\n");
const deploy = prisma(["migrate", "deploy"], env);
if (deploy.status === 0) console.log("\nListo: la base real ya tiene las migraciones. Ya se pueden subir los cambios a GitHub.");
else console.log("\nAlgo falló: copiá el mensaje de arriba (no tiene la contraseña) para revisarlo antes de reintentar.");
process.exit(deploy.status ?? 1);
