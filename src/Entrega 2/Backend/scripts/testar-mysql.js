// Cria e encerra uma instancia MySQL propria. Nunca usa nem apaga bancos pessoais.
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import mysql from "mysql2/promise";

const candidatos = [
  process.env.MYSQL_BIN,
  "C:/wamp64/bin/mysql/mysql8.4.7/bin/mysqld.exe",
  "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe",
].filter(Boolean);
let bin;
for (const p of candidatos)
  try {
    await fs.access(p);
    bin = p;
    break;
  } catch {}
if (!bin)
  throw new Error(
    "Defina MYSQL_BIN com o caminho do mysqld para executar testes isolados.",
  );
const pasta = path.resolve(".local", "mysql-testes", randomUUID()),
  dados = path.join(pasta, "data");
await fs.mkdir(dados, { recursive: true });
const porta = await new Promise((resolve) => {
  const s = net.createServer();
  s.listen(0, "127.0.0.1", () => {
    const p = s.address().port;
    s.close(() => resolve(p));
  });
});
const executar = (exe, args, opcoes = {}) =>
  new Promise((resolve, reject) => {
    const filho = spawn(exe, args, { windowsHide: true, ...opcoes });
    filho.once("error", reject);
    filho.once("exit", (code) => resolve(code));
  });
const inicio = await executar(
  bin,
  [
    "--no-defaults",
    "--initialize-insecure",
    "--datadir=" + dados,
    "--basedir=" + path.dirname(path.dirname(bin)),
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
if (inicio !== 0)
  throw new Error(`Falha ao inicializar MySQL isolado. Consulte ${pasta}`);
const servidor = spawn(
  bin,
  [
    "--no-defaults",
    "--datadir=" + dados,
    "--basedir=" + path.dirname(path.dirname(bin)),
    "--bind-address=127.0.0.1",
    "--port=" + porta,
    "--mysqlx=OFF",
    "--skip-log-bin",
    "--innodb-buffer-pool-size=64M",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let root,
  senhaRoot = randomBytes(32).toString("hex");
try {
  for (let i = 0; i < 100; i++) {
    try {
      root = await mysql.createConnection({
        host: "127.0.0.1",
        port: porta,
        user: "root",
        connectTimeout: 1000,
      });
      break;
    } catch {
      if (servidor.exitCode !== null) break;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  if (!root)
    throw new Error(
      "MySQL isolado nao respondeu. Consulte os logs em " + pasta,
    );
  await root.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [
    senhaRoot,
  ]);
  const senha = randomBytes(32).toString("hex");
  await root.query("CREATE USER 'collision_test'@'localhost' IDENTIFIED BY ?", [
    senha,
  ]);
  console.log(
    "MySQL isolado pronto; testes usam banco vazio e credenciais aleatorias.",
  );
  const arquivos = (await fs.readdir("testes"))
    .filter((n) => n.endsWith(".test.js"))
    .map((n) => "testes/" + n);
  let falhas = 0;
  for (const arquivo of arquivos) {
    const banco = "collision_api_test_" + randomBytes(4).toString("hex");
    // Identificador gerado internamente, sem entrada do usuario; um banco novo por arquivo.
    await root.query(
      `CREATE DATABASE ${banco} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
    await root.query(
      `GRANT ALL PRIVILEGES ON ${banco}.* TO 'collision_test'@'localhost'`,
    );
    const codigo = await executar(process.execPath, ["--test", arquivo], {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        DB_HOST: "127.0.0.1",
        DB_PORT: String(porta),
        DB_NAME: banco,
        DB_USER: "collision_test",
        DB_PASSWORD: senha,
        JWT_SECRET: randomBytes(48).toString("hex"),
        COLLISION_MYSQL_TEST: "1",
      },
    });
    if (codigo !== 0) falhas++;
  }
  console.log(
    `Arquivos de teste: ${arquivos.length}; arquivos com falhas: ${falhas}.`,
  );
  process.exitCode = falhas ? 1 : 0;
} finally {
  if (root) {
    try {
      await root.query("SHUTDOWN");
    } catch {}
    await root.end().catch(() => {});
  }
  if (servidor.exitCode === null) {
    await Promise.race([
      new Promise((r) => servidor.once("exit", r)),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
    if (servidor.exitCode === null) servidor.kill();
  }
  console.log(
    "Instancia MySQL de teste encerrada. Os servicos existentes nao foram alterados.",
  );
}
