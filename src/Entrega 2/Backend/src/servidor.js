import { lerAmbiente } from "./config/ambiente.js";
import { criarPool } from "./banco/pool.js";
import { criarApp } from "./app.js";
import { transporteEmail } from "./servicos/email.js";

const config = lerAmbiente(),
  pool = criarPool(config.db);
try {
  await pool.execute("SELECT 1");
  // Nao instala schema nem dados implicitamente ao iniciar a API.
  await pool.execute("SELECT nome FROM SCHEMA_MIGRATION LIMIT 1");
  const app = criarApp({ pool, config, enviarEmail: transporteEmail(config) });
  const servidor = app.listen(config.port, config.host, () =>
    console.log(
      `Collision API em http://${config.host}:${config.port}/api/saude`,
    ),
  );
  servidor.on("error", async (erro) => {
    console.error("Não foi possível abrir a porta da API:", erro.code);
    await pool.end();
    process.exitCode = 1;
  });
  let encerrando = false;
  const encerrar = () => {
    if (encerrando) return;
    encerrando = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    servidor.close(async () => {
      await pool.end();
      clearTimeout(timeout);
      process.exitCode = 0;
    });
  };
  process.on("SIGINT", encerrar);
  process.on("SIGTERM", encerrar);
} catch (erro) {
  console.error(
    "API não iniciada. Confira o ambiente e execute db:migrar.",
    erro.code || erro.message,
  );
  await pool.end();
  process.exitCode = 1;
}
