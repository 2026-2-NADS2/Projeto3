import { linhas, um, dataIso, transacao, dataSql } from "../banco/pool.js";
import {
  filtrosAcompanhamento,
  listarAcompanhamentos,
  dtoAcompanhamentos,
} from "../repositorios/acompanhamentos.js";
import { exigir, naoEncontrado } from "../erros.js";
import * as v from "../validadores.js";
import { criarCsv, criarXlsx, montarLinhas } from "../documentos/arquivos.js";
import { auditar } from "./auditoria.js";

export function servicoRelatorios(pool) {
  return {
    async indicadores(query, ator) {
      const f = filtrosAcompanhamento(query, ator);
      const porStatus = await linhas(
        pool,
        `SELECT a.status,COUNT(*) AS quantidade FROM VW_ACOMPANHAMENTO_DETALHADO a WHERE ${f.sql} GROUP BY a.status`,
        f.args,
      );
      const porDisciplina = await linhas(
        pool,
        `SELECT a.id_disciplina AS disciplinaId,a.disciplina_nome AS disciplina,COUNT(*) AS quantidade,
        ROUND(AVG(CASE WHEN a.status='PUBLICADO' THEN a.media END),2) AS mediaPublicada
        FROM VW_ACOMPANHAMENTO_DETALHADO a WHERE ${f.sql} GROUP BY a.id_disciplina,a.disciplina_nome ORDER BY a.disciplina_nome`,
        f.args,
      );
      return {
        total: porStatus.reduce((s, r) => s + r.quantidade, 0),
        porStatus,
        porDisciplina,
      };
    },
    async exportar(query, ator) {
      const formato = v.opcao(query.formato ?? "csv", "formato", [
        "csv",
        "xlsx",
      ]);
      const descricoes =
        query.descricoes === undefined
          ? false
          : v.opcao(query.descricoes, "descricoes", ["true", "false"]) ===
            "true";
      const resultado = await listarAcompanhamentos(pool, query, ator, {
        exportacao: true,
      });
      exigir(
        resultado.total <= 10000,
        400,
        "EXPORTACAO_GRANDE",
        "Refine os filtros para exportar até 10.000 registros.",
      );
      const dados = await dtoAcompanhamentos(pool, resultado.registros, ator),
        tabela = montarLinhas(dados, descricoes);
      return {
        nome: `acompanhamentos.${formato}`,
        tipo:
          formato === "csv"
            ? "text/csv; charset=utf-8"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: formato === "csv" ? criarCsv(tabela) : criarXlsx(tabela),
      };
    },
    async auditoria(query) {
      const pg = v.paginacao(query),
        where = [],
        args = [];
      if (query.acompanhamentoId) {
        where.push("h.id_acompanhamento=?");
        args.push(v.inteiro(query.acompanhamentoId));
      }
      if (query.entidade) {
        where.push("h.entidade=?");
        args.push(v.texto(query.entidade, "entidade", 50));
      }
      if (query.autorId) {
        where.push("h.id_usuario_acao=?");
        args.push(v.inteiro(query.autorId));
      }
      if (query.inicio) {
        where.push("h.dt_alteracao>=?");
        args.push(dataSql(v.instante(query.inicio, "inicio")));
      }
      if (query.fim) {
        where.push("h.dt_alteracao<=?");
        args.push(dataSql(v.instante(query.fim, "fim")));
      }
      const filtro = where.length ? " WHERE " + where.join(" AND ") : "";
      const dados = await linhas(
        pool,
        `SELECT h.id_historico AS id,h.id_acompanhamento AS acompanhamentoId,h.entidade,h.entidade_id AS entidadeId,h.acao,h.antes_json AS antes,h.depois_json AS depois,h.observacao AS motivo,h.dt_alteracao AS quando,u.nome AS autor,u.perfil AS perfil
        FROM HISTORICO_AUDITORIA h JOIN USUARIO u ON u.id_usuario=h.id_usuario_acao ${filtro} ORDER BY h.id_historico DESC LIMIT ${pg.limite} OFFSET ${pg.offset}`,
        args,
      );
      return {
        dados: dados.map((x) => ({ ...x, quando: dataIso(x.quando) })),
        paginacao: {
          pagina: pg.pagina,
          limite: pg.limite,
          total: (
            await um(
              pool,
              "SELECT COUNT(*) total FROM HISTORICO_AUDITORIA h" + filtro,
              args,
            )
          ).total,
        },
      };
    },
  };
}
function acessoComunicado(ator) {
  if (ator.perfil === "ADMINISTRADOR") return { sql: "1=1", args: [] };
  if (ator.perfil === "PROFESSOR")
    return {
      sql: `c.ativo=1 AND EXISTS (SELECT 1 FROM COMUNICADO_TURMA ct JOIN VINCULO_PROFESSOR vp ON vp.id_turma=ct.id_turma WHERE ct.id_comunicado=c.id_comunicado AND vp.id_professor=? AND vp.ativo=1)`,
      args: [ator.professorId],
    };
  return {
    sql: `c.ativo=1 AND EXISTS (SELECT 1 FROM COMUNICADO_TURMA ct JOIN MATRICULA_TURMA mt ON mt.id_turma=ct.id_turma JOIN ALUNO a ON a.id_aluno=mt.id_aluno JOIN ALUNO_RESPONSAVEL ar ON ar.id_aluno=mt.id_aluno WHERE ct.id_comunicado=c.id_comunicado AND mt.fim_em IS NULL AND a.ativo=1 AND ar.ativo=1 AND ar.id_responsavel=?)`,
    args: [ator.responsavelId],
  };
}
export function servicoComunicados(pool, relogio) {
  const dto = (r) => ({
    id: r.id_comunicado,
    titulo: r.titulo,
    conteudo: r.conteudo,
    publicadoEm: dataIso(r.publicado_em),
    ativo: !!r.ativo,
  });
  return {
    async listar(query, ator) {
      const pg = v.paginacao(query),
        f = acessoComunicado(ator);
      return {
        dados: (
          await linhas(
            pool,
            `SELECT c.* FROM COMUNICADO c WHERE ${f.sql} ORDER BY c.publicado_em DESC,c.id_comunicado DESC LIMIT ${pg.limite} OFFSET ${pg.offset}`,
            f.args,
          )
        ).map(dto),
        paginacao: {
          pagina: pg.pagina,
          limite: pg.limite,
          total: (
            await um(
              pool,
              "SELECT COUNT(*) total FROM COMUNICADO c WHERE " + f.sql,
              f.args,
            )
          ).total,
        },
      };
    },
    async detalhar(id, ator) {
      const f = acessoComunicado(ator),
        r = await um(
          pool,
          "SELECT c.* FROM COMUNICADO c WHERE c.id_comunicado=? AND " + f.sql,
          [id, ...f.args],
        );
      if (!r) throw naoEncontrado();
      return dto(r);
    },
    async criar(corpo, ator) {
      v.objeto(corpo, ["titulo", "conteudo", "turmaIds"]);
      const titulo = v.texto(corpo.titulo, "titulo", 160),
        conteudo = v.texto(corpo.conteudo, "conteudo", 10000),
        turmas = v.ids(corpo.turmaIds, "turmaIds");
      exigir(turmas.length, 400, "VALIDACAO", "Selecione ao menos uma turma.");
      return transacao(pool, async (db) => {
        const existentes = await linhas(
          db,
          `SELECT id_turma FROM TURMA WHERE ativo=1 AND id_turma IN (${turmas.map(() => "?").join(",")}) FOR SHARE`,
          turmas,
        );
        exigir(
          existentes.length === turmas.length,
          400,
          "TURMAS_INVALIDAS",
          "Selecione turmas ativas.",
        );
        const id = (
          await linhas(
            db,
            "INSERT INTO COMUNICADO(titulo,conteudo,id_autor,publicado_em) VALUES (?,?,?,?)",
            [titulo, conteudo, ator.id, dataSql(relogio())],
          )
        ).insertId;
        for (const turma of turmas)
          await linhas(
            db,
            "INSERT INTO COMUNICADO_TURMA(id_comunicado,id_turma) VALUES (?,?)",
            [id, turma],
          );
        await auditar(
          db,
          ator,
          "COMUNICADO",
          id,
          "CRIACAO",
          null,
          corpo,
          null,
          relogio(),
        );
        return {
          id,
          titulo,
          conteudo,
          publicadoEm: relogio().toISOString(),
          turmaIds: turmas,
        };
      });
    },
    async inativar(id, corpo, ator) {
      v.objeto(corpo, ["ativo"]);
      const ativo = v.booleano(corpo.ativo);
      return transacao(pool, async (db) => {
        const antes = await um(
          db,
          "SELECT * FROM COMUNICADO WHERE id_comunicado=? FOR UPDATE",
          [id],
        );
        if (!antes) throw naoEncontrado();
        await linhas(
          db,
          "UPDATE COMUNICADO SET ativo=? WHERE id_comunicado=?",
          [ativo, id],
        );
        await auditar(
          db,
          ator,
          "COMUNICADO",
          id,
          "ALTERACAO",
          dto(antes),
          { ...dto(antes), ativo },
          null,
          relogio(),
        );
        return { ...dto(antes), ativo };
      });
    },
  };
}
