import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { criarAuth, permitir } from "./servicos/auth.js";
import { servicoUsuarios } from "./servicos/usuarios.js";
import {
  cadastros,
  servicoCadastros,
  servicoVinculos,
  servicoBimestres,
} from "./servicos/cadastros.js";
import { servicoAcompanhamentos } from "./servicos/acompanhamentos.js";
import {
  servicoRelatorios,
  servicoComunicados,
} from "./servicos/relatorios.js";
import { criarPdf } from "./documentos/arquivos.js";
import { ErroApi, tratarErro, exigir } from "./erros.js";
import { inteiro } from "./validadores.js";
import { openapi } from "./openapi.js";

// Recebe banco/relogio/transporte por parametro: os testes usam o mesmo Express real.
export function criarApp({
  pool,
  config,
  relogio = () => new Date(),
  enviarEmail,
  limitar = true,
}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    req.id = randomUUID();
    res.set("X-Request-Id", req.id);
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(helmet());
  app.use(
    cors({
      origin(origem, cb) {
        cb(null, !origem || config.origens.includes(origem));
      },
      exposedHeaders: ["Content-Disposition", "X-Request-Id"],
    }),
  );
  app.use(express.json({ limit: "128kb" }));
  const auth = criarAuth({ pool, config, relogio, enviarEmail }),
    usuarios = servicoUsuarios(pool, relogio),
    cad = servicoCadastros(pool, relogio),
    vinc = servicoVinculos(pool, relogio),
    bimestres = servicoBimestres(pool, relogio),
    acomp = servicoAcompanhamentos(pool, relogio),
    rel = servicoRelatorios(pool),
    com = servicoComunicados(pool, relogio);
  const api = express.Router(),
    id = (req) => inteiro(req.params.id),
    admin = permitir("ADMINISTRADOR"),
    escola = permitir("ADMINISTRADOR", "PROFESSOR");
  api.get("/openapi.json", (req, res) => res.json(openapi));
  const limiteAuth = limitar
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
          erro: {
            codigo: "LIMITE_TENTATIVAS",
            mensagem: "Muitas tentativas. Aguarde antes de tentar novamente.",
          },
        },
      })
    : (req, res, next) => next();
  api.get("/saude", async (req, res) => {
    await pool.execute("SELECT 1");
    res.json({ status: "ok", banco: "conectado" });
  });
  api.post("/auth/login", limiteAuth, async (req, res) =>
    res.json(await auth.login(req.body)),
  );
  api.post("/auth/recuperacao", limiteAuth, async (req, res) =>
    res.status(202).json(await auth.recuperar(req.body)),
  );
  api.post("/auth/redefinicao", limiteAuth, async (req, res) => {
    await auth.redefinir(req.body);
    res.status(204).end();
  });
  api.use(auth.autenticar);
  api.get("/auth/me", (req, res) => res.json({ usuario: req.usuario }));
  api.post("/auth/logout", async (req, res) => {
    await auth.logout(req.sessaoId);
    res.status(204).end();
  });
  api.get("/usuarios", admin, async (req, res) =>
    res.json(await usuarios.listar(req.query)),
  );
  api.post("/usuarios", admin, async (req, res) =>
    res.status(201).json(await usuarios.criar(req.body, req.usuario)),
  );
  api.get("/usuarios/:id", admin, async (req, res) =>
    res.json(await usuarios.detalhar(id(req))),
  );
  api.patch("/usuarios/:id", admin, async (req, res) =>
    res.json(await usuarios.editar(id(req), req.body, req.usuario)),
  );
  for (const tipo of Object.keys(cadastros)) {
    api.get("/" + tipo, async (req, res) =>
      res.json(await cad.listar(tipo, req.query, req.usuario)),
    );
    api.post("/" + tipo, admin, async (req, res) =>
      res.status(201).json(await cad.salvar(tipo, null, req.body, req.usuario)),
    );
    api.get("/" + tipo + "/:id", async (req, res) =>
      res.json(await cad.detalhar(tipo, id(req), req.usuario)),
    );
    api.patch("/" + tipo + "/:id", admin, async (req, res) =>
      res.json(await cad.salvar(tipo, id(req), req.body, req.usuario)),
    );
  }
  api.get(
    "/meus-alunos",
    permitir("PROFESSOR", "RESPONSAVEL"),
    async (req, res) =>
      res.json(await cad.listar("alunos", req.query, req.usuario)),
  );
  api.get("/vinculos/professores", escola, async (req, res) =>
    res.json(await vinc.professores(req.query, req.usuario)),
  );
  api.post("/vinculos/professores", admin, async (req, res) =>
    res.status(201).json(await vinc.criarProfessor(req.body, req.usuario)),
  );
  api.patch("/vinculos/professores/:id", admin, async (req, res) =>
    res.json(await vinc.alterarProfessor(id(req), req.body, req.usuario)),
  );
  api.get(
    "/vinculos/responsaveis",
    permitir("ADMINISTRADOR", "RESPONSAVEL"),
    async (req, res) =>
      res.json(await vinc.responsaveis(req.query, req.usuario)),
  );
  api.post("/vinculos/responsaveis", admin, async (req, res) =>
    res
      .status(201)
      .json(
        await vinc.salvarResponsavel(
          req.body?.alunoId,
          req.body?.responsavelId,
          req.body,
          req.usuario,
          true,
        ),
      ),
  );
  api.patch(
    "/vinculos/responsaveis/:alunoId/:responsavelId",
    admin,
    async (req, res) =>
      res.json(
        await vinc.salvarResponsavel(
          req.params.alunoId,
          req.params.responsavelId,
          req.body,
          req.usuario,
        ),
      ),
  );
  api.post("/matriculas", admin, async (req, res) =>
    res.status(201).json(await vinc.matricular(req.body, req.usuario)),
  );
  api.post("/matriculas/:id/encerrar", admin, async (req, res) => {
    await vinc.encerrarMatricula(id(req), req.usuario);
    res.status(204).end();
  });
  api.get("/matriculas", async (req, res) =>
    res.json(await vinc.matriculas(req.query, req.usuario)),
  );
  api.get("/bimestres", async (req, res) =>
    res.json(await bimestres.listar(req.query)),
  );
  api.post("/bimestres/ano", admin, async (req, res) =>
    res.status(201).json(await bimestres.criarAno(req.body, req.usuario)),
  );
  api.patch("/bimestres/:id", admin, async (req, res) =>
    res.json(await bimestres.editar(id(req), req.body, req.usuario)),
  );
  api.get("/acompanhamentos", async (req, res) =>
    res.json(await acomp.listar(req.query, req.usuario)),
  );
  api.post("/acompanhamentos", permitir("PROFESSOR"), async (req, res) =>
    res.status(201).json(await acomp.criar(req.body, req.usuario)),
  );
  api.get("/acompanhamentos/:id", async (req, res) =>
    res.json(await acomp.detalhes(id(req), req.usuario)),
  );
  api.patch("/acompanhamentos/:id", escola, async (req, res) =>
    res.json(await acomp.alterar(id(req), req.body, req.usuario, "EDITAR")),
  );
  for (const [rota, acao, perfis] of [
    ["enviar", "ENVIAR", ["PROFESSOR"]],
    ["iniciar-revisao", "INICIAR_REVISAO", ["ADMINISTRADOR"]],
    ["devolver", "DEVOLVER", ["ADMINISTRADOR"]],
    ["publicar", "PUBLICAR", ["ADMINISTRADOR"]],
    ["cancelar", "CANCELAR", ["ADMINISTRADOR", "PROFESSOR"]],
  ])
    api.post(
      `/acompanhamentos/:id/${rota}`,
      permitir(...perfis),
      async (req, res) =>
        res.json(await acomp.alterar(id(req), req.body, req.usuario, acao)),
    );
  api.get("/acompanhamentos/:id/historico", escola, async (req, res) =>
    res.json(await acomp.historico(id(req), req.usuario, req.query)),
  );
  api.put(
    "/acompanhamentos/:id/ciencia",
    permitir("RESPONSAVEL"),
    async (req, res) => res.json(await acomp.ciencia(id(req), req.usuario)),
  );
  api.post(
    "/acompanhamentos/:id/observacoes",
    permitir("RESPONSAVEL"),
    async (req, res) =>
      res
        .status(201)
        .json(await acomp.observar(id(req), req.body, req.usuario)),
  );
  api.get("/acompanhamentos/:id/observacoes", async (req, res) =>
    res.json(await acomp.observacoes(id(req), req.usuario, req.query)),
  );
  api.get("/acompanhamentos/:id/pdf", async (req, res) => {
    const r = await acomp.detalhes(id(req), req.usuario);
    exigir(
      r.status === "PUBLICADO",
      409,
      "NAO_PUBLICADO",
      "Somente relatórios publicados podem gerar PDF.",
    );
    res
      .type("application/pdf")
      .attachment(`acompanhamento-${r.id}.pdf`)
      .send(await criarPdf(r));
  });
  api.get("/retornos", escola, async (req, res) =>
    res.json(await acomp.retornos(req.query, req.usuario)),
  );
  api.get("/relatorios/indicadores", escola, async (req, res) =>
    res.json(await rel.indicadores(req.query, req.usuario)),
  );
  api.get("/relatorios/exportacao", admin, async (req, res) => {
    const r = await rel.exportar(req.query, req.usuario);
    res.type(r.tipo).attachment(r.nome).send(r.buffer);
  });
  api.get("/auditoria", admin, async (req, res) =>
    res.json(await rel.auditoria(req.query)),
  );
  api.get("/comunicados", async (req, res) =>
    res.json(await com.listar(req.query, req.usuario)),
  );
  api.get("/comunicados/:id", async (req, res) =>
    res.json(await com.detalhar(id(req), req.usuario)),
  );
  api.post("/comunicados", admin, async (req, res) =>
    res.status(201).json(await com.criar(req.body, req.usuario)),
  );
  api.patch("/comunicados/:id", admin, async (req, res) =>
    res.json(await com.inativar(id(req), req.body, req.usuario)),
  );
  app.use("/api", api);
  app.use((req, res, next) =>
    next(new ErroApi(404, "ROTA_INEXISTENTE", "Rota não encontrada.")),
  );
  app.use(tratarErro);
  return app;
}
