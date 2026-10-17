// Base de datos Postgres local (PGlite) para desarrollo, sin instalar nada ni usar Supabase.
// Los datos quedan en .local-db/. Uso: npm run db:local (dejarlo corriendo).
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = 54329;
const db = await PGlite.create("./.local-db", { extensions: { btree_gist } });
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
await server.start();
console.log(`Base local lista en postgresql://postgres:postgres@127.0.0.1:${port}/postgres`);

const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
