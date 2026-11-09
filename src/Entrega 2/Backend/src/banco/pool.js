import mysql from "mysql2/promise";

export function criarPool(config) {
  // DATETIME e lido como texto para converter explicitamente de UTC nos DTOs.
  return mysql.createPool({
    ...config,
    timezone: "Z",
    dateStrings: true,
    decimalNumbers: true,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 100,
    charset: "utf8mb4",
    multipleStatements: false,
  });
}

export async function transacao(pool, executar) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const retorno = await executar(conexao);
    await conexao.commit();
    return retorno;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

export async function linhas(db, sql, parametros = []) {
  const [resultado] = await db.execute(sql, parametros);
  return resultado;
}
export async function um(db, sql, parametros = []) {
  return (await linhas(db, sql, parametros))[0];
}
export const dataSql = (data = new Date()) =>
  data.toISOString().slice(0, 23).replace("T", " ");
export const dataIso = (valor) =>
  valor
    ? new Date(
        String(valor).replace(" ", "T") +
          (String(valor).endsWith("Z") ? "" : "Z"),
      ).toISOString()
    : null;
