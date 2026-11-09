// Configurações permitem trocar campos e textos sem duplicar páginas de cadastro.
const campo = (
  nome,
  rotulo,
  tipo = "text",
  obrigatorio = false,
  placeholder = "",
) => ({ nome, rotulo, tipo, obrigatorio, placeholder });
const nomePessoa = campo(
  "nome",
  "Nome completo",
  "text",
  true,
  "Digite o nome completo",
);
const email = campo("email", "E-mail", "email", true, "nome@exemplo.com");
const telefone = campo(
  "telefone",
  "Telefone",
  "tel",
  false,
  "(11) 00000-0000 · opcional",
);
const status = campo("status", "Status", "status", true);
const ano = campo("ano", "Ano letivo", "ano", true);
const privacidade = {
  titulo: "Privacidade dos dados",
  texto:
    "Cadastre apenas as informações necessárias para o acompanhamento escolar.",
};
const senha = {
  titulo: "Sobre a senha",
  texto:
    "A senha inicial é definida no cadastro. Para trocá-la, o titular usa a recuperação de acesso.",
};

export const configuracoesAdmin = {
  responsaveis: {
    singular: "responsável",
    plural: "responsáveis",
    titulo: "Responsáveis",
    novo: "Novo responsável",
    editar: "Editar responsável",
    prefixo: "RSP",
    descricao:
      "Cadastre responsáveis e autorize quais alunos cada pessoa pode acompanhar.",
    dados: "Dados pessoais",
    campos: [nomePessoa, email, telefone, status],
    colunas: [
      ["nome", "Responsável"],
      ["email", "E-mail"],
      ["telefone", "Telefone"],
      ["resumo", "Alunos vinculados"],
      ["status", "Status"],
    ],
    busca: "Buscar responsável",
    placeholderBusca: "Buscar por nome ou e-mail",
    grupo: "Usuários",
    vinculosTitulo: "Alunos vinculados",
    vinculosTexto: "Defina quais alunos este responsável poderá acompanhar.",
    vinculosAcao: "+ Vincular aluno",
    vazio: "Nenhum aluno adicionado",
    vazioTexto:
      "O responsável terá acesso aos relatórios após a vinculação de um aluno.",
    informacoes: [
      {
        titulo: "Acesso e permissões",
        selo: "Responsável",
        texto:
          "Consulta somente os relatórios publicados dos alunos vinculados ao seu cadastro.",
      },
      senha,
      privacidade,
    ],
    efeito:
      "A conta não poderá acessar o sistema enquanto estiver inativa. Os vínculos autorizados e o histórico serão preservados.",
  },
  professores: {
    singular: "professor",
    plural: "professores",
    titulo: "Professores",
    novo: "Novo professor",
    editar: "Editar professor",
    prefixo: "PROF",
    descricao:
      "Cadastre professores e consulte suas turmas e disciplinas vinculadas.",
    dados: "Dados pessoais",
    campos: [nomePessoa, email, telefone, status],
    colunas: [
      ["nome", "Professor"],
      ["email", "E-mail"],
      ["disciplinas", "Disciplinas"],
      ["turmas", "Turmas"],
      ["status", "Status"],
    ],
    busca: "Buscar professor",
    placeholderBusca: "Buscar por nome ou e-mail",
    grupo: "Usuários",
    vinculosTitulo: "Turmas e disciplinas",
    vinculosTexto:
      "Relacione o professor às turmas e disciplinas que ele leciona.",
    vinculosAcao: "+ Adicionar vínculo",
    vazio: "Nenhum vínculo adicionado",
    vazioTexto:
      "O professor poderá registrar acompanhamentos após receber seus vínculos de ensino.",
    informacoes: [
      {
        titulo: "Acesso e permissões",
        selo: "Professor",
        texto:
          "Registra acompanhamentos somente para as turmas e disciplinas às quais estiver vinculado.",
      },
      senha,
      privacidade,
    ],
    efeito:
      "A conta não poderá acessar o sistema enquanto estiver inativa. Os vínculos e acompanhamentos anteriores serão preservados.",
  },
  alunos: {
    singular: "aluno",
    plural: "alunos",
    titulo: "Alunos",
    novo: "Novo aluno",
    editar: "Editar aluno",
    prefixo: "ALU",
    descricao:
      "Organize os cadastros escolares, as turmas e os responsáveis autorizados.",
    dados: "Dados do aluno",
    campos: [
      { ...nomePessoa, placeholder: "Digite o nome do aluno" },
      campo(
        "matricula",
        "Matrícula",
        "text",
        false,
        "Informe a matrícula, se utilizada pela escola",
      ),
      ano,
      status,
      campo("turma", "Turma", "turma", true),
    ],
    colunas: [
      ["nome", "Aluno"],
      ["matricula", "Matrícula"],
      ["turma", "Turma"],
      ["resumo", "Responsáveis autorizados"],
      ["status", "Status"],
    ],
    busca: "Buscar aluno",
    placeholderBusca: "Buscar por nome ou matrícula",
    vinculosTitulo: "Responsáveis autorizados",
    vinculosTexto:
      "Vincule as pessoas autorizadas a consultar os relatórios deste aluno.",
    vinculosAcao: "+ Vincular responsável",
    vazio: "Nenhum responsável adicionado",
    vazioTexto:
      "Você poderá vincular responsáveis agora ou após salvar o cadastro.",
    informacoes: [
      {
        titulo: "Cadastro escolar",
        selo: "Aluno",
        texto:
          "O aluno não possui conta de acesso. Seus relatórios são consultados pelos responsáveis autorizados.",
      },
      {
        titulo: "Responsáveis autorizados",
        texto:
          "Um aluno pode ter mais de um responsável autorizado. Cada vínculo deve ser conferido pela escola.",
      },
      privacidade,
    ],
    efeito:
      "O cadastro escolar ficará inativo. Os relatórios já publicados e o histórico serão preservados.",
  },
  turmas: {
    singular: "turma",
    plural: "turmas",
    titulo: "Turmas e vínculos",
    novo: "Nova turma",
    editar: "Editar turma",
    prefixo: "TUR",
    descricao:
      "Organize as turmas e os vínculos que permitem o acompanhamento dos alunos.",
    dados: "Dados da turma",
    campos: [
      campo("nome", "Nome da turma", "text", true, "Ex.: 8º A"),
      ano,
      campo("etapa", "Etapa de ensino", "etapa"),
      status,
    ],
    colunas: [
      ["nome", "Turma"],
      ["ano", "Ano letivo"],
      ["etapa", "Etapa de ensino"],
      ["alunos", "Alunos"],
      ["status", "Status"],
    ],
    busca: "Buscar turma",
    placeholderBusca: "Nome da turma",
    informacoes: [
      {
        titulo: "Organização da turma",
        texto:
          "Uma turma reúne os alunos de um mesmo ano letivo. Professores e disciplinas são vinculados na área de ensino.",
      },
      {
        titulo: "Antes de salvar",
        texto: "Confira o nome e o ano letivo para evitar turmas duplicadas.",
      },
    ],
  },
  disciplinas: {
    singular: "disciplina",
    plural: "disciplinas",
    titulo: "Disciplinas",
    novo: "Nova disciplina",
    editar: "Editar disciplina",
    prefixo: "DIS",
    feminino: true,
    descricao:
      "Organize as disciplinas e suas áreas de conhecimento para os acompanhamentos escolares.",
    dados: "Dados da disciplina",
    campos: [
      campo("nome", "Nome da disciplina", "text", true, "Ex.: Matemática"),
      campo("area", "Área de conhecimento", "area", true),
      status,
      campo(
        "descricao",
        "Descrição",
        "textarea",
        false,
        "Descreva brevemente o conteúdo da disciplina",
      ),
    ],
    colunas: [
      ["nome", "Disciplina"],
      ["area", "Área de conhecimento"],
      ["status", "Status"],
    ],
    busca: "Buscar disciplina",
    placeholderBusca: "Nome da disciplina",
    informacoes: [
      {
        titulo: "Organização pedagógica",
        texto:
          "A área de conhecimento agrupa disciplinas relacionadas e ajuda a organizar os registros escolares.",
      },
      {
        titulo: "Vínculos de ensino",
        texto:
          "Após salvar, vincule a disciplina aos professores e às turmas em “Turmas e vínculos”.",
      },
      {
        titulo: "Ano letivo",
        texto:
          "O cadastro da disciplina pode ser reutilizado. O ano letivo é definido nos vínculos de ensino.",
      },
    ],
  },
  areas_disciplinas: {
    singular: "área",
    plural: "áreas",
    titulo: "Áreas de disciplinas",
    novo: "Nova área",
    editar: "Editar área",
    prefixo: "AREA",
    feminino: true,
    descricao:
      "Cadastre as áreas de conhecimento e organize as disciplinas da escola.",
    dados: "Dados da área",
    campos: [
      campo("nome", "Nome da área", "text", true, "Ex.: Linguagens"),
      campo(
        "descricao",
        "Descrição",
        "textarea",
        false,
        "Descreva brevemente a área de conhecimento",
      ),
      status,
    ],
    colunas: [
      ["nome", "Área de conhecimento"],
      ["disciplinasArea", "Disciplinas vinculadas"],
      ["status", "Status"],
    ],
    busca: "Buscar área",
    placeholderBusca: "Nome da área",
    grupo: "Disciplinas",
    informacoes: [
      {
        titulo: "Como organizar as áreas",
        texto: "Uma área de conhecimento reúne disciplinas relacionadas.",
      },
      {
        titulo: "Depois do cadastro",
        texto:
          "Ao criar ou editar uma disciplina, selecione a área à qual ela pertence.",
      },
      {
        titulo: "Evite duplicidades",
        texto: "Confira se a área já existe antes de criar um novo cadastro.",
      },
    ],
  },
};

