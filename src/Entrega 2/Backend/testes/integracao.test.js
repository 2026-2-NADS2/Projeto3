import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import request from "supertest";
import jwt from "jsonwebtoken";
import { criarPool, um } from "../src/banco/pool.js";
import { lerAmbiente } from "../src/config/ambiente.js";
import { criarApp } from "../src/app.js";
import { migrar } from "../scripts/migrar.js";
import { inserirDemo } from "../scripts/seed-demo.js";

test(
  "API HTTP com MySQL real: fluxo escolar, persistencia e autorizacao",
  { skip: process.env.COLLISION_MYSQL_TEST !== "1" },
  async (t) => {
    assert.match(
      process.env.DB_NAME,
      /^collision_api_test_[a-f0-9]{8}$/,
      "Somente um banco reservado aos testes pode ser usado.",
    );
    const config = lerAmbiente(),
      pool = criarPool(config.db),
      emails = [],
      senha = "TesteLocal@2026";
    let agora = new Date("2026-11-07T12:00:00.000Z");
    const app = criarApp({
      pool,
      config,
      relogio: () => agora,
      enviarEmail: async (e) => emails.push(e),
      limitar: false,
    });
    const api = request(app),
      get = (rota, token) =>
        api.get("/api" + rota).set("Authorization", "Bearer " + token),
      post = (rota, corpo, token) =>
        api
          .post("/api" + rota)
          .set("Authorization", "Bearer " + token)
          .send(corpo),
      patch = (rota, corpo, token) =>
        api
          .patch("/api" + rota)
          .set("Authorization", "Bearer " + token)
          .send(corpo);
    let ids, admin, prof, profB, fam, famB, famC, registro;
    const login = async (email) => {
      const r = await api.post("/api/auth/login").send({ email, senha });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      return r.body.token;
    };
    const esperar = (r, status) => {
      assert.equal(r.status, status, JSON.stringify(r.body));
      return r.body;
    };
    try {
      await migrar(pool);
      await migrar(pool);
      ids = await inserirDemo(pool, senha, 2026, { tresContas: false });
      admin = await login("admin@example.com");
      prof = await login("ana.paula@example.com");
      profB = await login("joao.lima@example.com");
      fam = await login("maria.almeida@example.com");
      famB = await login("carlos.almeida@example.com");
      famC = await login("carla.silva@example.com");
      await t.test(
        "saude verifica banco; CORS e erros nao expõem detalhes",
        async () => {
          esperar(await api.get("/api/saude"), 200);
          const cors = await api
            .get("/api/saude")
            .set("Origin", "https://origem-invalida.example");
          assert.equal(cors.headers["access-control-allow-origin"], undefined);
          const invalido = await api
            .post("/api/auth/login")
            .set("Content-Type", "application/json")
            .send("{");
          esperar(invalido, 400);
          assert.equal(invalido.body.erro.codigo, "JSON_INVALIDO");
          esperar(await api.get("/api/alunos"), 401);
          esperar(await get("/nao-existe", admin), 404);
        },
      );
      await t.test(
        "login invalido, JWT adulterado e JWT expirado sao recusados",
        async () => {
          esperar(
            await api
              .post("/api/auth/login")
              .send({ email: "admin@example.com", senha: "SenhaErrada!" }),
            401,
          );
          esperar(await get("/auth/me", prof + "x"), 401);
          const original = jwt.decode(prof),
            expirado = jwt.sign(
              { sid: original.sid, sub: original.sub, exp: 1 },
              config.jwtSecret,
              {
                algorithm: "HS256",
                issuer: "collision-api",
                audience: "collision-web",
              },
            );
          esperar(await get("/auth/me", expirado), 401);
          const me = esperar(await get("/auth/me", prof), 200);
          assert.equal(me.usuario.perfil, "PROFESSOR");
          assert.equal(me.usuario.senha_hash, undefined);
        },
      );
      await t.test(
        "cadastros administrativos persistem; familia nao pode criar nem listar usuarios",
        async () => {
          esperar(await post("/areas", { nome: "Linguagens" }, fam), 403);
          esperar(await get("/usuarios", fam), 403);
          const area = esperar(
            await post("/areas", { nome: "Linguagens" }, admin),
            201,
          );
          assert.equal(
            esperar(await get("/areas/" + area.id, admin), 200).nome,
            "Linguagens",
          );
          esperar(await post("/areas", { nome: "Linguagens" }, admin), 409);
          esperar(
            await patch("/usuarios/" + ids.adminId, { ativo: false }, admin),
            409,
          );
          esperar(
            await post(
              "/usuarios",
              {
                nome: "X",
                email: "x@example.com",
                senha,
                perfil: "ADMINISTRADOR",
              },
              fam,
            ),
            403,
          );
        },
      );
      await t.test(
        "listas e detalhe de alunos respeitam vinculos",
        async () => {
          const alunos = esperar(await get("/meus-alunos", fam), 200).dados;
          assert.deepEqual(
            alunos.map((a) => a.id),
            [ids.alunoA],
          );
          assert.equal(alunos[0].turma, "8º A");
          assert.equal(
            esperar(await get("/alunos?turmaId=" + ids.turmaB, fam), 200)
              .paginacao.total,
            0,
          );
          esperar(await get("/alunos/" + ids.alunoB, fam), 404);
          esperar(await get("/alunos/" + ids.alunoB, prof), 404);
          assert.equal(
            esperar(await get("/vinculos/professores", prof), 200).dados.length,
            1,
          );
          esperar(await get("/alunos?limite=1000", admin), 400);
          esperar(await get("/alunos/1%20OR%201=1", admin), 400);
        },
      );
      await t.test(
        "validacao bloqueia nota, autoria externa, turma alheia e periodo fechado",
        async () => {
          const corpo = {
            alunoId: ids.alunoA,
            vinculoId: ids.vinculoA,
            bimestreId: ids.bimestres[3],
            descricao: "Descrição",
            media: 11,
            tagIds: [ids.tag],
          };
          esperar(await post("/acompanhamentos", corpo, prof), 400);
          esperar(
            await post(
              "/acompanhamentos",
              { ...corpo, media: 8, professorId: ids.professorB },
              prof,
            ),
            400,
          );
          esperar(
            await post(
              "/acompanhamentos",
              { ...corpo, media: 8, vinculoId: ids.vinculoB },
              prof,
            ),
            403,
          );
          esperar(
            await post(
              "/acompanhamentos",
              { ...corpo, media: 8, bimestreId: ids.bimestres[0] },
              prof,
            ),
            409,
          );
        },
      );
      await t.test(
        "rascunho incompleto e permitido, envio incompleto e bloqueado",
        async () => {
          registro = esperar(
            await post(
              "/acompanhamentos",
              {
                alunoId: ids.alunoA,
                vinculoId: ids.vinculoA,
                bimestreId: ids.bimestres[3],
              },
              prof,
            ),
            201,
          );
          assert.equal(registro.status, "RASCUNHO");
          esperar(
            await post(
              `/acompanhamentos/${registro.id}/enviar`,
              { versao: registro.versao },
              prof,
            ),
            400,
          );
          esperar(await get("/acompanhamentos/" + registro.id, fam), 404);
          esperar(await get(`/acompanhamentos/${registro.id}/pdf`, fam), 404);
          esperar(await get("/acompanhamentos/" + registro.id, profB), 404);
          esperar(
            await post(
              "/acompanhamentos",
              {
                alunoId: ids.alunoA,
                vinculoId: ids.vinculoA,
                bimestreId: ids.bimestres[3],
              },
              prof,
            ),
            409,
          );
        },
      );
      await t.test(
        "falha na auditoria desfaz a alteracao do acompanhamento",
        async () => {
          await pool.query(
            "CREATE TRIGGER bloquear_auditoria BEFORE INSERT ON HISTORICO_AUDITORIA FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Falha de teste'",
          );
          try {
            esperar(
              await patch(
                "/acompanhamentos/" + registro.id,
                { versao: registro.versao, descricao: "Não deve ficar salvo" },
                prof,
              ),
              500,
            );
            const salvo = esperar(
              await get("/acompanhamentos/" + registro.id, prof),
              200,
            );
            assert.equal(salvo.descricao, null);
            assert.equal(salvo.versao, registro.versao);
          } finally {
            await pool.query("DROP TRIGGER bloquear_auditoria");
          }
        },
      );
      await t.test(
        "edicao, envio, devolucao, correcao e reenvio preservam regras",
        async () => {
          registro = esperar(
            await patch(
              "/acompanhamentos/" + registro.id,
              {
                versao: registro.versao,
                descricao:
                  "Pedro apresentou evolução em frações e organização.",
                estrategias: "Revisão orientada.",
                ajudaFamilia: "Converse sobre as atividades.",
                media: 8.7,
                tagIds: [ids.tag, ids.tag2],
              },
              prof,
            ),
            200,
          );
          esperar(
            await patch(
              "/acompanhamentos/" + registro.id,
              { versao: 1, descricao: "Antiga" },
              prof,
            ),
            409,
          );
          registro = esperar(
            await post(
              `/acompanhamentos/${registro.id}/enviar`,
              { versao: registro.versao },
              prof,
            ),
            200,
          );
          esperar(
            await patch(
              "/acompanhamentos/" + registro.id,
              { versao: registro.versao, descricao: "Editando enviado" },
              prof,
            ),
            409,
          );
          esperar(
            await post(
              `/acompanhamentos/${registro.id}/publicar`,
              { versao: registro.versao },
              admin,
            ),
            409,
          );
          registro = esperar(
            await post(
              `/acompanhamentos/${registro.id}/iniciar-revisao`,
              { versao: registro.versao },
              admin,
            ),
            200,
          );
          esperar(
            await post(
              `/acompanhamentos/${registro.id}/devolver`,
              { versao: registro.versao },
              admin,
            ),
            400,
          );
          registro = esperar(
            await post(
              `/acompanhamentos/${registro.id}/devolver`,
              { versao: registro.versao, motivo: "Detalhar estratégias." },
              admin,
            ),
            200,
          );
          registro = esperar(
            await patch(
              "/acompanhamentos/" + registro.id,
              {
                versao: registro.versao,
                estrategias: "Revisão semanal com apoio visual.",
              },
              prof,
            ),
            200,
          );
          assert.equal(registro.status, "DEVOLVIDO");
          registro = esperar(
            await post(
              `/acompanhamentos/${registro.id}/enviar`,
              { versao: registro.versao },
              prof,
            ),
            200,
          );
          registro = esperar(
            await post(
              `/acompanhamentos/${registro.id}/iniciar-revisao`,
              { versao: registro.versao },
              admin,
            ),
            200,
          );
          esperar(
            await patch(
              "/acompanhamentos/" + registro.id,
              { versao: registro.versao, media: 9 },
              admin,
            ),
            400,
          );
          registro = esperar(
            await patch(
              "/acompanhamentos/" + registro.id,
              {
                versao: registro.versao,
                media: 9,
                motivo: "Conferência com o professor.",
              },
              admin,
            ),
            200,
          );
        },
      );
      await t.test(
        "publicacoes concorrentes resultam em um sucesso e um conflito",
        async () => {
          const respostas = await Promise.all([
            post(
              `/acompanhamentos/${registro.id}/publicar`,
              { versao: registro.versao },
              admin,
            ),
            post(
              `/acompanhamentos/${registro.id}/publicar`,
              { versao: registro.versao },
              admin,
            ),
          ]);
          assert.deepEqual(respostas.map((r) => r.status).sort(), [200, 409]);
          registro = respostas.find((r) => r.status === 200).body;
          const total = await um(
            pool,
            "SELECT COUNT(*) total FROM HISTORICO_AUDITORIA WHERE id_acompanhamento=? AND acao='PUBLICAR'",
            [registro.id],
          );
          assert.equal(total.total, 1);
          esperar(
            await patch(
              "/acompanhamentos/" + registro.id,
              { versao: registro.versao, media: 10, motivo: "Teste" },
              admin,
            ),
            409,
          );
        },
      );
      await t.test(
        "familia acessa apenas publicacao vinculada e nao ve auditoria interna",
        async () => {
          const publicado = esperar(
            await get("/acompanhamentos/" + registro.id, fam),
            200,
          );
          assert.equal(publicado.media, 9);
          assert.equal(publicado.motivoDevolucao, undefined);
          assert.equal(publicado.ciencias, undefined);
          esperar(await get("/acompanhamentos/" + registro.id, famC), 404);
          esperar(
            await get(`/acompanhamentos/${registro.id}/historico`, fam),
            403,
          );
          assert.equal(
            esperar(await get("/acompanhamentos?pendente=true", fam), 200)
              .paginacao.total,
            1,
          );
        },
      );
      await t.test(
        "ciencia idempotente e independente entre dois responsaveis",
        async () => {
          esperar(
            await post(
              `/acompanhamentos/${registro.id}/observacoes`,
              { texto: "Antes da leitura" },
              fam,
            ),
            409,
          );
          const ciencia = async (token) =>
            esperar(
              await api
                .put(`/api/acompanhamentos/${registro.id}/ciencia`)
                .set("Authorization", "Bearer " + token)
                .send({}),
              200,
            );
          const primeira = await ciencia(fam),
            segunda = await ciencia(fam);
          assert.deepEqual(primeira, segunda);
          assert.equal(
            esperar(await get("/acompanhamentos?pendente=true", fam), 200)
              .paginacao.total,
            0,
          );
          assert.equal(
            esperar(await get("/acompanhamentos?pendente=true", famB), 200)
              .paginacao.total,
            1,
          );
          await ciencia(famB);
          assert.equal(
            (
              await um(
                pool,
                "SELECT COUNT(*) total FROM RETORNO_RESPONSAVEL WHERE id_acompanhamento=?",
                [registro.id],
              )
            ).total,
            2,
          );
        },
      );
      await t.test(
        "observacoes ficam visiveis a escola e somente ao autor na familia",
        async () => {
          esperar(
            await post(
              `/acompanhamentos/${registro.id}/observacoes`,
              { texto: " " },
              fam,
            ),
            400,
          );
          esperar(
            await post(
              `/acompanhamentos/${registro.id}/observacoes`,
              { texto: "Vamos revisar as frações em casa." },
              fam,
            ),
            201,
          );
          assert.equal(
            esperar(
              await get(`/acompanhamentos/${registro.id}/observacoes`, prof),
              200,
            ).paginacao.total,
            1,
          );
          assert.equal(
            esperar(
              await get(`/acompanhamentos/${registro.id}/observacoes`, famB),
              200,
            ).paginacao.total,
            0,
          );
          assert.equal(
            esperar(await get("/retornos", admin), 200).paginacao.total,
            2,
          );
          esperar(await get("/retornos", fam), 403);
        },
      );
      await t.test(
        "indicadores nao duplicam registro por duas tags ou dois responsaveis",
        async () => {
          const indicadores = esperar(
            await get("/relatorios/indicadores", admin),
            200,
          );
          assert.equal(indicadores.total, 1);
          assert.equal(indicadores.porDisciplina[0].quantidade, 1);
          const tags = esperar(
            await get("/relatorios/indicadores?tagId=" + ids.tag, admin),
            200,
          );
          assert.equal(tags.total, 1);
          assert.equal(
            esperar(await get("/relatorios/indicadores", profB), 200).total,
            0,
          );
        },
      );
      await t.test(
        "PDF, CSV e XLSX sao baixados de rotas autenticadas",
        async () => {
          const binario = (res, cb) => {
            const partes = [];
            res.on("data", (p) => partes.push(p));
            res.on("end", () => cb(null, Buffer.concat(partes)));
          };
          const pdf = await get(`/acompanhamentos/${registro.id}/pdf`, fam)
            .buffer(true)
            .parse(binario);
          esperar(pdf, 200);
          assert.equal(pdf.body.subarray(0, 4).toString(), "%PDF");
          const csv = await get(
            "/relatorios/exportacao?formato=csv&descricoes=true",
            admin,
          )
            .buffer(true)
            .parse(binario);
          esperar(csv, 200);
          assert.ok(csv.body.toString().includes("Pedro Almeida"));
          const xlsx = await get("/relatorios/exportacao?formato=xlsx", admin)
            .buffer(true)
            .parse(binario);
          esperar(xlsx, 200);
          assert.equal(xlsx.body.readUInt32LE(0), 0x04034b50);
          esperar(await get("/relatorios/exportacao?formato=xlsx", fam), 403);
          await fs.mkdir(".local/evidencias", { recursive: true });
          await fs.writeFile(".local/evidencias/acompanhamento.pdf", pdf.body);
          await fs.writeFile(
            ".local/evidencias/acompanhamentos.xlsx",
            xlsx.body,
          );
          await fs.writeFile(".local/evidencias/acompanhamentos.csv", csv.body);
        },
      );
      await t.test("comunicado respeita turma e inativacao", async () => {
        const comunicado = esperar(
          await post(
            "/comunicados",
            {
              titulo: "Reunião escolar",
              conteudo: "Conversa sobre o acompanhamento.",
              turmaIds: [ids.turmaA],
            },
            admin,
          ),
          201,
        );
        esperar(await get("/comunicados/" + comunicado.id, fam), 200);
        esperar(await get("/comunicados/" + comunicado.id, famC), 404);
        esperar(
          await patch("/comunicados/" + comunicado.id, { ativo: false }, admin),
          200,
        );
        esperar(await get("/comunicados/" + comunicado.id, fam), 404);
      });
      await t.test(
        "transferencia e encerramento preservam a turma do acompanhamento anterior",
        async () => {
          esperar(
            await post(
              "/matriculas",
              { alunoId: ids.alunoA, turmaId: ids.turmaB },
              admin,
            ),
            201,
          );
          assert.equal(
            esperar(await get("/alunos/" + ids.alunoA, fam), 200).turma,
            "9º B",
          );
          const historico = esperar(
            await get(
              "/matriculas?alunoId=" + ids.alunoA + "&atual=false",
              fam,
            ),
            200,
          );
          assert.equal(historico.dados.length, 1);
          assert.equal(historico.dados[0].turma, "8º A");
          assert.equal(
            esperar(await get("/matriculas?alunoId=" + ids.alunoB, fam), 200)
              .dados.length,
            0,
          );
          assert.equal(
            esperar(await get("/acompanhamentos/" + registro.id, fam), 200)
              .turma,
            "8º A",
          );
          esperar(
            await post(
              "/matriculas",
              { alunoId: ids.alunoA, turmaId: ids.turmaB },
              admin,
            ),
            409,
          );
          const [matricula] = esperar(
            await get(
              "/matriculas?alunoId=" + ids.alunoA + "&atual=true",
              admin,
            ),
            200,
          ).dados;
          const encerrar = "/matriculas/" + matricula.id + "/encerrar";
          esperar(await post(encerrar, {}, prof), 403);
          esperar(await post(encerrar, {}, admin), 204);
          esperar(await post(encerrar, {}, admin), 204);
          assert.equal(
            esperar(await get("/alunos/" + ids.alunoA, fam), 200).turma,
            null,
          );
          assert.equal(
            esperar(await get("/acompanhamentos/" + registro.id, fam), 200)
              .turma,
            "8º A",
          );
        },
      );
      await t.test(
        "nova instancia da API le o mesmo dado e a mesma sessao persistidos",
        async () => {
          const outroPool = criarPool(config.db);
          try {
            const outraApp = criarApp({
              pool: outroPool,
              config,
              relogio: () => agora,
              limitar: false,
            });
            const r = await request(outraApp)
              .get("/api/acompanhamentos/" + registro.id)
              .set("Authorization", "Bearer " + fam);
            esperar(r, 200);
            assert.equal(r.body.media, 9);
          } finally {
            await outroPool.end();
          }
        },
      );
      await t.test(
        "recuperacao usa token unico, revoga sessoes e nao revela conta",
        async () => {
          const conhecida = esperar(
            await api
              .post("/api/auth/recuperacao")
              .send({ email: "maria.almeida@example.com" }),
            202,
          );
          const desconhecida = esperar(
            await api
              .post("/api/auth/recuperacao")
              .send({ email: "nao-existe@example.com" }),
            202,
          );
          assert.deepEqual(conhecida, desconhecida);
          assert.equal(emails.length, 1);
          const token = emails[0].texto.match(/token=([a-f0-9]{64})/)[1];
          esperar(
            await api
              .post("/api/auth/redefinicao")
              .send({ token, senha: "NovaSenha@2026" }),
            204,
          );
          esperar(await get("/auth/me", fam), 401);
          esperar(
            await api
              .post("/api/auth/redefinicao")
              .send({ token, senha: "OutraSenha@2026" }),
            400,
          );
          const novo = esperar(
            await api.post("/api/auth/login").send({
              email: "maria.almeida@example.com",
              senha: "NovaSenha@2026",
            }),
            200,
          );
          esperar(await post("/auth/logout", {}, novo.token), 204);
          esperar(await get("/auth/me", novo.token), 401);
        },
      );
      await t.test(
        "inativacao de usuario revoga acesso imediatamente",
        async () => {
          const usuario = esperar(await get("/auth/me", profB), 200).usuario;
          esperar(
            await patch("/usuarios/" + usuario.id, { ativo: false }, admin),
            200,
          );
          esperar(await get("/auth/me", profB), 401);
        },
      );
    } finally {
      await pool.end();
    }
  },
);
