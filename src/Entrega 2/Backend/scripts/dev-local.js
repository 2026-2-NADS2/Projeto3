// Ambiente local persistente, separado dos servicos MySQL/Wamp existentes.
// Credenciais aleatorias ficam somente em .local (ignorada pelo Git).
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import { migrar } from "./migrar.js";
import { inserirDemo } from "./seed-demo.js";
import { criarPool, um } from "../src/banco/pool.js";
import { criarApp } from "../src/app.js";
import { transporteEmail } from "../src/servicos/email.js";

const base = path.resolve(".local/mysql-integrado"),
  data = path.join(base, "data"),
  configFile = path.join(base, "config.json"),
  lockFile = path.join(base, "execucao.lock");
await fs.mkdir(base, { recursive: true });
try {
  const anterior = JSON.parse(await fs.readFile(lockFile, "utf8"));
  let vivo = true;
  try {
    process.kill(anterior.pid, 0);
  } catch (erro) {
    if (erro.code === "ESRCH") vivo = false;
    else throw erro;
  }
  if (vivo)
    throw new Error(
      "O ambiente local ja esta em execucao. Encerre o terminal anterior antes de iniciar outro.",
    );
  await fs.unlink(lockFile);
} catch (erro) {
  if (erro.code !== "ENOENT") throw erro;
}
await fs.writeFile(lockFile, JSON.stringify({ pid: process.pid }), {
  flag: "wx",
  mode: 0o600,
});
let servidorMysql,
  root,
  pool,
  http,
  encerrando = false;
