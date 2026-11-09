import { linhas, dataSql } from "../banco/pool.js";

// A conexao recebida pertence a transacao da alteracao principal.
export async function auditar(
  db,
  ator,
  entidade,
  id,
  acao,
  antes,
  depois,
  motivo = null,
  agora = new Date(),
) {
  await linhas(
    db,
    `INSERT INTO HISTORICO_AUDITORIA
    (id_acompanhamento,id_usuario_acao,entidade,entidade_id,acao,antes_json,depois_json,observacao,dt_alteracao)
    VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      entidade === "ACOMPANHAMENTO" ? id : null,
      ator.id,
      entidade,
      String(id),
      acao,
      antes == null ? null : JSON.stringify(antes),
      depois == null ? null : JSON.stringify(depois),
      motivo,
      dataSql(agora),
    ],
  );
}
