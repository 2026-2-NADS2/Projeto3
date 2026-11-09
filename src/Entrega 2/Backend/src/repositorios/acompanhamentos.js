import { linhas, um, dataIso } from "../banco/pool.js";
import * as v from "../validadores.js";
import { naoEncontrado } from "../erros.js";

export const estados = [
  "RASCUNHO",
  "ENVIADO_PARA_REVISAO",
  "EM_REVISAO",
  "DEVOLVIDO",
  "PUBLICADO",
  "CANCELADO",
];
export function acessoAcompanhamento(ator, alias = "a") {
  if (ator.perfil === "ADMINISTRADOR") return { sql: "1=1", args: [] };
  if (ator.perfil === "PROFESSOR")
    return { sql: `${alias}.professor_usuario_id=?`, args: [ator.id] };
  return {
    sql: `${alias}.status='PUBLICADO' AND EXISTS (SELECT 1 FROM ALUNO_RESPONSAVEL ar JOIN ALUNO al ON al.id_aluno=ar.id_aluno WHERE ar.id_aluno=${alias}.id_aluno AND ar.id_responsavel=? AND ar.ativo=1 AND al.ativo=1)`,
    args: [ator.responsavelId],
  };
}
export function filtrosAcompanhamento(query, ator) {
  const acesso = acessoAcompanhamento(ator),
    where = [acesso.sql],
    args = [...acesso.args];
  const mapa = {
    alunoId: "id_aluno",
    turmaId: "id_turma",
    disciplinaId: "id_disciplina",
    professorId: "id_professor",
    bimestreId: "id_bimestre",
    anoLetivo: "ano_letivo",
    bimestre: "bimestre_numero",
  };
  for (const [api, coluna] of Object.entries(mapa))
    if (query[api] !== undefined) {
      where.push("a." + coluna + "=?");
      args.push(v.inteiro(query[api], api));
    }
  if (query.status) {
    where.push("a.status=?");
    args.push(v.opcao(query.status, "status", estados));
  }
  if (query.tagId) {
    where.push(
      "EXISTS (SELECT 1 FROM ACOMPANHAMENTO_TAG atg WHERE atg.id_acompanhamento=a.id_acompanhamento AND atg.id_tag=?)",
    );
    args.push(v.inteiro(query.tagId, "tagId"));
  }
  if (query.busca) {
    where.push("(a.aluno_nome LIKE ? OR a.disciplina_nome LIKE ?)");
    const busca = "%" + v.texto(query.busca, "busca") + "%";
    args.push(busca, busca);
  }
  if (query.pendente !== undefined && ator.perfil === "RESPONSAVEL") {
    const pendente =
      v.opcao(query.pendente, "pendente", ["true", "false"]) === "true";
    where.push(
      `${pendente ? "NOT " : ""}EXISTS (SELECT 1 FROM RETORNO_RESPONSAVEL rr WHERE rr.id_acompanhamento=a.id_acompanhamento AND rr.id_responsavel=?)`,
    );
    args.push(ator.responsavelId);
  }
  return { sql: where.join(" AND "), args };
}
export async function dtoAcompanhamentos(db, registros, ator) {
  if (!registros.length) return [];
  const ids = registros.map((r) => r.id_acompanhamento),
    marks = ids.map(() => "?").join(",");
  const tags = await linhas(
    db,
    `SELECT atg.id_acompanhamento,t.id_tag,t.nome,t.cor,t.ativo FROM ACOMPANHAMENTO_TAG atg JOIN TAG t ON t.id_tag=atg.id_tag WHERE atg.id_acompanhamento IN (${marks})`,
    ids,
  );
  const retornos = await linhas(
    db,
    `SELECT id_acompanhamento,id_responsavel,dt_ciencia FROM RETORNO_RESPONSAVEL WHERE id_acompanhamento IN (${marks})${ator.perfil === "RESPONSAVEL" ? " AND id_responsavel=?" : ""}`,
    [...ids, ...(ator.perfil === "RESPONSAVEL" ? [ator.responsavelId] : [])],
  );
  return registros.map((r) => ({
    id: r.id_acompanhamento,
    alunoId: r.id_aluno,
    aluno: r.aluno_nome,
    matricula: r.aluno_matricula,
    vinculoId: r.id_vinculo,
    matriculaTurmaId: r.id_matricula_turma,
    professorId: r.id_professor,
    professor: r.professor_nome,
    turmaId: r.id_turma,
    turma: r.turma_nome,
    disciplinaId: r.id_disciplina,
    disciplina: r.disciplina_nome,
    bimestreId: r.id_bimestre,
    bimestre: r.bimestre_numero,
    anoLetivo: r.ano_letivo,
    descricao: r.descricao,
    estrategias: r.estrategias,
    ajudaFamilia: r.ajuda_familia,
    media: r.media,
    status: r.status,
    versao: r.versao,
    criadoEm: dataIso(r.data_criacao),
    atualizadoEm: dataIso(r.data_atualizacao),
    publicadoEm: dataIso(r.publicado_em),
    tags: tags
      .filter((t) => t.id_acompanhamento === r.id_acompanhamento)
      .map((t) => ({
        id: t.id_tag,
        nome: t.nome,
        cor: t.cor,
        ativo: !!t.ativo,
      })),
    ...(ator.perfil === "RESPONSAVEL"
      ? {
          cienciaEm: dataIso(
            retornos.find((x) => x.id_acompanhamento === r.id_acompanhamento)
              ?.dt_ciencia,
          ),
        }
      : {
          motivoDevolucao: r.motivo_devolucao,
          revisorId: r.id_revisor,
          ciencias: retornos
            .filter((x) => x.id_acompanhamento === r.id_acompanhamento)
            .map((x) => ({
              responsavelId: x.id_responsavel,
              quando: dataIso(x.dt_ciencia),
            })),
        }),
  }));
}
export async function buscarAcompanhamento(db, id, ator) {
  const acesso = acessoAcompanhamento(ator),
    r = await um(
      db,
      "SELECT a.* FROM VW_ACOMPANHAMENTO_DETALHADO a WHERE a.id_acompanhamento=? AND " +
        acesso.sql,
      [id, ...acesso.args],
    );
  if (!r) throw naoEncontrado();
  return r;
}
export async function listarAcompanhamentos(
  db,
  query,
  ator,
  { exportacao = false } = {},
) {
  const pg = v.paginacao(query),
    filtro = filtrosAcompanhamento(query, ator);
  const total = (
    await um(
      db,
      "SELECT COUNT(*) total FROM VW_ACOMPANHAMENTO_DETALHADO a WHERE " +
        filtro.sql,
      filtro.args,
    )
  ).total;
  // Exportacao tem limite explicito em vez de truncar silenciosamente o arquivo.
  const limite = exportacao ? 10001 : pg.limite,
    offset = exportacao ? 0 : pg.offset;
  const dados = await linhas(
    db,
    `SELECT a.* FROM VW_ACOMPANHAMENTO_DETALHADO a WHERE ${filtro.sql} ORDER BY a.data_atualizacao DESC,a.id_acompanhamento DESC LIMIT ${limite} OFFSET ${offset}`,
    filtro.args,
  );
  return {
    registros: dados,
    total,
    paginacao: { pagina: pg.pagina, limite: pg.limite, total },
  };
}