// As URLs reproduzem as telas das seções 04 a 14; IDs de registros são passados pela query string.
export const rotasAdminFigma = [
  ["/administrador/retornos", "15", "retornos"],
  ["/administrador/retorno", "15", "retorno"],
  // Rotas das seções 11 a 14 e seus atalhos no menu.
  ["/administrador/tags/lista", "11", "lista"],
  ["/administrador/tags/nova", "11", "nova"],
  ["/administrador/tags/editar", "11", "editar"],
  ["/administrador/relatorios/01-visao-geral", "12", "01-visao-geral"],
  ["/administrador/relatorios/04-acompanhamentos", "12", "04-acompanhamentos"],
  [
    "/administrador/relatorios/05-detalhe-do-acompanhamento",
    "12",
    "05-detalhe-do-acompanhamento",
  ],
  ["/administrador/relatorios/07-exportar-dados", "12", "07-exportar-dados"],
  ["/administrador/relatorios/08-arquivo-pronto", "12", "08-arquivo-pronto"],
  ["/administrador/auditoria/01-lista-de-eventos", "13", "01-lista-de-eventos"],
  [
    "/administrador/auditoria/04-alteracao-de-conteudo",
    "13",
    "04-alteracao-de-conteudo",
  ],
  [
    "/administrador/auditoria/10-historico-do-acompanhamento",
    "13",
    "10-historico-do-acompanhamento",
  ],
  [
    "/administrador/revisao/editar_acompanhamento",
    "14",
    "editar_acompanhamento",
  ],
  ["/administrador/revisao/justificar_devolucao", "14", "justificar_devolucao"],
  [
    "/administrador/revisao/acompanhamento_devolvido",
    "14",
    "acompanhamento_devolvido",
  ],
  ["/administrador/revisao/confirmar_publicacao", "14", "confirmar_publicacao"],
  [
    "/administrador/revisao/acompanhamento_publicado",
    "14",
    "acompanhamento_publicado",
  ],
  ["/administrador/todas_revisoes", "14", "Todas as revisões"],
  ["/administrador/revisar_acompanhamento", "14", "Revisar acompanhamento"],
  ["/administrador/tags", "11", "tags"],
  ["/administrador/relatorios", "12", "relatorios"],
  ["/administrador/auditoria", "13", "auditoria"],
  ["/administrador/revisao", "14", "revisao"],

  ["/dashboard_admin", "04", "Visão geral"],
  // A seção 10 reutiliza o mesmo layout e identifica o bimestre pela query string.
  ...["visao_geral", "configurar_periodos", "editar_periodo"].map((tela) => [
    `/administrador/bimestres/${tela}`,
    "10",
    tela,
  ]),
  ...["responsaveis", "professores", "alunos"].flatMap((tipo, i) => [
    ...["lista", "novo", "detalhes", "editar", "detalhes_inativo"].map(
      (tela) => [
        `/administrador/${tipo}/${tela}`,
        String(i + 5).padStart(2, "0"),
        tela,
      ],
    ),
    [
      `/administrador/${{ responsaveis: "responsavel", professores: "professor", alunos: "aluno" }[tipo]}_inativar`,
      String(i + 5).padStart(2, "0"),
      "Inativar",
    ],
  ]),
  ...[
    "lista",
    "nova",
    "editar",
    "alunos",
    "adicionar_alunos",
    "professores_disciplinas",
  ].map((tela) => [`/administrador/turmas/${tela}`, "08", tela]),
  ...["ensino_por_turma", "responsaveis_alunos", "novo_responsavel_aluno"].map(
    (tela) => [`/administrador/vinculos/${tela}`, "08", tela],
  ),
  ["/administrador/vinculo_duplicado", "08", "Vínculo duplicado"],
  ["/administrador/vinculo_incompativel", "08", "Vínculo incompatível"],
  ...["disciplinas", "areas_disciplinas"].flatMap((tipo) =>
    ["lista", "nova", "editar"].map((tela) => [
      `/administrador/${tipo}/${tela}`,
      "09",
      tela,
    ]),
  ),
];

// A mesma convenção é usada pelos botões de listas, formulários e retornos.
export function caminhoCadastro(tipo, tela = "lista", id = "") {
  return `/administrador/${tipo}/${tela}${id ? "?id=" + encodeURIComponent(id) : ""}`;
}
