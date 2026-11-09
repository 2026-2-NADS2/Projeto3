import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  criarPool,
  transacao,
  um,
  linhas,
  dataSql,
} from "../src/banco/pool.js";
import { lerAmbiente } from "../src/config/ambiente.js";
import { criarUsuario } from "../src/servicos/usuarios.js";
import { senha as validarSenha } from "../src/validadores.js";

// Somente dados ficticios coerentes. Nao importa os arrays repetidos das telas.
export async function inserirDemo(
  pool,
  senha,
  ano = new Date().getFullYear(),
  { tresContas = true } = {},
) {
  validarSenha(senha);
  return transacao(pool, async (db) => {
    if ((await um(db, "SELECT COUNT(*) total FROM USUARIO")).total)
      throw new Error(
        "A carga demo exige um banco vazio. Nao apaga nem substitui dados existentes.",
      );
    const agora = new Date(),
      criar = (nome, email, perfil, extra = {}) =>
        criarUsuario(db, { nome, email, senha, perfil, ...extra }, null, agora);
    const admin = await criar(
      "Ana Costa",
      "admin@example.com",
      "ADMINISTRADOR",
    );
    const pa = await criar("Ana Paula", "ana.paula@example.com", "PROFESSOR", {
      matricula: "PROF-001",
    });
    const pb = tresContas
      ? null
      : await criar("João Lima", "joao.lima@example.com", "PROFESSOR", {
          matricula: "PROF-002",
        });
    const ra = tresContas
      ? null
      : await criar(
          "Maria Almeida",
          "maria.almeida@example.com",
          "RESPONSAVEL",
        );
    const rb = await criar(
      "Carlos Almeida",
      "carlos.almeida@example.com",
      "RESPONSAVEL",
    );
    const rc = tresContas
      ? null
      : await criar("Carla Silva", "carla.silva@example.com", "RESPONSAVEL");
    const professorA = (
      await um(db, "SELECT id_professor id FROM PROFESSOR WHERE id_usuario=?", [
        pa.id,
      ])
    ).id;
    const professorB =
      pb &&
      (
        await um(
          db,
          "SELECT id_professor id FROM PROFESSOR WHERE id_usuario=?",
          [pb.id],
        )
      ).id;
    const responsavelA =
      ra &&
      (
        await um(
          db,
          "SELECT id_responsavel id FROM RESPONSAVEL WHERE id_usuario=?",
          [ra.id],
        )
      ).id;
    const responsavelB = (
      await um(
        db,
        "SELECT id_responsavel id FROM RESPONSAVEL WHERE id_usuario=?",
        [rb.id],
      )
    ).id;
    const responsavelC =
      rc &&
      (
        await um(
          db,
          "SELECT id_responsavel id FROM RESPONSAVEL WHERE id_usuario=?",
          [rc.id],
        )
      ).id;
    const insert = async (sql, args) => (await linhas(db, sql, args)).insertId;
    const area = await insert(
      "INSERT INTO AREA_DISCIPLINA(nome,descricao) VALUES (?,?)",
      ["Exatas", "Matemática e raciocínio lógico."],
    );
    const disciplina = await insert(
      "INSERT INTO DISCIPLINA(nome,id_area) VALUES (?,?)",
      ["Matemática", area],
    );
    const turmaA = await insert(
      "INSERT INTO TURMA(nome,ano_letivo,serie,turno) VALUES (?,?,?,?)",
      ["8º A", ano, "8º ano", "Manhã"],
    );
    const turmaB = await insert(
      "INSERT INTO TURMA(nome,ano_letivo,serie,turno) VALUES (?,?,?,?)",
      ["9º B", ano, "9º ano", "Tarde"],
    );
    const alunoA = await insert(
      "INSERT INTO ALUNO(nome,matricula,data_nascimento) VALUES (?,?,?)",
      ["Pedro Almeida", `${ano}-001`, `${ano - 13}-03-12`],
    );
    const alunoB = await insert(
      "INSERT INTO ALUNO(nome,matricula,data_nascimento) VALUES (?,?,?)",
      ["Mariana Silva", `${ano}-002`, `${ano - 14}-05-15`],
    );
    for (const [aluno, turma] of [
      [alunoA, turmaA],
      [alunoB, turmaB],
    ])
      await linhas(
        db,
        "INSERT INTO MATRICULA_TURMA(id_aluno,id_turma,inicio_em) VALUES (?,?,?)",
        [aluno, turma, `${ano}-01-01 00:00:00`],
      );
    for (const [aluno, resp, parentesco, principal] of [
      [alunoA, responsavelA, "MAE", 1],
      [alunoA, responsavelB, "PAI", tresContas ? 1 : 0],
      [alunoB, responsavelC, "MAE", 1],
    ].filter(([, responsavel]) => responsavel))
      await linhas(
        db,
        "INSERT INTO ALUNO_RESPONSAVEL(id_aluno,id_responsavel,parentesco,principal,data_cadastro) VALUES (?,?,?,?,?)",
        [aluno, resp, parentesco, principal, dataSql(agora)],
      );
    const vinculoA = await insert(
      "INSERT INTO VINCULO_PROFESSOR(id_professor,id_turma,id_disciplina,ano_letivo) VALUES (?,?,?,?)",
      [professorA, turmaA, disciplina, ano],
    );
    const vinculoB =
      professorB &&
      (await insert(
        "INSERT INTO VINCULO_PROFESSOR(id_professor,id_turma,id_disciplina,ano_letivo) VALUES (?,?,?,?)",
        [professorB, turmaB, disciplina, ano],
      ));
    const tag = await insert("INSERT INTO TAG(nome,cor) VALUES (?,?)", [
      "Participativo",
      "#246BC0",
    ]);
    const tag2 = await insert("INSERT INTO TAG(nome,cor) VALUES (?,?)", [
      "Precisa de apoio",
      "#D97706",
    ]);
    const bimestres = [];
    for (let numero = 1; numero <= 4; numero++) {
      const mes = (numero - 1) * 3 + 1,
        ultimo = numero * 3;
      // Inicio/fim do dia de Brasilia convertidos para UTC, incluindo a virada do ano.
      const abertura = new Date(Date.UTC(ano, mes - 1, 1, 3)),
        encerramento = new Date(Date.UTC(ano, ultimo, 1, 3) - 1);
      bimestres.push(
        await insert(
          "INSERT INTO BIMESTRE(numero,ano_letivo,dt_abertura,dt_encerramento) VALUES (?,?,?,?)",
          [numero, ano, dataSql(abertura), dataSql(encerramento)],
        ),
      );
    }
    return {
      adminId: admin.id,
      professorA,
      professorB,
      responsavelA,
      responsavelB,
      responsavelC,
      area,
      disciplina,
      turmaA,
      turmaB,
      alunoA,
      alunoB,
      vinculoA,
      vinculoB,
      tag,
      tag2,
      bimestres,
    };
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const config = lerAmbiente();
  if (config.producao)
    throw new Error("Carga demonstrativa desabilitada em producao.");
  const pool = criarPool(config.db);
  try {
    await inserirDemo(pool, process.env.DEMO_PASSWORD);
    console.log(
      "Carga inicial criada. Contas: admin, ana.paula e carlos.almeida @example.com. Senha inicial: valor de DEMO_PASSWORD.",
    );
  } finally {
    await pool.end();
  }
}
