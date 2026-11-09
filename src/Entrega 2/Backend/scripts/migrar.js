import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { criarPool, linhas, um } from "../src/banco/pool.js";
import { lerAmbiente } from "../src/config/ambiente.js";

// Única equivalência histórica: o SQL de 001 recebeu somente formatação.
// Aceita as duas apresentações em LF e CRLF e mantém a proteção contra alterações de conteúdo.
const checksumsEstrutura = new Set([
  "0547e8d256f055b849c639cc5576c3b69290ef062ddd7d1a52213624bf1051a7",
  "43e3475e207b520d1100871852b30ee6273f5bad088d356540500f89b55a1b97",
  "0dd5e02349e58cf971749e4e8313dfd9ce8d51a0a5a1110c5db54f381905f2e5",
  "54aefd6e9b42c325b68e0b4a4da691ad88664f330a11a4ca0fe6c2a16960eb4e",
]);

export async function migrar(pool) {
  const db = await pool.getConnection();
  try {
    const trava = await um(
      db,
      "SELECT GET_LOCK(CONCAT(DATABASE(), ':migracoes'),10) AS ok",
    );
    if (trava.ok !== 1) throw new Error("Outra migracao esta em andamento.");
    const tabelas = await linhas(db, "SHOW TABLES");
    // MySQL no Windows pode normalizar os nomes para minusculas.
    const nomes = tabelas.map((x) => String(Object.values(x)[0]).toUpperCase());
    if (nomes.length && !nomes.includes("SCHEMA_MIGRATION"))
      throw new Error(
        "Banco existente nao gerenciado. Use um banco NOVO; o SQL academico nao e migrado automaticamente.",
      );
    await db.query(
      "CREATE TABLE IF NOT EXISTS SCHEMA_MIGRATION (nome VARCHAR(200) PRIMARY KEY, checksum CHAR(64) NOT NULL, aplicada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB",
    );
    const pasta = fileURLToPath(new URL("../sql/migracoes/", import.meta.url));
    for (const nome of (await fs.readdir(pasta))
      .filter((x) => x.endsWith(".sql"))
      .sort()) {
      const sql = await fs.readFile(path.join(pasta, nome), "utf8"),
        checksum = createHash("sha256").update(sql).digest("hex");
      const anterior = await um(
        db,
        "SELECT checksum FROM SCHEMA_MIGRATION WHERE nome=?",
        [nome],
      );
      if (anterior) {
        const formatoEquivalente =
          nome === "001_estrutura.sql" &&
          checksumsEstrutura.has(anterior.checksum) &&
          checksumsEstrutura.has(checksum);
        if (anterior.checksum !== checksum && !formatoEquivalente)
          throw new Error(`Migracao aplicada foi alterada: ${nome}`);
        continue;
      }
      // Scripts deste repositorio nao usam procedures; cada instrucao termina em ponto e virgula.
      // DDL MySQL faz commit implicito: em falha, inspecione antes de retomar; nunca apague dados automaticamente.
      for (const instrucao of sql
        .replace(/^\s*--.*$/gm, "")
        .split(";")
        .map((x) => x.trim())
        .filter(Boolean))
        await db.query(instrucao);
      await linhas(
        db,
        "INSERT INTO SCHEMA_MIGRATION(nome,checksum) VALUES (?,?)",
        [nome, checksum],
      );
      console.log(`Migracao aplicada: ${nome}`);
    }
  } finally {
    await db
      .query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':migracoes'))")
      .catch(() => {});
    db.release();
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const pool = criarPool(lerAmbiente().db);
  try {
    await migrar(pool);
  } finally {
    await pool.end();
  }
}