async function encerrar() {
  if (encerrando) return;
  encerrando = true;
  if (http)
    await new Promise((r) => {
      http.close(r);
      http.closeIdleConnections();
    });
  if (pool) await pool.end();
  if (root) {
    try {
      await root.query("SHUTDOWN");
    } catch {}
    await root.end().catch(() => {});
  }
  if (servidorMysql && servidorMysql.exitCode === null) {
    await Promise.race([
      new Promise((r) => servidorMysql.once("exit", r)),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
    if (servidorMysql.exitCode === null) servidorMysql.kill();
  }
  await fs.unlink(lockFile).catch(() => {});
}
process.on("SIGINT", () => encerrar().catch(console.error));
process.on("SIGTERM", () => encerrar().catch(console.error));
try {
  let local;
  try {
    local = JSON.parse(await fs.readFile(configFile, "utf8"));
  } catch (erro) {
    if (erro.code !== "ENOENT") throw erro;
  }
  const novo = !local;
  let bin;
  for (const candidato of [
    process.env.MYSQL_BIN,
    local?.mysqlBin,
    "C:/wamp64/bin/mysql/mysql8.4.7/bin/mysqld.exe",
    "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe",
  ].filter(Boolean))
    try {
      await fs.access(candidato);
      bin = candidato;
      break;
    } catch {}
  if (!bin)
    throw new Error("Defina MYSQL_BIN com o caminho do mysqld instalado.");
  const porta = local?.porta ?? Number(process.env.MYSQL_LOCAL_PORT || 13307);
  if (!Number.isInteger(porta) || porta < 1024 || porta > 65535)
    throw new Error("MYSQL_LOCAL_PORT invalida.");
  // Confere as portas antes de inicializar um novo diretório de dados.
  const portaApi = Number(process.env.PORT || 3334);
  if (
    !Number.isInteger(portaApi) ||
    portaApi < 1024 ||
    portaApi > 65535 ||
    portaApi === porta
  )
    throw new Error("PORT invalida ou igual a porta do MySQL.");
  for (const [numero, nome] of [
    [porta, "MySQL"],
    [portaApi, "API"],
  ]) {
    await new Promise((resolve, reject) => {
      const s = net.createServer();
      s.once("error", (erro) =>
        reject(new Error(`Porta ${numero} do ${nome}: ${erro.code}.`)),
      );
      s.listen(numero, "127.0.0.1", () => s.close(resolve));
    });
  }
  if (novo) {
    local = {
      mysqlBin: bin,
      porta,
      rootPassword: randomBytes(32).toString("hex"),
      password: randomBytes(32).toString("hex"),
      jwtSecret: randomBytes(48).toString("hex"),
      demoPassword: randomBytes(18).toString("base64url"),
    };
    await fs.mkdir(data, { recursive: true });
    if ((await fs.readdir(data)).length)
      throw new Error(
        "Diretorio de dados sem configuracao. Inspecione .local/mysql-integrado antes de continuar; nenhum arquivo foi apagado.",
      );
    const codigo = await new Promise((resolve, reject) => {
      const p = spawn(
        bin,
        [
          "--no-defaults",
          "--initialize-insecure",
          "--datadir=" + data,
          "--basedir=" + path.dirname(path.dirname(bin)),
        ],
        { windowsHide: true, stdio: "ignore" },
      );
      p.on("error", reject);
      p.on("exit", resolve);
    });
    if (codigo !== 0)
      throw new Error(
        "Inicializacao MySQL falhou. Consulte os arquivos .err em .local/mysql-integrado/data.",
      );
  }
  servidorMysql = spawn(
    bin,
    [
      "--no-defaults",
      "--datadir=" + data,
      "--basedir=" + path.dirname(path.dirname(bin)),
      "--bind-address=127.0.0.1",
      "--port=" + local.porta,
      "--mysqlx=OFF",
      "--skip-log-bin",
      "--innodb-buffer-pool-size=64M",
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  for (let i = 0; i < 100; i++) {
    try {
      root = await mysql.createConnection({
        host: "127.0.0.1",
        port: local.porta,
        user: "root",
        password: novo ? "" : local.rootPassword,
        connectTimeout: 1000,
      });
      break;
    } catch {
      if (servidorMysql.exitCode !== null) break;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  if (!root)
    throw new Error(
      "MySQL local nao iniciou. Consulte .local/mysql-integrado/data.",
    );
  if (novo) {
    await root.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [
      local.rootPassword,
    ]);
    await root.query(
      "CREATE DATABASE collision_api_local CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci",
    );
    await root.query(
      "CREATE USER 'collision_local'@'localhost' IDENTIFIED BY ?",
      [local.password],
    );
    await root.query(
      "GRANT ALL PRIVILEGES ON collision_api_local.* TO 'collision_local'@'localhost'",
    );
    await fs.writeFile(configFile, JSON.stringify(local, null, 2), {
      mode: 0o600,
    });
  }
  const config = {
    producao: false,
    db: {
      host: "127.0.0.1",
      port: local.porta,
      database: "collision_api_local",
      user: "collision_local",
      password: local.password,
    },
    jwtSecret: local.jwtSecret,
    jwtTtl: 1800,
    origens: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:4174",
      "http://localhost:4174",
    ],
    frontendUrl: "http://localhost:5173",
    smtp: null,
  };
  pool = criarPool(config.db);
  await migrar(pool);
  if (!(await um(pool, "SELECT COUNT(*) total FROM USUARIO")).total)
    await inserirDemo(pool, local.demoPassword, undefined, {
      tresContas: true,
    });
  const contas = ["admin", "ana.paula", "carlos.almeida"].map((x) => ({
    email: x + "@example.com",
    senha: local.demoPassword,
  }));
  await fs.writeFile(
    ".local/acessos-fullstack.json",
    JSON.stringify(
      { aviso: "Credenciais locais ficticias. Nao publicar.", contas },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  http = criarApp({
    pool,
    config,
    enviarEmail: transporteEmail(config),
  }).listen(portaApi, "127.0.0.1");
  await new Promise((resolve, reject) => {
    http.once("listening", resolve);
    http.once("error", reject);
  });
  console.log(`API local em http://127.0.0.1:${portaApi}/api/saude`);
  console.log(
    "Credenciais: .local/acessos-fullstack.json. Dados persistentes: .local/mysql-integrado/data.",
  );
  console.log(
    "Ctrl+C encerra API e MySQL isolado. Os dados permanecem para a proxima execucao.",
  );
} catch (erro) {
  console.error(erro.message);
  await encerrar();
  process.exitCode = 1;
}
