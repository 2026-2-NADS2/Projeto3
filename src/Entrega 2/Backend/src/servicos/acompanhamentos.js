import { linhas, um, transacao, dataSql, dataIso } from "../banco/pool.js";
import * as v from "../validadores.js";
import { exigir, naoEncontrado } from "../erros.js";
import { auditar } from "./auditoria.js";
import {
  buscarAcompanhamento,
  dtoAcompanhamentos,
  listarAcompanhamentos,
  acessoAcompanhamento,
} from "../repositorios/acompanhamentos.js";

const camposConteudo = [
  "descricao",
  "estrategias",
  "ajudaFamilia",
  "media",
  "tagIds",
];
function conteudo(corpo, antes = {}) {
  return {
    descricao:
      "descricao" in corpo
        ? v.texto(corpo.descricao, "descricao", 10000, false)
        : (antes.descricao ?? null),
    estrategias:
      "estrategias" in corpo
        ? v.texto(corpo.estrategias, "estrategias", 10000, false)
        : (antes.estrategias ?? null),
    ajuda_familia:
      "ajudaFamilia" in corpo
        ? v.texto(corpo.ajudaFamilia, "ajudaFamilia", 10000, false)
        : (antes.ajuda_familia ?? null),
    media: "media" in corpo ? v.nota(corpo.media) : (antes.media ?? null),
  };
}
async function tagsRegistro(db, id) {
  return (
    await linhas(
      db,
      "SELECT id_tag FROM ACOMPANHAMENTO_TAG WHERE id_acompanhamento=? ORDER BY id_tag",
      [id],
    )
  ).map((r) => r.id_tag);
}
async function validarTags(db, ids, anteriores = []) {
  if (!ids.length) return;
  const tags = await linhas(
    db,
    `SELECT id_tag,ativo FROM TAG WHERE id_tag IN (${ids.map(() => "?").join(",")}) FOR SHARE`,
    ids,
  );
  exigir(
    tags.length === ids.length &&
      tags.every((t) => t.ativo || anteriores.includes(t.id_tag)),
    400,
    "TAGS_INVALIDAS",
    "Selecione somente tags disponíveis.",
  );
}
async function gravarTags(db, id, ids) {
  await linhas(db, "DELETE FROM ACOMPANHAMENTO_TAG WHERE id_acompanhamento=?", [
    id,
  ]);
  for (const tag of ids)
    await linhas(
      db,
      "INSERT INTO ACOMPANHAMENTO_TAG(id_acompanhamento,id_tag) VALUES (?,?)",
      [id, tag],
    );
}
export function validarEnvio(registro, tags) {
  exigir(
    registro.descricao?.trim() && registro.media !== null && tags.length,
    400,
    "CONTEUDO_INCOMPLETO",
    "Informe desenvolvimento, média e ao menos uma tag antes de enviar.",
  );
}
async function validarContexto(
  db,
  alunoId,
  vinculoId,
  bimestreId,
  ator,
  agora,
  matriculaId = null,
) {
  const aluno = await um(
    db,
    "SELECT id_aluno FROM ALUNO WHERE id_aluno=? AND ativo=1 FOR SHARE",
    [alunoId],
  );
  exigir(aluno, 409, "ALUNO_INATIVO", "O aluno não está ativo.");
  const vinculo = await um(
    db,
    `SELECT v.* FROM VINCULO_PROFESSOR v JOIN TURMA t ON t.id_turma=v.id_turma
    JOIN DISCIPLINA d ON d.id_disciplina=v.id_disciplina JOIN AREA_DISCIPLINA ar ON ar.id_area=d.id_area
    WHERE v.id_vinculo=? AND v.ativo=1 AND t.ativo=1 AND d.ativo=1 AND ar.ativo=1 FOR SHARE`,
    [vinculoId],
  );
  exigir(
    vinculo && vinculo.id_professor === ator.professorId,
    403,
    "VINCULO_NEGADO",
    "Você não possui essa atribuição docente ativa.",
  );
  const matricula = await um(
    db,
    "SELECT * FROM MATRICULA_TURMA WHERE id_aluno=? AND id_turma=? AND fim_em IS NULL FOR SHARE",
    [alunoId, vinculo.id_turma],
  );
  exigir(
    matricula && (!matriculaId || matricula.id_matricula_turma === matriculaId),
    409,
    "MATRICULA_INVALIDA",
    "O aluno não está mais matriculado na turma deste registro.",
  );
  const bimestre = await um(
    db,
    "SELECT * FROM BIMESTRE WHERE id_bimestre=? FOR SHARE",
    [bimestreId],
  );
  exigir(
    bimestre && bimestre.ano_letivo === vinculo.ano_letivo,
    409,
    "ANO_INCOMPATIVEL",
    "Bimestre e atribuição devem pertencer ao mesmo ano.",
  );
  exigir(
    bimestre.ativo &&
      agora >= new Date(dataIso(bimestre.dt_abertura)) &&
      agora <= new Date(dataIso(bimestre.dt_encerramento)),
    409,
    "PERIODO_ENCERRADO",
    "O período de digitação deste bimestre não está aberto.",
  );
  return matricula;
}
export function servicoAcompanhamentos(pool, relogio) {
  async function detalhes(id, ator, db = pool) {
    return (
      await dtoAcompanhamentos(
        db,
        [await buscarAcompanhamento(db, id, ator)],
        ator,
      )
    )[0];
  }
  async function alterar(id, corpo, ator, acao) {
    v.objeto(
      corpo,
      acao === "EDITAR"
        ? [...camposConteudo, "versao", "motivo"]
        : ["versao", "motivo"],
    );
    const versao = v.inteiro(corpo.versao, "versao");
    return transacao(pool, async (db) => {
      const registro = await um(
        db,
        "SELECT * FROM ACOMPANHAMENTO WHERE id_acompanhamento=? FOR UPDATE",
        [id],
      );
      if (!registro) throw naoEncontrado();
      await buscarAcompanhamento(db, id, ator);
      exigir(
        registro.versao === versao,
        409,
        "VERSAO_DESATUALIZADA",
        "Este registro foi alterado. Atualize a página antes de continuar.",
      );
      const anteriores = await tagsRegistro(db, id),
        antes = { ...registro, tagIds: anteriores },
        agora = relogio();
      let depois = { ...registro },
        tags = anteriores,
        motivo = null;
      const professor = ator.perfil === "PROFESSOR";
      exigir(
        ator.perfil !== "RESPONSAVEL",
        403,
        "SEM_PERMISSAO",
        "A família não pode modificar o acompanhamento.",
      );
      if (professor) {
        exigir(
          ["EDITAR", "ENVIAR", "CANCELAR"].includes(acao),
          403,
          "SEM_PERMISSAO",
          "Ação reservada à administração.",
        );
        exigir(
          ["RASCUNHO", "DEVOLVIDO"].includes(registro.status),
          409,
          "ESTADO_INVALIDO",
          "O professor só pode alterar rascunhos ou registros devolvidos.",
        );
        if (acao !== "CANCELAR")
          await validarContexto(
            db,
            registro.id_aluno,
            registro.id_vinculo,
            registro.id_bimestre,
            ator,
            agora,
            registro.id_matricula_turma,
          );
      }
      if (acao === "EDITAR") {
        exigir(
          professor || registro.status === "EM_REVISAO",
          409,
          "ESTADO_INVALIDO",
          "Inicie a revisão antes de editar.",
        );
        if (!professor) motivo = v.texto(corpo.motivo, "motivo", 2000);
        depois = { ...depois, ...conteudo(corpo, registro) };
        tags = "tagIds" in corpo ? v.ids(corpo.tagIds) : anteriores;
        await validarTags(db, tags, anteriores);
        if (!professor) validarEnvio(depois, tags);
      } else if (acao === "ENVIAR") {
        exigir(
          professor,
          403,
          "SEM_PERMISSAO",
          "Somente o professor autor pode enviar.",
        );
        validarEnvio(depois, tags);
        depois.status = "ENVIADO_PARA_REVISAO";
      } else if (acao === "INICIAR_REVISAO") {
        exigir(
          registro.status === "ENVIADO_PARA_REVISAO",
          409,
          "ESTADO_INVALIDO",
          "Somente registros enviados podem iniciar revisão.",
        );
        depois.status = "EM_REVISAO";
        depois.id_revisor = ator.id;
      } else if (acao === "DEVOLVER") {
        exigir(
          registro.status === "EM_REVISAO",
          409,
          "ESTADO_INVALIDO",
          "Inicie a revisão antes de devolver.",
        );
        motivo = v.texto(corpo.motivo, "motivo", 2000);
        depois.status = "DEVOLVIDO";
        depois.motivo_devolucao = motivo;
        depois.id_revisor = ator.id;
      } else if (acao === "PUBLICAR") {
        exigir(
          registro.status === "EM_REVISAO",
          409,
          "ESTADO_INVALIDO",
          "Somente registros em revisão podem ser publicados.",
        );
        validarEnvio(depois, tags);
        depois.status = "PUBLICADO";
        depois.publicado_em = dataSql(agora);
        depois.id_revisor = ator.id;
      } else if (acao === "CANCELAR") {
        exigir(
          !["PUBLICADO", "CANCELADO"].includes(registro.status),
          409,
          "ESTADO_INVALIDO",
          "Registro publicado ou cancelado não pode ser cancelado por este fluxo.",
        );
        motivo = v.texto(corpo.motivo, "motivo", 2000);
        depois.status = "CANCELADO";
      }
      depois.versao++;
      depois.data_atualizacao = dataSql(agora);
      await linhas(
        db,
        `UPDATE ACOMPANHAMENTO SET descricao=?,estrategias=?,ajuda_familia=?,media=?,status=?,motivo_devolucao=?,id_revisor=?,publicado_em=?,versao=?,data_atualizacao=? WHERE id_acompanhamento=?`,
        [
          depois.descricao,
          depois.estrategias,
          depois.ajuda_familia,
          depois.media,
          depois.status,
          depois.motivo_devolucao,
          depois.id_revisor,
          depois.publicado_em,
          depois.versao,
          depois.data_atualizacao,
          id,
        ],
      );
      if (acao === "EDITAR") await gravarTags(db, id, tags);
      await auditar(
        db,
        ator,
        "ACOMPANHAMENTO",
        id,
        acao,
        antes,
        { ...depois, tagIds: tags },
        motivo,
        agora,
      );
      return detalhes(id, ator, db);
    });
  }
  return {
    detalhes,
    alterar,
    async listar(query, ator) {
      const r = await listarAcompanhamentos(pool, query, ator);
      return {
        dados: await dtoAcompanhamentos(pool, r.registros, ator),
        paginacao: r.paginacao,
      };
    },
    async criar(corpo, ator) {
      v.objeto(corpo, [
        "alunoId",
        "vinculoId",
        "bimestreId",
        ...camposConteudo,
      ]);
      const aluno = v.inteiro(corpo.alunoId),
        vinculo = v.inteiro(corpo.vinculoId),
        bimestre = v.inteiro(corpo.bimestreId),
        dados = conteudo(corpo),
        tags = v.ids(corpo.tagIds ?? []),
        agora = relogio();
      return transacao(pool, async (db) => {
        const matricula = await validarContexto(
          db,
          aluno,
          vinculo,
          bimestre,
          ator,
          agora,
        );
        await validarTags(db, tags);
        const id = (
          await linhas(
            db,
            `INSERT INTO ACOMPANHAMENTO(id_aluno,id_matricula_turma,id_vinculo,id_bimestre,descricao,estrategias,ajuda_familia,media,data_criacao,data_atualizacao)
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [
              aluno,
              matricula.id_matricula_turma,
              vinculo,
              bimestre,
              dados.descricao,
              dados.estrategias,
              dados.ajuda_familia,
              dados.media,
              dataSql(agora),
              dataSql(agora),
            ],
          )
        ).insertId;
        await gravarTags(db, id, tags);
        const depois = await detalhes(id, ator, db);
        await auditar(
          db,
          ator,
          "ACOMPANHAMENTO",
          id,
          "CRIACAO",
          null,
          depois,
          null,
          agora,
        );
        return depois;
      });
    },
    async historico(id, ator, query) {
      await buscarAcompanhamento(pool, id, ator);
      const pg = v.paginacao(query);
      const dados = await linhas(
        pool,
        `SELECT h.id_historico AS id,h.acao,h.antes_json AS antes,h.depois_json AS depois,h.observacao AS motivo,h.dt_alteracao AS quando,u.nome AS autor
       FROM HISTORICO_AUDITORIA h JOIN USUARIO u ON u.id_usuario=h.id_usuario_acao WHERE h.id_acompanhamento=? ORDER BY h.id_historico DESC LIMIT ${pg.limite} OFFSET ${pg.offset}`,
        [id],
      );
      const total = (
        await um(
          pool,
          "SELECT COUNT(*) total FROM HISTORICO_AUDITORIA WHERE id_acompanhamento=?",
          [id],
        )
      ).total;
      return {
        dados: dados.map((x) => ({ ...x, quando: dataIso(x.quando) })),
        paginacao: { pagina: pg.pagina, limite: pg.limite, total },
      };
    },
    async ciencia(id, ator) {
      return transacao(pool, async (db) => {
        await um(
          db,
          "SELECT id_acompanhamento FROM ACOMPANHAMENTO WHERE id_acompanhamento=? FOR UPDATE",
          [id],
        );
        await buscarAcompanhamento(db, id, ator);
        const existente = await um(
          db,
          "SELECT * FROM RETORNO_RESPONSAVEL WHERE id_acompanhamento=? AND id_responsavel=?",
          [id, ator.responsavelId],
        );
        if (existente)
          return {
            id: existente.id_retorno,
            cienciaEm: dataIso(existente.dt_ciencia),
          };
        const agora = relogio(),
          novo = (
            await linhas(
              db,
              "INSERT INTO RETORNO_RESPONSAVEL(id_acompanhamento,id_responsavel,dt_ciencia) VALUES (?,?,?)",
              [id, ator.responsavelId, dataSql(agora)],
            )
          ).insertId;
        await auditar(
          db,
          ator,
          "ACOMPANHAMENTO",
          id,
          "CIENCIA",
          null,
          { retornoId: novo, responsavelId: ator.responsavelId },
          null,
          agora,
        );
        return { id: novo, cienciaEm: agora.toISOString() };
      });
    },
    async observar(id, corpo, ator) {
      v.objeto(corpo, ["texto"]);
      const texto = v.texto(corpo.texto, "texto", 2000);
      return transacao(pool, async (db) => {
        await buscarAcompanhamento(db, id, ator);
        const retorno = await um(
          db,
          "SELECT id_retorno FROM RETORNO_RESPONSAVEL WHERE id_acompanhamento=? AND id_responsavel=? FOR UPDATE",
          [id, ator.responsavelId],
        );
        exigir(
          retorno,
          409,
          "CIENCIA_NECESSARIA",
          "Confirme a leitura antes de enviar uma observação.",
        );
        const agora = relogio(),
          novo = (
            await linhas(
              db,
              "INSERT INTO OBSERVACAO_RESPONSAVEL(id_retorno,texto,criado_em) VALUES (?,?,?)",
              [retorno.id_retorno, texto, dataSql(agora)],
            )
          ).insertId;
        await auditar(
          db,
          ator,
          "ACOMPANHAMENTO",
          id,
          "OBSERVACAO",
          null,
          { id: novo, texto },
          null,
          agora,
        );
        return { id: novo, texto, criadoEm: agora.toISOString() };
      });
    },
    async observacoes(id, ator, query) {
      await buscarAcompanhamento(pool, id, ator);
      const pg = v.paginacao(query),
        args = [id],
        where = ["rr.id_acompanhamento=?"];
      if (ator.perfil === "RESPONSAVEL") {
        where.push("rr.id_responsavel=?");
        args.push(ator.responsavelId);
      }
      const base = ` FROM OBSERVACAO_RESPONSAVEL o JOIN RETORNO_RESPONSAVEL rr ON rr.id_retorno=o.id_retorno JOIN RESPONSAVEL r ON r.id_responsavel=rr.id_responsavel JOIN USUARIO u ON u.id_usuario=r.id_usuario WHERE ${where.join(" AND ")}`;
      const dados = await linhas(
        pool,
        "SELECT o.id_observacao AS id,o.texto,o.criado_em AS criadoEm,u.nome AS autor" +
          base +
          ` ORDER BY o.id_observacao DESC LIMIT ${pg.limite} OFFSET ${pg.offset}`,
        args,
      );
      return {
        dados: dados.map((x) => ({ ...x, criadoEm: dataIso(x.criadoEm) })),
        paginacao: {
          pagina: pg.pagina,
          limite: pg.limite,
          total: (await um(pool, "SELECT COUNT(*) total" + base, args)).total,
        },
      };
    },
    async retornos(query, ator) {
      const pg = v.paginacao(query),
        acesso = acessoAcompanhamento(ator),
        where = [acesso.sql, "a.status='PUBLICADO'"],
        args = [...acesso.args];
      if (query.alunoId) {
        where.push("a.id_aluno=?");
        args.push(v.inteiro(query.alunoId));
      }
      if (query.acompanhamentoId) {
        where.push("a.id_acompanhamento=?");
        args.push(v.inteiro(query.acompanhamentoId));
      }
      const base = ` FROM RETORNO_RESPONSAVEL rr JOIN VW_ACOMPANHAMENTO_DETALHADO a ON a.id_acompanhamento=rr.id_acompanhamento
        JOIN RESPONSAVEL r ON r.id_responsavel=rr.id_responsavel JOIN USUARIO u ON u.id_usuario=r.id_usuario WHERE ${where.join(" AND ")}`;
      const dados = await linhas(
        pool,
        `SELECT rr.id_retorno AS id,a.id_acompanhamento AS acompanhamentoId,a.aluno_nome AS aluno,a.turma_nome AS turma,a.disciplina_nome AS disciplina,u.nome AS responsavel,rr.dt_ciencia AS cienciaEm,
        (SELECT COUNT(*) FROM OBSERVACAO_RESPONSAVEL o WHERE o.id_retorno=rr.id_retorno) AS totalObservacoes` +
          base +
          ` ORDER BY rr.id_retorno DESC LIMIT ${pg.limite} OFFSET ${pg.offset}`,
        args,
      );
      return {
        dados: dados.map((x) => ({ ...x, cienciaEm: dataIso(x.cienciaEm) })),
        paginacao: {
          pagina: pg.pagina,
          limite: pg.limite,
          total: (await um(pool, "SELECT COUNT(*) total" + base, args)).total,
        },
      };
    },
  };
}
