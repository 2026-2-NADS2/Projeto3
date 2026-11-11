import { lerAmbiente } from "./config/ambiente.js";
import { criarPool } from "./banco/pool.js";
import { criarApp } from "./app.js";
import { transporteEmail } from "./servicos/email.js";

const orientacoes = {
  ECONNREFUSED: "Inicie o MySQL e confira DB_HOST e DB_PORT no .env do backend.",
  ER_ACCESS_DENIED_ERROR:
    "O MySQL recusou as credenciais. Confira DB_USER e DB_PASSWORD no .env do backend.",
  ER_DBACCESS_DENIED_ERROR:
    "O usuário do MySQL não tem acesso ao banco informado em DB_NAME.",
  ER_BAD_DB_ERROR: "Crie o banco informado em DB_NAME antes de iniciar a API.",
  ER_NO_SUCH_TABLE: "Prepare o banco com npm run db:migrar antes de iniciar a API.",
};

let pool;
try {
  const config = lerAmbiente();
  pool = criarPool(config.db);
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
    "Não foi possível iniciar a API do Collision.",
    orientacoes[erro.code] || erro.code || erro.message,
  );
  await pool?.end();
  process.exitCode = 1;
}
