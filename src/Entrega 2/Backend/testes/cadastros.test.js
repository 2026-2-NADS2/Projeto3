import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { criarPool, um } from "../src/banco/pool.js";
import { lerAmbiente } from "../src/config/ambiente.js";
import { criarApp } from "../src/app.js";
import { migrar } from "../scripts/migrar.js";
import { inserirDemo } from "../scripts/seed-demo.js";

// O harness cria um banco novo por arquivo de integracao, evitando dependencia de ordem.
test(
  "Cadastros completos e limites de prazo com MySQL",
  { skip: process.env.COLLISION_MYSQL_TEST !== "1" },
  async (t) => {
    assert.match(process.env.DB_NAME, /^collision_api_test_[a-f0-9]{8}$/);
    const config = { ...lerAmbiente(), jwtTtl: 7200 },
      pool = criarPool(config.db),
      senha = "TesteLocal@2026";
    let agora = new Date("2026-11-07T12:00:00.000Z");
    const app = criarApp({
        pool,
        config,
        relogio: () => agora,
        limitar: false,
      }),
      api = request(app);
    const esperar = (r, s) => {
      assert.equal(r.status, s, JSON.stringify(r.body));
      return r.body;
    };
    const post = (p, b, token) =>
        api
          .post("/api" + p)
          .set("Authorization", "Bearer " + token)
          .send(b),
      patch = (p, b, token) =>
        api
          .patch("/api" + p)
          .set("Authorization", "Bearer " + token)
          .send(b),
      get = (p, token) =>
        api.get("/api" + p).set("Authorization", "Bearer " + token);
    try {
      await migrar(pool);
      const ids = await inserirDemo(pool, senha, 2026, { tresContas: false });
      const login = async (email) =>
        esperar(await api.post("/api/auth/login").send({ email, senha }), 200)
          .token;
      const admin = await login("admin@example.com"),
        prof = await login("ana.paula@example.com"),
        familia = await login("maria.almeida@example.com");
      await t.test(
        "contrato OpenAPI e publico e inclui os recursos implementados",
        async () => {
          const doc = esperar(await api.get("/api/openapi.json"), 200);
          assert.equal(doc.openapi, "3.1.0");
          assert.ok(doc.paths["/acompanhamentos/{id}/publicar"].post);
          assert.ok(doc.paths["/auth/login"].post.security.length === 0);
        },
      );
      await t.test(
        "cadastro de professor e responsavel cria perfil e protege senhas",
        async () => {
          const p = esperar(
            await post(
              "/usuarios",
              {
                nome: "Professor de teste",
                email: "novo.professor@example.com",
                senha,
                perfil: "PROFESSOR",
                matricula: "P-TESTE",
              },
              admin,
            ),
            201,
          );
          const r = esperar(
            await post(
              "/usuarios",
              {
                nome: "Responsável de teste",
                email: "novo.responsavel@example.com",
                senha,
                perfil: "RESPONSAVEL",
              },
              admin,
            ),
            201,
          );
          assert.ok(
            esperar(await get("/usuarios/" + p.id, admin), 200).professorId,
          );
          assert.ok(
            esperar(await get("/usuarios/" + r.id, admin), 200).responsavelId,
          );
          assert.equal(p.senha, undefined);
          assert.equal(p.senha_hash, undefined);
          const hash = (
            await um(
              pool,
              "SELECT senha_hash FROM USUARIO WHERE id_usuario=?",
              [p.id],
            )
          ).senha_hash;
          assert.notEqual(hash, senha);
          assert.ok(hash.startsWith("$2"));
          esperar(
            await post(
              "/usuarios",
              {
                nome: "Sem matrícula",
                email: "erro@example.com",
                senha,
                perfil: "PROFESSOR",
              },
              admin,
            ),
            400,
          );
          assert.equal(
            (
              await um(
                pool,
                "SELECT COUNT(*) total FROM USUARIO WHERE email=?",
                ["erro@example.com"],
              )
            ).total,
            0,
          );
        },
      );
      let turma, aluno, disciplina;
      await t.test(
        "administrador cria area, disciplina, turma e aluno com validacoes",
        async () => {
          const area = esperar(
            await post(
              "/areas",
              { nome: "Humanas", descricao: "Área de teste" },
              admin,
            ),
            201,
          );
          disciplina = esperar(
            await post(
              "/disciplinas",
              { nome: "História", areaId: area.id },
              admin,
            ),
            201,
          );
          turma = esperar(
            await post(
              "/turmas",
              {
                nome: "7º C",
                anoLetivo: 2026,
                serie: "7º ano",
                turno: "Tarde",
              },
              admin,
            ),
            201,
          );
          aluno = esperar(
            await post(
              "/alunos",
              {
                nome: "Aluno de teste",
                matricula: "TEST-01",
                dataNascimento: "2013-04-15",
              },
              admin,
            ),
            201,
          );
          esperar(
            await post(
              "/alunos",
              {
                nome: "Data inválida",
                matricula: "TEST-02",
                dataNascimento: "2026-02-30",
              },
              admin,
            ),
            400,
          );
          esperar(
            await post(
              "/alunos",
              {
                nome: "Futuro",
                matricula: "TEST-03",
                dataNascimento: "2027-01-01",
              },
              admin,
            ),
            400,
          );
          esperar(
            await patch("/areas/" + area.id, { ativo: false }, admin),
            200,
          );
          esperar(
            await post(
              "/disciplinas",
              { nome: "Filosofia", areaId: area.id },
              admin,
            ),
            409,
          );
          esperar(
            await patch("/areas/" + area.id, { ativo: true }, admin),
            200,
          );
        },
      );
      await t.test(
        "matricula e atribuicao validam duplicidade e ano da turma em uso",
        async () => {
          esperar(
            await post(
              "/matriculas",
              { alunoId: aluno.id, turmaId: turma.id },
              admin,
            ),
            201,
          );
          const body = {
            professorId: ids.professorA,
            turmaId: turma.id,
            disciplinaId: disciplina.id,
          };
          const vinc = esperar(
            await post("/vinculos/professores", body, admin),
            201,
          );
          esperar(await post("/vinculos/professores", body, admin), 409);
          esperar(
            await patch("/turmas/" + turma.id, { anoLetivo: 2027 }, admin),
            409,
          );
          esperar(
            await patch(
              "/vinculos/professores/" + vinc.id,
              { ativo: false },
              admin,
            ),
            200,
          );
          const r = await post(
            "/acompanhamentos",
            {
              alunoId: aluno.id,
              vinculoId: vinc.id,
              bimestreId: ids.bimestres[3],
            },
            prof,
          );
          esperar(r, 403);
          esperar(
            await patch(
              "/vinculos/professores/" + vinc.id,
              { ativo: true },
              admin,
            ),
            200,
          );
        },
      );
      await t.test(
        "vinculo familiar exige um principal e inativacao retira acesso",
        async () => {
          esperar(
            await post(
              "/vinculos/responsaveis",
              {
                alunoId: aluno.id,
                responsavelId: ids.responsavelA,
                parentesco: "MAE",
                principal: true,
              },
              admin,
            ),
            201,
          );
          esperar(
            await post(
              "/vinculos/responsaveis",
              {
                alunoId: aluno.id,
                responsavelId: ids.responsavelB,
                parentesco: "PAI",
                principal: true,
              },
              admin,
            ),
            409,
          );
          esperar(await get("/alunos/" + aluno.id, familia), 200);
          esperar(
            await patch(
              `/vinculos/responsaveis/${aluno.id}/${ids.responsavelA}`,
              { ativo: false },
              admin,
            ),
            200,
          );
          esperar(await get("/alunos/" + aluno.id, familia), 404);
        },
      );
      await t.test(
        "quatro periodos sao criados juntos e ano repetido nao cria registros parciais",
        async () => {
          const body = {
            anoLetivo: 2027,
            periodos: [1, 2, 3, 4].map((numero) => ({
              numero,
              abertura: `2027-${String(numero * 2).padStart(2, "0")}-01T08:00:00-03:00`,
              encerramento: `2027-${String(numero * 2 + 1).padStart(2, "0")}-01T18:00:00-03:00`,
            })),
          };
          esperar(await post("/bimestres/ano", body, admin), 201);
          esperar(await post("/bimestres/ano", body, admin), 409);
          assert.equal(
            (
              await um(
                pool,
                "SELECT COUNT(*) total FROM BIMESTRE WHERE ano_letivo=2027",
              )
            ).total,
            4,
          );
          esperar(
            await patch(
              "/bimestres/" + ids.bimestres[3],
              {
                abertura: "2026-12-01T12:00:00Z",
                encerramento: "2026-11-01T12:00:00Z",
              },
              admin,
            ),
            400,
          );
          const ultimo = (
            await um(
              pool,
              "SELECT id_bimestre id FROM BIMESTRE WHERE ano_letivo=2027 AND numero=4",
            )
          ).id;
          const fim = esperar(
            await patch(
              "/bimestres/" + ultimo,
              { encerramento: "2027-12-31T23:59:59-03:00" },
              admin,
            ),
            200,
          );
          assert.equal(fim.encerramento, "2028-01-01T02:59:59.000Z");
          esperar(
            await patch("/bimestres/" + ultimo, { ativo: false }, admin),
            200,
          );
        },
      );
      await t.test(
        "abertura e encerramento sao inclusivos; apos encerramento bloqueia servidor",
        async () => {
          const bimestre = ids.bimestres[3];
          esperar(
            await patch(
              "/bimestres/" + bimestre,
              {
                abertura: "2026-11-07T12:00:00Z",
                encerramento: "2026-11-07T13:00:00Z",
              },
              admin,
            ),
            200,
          );
          let r = esperar(
            await post(
              "/acompanhamentos",
              {
                alunoId: ids.alunoA,
                vinculoId: ids.vinculoA,
                bimestreId: bimestre,
              },
              prof,
            ),
            201,
          );
          agora = new Date("2026-11-07T13:00:00.000Z");
          r = esperar(
            await patch(
              "/acompanhamentos/" + r.id,
              { versao: r.versao, descricao: "No instante final" },
              prof,
            ),
            200,
          );
          agora = new Date("2026-11-07T13:00:00.001Z");
          esperar(
            await patch(
              "/acompanhamentos/" + r.id,
              { versao: r.versao, descricao: "Depois do prazo" },
              prof,
            ),
            409,
          );
        },
      );
      await t.test(
        "remocao de vinculo e permitida mesmo apos inativar o responsavel",
        async () => {
          agora = new Date("2026-11-07T12:00:00.000Z");
          const u = await um(
            pool,
            "SELECT id_usuario FROM RESPONSAVEL WHERE id_responsavel=?",
            [ids.responsavelB],
          );
          esperar(
            await patch("/usuarios/" + u.id_usuario, { ativo: false }, admin),
            200,
          );
          esperar(
            await patch(
              `/vinculos/responsaveis/${ids.alunoA}/${ids.responsavelB}`,
              { ativo: false },
              admin,
            ),
            200,
          );
          esperar(
            await patch(
              `/vinculos/responsaveis/${ids.alunoA}/${ids.responsavelB}`,
              { ativo: true },
              admin,
            ),
            409,
          );
        },
      );
    } finally {
      await pool.end();
    }
  },
);
