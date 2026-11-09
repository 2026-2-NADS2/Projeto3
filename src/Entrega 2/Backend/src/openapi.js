// Contrato de leitura da API. Disponivel em /api/openapi.json e versionado no repositorio.
const ref = (nome) => ({ $ref: "#/components/schemas/" + nome });
const int = { type: "integer", minimum: 1 },
  str = { type: "string" },
  bool = { type: "boolean" },
  date = { type: "string", format: "date-time" };
const objeto = (properties, required = []) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});
const json = (schema) => ({ "application/json": { schema } });
const esquemaUsuario = ref("Usuario");
const paths = {};
function rota(
  caminho,
  metodo,
  resumo,
  {
    corpo,
    publica = false,
    lista = false,
    query = [],
    sucesso = 200,
    resposta = ref("Dados"),
    arquivo,
  } = {},
) {
  const parametros = [...caminho.matchAll(/\{(\w+)\}/g)].map((x) => ({
    name: x[1],
    in: "path",
    required: true,
    schema: int,
  }));
  if (lista)
    parametros.push(
      {
        name: "pagina",
        in: "query",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      {
        name: "limite",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    );
  parametros.push(
    ...query.map((name) => ({
      name,
      in: "query",
      schema:
        name.endsWith("Id") || ["anoLetivo", "bimestre"].includes(name)
          ? int
          : str,
    })),
  );
  const responses = {
    [sucesso]: {
      description: "Operação concluída",
      ...(sucesso === 204
        ? {}
        : {
            content: arquivo
              ? { [arquivo]: { schema: { type: "string", format: "binary" } } }
              : json(lista ? ref("Lista") : resposta),
          }),
    },
    400: { description: "Dados inválidos", content: json(ref("Erro")) },
    401: {
      description: "Autenticação necessária ou sessão inválida",
      content: json(ref("Erro")),
    },
    403: { description: "Perfil sem permissão", content: json(ref("Erro")) },
    404: {
      description: "Não encontrado no recorte autorizado",
      content: json(ref("Erro")),
    },
    409: {
      description: "Estado, versão, vínculo ou chave conflitante",
      content: json(ref("Erro")),
    },
    500: { description: "Erro interno", content: json(ref("Erro")) },
  };
  (paths[caminho] ??= {})[metodo] = {
    summary: resumo,
    tags: [caminho.split("/")[1]],
    parameters: parametros,
    responses,
    ...(publica ? { security: [] } : {}),
    ...(corpo ? { requestBody: { required: true, content: json(corpo) } } : {}),
  };
}
const filtros = [
  "alunoId",
  "turmaId",
  "disciplinaId",
  "professorId",
  "bimestreId",
  "anoLetivo",
  "bimestre",
  "tagId",
  "status",
  "busca",
  "pendente",
];
rota("/saude", "get", "Disponibilidade da API e do banco", { publica: true });
rota("/auth/login", "post", "Autenticar conta ativa", {
  publica: true,
  corpo: objeto({ email: { type: "string", format: "email" }, senha: str }, [
    "email",
    "senha",
  ]),
  resposta: objeto({ token: str, expiraEm: date, usuario: esquemaUsuario }),
});
rota("/auth/me", "get", "Consultar identidade autenticada", {
  resposta: objeto({ usuario: esquemaUsuario }),
});
rota("/auth/logout", "post", "Revogar sessão atual", { sucesso: 204 });
rota(
  "/auth/recuperacao",
  "post",
  "Solicitar recuperação sem revelar existência da conta",
  {
    publica: true,
    sucesso: 202,
    corpo: objeto({ email: { type: "string", format: "email" } }, ["email"]),
  },
);
rota("/auth/redefinicao", "post", "Trocar senha com token de uso único", {
  publica: true,
  sucesso: 204,
  corpo: objeto({ token: str, senha: ref("Senha") }, ["token", "senha"]),
});
rota("/usuarios", "get", "Administrador: listar contas", {
  lista: true,
  query: ["perfil", "busca"],
});
rota("/usuarios", "post", "Administrador: criar conta e perfil escolar", {
  sucesso: 201,
  corpo: ref("NovoUsuario"),
  resposta: esquemaUsuario,
});
rota("/usuarios/{id}", "get", "Administrador: consultar conta sem hash", {
  resposta: esquemaUsuario,
});
rota("/usuarios/{id}", "patch", "Administrador: editar/inativar conta", {
  corpo: objeto({
    nome: str,
    email: { type: "string", format: "email" },
    telefone: str,
    cargo: str,
    ativo: bool,
  }),
  resposta: esquemaUsuario,
});
const recursos = {
  areas: objeto(
    { nome: str, descricao: { type: ["string", "null"] }, ativo: bool },
    ["nome"],
  ),
  disciplinas: objeto({ nome: str, areaId: int, ativo: bool }, [
    "nome",
    "areaId",
  ]),
  turmas: objeto(
    {
      nome: str,
      anoLetivo: { type: "integer", minimum: 2000, maximum: 2100 },
      serie: { type: ["string", "null"] },
      turno: { type: ["string", "null"] },
      ativo: bool,
    },
    ["nome", "anoLetivo"],
  ),
  alunos: objeto(
    {
      nome: str,
      matricula: str,
      dataNascimento: { type: "string", format: "date" },
      ativo: bool,
    },
    ["nome", "matricula", "dataNascimento"],
  ),
  tags: objeto(
    {
      nome: str,
      cor: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
      descricao: { type: ["string", "null"] },
      ativo: bool,
    },
    ["nome"],
  ),
};
for (const [recurso, schema] of Object.entries(recursos)) {
  rota("/" + recurso, "get", "Consultar " + recurso + " no recorte do perfil", {
    lista: true,
    query: [
      "busca",
      "ativo",
      ...(["turmas", "alunos"].includes(recurso) ? ["anoLetivo"] : []),
      ...(recurso === "alunos" ? ["turmaId"] : []),
    ],
  });
  rota("/" + recurso, "post", "Administrador: criar " + recurso, {
    sucesso: 201,
    corpo: schema,
  });
  rota(
    "/" + recurso + "/{id}",
    "get",
    "Consultar detalhe autorizado de " + recurso,
  );
  rota(
    "/" + recurso + "/{id}",
    "patch",
    "Administrador: atualizar " + recurso,
    { corpo: { ...schema, required: [] } },
  );
}
rota("/meus-alunos", "get", "Professor/família: consultar alunos vinculados", {
  lista: true,
  query: ["busca", "ativo", "turmaId", "anoLetivo"],
});
rota(
  "/vinculos/professores",
  "get",
  "Consultar atribuições docentes autorizadas",
  { lista: true },
);
rota(
  "/vinculos/professores",
  "post",
  "Administrador: atribuir professor à turma/disciplina",
  {
    sucesso: 201,
    corpo: objeto({ professorId: int, turmaId: int, disciplinaId: int }, [
      "professorId",
      "turmaId",
      "disciplinaId",
    ]),
  },
);
rota(
  "/vinculos/professores/{id}",
  "patch",
  "Administrador: ativar ou encerrar atribuição",
  { corpo: objeto({ ativo: bool }, ["ativo"]) },
);
rota(
  "/vinculos/responsaveis",
  "get",
  "Consultar vínculos familiares autorizados",
  { lista: true },
);
const parentesco = {
  type: "string",
  enum: ["PAI", "MAE", "AVO", "AVOH", "TIO", "TIA", "OUTRO"],
};
rota(
  "/vinculos/responsaveis",
  "post",
  "Administrador: vincular responsável ao aluno",
  {
    sucesso: 201,
    corpo: objeto(
      { alunoId: int, responsavelId: int, parentesco, principal: bool },
      ["alunoId", "responsavelId", "parentesco"],
    ),
  },
);
rota(
  "/vinculos/responsaveis/{alunoId}/{responsavelId}",
  "patch",
  "Administrador: atualizar vínculo familiar",
  { corpo: objeto({ parentesco, principal: bool, ativo: bool }) },
);
rota(
  "/matriculas",
  "get",
  "Consultar matrículas e transferências autorizadas",
  { lista: true, query: ["alunoId", "turmaId", "atual"] },
);
rota(
  "/matriculas",
  "post",
  "Administrador: matricular/transferir sem apagar histórico",
  {
    sucesso: 201,
    corpo: objeto({ alunoId: int, turmaId: int }, ["alunoId", "turmaId"]),
  },
);
rota(
  "/matriculas/{id}/encerrar",
  "post",
  "Administrador: encerrar matrícula e preservar histórico",
  { sucesso: 204 },
);
rota("/bimestres", "get", "Consultar períodos e situação calculada", {
  query: ["anoLetivo"],
});
rota(
  "/bimestres/ano",
  "post",
  "Administrador: criar quatro períodos em uma transação",
  {
    sucesso: 201,
    corpo: objeto(
      {
        anoLetivo: { type: "integer", minimum: 2000, maximum: 2100 },
        periodos: {
          type: "array",
          minItems: 4,
          maxItems: 4,
          items: objeto(
            {
              numero: { type: "integer", minimum: 1, maximum: 4 },
              abertura: date,
              encerramento: date,
            },
            ["numero", "abertura", "encerramento"],
          ),
        },
      },
      ["anoLetivo", "periodos"],
    ),
  },
);
rota(
  "/bimestres/{id}",
  "patch",
  "Administrador: alterar datas, horas ou situação",
  { corpo: objeto({ abertura: date, encerramento: date, ativo: bool }) },
);
rota("/acompanhamentos", "get", "Consultar acompanhamentos autorizados", {
  lista: true,
  query: filtros,
});
const conteudo = {
  descricao: { type: ["string", "null"], maxLength: 10000 },
  estrategias: { type: ["string", "null"], maxLength: 10000 },
  ajudaFamilia: { type: ["string", "null"], maxLength: 10000 },
  media: {
    type: ["number", "null"],
    minimum: 0,
    maximum: 10,
    multipleOf: 0.01,
  },
  tagIds: { type: "array", maxItems: 30, uniqueItems: true, items: int },
};
rota("/acompanhamentos", "post", "Professor: criar rascunho dentro do prazo", {
  sucesso: 201,
  corpo: objeto(
    { alunoId: int, vinculoId: int, bimestreId: int, ...conteudo },
    ["alunoId", "vinculoId", "bimestreId"],
  ),
});
rota("/acompanhamentos/{id}", "get", "Consultar conteúdo conforme o perfil");
rota(
  "/acompanhamentos/{id}",
  "patch",
  "Autor: editar rascunho/correção; administrador: editar revisão com motivo",
  { corpo: objeto({ ...conteudo, versao: int, motivo: str }, ["versao"]) },
);
for (const [acao, resumo, motivo] of [
  ["enviar", "Professor: enviar ou reenviar", false],
  ["iniciar-revisao", "Administrador: iniciar revisão", false],
  ["devolver", "Administrador: devolver para ajustes", true],
  ["publicar", "Administrador: publicar", false],
  ["cancelar", "Cancelar registro ainda não publicado", true],
])
  rota("/acompanhamentos/{id}/" + acao, "post", resumo, {
    corpo: objeto(
      { versao: int, motivo: { type: "string", maxLength: 2000 } },
      ["versao", ...(motivo ? ["motivo"] : [])],
    ),
  });
rota(
  "/acompanhamentos/{id}/historico",
  "get",
  "Professor/administrador: histórico interno",
  { lista: true },
);
rota(
  "/acompanhamentos/{id}/ciencia",
  "put",
  "Responsável: confirmar leitura idempotente",
);
rota(
  "/acompanhamentos/{id}/observacoes",
  "get",
  "Consultar observações autorizadas",
  { lista: true },
);
rota(
  "/acompanhamentos/{id}/observacoes",
  "post",
  "Responsável: enviar observação após ciência",
  {
    sucesso: 201,
    corpo: objeto(
      { texto: { type: "string", minLength: 1, maxLength: 2000 } },
      ["texto"],
    ),
  },
);
rota(
  "/acompanhamentos/{id}/pdf",
  "get",
  "Baixar PDF de acompanhamento publicado autorizado",
  { arquivo: "application/pdf" },
);
rota(
  "/retornos",
  "get",
  "Escola: consultar ciências e quantidade de observações",
  { lista: true, query: ["alunoId", "acompanhamentoId"] },
);
rota(
  "/relatorios/indicadores",
  "get",
  "Escola: indicadores sem multiplicação por tags/vínculos",
  { query: filtros },
);
rota(
  "/relatorios/exportacao",
  "get",
  "Administrador: exportar até 10.000 registros filtrados",
  {
    query: [...filtros, "formato", "descricoes"],
    arquivo: "application/octet-stream",
  },
);
rota("/auditoria", "get", "Administrador: ações, antes e depois", {
  lista: true,
  query: ["acompanhamentoId", "autorId", "entidade", "inicio", "fim"],
});
rota("/comunicados", "get", "Consultar comunicados das turmas autorizadas", {
  lista: true,
});
rota("/comunicados/{id}", "get", "Consultar comunicado autorizado");
rota("/comunicados", "post", "Administrador: publicar comunicado para turmas", {
  sucesso: 201,
  corpo: objeto(
    {
      titulo: { type: "string", maxLength: 160 },
      conteudo: { type: "string", maxLength: 10000 },
      turmaIds: {
        type: "array",
        minItems: 1,
        maxItems: 30,
        uniqueItems: true,
        items: int,
      },
    },
    ["titulo", "conteudo", "turmaIds"],
  ),
});
rota(
  "/comunicados/{id}",
  "patch",
  "Administrador: ativar/inativar comunicado",
  { corpo: objeto({ ativo: bool }, ["ativo"]) },
);

export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Collision API Fullstack",
    version: "1.0.0",
    description:
      "API escolar em Express/MySQL. Login fornece Bearer token; o servidor verifica perfil, vínculo, período e versão. Dados fictícios no ambiente local.",
  },
  servers: [{ url: "/api" }],
  security: [{ bearerAuth: [] }],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Dados: { type: "object", additionalProperties: true },
      Lista: objeto(
        {
          dados: { type: "array", items: ref("Dados") },
          paginacao: objeto({
            pagina: int,
            limite: int,
            total: { type: "integer", minimum: 0 },
          }),
        },
        ["dados", "paginacao"],
      ),
      Erro: objeto(
        {
          erro: objeto(
            {
              codigo: str,
              mensagem: str,
              campos: {
                type: "object",
                additionalProperties: { type: "string" },
              },
              requisicaoId: str,
            },
            ["codigo", "mensagem"],
          ),
        },
        ["erro"],
      ),
      Senha: {
        type: "string",
        minLength: 10,
        description:
          "Ao menos 10 caracteres e no máximo 72 bytes UTF-8; não pode ser truncada pelo bcrypt.",
      },
      Usuario: objeto({
        id: int,
        nome: str,
        email: { type: "string", format: "email" },
        perfil: {
          type: "string",
          enum: ["ADMINISTRADOR", "PROFESSOR", "RESPONSAVEL"],
        },
        ativo: bool,
        professorId: { type: ["integer", "null"] },
        responsavelId: { type: ["integer", "null"] },
      }),
      NovoUsuario: objeto(
        {
          nome: str,
          email: { type: "string", format: "email" },
          senha: ref("Senha"),
          perfil: {
            type: "string",
            enum: ["ADMINISTRADOR", "PROFESSOR", "RESPONSAVEL"],
          },
          matricula: {
            type: "string",
            description: "Obrigatória para professor.",
          },
          cpf: { type: ["string", "null"], pattern: "^\\d{11}$" },
          telefone: { type: ["string", "null"] },
          cargo: { type: ["string", "null"] },
        },
        ["nome", "email", "senha", "perfil"],
      ),
    },
  },
};
