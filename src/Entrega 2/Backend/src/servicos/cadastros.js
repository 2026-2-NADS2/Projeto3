import * as v from "../validadores.js";
import { linhas, um, transacao, dataSql, dataIso } from "../banco/pool.js";
import { exigir, naoEncontrado } from "../erros.js";
import { auditar } from "./auditoria.js";

// Nomes SQL vem apenas desta lista fixa. Valores do cliente vao nos placeholders.
export const cadastros = {
  areas: {
    tabela: "AREA_DISCIPLINA",
    pk: "id_area",
    campos: {
      nome: ["nome", (x) => v.texto(x, "nome")],
      descricao: ["descricao", (x) => v.texto(x, "descricao", 1000, false)],
    },
  },
  disciplinas: {
    tabela: "DISCIPLINA",
    pk: "id_disciplina",
    campos: {
      nome: ["nome", (x) => v.texto(x, "nome")],
      areaId: ["id_area", (x) => v.inteiro(x, "areaId")],
    },
  },
  turmas: {
    tabela: "TURMA",
    pk: "id_turma",
    campos: {
      nome: ["nome", (x) => v.texto(x, "nome", 50)],
      anoLetivo: ["ano_letivo", (x) => v.inteiro(x, "anoLetivo", 2000, 2100)],
      serie: ["serie", (x) => v.texto(x, "serie", 50, false)],
      turno: ["turno", (x) => v.texto(x, "turno", 30, false)],
    },
  },
  alunos: {
    tabela: "ALUNO",
    pk: "id_aluno",
    campos: {
      nome: ["nome", (x) => v.texto(x, "nome")],
      matricula: ["matricula", (x) => v.texto(x, "matricula", 20)],
      dataNascimento: [
        "data_nascimento",
        (x) => v.dataCivil(x, "dataNascimento"),
      ],
    },
  },
  tags: {
    tabela: "TAG",
    pk: "id_tag",
    campos: {
      nome: ["nome", (x) => v.texto(x, "nome", 50)],
      cor: [
        "cor",
        (x) => {
          exigir(
            typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x),
            400,
            "VALIDACAO",
            "Informe cor hexadecimal #RRGGBB.",
          );
          return x;
        },
      ],
      descricao: ["descricao", (x) => v.texto(x, "descricao", 1000, false)],
    },
  },
};
function dto(tipo, r) {
  const c = cadastros[tipo],
    saida = { id: r[c.pk], ativo: !!r.ativo };
  for (const [api, [sql]] of Object.entries(c.campos)) saida[api] = r[sql];
  return saida;
}
async function projetarCadastros(db, tipo, registros) {
  const dados = registros.map((r) => dto(tipo, r));
  if (tipo !== "alunos" || !dados.length) return dados;
  const ids = dados.map((r) => r.id);
  const matriculas = await linhas(
    db,
    `SELECT m.id_aluno,m.id_matricula_turma,m.id_turma,t.nome,t.ano_letivo
    FROM MATRICULA_TURMA m JOIN TURMA t ON t.id_turma=m.id_turma
    WHERE m.fim_em IS NULL AND m.id_aluno IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  return dados.map((r) => {
    const m = matriculas.find((m) => m.id_aluno === r.id);
    return {
      ...r,
      matriculaTurmaId: m?.id_matricula_turma ?? null,
      turmaId: m?.id_turma ?? null,
      turma: m?.nome ?? null,
      anoLetivo: m?.ano_letivo ?? null,
    };
  });
}
export function recorteAluno(ator, alias = "x") {
  if (ator.perfil === "ADMINISTRADOR") return { sql: "1=1", args: [] };
  if (ator.perfil === "RESPONSAVEL")
    return {
      sql: `EXISTS (SELECT 1 FROM ALUNO_RESPONSAVEL ar WHERE ar.id_aluno=${alias}.id_aluno AND ar.id_responsavel=? AND ar.ativo=1)`,
      args: [ator.responsavelId],
    };
  return {
    sql: `EXISTS (SELECT 1 FROM MATRICULA_TURMA mt JOIN VINCULO_PROFESSOR vp ON vp.id_turma=mt.id_turma WHERE mt.id_aluno=${alias}.id_aluno AND mt.fim_em IS NULL AND vp.id_professor=? AND vp.ativo=1)`,
    args: [ator.professorId],
  };
}
function filtroAcesso(tipo, ator) {
  if (tipo === "alunos") return recorteAluno(ator);
  if (
    ator.perfil === "ADMINISTRADOR" ||
    !["turmas", "disciplinas"].includes(tipo)
  )
    return { sql: "1=1", args: [] };
  if (ator.perfil === "PROFESSOR")
    return {
      sql: `EXISTS (SELECT 1 FROM VINCULO_PROFESSOR vp WHERE vp.${tipo === "turmas" ? "id_turma" : "id_disciplina"}=x.${cadastros[tipo].pk} AND vp.id_professor=? AND vp.ativo=1)`,
      args: [ator.professorId],
    };
  if (tipo === "turmas")
    return {
      sql: `EXISTS (SELECT 1 FROM MATRICULA_TURMA mt JOIN ALUNO_RESPONSAVEL ar ON ar.id_aluno=mt.id_aluno WHERE mt.id_turma=x.id_turma AND mt.fim_em IS NULL AND ar.id_responsavel=? AND ar.ativo=1)`,
      args: [ator.responsavelId],
    };
  return {
    sql: `EXISTS (SELECT 1 FROM VW_RELATORIO_PUBLICADO a JOIN ALUNO_RESPONSAVEL ar ON ar.id_aluno=a.id_aluno WHERE a.id_disciplina=x.id_disciplina AND ar.id_responsavel=? AND ar.ativo=1)`,
    args: [ator.responsavelId],
  };
}
export function servicoCadastros(pool, relogio) {
  async function verificar(db, tipo, dados, id) {
    if (tipo === "disciplinas")
      exigir(
        await um(
          db,
          "SELECT id_area FROM AREA_DISCIPLINA WHERE id_area=? AND ativo=1",
          [dados.id_area],
        ),
        409,
        "AREA_INVALIDA",
        "Selecione uma área ativa.",
      );
    if (tipo === "alunos")
      exigir(
        dados.data_nascimento <= relogio().toISOString().slice(0, 10),
        400,
        "VALIDACAO",
        "Data de nascimento não pode estar no futuro.",
      );
    if (tipo === "turmas" && id) {
      const anterior = await um(
        db,
        "SELECT ano_letivo FROM TURMA WHERE id_turma=?",
        [id],
      );
      if (anterior.ano_letivo !== dados.ano_letivo) {
        const usado =
          (await um(
            db,
            "SELECT id_matricula_turma FROM MATRICULA_TURMA WHERE id_turma=? LIMIT 1",
            [id],
          )) ||
          (await um(
            db,
            "SELECT id_vinculo FROM VINCULO_PROFESSOR WHERE id_turma=? LIMIT 1",
            [id],
          ));
        exigir(
          !usado,
          409,
          "TURMA_EM_USO",
          "O ano de uma turma com vínculos não pode ser alterado.",
        );
      }
    }
  }
  return {
    async listar(tipo, query, ator) {
      const c = cadastros[tipo],
        pg = v.paginacao(query),
        acesso = filtroAcesso(tipo, ator),
        where = [acesso.sql],
        args = [...acesso.args];
      if (query.busca) {
        where.push("(x.nome LIKE ?)");
        args.push("%" + v.texto(query.busca, "busca") + "%");
      }
      if (query.ativo !== undefined) {
        where.push("x.ativo=?");
        args.push(v.opcao(query.ativo, "ativo", ["true", "false"]) === "true");
      }
      if (tipo === "turmas" && query.anoLetivo) {
        where.push("x.ano_letivo=?");
        args.push(v.inteiro(query.anoLetivo, "anoLetivo", 2000, 2100));
      }
      if (tipo === "alunos" && (query.turmaId || query.anoLetivo)) {
        const condicoes = ["mt.id_aluno=x.id_aluno", "mt.fim_em IS NULL"];
        if (query.turmaId) {
          condicoes.push("mt.id_turma=?");
          args.push(v.inteiro(query.turmaId, "turmaId"));
        }
        if (query.anoLetivo) {
          condicoes.push("t.ano_letivo=?");
          args.push(v.inteiro(query.anoLetivo, "anoLetivo", 2000, 2100));
        }
        where.push(
          `EXISTS (SELECT 1 FROM MATRICULA_TURMA mt JOIN TURMA t ON t.id_turma=mt.id_turma WHERE ${condicoes.join(" AND ")})`,
        );
      }
      const filtro = " WHERE " + where.join(" AND "),
        total = (
          await um(
            pool,
            `SELECT COUNT(*) total FROM ${c.tabela} x` + filtro,
            args,
          )
        ).total;
      const dados = await linhas(
        pool,
        `SELECT x.* FROM ${c.tabela} x${filtro} ORDER BY x.nome,x.${c.pk} LIMIT ${pg.limite} OFFSET ${pg.offset}`,
        args,
      );
      return {
        dados: await projetarCadastros(pool, tipo, dados),
        paginacao: { pagina: pg.pagina, limite: pg.limite, total },
      };
    },
    async detalhar(tipo, id, ator) {
      const c = cadastros[tipo],
        acesso = filtroAcesso(tipo, ator),
        r = await um(
          pool,
          `SELECT x.* FROM ${c.tabela} x WHERE x.${c.pk}=? AND ${acesso.sql}`,
          [id, ...acesso.args],
        );
      if (!r) throw naoEncontrado();
      return (await projetarCadastros(pool, tipo, [r]))[0];
    },
    async salvar(tipo, id, corpo, ator) {
      const c = cadastros[tipo];
      v.objeto(corpo, [...Object.keys(c.campos), "ativo"]);
      return transacao(pool, async (db) => {
        const antes = id
          ? await um(
              db,
              `SELECT * FROM ${c.tabela} WHERE ${c.pk}=? FOR UPDATE`,
              [id],
            )
          : null;
        if (id && !antes) throw naoEncontrado();
        const valores = {};
        for (const [api, [sql, validar]] of Object.entries(c.campos))
          valores[sql] =
            id && !(api in corpo)
              ? antes[sql]
              : validar(corpo[api] ?? (api === "cor" ? "#246BC0" : undefined));
        valores.ativo =
          "ativo" in corpo ? v.booleano(corpo.ativo) : (antes?.ativo ?? true);
        await verificar(db, tipo, valores, id);
        let novoId = id;
        if (id)
          await linhas(
            db,
            `UPDATE ${c.tabela} SET ${Object.keys(valores)
              .map((k) => k + "=?")
              .join(",")} WHERE ${c.pk}=?`,
            [...Object.values(valores), id],
          );
        else
          novoId = (
            await linhas(
              db,
              `INSERT INTO ${c.tabela} (${Object.keys(valores).join(",")}) VALUES (${Object.keys(
                valores,
              )
                .map(() => "?")
                .join(",")})`,
              Object.values(valores),
            )
          ).insertId;
        const depois = dto(tipo, { ...valores, [c.pk]: novoId });
        await auditar(
          db,
          ator,
          c.tabela,
          novoId,
          id ? "ALTERACAO" : "CRIACAO",
          antes ? dto(tipo, antes) : null,
          depois,
          null,
          relogio(),
        );
        return depois;
      });
    },
  };
}

export function servicoVinculos(pool, relogio) {
  return {
    async matriculas(query, ator) {
      const pg = v.paginacao(query),
        acesso =
          ator.perfil === "PROFESSOR"
            ? {
                sql: "EXISTS (SELECT 1 FROM VINCULO_PROFESSOR vp WHERE vp.id_turma=m.id_turma AND vp.id_professor=? AND vp.ativo=1)",
                args: [ator.professorId],
              }
            : recorteAluno(ator, "m");
      const where = [acesso.sql],
        args = [...acesso.args];
      if (query.alunoId) {
        where.push("m.id_aluno=?");
        args.push(v.inteiro(query.alunoId, "alunoId"));
      }
      if (query.turmaId) {
        where.push("m.id_turma=?");
        args.push(v.inteiro(query.turmaId, "turmaId"));
      }
      if (query.atual !== undefined)
        where.push(
          v.opcao(query.atual, "atual", ["true", "false"]) === "true"
            ? "m.fim_em IS NULL"
            : "m.fim_em IS NOT NULL",
        );
      const base = ` FROM MATRICULA_TURMA m JOIN ALUNO a ON a.id_aluno=m.id_aluno JOIN TURMA t ON t.id_turma=m.id_turma WHERE ${where.join(" AND ")}`;
      const dados = await linhas(
        pool,
        `SELECT m.id_matricula_turma AS id,m.id_aluno AS alunoId,a.nome AS aluno,m.id_turma AS turmaId,t.nome AS turma,t.ano_letivo AS anoLetivo,m.inicio_em AS inicioEm,m.fim_em AS fimEm${base} ORDER BY m.id_matricula_turma DESC LIMIT ${pg.limite} OFFSET ${pg.offset}`,
        args,
      );
      return {
        dados: dados.map((r) => ({
          ...r,
          inicioEm: dataIso(r.inicioEm),
          fimEm: dataIso(r.fimEm),
        })),
        paginacao: {
          pagina: pg.pagina,
          limite: pg.limite,
          total: (await um(pool, "SELECT COUNT(*) total" + base, args)).total,
        },
      };
    },
    async professores(query, ator) {
      const pg = v.paginacao(query),
        filtro = ator.perfil === "PROFESSOR" ? "WHERE v.id_professor=?" : "",
        args = ator.perfil === "PROFESSOR" ? [ator.professorId] : [];
      const dados = await linhas(
        pool,
        `SELECT v.id_vinculo AS id,v.id_professor AS professorId,v.id_turma AS turmaId,v.id_disciplina AS disciplinaId,v.ano_letivo AS anoLetivo,v.ativo,u.nome AS professor,t.nome AS turma,d.nome AS disciplina
       FROM VINCULO_PROFESSOR v JOIN PROFESSOR p ON p.id_professor=v.id_professor JOIN USUARIO u ON u.id_usuario=p.id_usuario JOIN TURMA t ON t.id_turma=v.id_turma JOIN DISCIPLINA d ON d.id_disciplina=v.id_disciplina ${filtro} ORDER BY v.id_vinculo LIMIT ${pg.limite} OFFSET ${pg.offset}`,
        args,
      );
      const total = (
        await um(
          pool,
          "SELECT COUNT(*) total FROM VINCULO_PROFESSOR v " + filtro,
          args,
        )
      ).total;
      return {
        dados,
        paginacao: { pagina: pg.pagina, limite: pg.limite, total },
      };
    },
    async criarProfessor(corpo, ator) {
      v.objeto(corpo, ["professorId", "turmaId", "disciplinaId"]);
      const professor = v.inteiro(corpo.professorId),
        turma = v.inteiro(corpo.turmaId),
        disciplina = v.inteiro(corpo.disciplinaId);
      return transacao(pool, async (db) => {
        const t = await um(
          db,
          "SELECT ano_letivo FROM TURMA WHERE id_turma=? AND ativo=1 FOR UPDATE",
          [turma],
        );
        exigir(t, 409, "VINCULO_INVALIDO", "Selecione turma ativa.");
        exigir(
          await um(
            db,
            "SELECT p.id_professor FROM PROFESSOR p JOIN USUARIO u ON u.id_usuario=p.id_usuario WHERE p.id_professor=? AND u.ativo=1",
            [professor],
          ),
          409,
          "VINCULO_INVALIDO",
          "Selecione professor ativo.",
        );
        exigir(
          await um(
            db,
            "SELECT d.id_disciplina FROM DISCIPLINA d JOIN AREA_DISCIPLINA ar ON ar.id_area=d.id_area WHERE d.id_disciplina=? AND d.ativo=1 AND ar.ativo=1",
            [disciplina],
          ),
          409,
          "VINCULO_INVALIDO",
          "Selecione disciplina e área ativas.",
        );
        const id = (
          await linhas(
            db,
            "INSERT INTO VINCULO_PROFESSOR(id_professor,id_turma,id_disciplina,ano_letivo) VALUES (?,?,?,?)",
            [professor, turma, disciplina, t.ano_letivo],
          )
        ).insertId;
        await auditar(
          db,
          ator,
          "VINCULO_PROFESSOR",
          id,
          "CRIACAO",
          null,
          corpo,
          null,
          relogio(),
        );
        return { id, ...corpo, anoLetivo: t.ano_letivo, ativo: true };
      });
    },
    async alterarProfessor(id, corpo, ator) {
      v.objeto(corpo, ["ativo"]);
      const ativo = v.booleano(corpo.ativo);
      return transacao(pool, async (db) => {
        const antes = await um(
          db,
          "SELECT * FROM VINCULO_PROFESSOR WHERE id_vinculo=? FOR UPDATE",
          [id],
        );
        if (!antes) throw naoEncontrado();
        await linhas(
          db,
          "UPDATE VINCULO_PROFESSOR SET ativo=? WHERE id_vinculo=?",
          [ativo, id],
        );
        await auditar(
          db,
          ator,
          "VINCULO_PROFESSOR",
          id,
          "ALTERACAO",
          antes,
          { ...antes, ativo },
          null,
          relogio(),
        );
        return { id, ativo };
      });
    },
    async responsaveis(query, ator) {
      const pg = v.paginacao(query),
        filtro =
          ator.perfil === "RESPONSAVEL" ? "WHERE ar.id_responsavel=?" : "",
        args = ator.perfil === "RESPONSAVEL" ? [ator.responsavelId] : [];
      const dados = await linhas(
        pool,
        `SELECT ar.id_aluno AS alunoId,ar.id_responsavel AS responsavelId,ar.parentesco,ar.principal,ar.ativo,a.nome AS aluno,u.nome AS responsavel
       FROM ALUNO_RESPONSAVEL ar JOIN ALUNO a ON a.id_aluno=ar.id_aluno JOIN RESPONSAVEL r ON r.id_responsavel=ar.id_responsavel JOIN USUARIO u ON u.id_usuario=r.id_usuario ${filtro} ORDER BY ar.id_aluno,ar.id_responsavel LIMIT ${pg.limite} OFFSET ${pg.offset}`,
        args,
      );
      const total = (
        await um(
          pool,
          "SELECT COUNT(*) total FROM ALUNO_RESPONSAVEL ar " + filtro,
          args,
        )
      ).total;
      return {
        dados,
        paginacao: { pagina: pg.pagina, limite: pg.limite, total },
      };
    },
    async salvarResponsavel(alunoId, responsavelId, corpo, ator, novo = false) {
      v.objeto(
        corpo,
        novo
          ? ["alunoId", "responsavelId", "parentesco", "principal"]
          : ["parentesco", "principal", "ativo"],
      );
      const aluno = v.inteiro(alunoId),
        responsavel = v.inteiro(responsavelId);
      return transacao(pool, async (db) => {
        const cadastroAluno = await um(
          db,
          "SELECT id_aluno,ativo FROM ALUNO WHERE id_aluno=? FOR UPDATE",
          [aluno],
        );
        const cadastroResponsavel = await um(
          db,
          "SELECT r.id_responsavel,u.ativo FROM RESPONSAVEL r JOIN USUARIO u ON u.id_usuario=r.id_usuario WHERE r.id_responsavel=?",
          [responsavel],
        );
        exigir(
          cadastroAluno && cadastroResponsavel,
          409,
          "VINCULO_INVALIDO",
          "Selecione aluno e responsável cadastrados.",
        );
        const antes = await um(
          db,
          "SELECT * FROM ALUNO_RESPONSAVEL WHERE id_aluno=? AND id_responsavel=? FOR UPDATE",
          [aluno, responsavel],
        );
        if (!novo && !antes) throw naoEncontrado();
        exigir(!(novo && antes), 409, "DUPLICADO", "Vínculo já cadastrado.");
        const parentesco =
          "parentesco" in corpo
            ? v.opcao(corpo.parentesco, "parentesco", [
                "PAI",
                "MAE",
                "AVO",
                "AVOH",
                "TIO",
                "TIA",
                "OUTRO",
              ])
            : antes?.parentesco;
        exigir(parentesco, 400, "VALIDACAO", "Informe o parentesco.");
        const principal =
            "principal" in corpo
              ? v.booleano(corpo.principal)
              : !!antes?.principal,
          ativo =
            "ativo" in corpo ? v.booleano(corpo.ativo) : (antes?.ativo ?? true);
        exigir(
          !ativo || (cadastroAluno.ativo && cadastroResponsavel.ativo),
          409,
          "VINCULO_INATIVO",
          "Para ativar o vínculo, aluno e responsável precisam estar ativos.",
        );
        if (principal && ativo)
          exigir(
            !(await um(
              db,
              "SELECT id_responsavel FROM ALUNO_RESPONSAVEL WHERE id_aluno=? AND id_responsavel<>? AND principal=1 AND ativo=1",
              [aluno, responsavel],
            )),
            409,
            "PRINCIPAL_EXISTENTE",
            "Já existe responsável principal ativo para este aluno.",
          );
        if (novo)
          await linhas(
            db,
            "INSERT INTO ALUNO_RESPONSAVEL(id_aluno,id_responsavel,parentesco,principal,ativo,data_cadastro) VALUES (?,?,?,?,?,?)",
            [
              aluno,
              responsavel,
              parentesco,
              principal,
              ativo,
              dataSql(relogio()),
            ],
          );
        else
          await linhas(
            db,
            "UPDATE ALUNO_RESPONSAVEL SET parentesco=?,principal=?,ativo=? WHERE id_aluno=? AND id_responsavel=?",
            [parentesco, principal, ativo, aluno, responsavel],
          );
        const depois = {
          alunoId: aluno,
          responsavelId: responsavel,
          parentesco,
          principal,
          ativo,
        };
        await auditar(
          db,
          ator,
          "ALUNO_RESPONSAVEL",
          `${aluno}:${responsavel}`,
          novo ? "CRIACAO" : "ALTERACAO",
          antes,
          depois,
          null,
          relogio(),
        );
        return depois;
      });
    },
    async encerrarMatricula(id, ator) {
      return transacao(pool, async (db) => {
        const matricula = await um(
          db,
          "SELECT * FROM MATRICULA_TURMA WHERE id_matricula_turma=?",
          [id],
        );
        if (!matricula) throw naoEncontrado();
        // Usa a mesma ordem de bloqueios da transferência.
        await um(db, "SELECT id_aluno FROM ALUNO WHERE id_aluno=? FOR UPDATE", [
          matricula.id_aluno,
        ]);
        const atual = await um(
          db,
          "SELECT * FROM MATRICULA_TURMA WHERE id_matricula_turma=? FOR UPDATE",
          [id],
        );
        if (atual.fim_em) return;
        const agora = relogio(),
          fim = dataSql(agora);
        await linhas(
          db,
          "UPDATE MATRICULA_TURMA SET fim_em=? WHERE id_matricula_turma=?",
          [fim, id],
        );
        await auditar(
          db,
          ator,
          "MATRICULA_TURMA",
          id,
          "ENCERRAMENTO",
          atual,
          { ...atual, fim_em: fim },
          null,
          agora,
        );
      });
    },
    async matricular(corpo, ator) {
      v.objeto(corpo, ["alunoId", "turmaId"]);
      const aluno = v.inteiro(corpo.alunoId),
        turma = v.inteiro(corpo.turmaId),
        agora = dataSql(relogio());
      return transacao(pool, async (db) => {
        exigir(
          await um(
            db,
            "SELECT id_aluno FROM ALUNO WHERE id_aluno=? AND ativo=1 FOR UPDATE",
            [aluno],
          ),
          409,
          "ALUNO_INVALIDO",
          "Selecione aluno ativo.",
        );
        exigir(
          await um(
            db,
            "SELECT id_turma FROM TURMA WHERE id_turma=? AND ativo=1 FOR UPDATE",
            [turma],
          ),
          409,
          "TURMA_INVALIDA",
          "Selecione turma ativa.",
        );
        const atual = await um(
          db,
          "SELECT * FROM MATRICULA_TURMA WHERE id_aluno=? AND fim_em IS NULL FOR UPDATE",
          [aluno],
        );
        exigir(
          atual?.id_turma !== turma,
          409,
          "DUPLICADO",
          "O aluno já está matriculado nesta turma.",
        );
        if (atual)
          await linhas(
            db,
            "UPDATE MATRICULA_TURMA SET fim_em=? WHERE id_matricula_turma=?",
            [agora, atual.id_matricula_turma],
          );
        const id = (
          await linhas(
            db,
            "INSERT INTO MATRICULA_TURMA(id_aluno,id_turma,inicio_em) VALUES (?,?,?)",
            [aluno, turma, agora],
          )
        ).insertId;
        await auditar(
          db,
          ator,
          "MATRICULA_TURMA",
          id,
          atual ? "TRANSFERENCIA" : "CRIACAO",
          atual,
          { id, alunoId: aluno, turmaId: turma, inicioEm: dataIso(agora) },
          null,
          relogio(),
        );
        return { id, alunoId: aluno, turmaId: turma, inicioEm: dataIso(agora) };
      });
    },
  };
}

export function servicoBimestres(pool, relogio) {
  const dtoB = (r) => ({
    id: r.id_bimestre,
    numero: r.numero,
    anoLetivo: r.ano_letivo,
    abertura: dataIso(r.dt_abertura),
    encerramento: dataIso(r.dt_encerramento),
    ativo: !!r.ativo,
    situacao: !r.ativo
      ? "INATIVO"
      : relogio() < new Date(dataIso(r.dt_abertura))
        ? "AGENDADO"
        : relogio() > new Date(dataIso(r.dt_encerramento))
          ? "ENCERRADO"
          : "ABERTO",
  });
  function periodo(corpo, ano) {
    const abertura = v.instante(corpo.abertura, "abertura"),
      encerramento = v.instante(corpo.encerramento, "encerramento");
    // O ano escolar e avaliado em Brasilia; 31/12 a noite pode ser 01/01 em UTC.
    const anoEscolar = (data) =>
      new Intl.DateTimeFormat("en", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
      }).format(data);
    exigir(
      encerramento > abertura &&
        anoEscolar(abertura) === String(ano) &&
        anoEscolar(encerramento) === String(ano),
      400,
      "PERIODO_INVALIDO",
      "A abertura deve preceder o encerramento, ambos no ano letivo em Brasília.",
    );
    return [dataSql(abertura), dataSql(encerramento)];
  }
  return {
    async listar(query) {
      const args = [],
        where = query.anoLetivo ? "WHERE ano_letivo=?" : "";
      if (query.anoLetivo)
        args.push(v.inteiro(query.anoLetivo, "anoLetivo", 2000, 2100));
      return {
        dados: (
          await linhas(
            pool,
            "SELECT * FROM BIMESTRE " + where + " ORDER BY ano_letivo,numero",
            args,
          )
        ).map(dtoB),
      };
    },
    async criarAno(corpo, ator) {
      v.objeto(corpo, ["anoLetivo", "periodos"]);
      const ano = v.inteiro(corpo.anoLetivo, "anoLetivo", 2000, 2100);
      exigir(
        Array.isArray(corpo.periodos) && corpo.periodos.length === 4,
        400,
        "VALIDACAO",
        "Informe os quatro períodos.",
      );
      const periodos = corpo.periodos.map((p) => {
        v.objeto(p, ["numero", "abertura", "encerramento"]);
        return {
          numero: v.inteiro(p.numero, "numero", 1, 4),
          datas: periodo(p, ano),
        };
      });
      exigir(
        new Set(periodos.map((p) => p.numero)).size === 4,
        400,
        "VALIDACAO",
        "Não repita bimestres.",
      );
      return transacao(pool, async (db) => {
        const ids = [];
        for (const p of periodos)
          ids.push(
            (
              await linhas(
                db,
                "INSERT INTO BIMESTRE(numero,ano_letivo,dt_abertura,dt_encerramento) VALUES (?,?,?,?)",
                [p.numero, ano, ...p.datas],
              )
            ).insertId,
          );
        await auditar(
          db,
          ator,
          "BIMESTRE",
          ano,
          "CRIACAO_ANO",
          null,
          corpo,
          null,
          relogio(),
        );
        return { ids, anoLetivo: ano };
      });
    },
    async editar(id, corpo, ator) {
      v.objeto(corpo, ["abertura", "encerramento", "ativo"]);
      return transacao(pool, async (db) => {
        const antes = await um(
          db,
          "SELECT * FROM BIMESTRE WHERE id_bimestre=? FOR UPDATE",
          [id],
        );
        if (!antes) throw naoEncontrado();
        const datas = periodo(
            {
              abertura: corpo.abertura ?? dataIso(antes.dt_abertura),
              encerramento:
                corpo.encerramento ?? dataIso(antes.dt_encerramento),
            },
            antes.ano_letivo,
          ),
          ativo = "ativo" in corpo ? v.booleano(corpo.ativo) : !!antes.ativo;
        await linhas(
          db,
          "UPDATE BIMESTRE SET dt_abertura=?,dt_encerramento=?,ativo=? WHERE id_bimestre=?",
          [...datas, ativo, id],
        );
        const depois = dtoB({
          ...antes,
          dt_abertura: datas[0],
          dt_encerramento: datas[1],
          ativo,
        });
        await auditar(
          db,
          ator,
          "BIMESTRE",
          id,
          "ALTERACAO",
          dtoB(antes),
          depois,
          null,
          relogio(),
        );
        return depois;
      });
    },
  };
}
