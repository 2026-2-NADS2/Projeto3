// Listas, formulários e detalhes compartilham a configuração de cada cadastro.
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDadosEscolares } from "../../hooks/useDadosEscolares.jsx";
import {
  configuracoesAdmin,
  caminhoCadastro,
} from "../../data/adminConfiguracao.js";
import {
  AcaoAdmin,
  StatusAdmin,
  TituloAdmin,
  AbasAdmin,
  CampoAdmin,
  TabelaAdmin,
  InformacoesAdmin,
  DialogoAdmin,
  normalizarAdmin,
} from "./ElementosAdmin.jsx";

const pessoais = ["responsaveis", "professores", "alunos"];
const telaNova = (tipo) => (pessoais.includes(tipo) ? "novo" : "nova");
const opcoesStatus = [
  ["Ativo", "Ativo"],
  ["Inativo", "Inativo"],
];

// As opções de seleção vêm dos mesmos cadastros usados nas tabelas.
function opcoesCampo(campo, dados, valores, feminino) {
  if (campo.tipo === "status")
    return opcoesStatus.map(([v, t]) => [
      v,
      feminino ? t.replace(/o$/, "a") : t,
    ]);
  if (campo.tipo === "ano") return ["2026", "2025"];
  if (campo.tipo === "etapa")
    return ["Ensino Fundamental", "Ensino Médio", "Educação Infantil"];
  if (campo.tipo === "area")
    return [
      ["", "Selecionar área"],
      ...dados.areas_disciplinas
        .filter((i) => i.status === "Ativo" || i.nome === valores.area)
        .map((i) => i.nome),
    ];
  if (campo.tipo === "turma")
    return [
      ["", "Selecionar turma"],
      ...new Set([
        ...dados.turmas
          .filter((i) => i.ano === valores.ano && i.status === "Ativo")
          .map((i) => i.nome),
        ...(valores.turma ? [valores.turma] : []),
      ]),
    ];
  return [];
}

// Filtros das listas se aplicam ao conjunto completo antes da paginação.
export function ListaCadastrosAdmin({ tipo }) {
  const { dados } = useDadosEscolares();
  const cfg = configuracoesAdmin[tipo];
  const [filtros, setFiltros] = useState({
    busca: "",
    status: "",
    ano: "2026",
    turma: "",
    disciplina: "",
    area: "",
  });
  // A lista de áreas aguarda o botão Aplicar filtros antes de atualizar a tabela.
  const [aplicados, setAplicados] = useState(() => ({ ...filtros }));
  const navegar = useNavigate();
  const filtro = tipo === "areas_disciplinas" ? aplicados : filtros;
  const linhas = dados[tipo].filter(
    (item) =>
      normalizarAdmin(
        [item.nome, item.email, item.matricula].join(" "),
      ).includes(normalizarAdmin(filtro.busca)) &&
      (!filtro.status || item.status === filtro.status) &&
      (!["alunos", "turmas"].includes(tipo) ||
        !filtro.ano ||
        item.ano === filtro.ano) &&
      (tipo !== "alunos" || !filtro.turma || item.turma === filtro.turma) &&
      (tipo !== "professores" ||
        !filtro.disciplina ||
        item.disciplinas?.includes(filtro.disciplina)) &&
      (tipo !== "disciplinas" || !filtro.area || item.area === filtro.area),
  );
  function atualizar(evento) {
    setFiltros((atuais) => ({
      ...atuais,
      [evento.target.name]: evento.target.value,
    }));
  }
  function limpar() {
    setFiltros({
      busca: "",
      status: "",
      ano: "2026",
      turma: "",
      disciplina: "",
      area: "",
    });
    setAplicados({
      busca: "",
      status: "",
      ano: "2026",
      turma: "",
      disciplina: "",
      area: "",
    });
  }
  const abasUsuarios = [
    ["Responsáveis", caminhoCadastro("responsaveis")],
    ["Professores", caminhoCadastro("professores")],
  ];
  const abasTurmas = [
    ["Turmas", caminhoCadastro("turmas")],
    ["Vínculos de ensino", "/administrador/vinculos/ensino_por_turma"],
    ["Responsáveis e alunos", "/administrador/vinculos/responsaveis_alunos"],
  ];
  const abasDisciplinas = [
    ["Disciplinas", caminhoCadastro("disciplinas")],
    ["Áreas de disciplinas", caminhoCadastro("areas_disciplinas")],
  ];

  // Algumas células combinam nome, identificador e informações secundárias.
  function renderizar(item, chave, indice) {
    if (chave === "status")
      return <StatusAdmin valor={item.status} feminino={cfg.feminino} />;
    if (chave === "nome")
      return (
        <>
          <strong>{item.nome}</strong>
          {["responsaveis", "professores"].includes(tipo) && (
            <small>Cadastro {String(indice + 1).padStart(3, "0")}</small>
          )}
          {tipo === "alunos" && <small>{item.etapa}</small>}
          {tipo === "disciplinas" && <small>{item.descricao}</small>}
        </>
      );
    if (chave === "disciplinasArea") {
      const disciplinas = dados.disciplinas.filter((i) => i.area === item.nome);
      return (
        <>
          <strong>
            {disciplinas.length}{" "}
            {disciplinas.length === 1 ? "disciplina" : "disciplinas"}
          </strong>
          <small>{disciplinas.map((i) => i.nome).join(" e ")}</small>
        </>
      );
    }
    return (
      <span
        className={item[chave] === "Sem vínculo" ? "admin-texto-suave" : ""}
      >
        {item[chave] || "Sem vínculo"}
      </span>
    );
  }
  return (
    <>
      <TituloAdmin
        titulo={cfg.titulo}
        descricao={cfg.descricao}
        caminho={[...(cfg.grupo ? [cfg.grupo] : []), cfg.titulo]}
        acoes={
          <>
            {tipo === "disciplinas" && (
              <AcaoAdmin to={caminhoCadastro("areas_disciplinas")}>
                Áreas de disciplinas
              </AcaoAdmin>
            )}
            <AcaoAdmin
              tipo="primario"
              to={caminhoCadastro(tipo, telaNova(tipo))}
            >
              + {cfg.novo}
            </AcaoAdmin>
          </>
        }
      />
      {["responsaveis", "professores"].includes(tipo) && (
        <AbasAdmin itens={abasUsuarios} atual={cfg.titulo} />
      )}
      {tipo === "turmas" && <AbasAdmin itens={abasTurmas} atual="Turmas" />}
      {tipo === "areas_disciplinas" && (
        <AbasAdmin itens={abasDisciplinas} atual={cfg.titulo} linha />
      )}
      <section
        className={`admin-painel admin-lista admin-lista--${tipo}`}
        aria-label={cfg.titulo}
      >
        <div className="admin-filtros">
          <CampoAdmin
            nome="busca"
            rotulo={cfg.busca}
            placeholder={cfg.placeholderBusca}
            valor={filtros.busca}
            onChange={atualizar}
            busca={["responsaveis", "professores", "alunos"].includes(tipo)}
          />
          {["alunos", "turmas"].includes(tipo) && (
            <CampoAdmin
              nome="ano"
              rotulo="Ano letivo"
              tipo="select"
              valor={filtros.ano}
              onChange={atualizar}
              opcoes={["2026", "2025"]}
            />
          )}
          {tipo === "disciplinas" && (
            <CampoAdmin
              nome="area"
              rotulo="Área de conhecimento"
              tipo="select"
              valor={filtros.area}
              onChange={atualizar}
              opcoes={[
                ["", "Todas"],
                ...dados.areas_disciplinas.map((i) => i.nome),
              ]}
            />
          )}
          <CampoAdmin
            nome="status"
            rotulo="Status"
            tipo="select"
            valor={filtros.status}
            onChange={atualizar}
            opcoes={[
              ["", "Todos"],
              ...opcoesStatus.map(([v, t]) => [
                v,
                cfg.feminino ? t.replace(/o$/, "a") : t,
              ]),
            ]}
          />
          {tipo === "alunos" && (
            <CampoAdmin
              nome="turma"
              rotulo="Turma"
              tipo="select"
              valor={filtros.turma}
              onChange={atualizar}
              opcoes={[["", "Todas"], ...dados.turmas.map((i) => i.nome)]}
            />
          )}
          {tipo === "professores" && (
            <CampoAdmin
              nome="disciplina"
              rotulo="Disciplina"
              tipo="select"
              valor={filtros.disciplina}
              onChange={atualizar}
              opcoes={[["", "Todas"], ...dados.disciplinas.map((i) => i.nome)]}
            />
          )}
          {tipo === "areas_disciplinas" && (
            <AcaoAdmin onClick={() => setAplicados({ ...filtros })}>
              Aplicar filtros
            </AcaoAdmin>
          )}
        </div>
        <div className="admin-resumo-lista">
          <span>
            {linhas.length} {cfg.plural}{" "}
            {["turmas", "disciplinas", "areas_disciplinas"].includes(tipo)
              ? "encontradas"
              : "encontrados"}
          </span>
          <button type="button" className="admin-link" onClick={limpar}>
            Limpar filtros
          </button>
        </div>
        <TabelaAdmin
          key={JSON.stringify(filtro)}
          colunas={cfg.colunas}
          linhas={linhas}
          plural={cfg.plural}
          renderizar={renderizar}
          classe="admin-tabela--cadastros"
          acao={(item) => (
            <AcaoAdmin
              className="admin-botao--pequeno"
              onClick={() =>
                navegar(
                  caminhoCadastro(
                    tipo,
                    tipo === "turmas"
                      ? "alunos"
                      : pessoais.includes(tipo)
                        ? "detalhes"
                        : "editar",
                    item.id,
                  ),
                )
              }
            >
              {tipo === "turmas"
                ? "Ver turma"
                : tipo === "areas_disciplinas"
                  ? "Editar área"
                  : "Ver detalhes"}
            </AcaoAdmin>
          )}
        />
      </section>
      {tipo === "areas_disciplinas" && (
        <p className="admin-texto-rodape">
          As disciplinas são associadas a uma área no cadastro de disciplinas.
        </p>
      )}
    </>
  );
}

// A escolha de vínculos usa uma janela comum; o cadastro não precisa ser salvo primeiro.
function VinculosCadastroAdmin({ tipo, vinculos, onChange }) {
  const { dados } = useDadosEscolares();
  const cfg = configuracoesAdmin[tipo];
  const [aberto, setAberto] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [turma, setTurma] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const destino = tipo === "alunos" ? "responsaveis" : "alunos";
  const candidatos = dados[destino].filter(
    (i) => i.status === "Ativo" && !vinculos.some((v) => v.id === i.id),
  );
  function adicionar() {
    const novos =
      tipo === "professores"
        ? [
            {
              id: crypto.randomUUID(),
              nome: turma + " · " + disciplina,
              turmaId: Number(dados.turmas.find((t) => t.nome === turma)?.id),
              disciplinaId: Number(
                dados.disciplinas.find((d) => d.nome === disciplina)?.id,
              ),
            },
          ]
        : candidatos
            .filter((i) => selecionados.includes(i.id))
            .map((i) => ({
              id: i.id,
              nome: i.nome,
              detalhe:
                tipo === "alunos" ? i.email : i.turma + " · Ensino Fundamental",
            }));
    onChange([...vinculos, ...novos]);
    setAberto(false);
    setSelecionados([]);
  }
  return (
    <div className="admin-vinculos-cadastro">
      <div className="admin-bloco-titulo">
        <div>
          <h3>{cfg.vinculosTitulo}</h3>
          <p>{cfg.vinculosTexto}</p>
        </div>
        <AcaoAdmin
          className="admin-botao--pequeno"
          onClick={() => setAberto(true)}
        >
          {cfg.vinculosAcao}
        </AcaoAdmin>
      </div>
      {vinculos.length === 0 ? (
        <div className="admin-vazio admin-vazio--caixa">
          <strong>{cfg.vazio}</strong>
          <p>{cfg.vazioTexto}</p>
        </div>
      ) : (
        <div className="admin-vinculos-lista">
          {vinculos.map((item) => (
            <div key={item.id}>
              <span className="admin-icone">
                <img
                  src={`/img/admin/${tipo === "professores" ? "usuarios" : "alunos"}.svg`}
                  alt=""
                />
              </span>
              <div>
                <strong>{item.nome}</strong>
                <small>{item.detalhe}</small>
              </div>
              <button
                type="button"
                className="admin-link"
                onClick={() =>
                  onChange(vinculos.filter((v) => v.id !== item.id))
                }
              >
                Remover vínculo
              </button>
            </div>
          ))}
        </div>
      )}
      {aberto && (
        <DialogoAdmin
          titulo={cfg.vinculosTitulo}
          aoFechar={() => setAberto(false)}
        >
          {tipo === "professores" ? (
            <div className="admin-grade-campos">
              <CampoAdmin
                nome="turma-vinculo"
                rotulo="Turma"
                tipo="select"
                valor={turma}
                onChange={(e) => setTurma(e.target.value)}
                opcoes={dados.turmas
                  .filter((i) => i.status === "Ativo")
                  .map((i) => i.nome)}
              />
              <CampoAdmin
                nome="disciplina-vinculo"
                rotulo="Disciplina"
                tipo="select"
                valor={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                opcoes={dados.disciplinas
                  .filter((i) => i.status === "Ativo")
                  .map((i) => i.nome)}
              />
            </div>
          ) : (
            <div className="admin-opcoes-checkbox">
              {candidatos.map((i) => (
                <label key={i.id}>
                  <input
                    type="checkbox"
                    checked={selecionados.includes(i.id)}
                    onChange={() =>
                      setSelecionados((atuais) =>
                        atuais.includes(i.id)
                          ? atuais.filter((id) => id !== i.id)
                          : [...atuais, i.id],
                      )
                    }
                  />
                  <span>
                    <strong>{i.nome}</strong>
                    <small>{i.email || i.matricula}</small>
                  </span>
                </label>
              ))}
              {!candidatos.length && <p>Nenhum cadastro ativo disponível.</p>}
            </div>
          )}
          <div className="admin-formulario-acoes">
            <AcaoAdmin onClick={() => setAberto(false)}>Cancelar</AcaoAdmin>
            <AcaoAdmin
              tipo="primario"
              onClick={adicionar}
              disabled={tipo !== "professores" && !selecionados.length}
            >
              Adicionar vínculo
            </AcaoAdmin>
          </div>
        </DialogoAdmin>
      )}
    </div>
  );
}

// O formulário monta os campos definidos na configuração, inclusive os dados de edição.
export function FormularioCadastroAdmin({ tipo, registro, editar = false }) {
  const { dados, salvar } = useDadosEscolares();
  const cfg = configuracoesAdmin[tipo];
  const navegar = useNavigate();
  const [valores, setValores] = useState(() =>
    editar
      ? structuredClone(registro)
      : {
          nome: "",
          email: "",
          telefone: "",
          matricula: "",
          ano: String(new Date().getFullYear()),
          turma: "",
          etapa: "Ensino Fundamental",
          status: "Ativo",
          area: "",
          descricao: "",
          vinculos: [],
        },
  );
  const [erros, setErros] = useState({});
  const pessoal = pessoais.includes(tipo);
  const retorno = caminhoCadastro(
    tipo,
    pessoal && editar ? "detalhes" : "lista",
    pessoal && editar ? registro.id : "",
  );
  function atualizar(evento) {
    const { name, value } = evento.target;
    setValores((atuais) => ({
      ...atuais,
      [name]: value,
      ...(name === "ano" && tipo === "alunos" ? { turma: "" } : {}),
    }));
    setErros((atuais) => ({ ...atuais, [name]: "" }));
  }
  const campos = [
    ...cfg.campos.filter(
      (c) =>
        (tipo !== "disciplinas" || c.nome !== "descricao") &&
        (editar ||
          !["professores", "responsaveis"].includes(tipo) ||
          c.nome !== "status"),
    ),
    ...(tipo === "alunos"
      ? [
          {
            nome: "dataNascimento",
            rotulo: "Data de nascimento",
            tipo: "date",
            obrigatorio: true,
          },
        ]
      : []),
    ...(!editar && tipo === "professores"
      ? [
          {
            nome: "matricula",
            rotulo: "Matrícula",
            tipo: "text",
            obrigatorio: true,
          },
        ]
      : []),
    ...(!editar && ["professores", "responsaveis"].includes(tipo)
      ? [
          {
            nome: "senha",
            rotulo: "Senha inicial (mínimo 10 caracteres)",
            tipo: "password",
            obrigatorio: true,
          },
        ]
      : []),
  ];
  const [salvando, setSalvando] = useState(false);
  async function salvarFormulario(evento) {
    evento.preventDefault();
    if (salvando) return;
    const problemas = {};
    campos.forEach((campo) => {
      if (campo.obrigatorio && !String(valores[campo.nome] ?? "").trim())
        problemas[campo.nome] = "Preencha este campo.";
      if (
        campo.tipo === "email" &&
        valores.email &&
        !evento.currentTarget.elements.namedItem("email").validity.valid
      )
        problemas.email = "Digite um e-mail válido.";
    });
    if (
      valores.email &&
      [...dados.responsaveis, ...dados.professores].some(
        (i) =>
          i.id !== valores.id &&
          normalizarAdmin(i.email) === normalizarAdmin(valores.email),
      )
    )
      problemas.email = "Este e-mail já está cadastrado.";
    if (
      ["turmas", "disciplinas", "areas_disciplinas"].includes(tipo) &&
      dados[tipo].some(
        (i) =>
          i.id !== valores.id &&
          normalizarAdmin(i.nome) === normalizarAdmin(valores.nome) &&
          (tipo !== "turmas" || i.ano === valores.ano),
      )
    )
      problemas.nome = "Já existe um cadastro com estes dados.";
    if (
      tipo === "alunos" &&
      valores.turma &&
      !dados.turmas.some(
        (i) => i.nome === valores.turma && i.ano === valores.ano,
      ) &&
      !(
        editar &&
        valores.turma === registro.turma &&
        valores.ano === registro.ano
      )
    )
      problemas.turma = "Selecione uma turma deste ano letivo.";
    setErros(problemas);
    if (Object.keys(problemas).length) {
      evento.currentTarget.elements
        .namedItem(Object.keys(problemas)[0])
        ?.focus();
      return;
    }
    const registroSalvo = {
      ...valores,
      nome: valores.nome.trim(),
      email: valores.email?.trim(),
      etapa: valores.etapa || "Ensino Fundamental",
      alunos: valores.alunos || 0,
      resumo: valores.vinculos?.map((i) => i.nome).join(" · ") || "Sem vínculo",
    };
    setSalvando(true);
    const resultado = await salvar(tipo, registroSalvo);
    const id = resultado?.parcial ? resultado.id : resultado;
    setSalvando(false);
    if (!id) return;
    navegar(
      caminhoCadastro(
        tipo,
        pessoal ? "detalhes" : tipo === "turmas" ? "alunos" : "lista",
        pessoal || tipo === "turmas" ? id : "",
      ),
    );
  }
  let descricao = editar
    ? "Atualize os dados mantendo os vínculos e o histórico do cadastro."
    : "Preencha os dados e confira as permissões antes de salvar.";
  if (tipo === "turmas")
    descricao =
      "Organize as turmas por ano letivo e mantenha os cadastros atualizados.";
  if (tipo === "disciplinas")
    descricao = editar
      ? "Atualize os dados da disciplina preservando os vínculos e o histórico."
      : "Preencha os dados para disponibilizar a disciplina nos vínculos de ensino.";
  if (tipo === "areas_disciplinas")
    descricao = editar
      ? "Atualize os dados da área mantendo as disciplinas e o histórico."
      : "Crie uma área de conhecimento para agrupar disciplinas relacionadas.";
  let informacoes = cfg.informacoes;
  if (tipo === "areas_disciplinas" && editar) {
    const disciplinas = dados.disciplinas.filter(
      (i) => i.area === registro.nome,
    );
    informacoes = [
      {
        titulo: "Disciplinas desta área",
        texto: `${disciplinas.length} disciplinas associadas a ${registro.nome}.`,
        conteudo: (
          <>
            <div className="admin-disciplinas-area">
              {disciplinas.map((i) => (
                <div key={i.id}>
                  <strong>{i.nome}</strong>
                  <StatusAdmin valor={i.status} feminino />
                </div>
              ))}
            </div>
            <AcaoAdmin
              className="admin-link"
              to={caminhoCadastro("disciplinas")}
            >
              Consultar disciplinas →
            </AcaoAdmin>
          </>
        ),
      },
      {
        titulo: "Histórico preservado",
        texto:
          "Editar o nome ou a descrição não altera os vínculos existentes nem apaga os registros escolares.",
      },
    ];
  } else if (tipo === "areas_disciplinas") {
    informacoes = informacoes.map((item, i) =>
      i === 0
        ? {
            ...item,
            conteudo: (
              <div className="admin-exemplo-area">
                <small>EXEMPLO</small>
                <strong>Ciências Humanas</strong>
                <p>História e Geografia</p>
              </div>
            ),
          }
        : item,
    );
  }
  return (
    <>
      <TituloAdmin
        titulo={editar ? cfg.editar : cfg.novo}
        descricao={descricao}
        caminho={[
          ...(cfg.grupo ? [cfg.grupo] : []),
          cfg.titulo,
          editar ? "Editar cadastro" : "Novo cadastro",
        ]}
        acoes={
          tipo === "areas_disciplinas" && (
            <AcaoAdmin to={caminhoCadastro(tipo)}>← Voltar às áreas</AcaoAdmin>
          )
        }
      />
      <div
        className={`admin-colunas ${tipo === "areas_disciplinas" ? "admin-colunas--area" : ""}`}
      >
        <form
          className="admin-painel admin-formulario"
          noValidate
          onSubmit={salvarFormulario}
        >
          <div className="admin-bloco-titulo">
            <h2>{cfg.dados}</h2>
            <small>
              Campos com <span className="admin-obrigatorio">*</span> são
              obrigatórios
            </small>
          </div>
          <div className="admin-grade-campos">
            {campos
              .filter(
                (c) =>
                  !(
                    tipo === "areas_disciplinas" &&
                    !editar &&
                    c.nome === "status"
                  ),
              )
              .map((campo) => {
                const opcoes = opcoesCampo(campo, dados, valores, cfg.feminino);
                return (
                  <CampoAdmin
                    key={campo.nome}
                    {...campo}
                    tipo={opcoes.length ? "select" : campo.tipo}
                    valor={valores[campo.nome] ?? ""}
                    onChange={atualizar}
                    erro={erros[campo.nome]}
                    opcoes={opcoes}
                    opcional={campo.tipo === "textarea"}
                  />
                );
              })}
          </div>
          {["responsaveis", "professores"].includes(tipo) && (
            <p className="admin-ajuda">
              O e-mail identifica a conta. Entregue a senha inicial somente ao
              titular.
            </p>
          )}
          {tipo === "alunos" && (
            <p className="admin-ajuda">
              A turma selecionada deve pertencer ao ano letivo informado.
            </p>
          )}
          {tipo === "disciplinas" && (
            <p className="admin-ajuda">
              Professores, turmas e alunos são definidos nos vínculos de ensino.
            </p>
          )}
          {tipo === "turmas" && (
            <p className="admin-alerta">
              Os alunos e os vínculos de ensino são adicionados após salvar a
              turma.
            </p>
          )}
          {tipo === "areas_disciplinas" && !editar && (
            <div className="admin-exemplo-area">
              <strong>
                Status inicial <StatusAdmin feminino />
              </strong>
              <p>
                A área ficará disponível para seleção no cadastro de
                disciplinas.
              </p>
            </div>
          )}
          {tipo === "areas_disciplinas" && editar && (
            <p className="admin-ajuda">
              Ao inativar, a área deixa de estar disponível para novos
              cadastros. As disciplinas já associadas e os acompanhamentos
              anteriores são preservados.
            </p>
          )}
          {pessoal && (
            <VinculosCadastroAdmin
              tipo={tipo}
              vinculos={valores.vinculos || []}
              onChange={(vinculos) =>
                setValores((atuais) => ({ ...atuais, vinculos }))
              }
            />
          )}
          <div className="admin-formulario-acoes">
            <AcaoAdmin to={retorno}>Cancelar</AcaoAdmin>
            <AcaoAdmin tipo="primario" type="submit">
              {editar
                ? "Salvar alterações"
                : pessoal
                  ? "Salvar cadastro"
                  : "Salvar " + cfg.singular}
            </AcaoAdmin>
          </div>
        </form>
        <InformacoesAdmin blocos={informacoes} />
      </div>
    </>
  );
}

// A tela de detalhes preserva vínculos quando o status muda.
export function DetalhesCadastroAdmin({ tipo, registro, inativo = false }) {
  const { salvar, mudarStatus } = useDadosEscolares();
  const cfg = configuracoesAdmin[tipo];
  const navegar = useNavigate();
  const atual = inativo ? { ...registro, status: "Inativo" } : registro;
  const ehAluno = tipo === "alunos";
  const campos = ehAluno
    ? [
        ["Nome completo", atual.nome],
        ["Matrícula", atual.matricula],
        ["Ano letivo", atual.ano],
        ["Turma", atual.turma],
        ["Etapa de ensino", atual.etapa],
        ["Status", <StatusAdmin key="status" valor={atual.status} verde />],
      ]
    : [
        ["Nome completo", atual.nome],
        ["E-mail", atual.email],
        ["Telefone", atual.telefone],
        [
          "Perfil de acesso",
          tipo === "professores" ? "Professor" : "Responsável",
        ],
        ["Identificação", atual.id],
        ["Status", <StatusAdmin key="status" valor={atual.status} verde />],
      ];
  async function alternarStatus() {
    if (atual.status === "Inativo") {
      if (!(await mudarStatus(tipo, atual.id, "Ativo"))) return;
      navegar(caminhoCadastro(tipo, "detalhes", atual.id));
    } else
      navegar(
        `/administrador/${{ responsaveis: "responsavel", professores: "professor", alunos: "aluno" }[tipo]}_inativar?id=${atual.id}`,
      );
  }
  return (
    <>
      <TituloAdmin
        titulo={atual.nome}
        descricao="Consulte os dados, a situação e os vínculos deste cadastro."
        caminho={[...(cfg.grupo ? [cfg.grupo] : []), cfg.titulo, "Detalhes"]}
        acoes={
          <>
            <AcaoAdmin to={caminhoCadastro(tipo)}>← Voltar à lista</AcaoAdmin>
            <AcaoAdmin
              tipo="primario"
              to={caminhoCadastro(tipo, "editar", atual.id)}
            >
              Editar cadastro
            </AcaoAdmin>
          </>
        }
      />
      <div className="admin-painel admin-identidade">
        <span className="admin-avatar">
          {atual.nome
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")}
        </span>
        <div>
          <h2>{atual.nome}</h2>
          <p>
            {ehAluno
              ? atual.turma + " · " + atual.etapa
              : (tipo === "professores" ? "Professor" : "Responsável") +
                " · " +
                atual.email}
          </p>
        </div>
        <StatusAdmin valor={atual.status} verde />
        <small>{atual.id}</small>
      </div>
      <div className="admin-colunas">
        <section className="admin-painel">
          <h2>{ehAluno ? "Dados escolares" : "Dados do cadastro"}</h2>
          <dl className="admin-dados">
            {campos.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt>{rotulo}</dt>
                <dd>{valor || "Não informado"}</dd>
              </div>
            ))}
          </dl>
          <VinculosCadastroAdmin
            tipo={tipo}
            vinculos={atual.vinculos || []}
            onChange={(vinculos) =>
              salvar(tipo, {
                ...atual,
                vinculos,
                resumo:
                  vinculos.map((i) => i.nome).join(" · ") || "Sem vínculo",
              })
            }
          />
          <div className="admin-rodape-detalhes">
            <small>
              {atual.status === "Ativo"
                ? "Cadastro ativo | Informações mantidas pela administração escolar."
                : "Cadastro inativo | O histórico e os vínculos são preservados."}
            </small>
            <AcaoAdmin
              tipo="perigo"
              className="admin-botao--pequeno"
              onClick={alternarStatus}
            >
              {atual.status === "Ativo" ? "Inativar" : "Reativar"}{" "}
              {cfg.singular}
            </AcaoAdmin>
          </div>
        </section>
        <InformacoesAdmin blocos={cfg.informacoes} />
      </div>
    </>
  );
}

// A confirmação ocupa uma tela própria, seguindo os três exemplos de inativação.
export function ConfirmarInativacaoAdmin({ tipo, registro }) {
  const { mudarStatus } = useDadosEscolares();
  const cfg = configuracoesAdmin[tipo];
  const navegar = useNavigate();
  const retorno = caminhoCadastro(tipo, "detalhes", registro.id);
  async function confirmar() {
    if (!(await mudarStatus(tipo, registro.id, "Inativo"))) return;
    navegar(caminhoCadastro(tipo, "detalhes_inativo", registro.id));
  }
  return (
    <div className="admin-confirmacao">
      <AcaoAdmin to={retorno}>← Voltar</AcaoAdmin>
      <TituloAdmin
        titulo={"Inativar " + cfg.singular + "?"}
        descricao="Confira o cadastro antes de confirmar esta alteração."
      />
      <section className="admin-painel">
        <h2>Cadastro selecionado</h2>
        <p>{registro.nome}</p>
        <dl className="admin-dados admin-dados--coluna">
          <div>
            <dt>Perfil</dt>
            <dd>
              {tipo === "professores"
                ? "Professor"
                : tipo === "alunos"
                  ? "Aluno"
                  : "Responsável"}
            </dd>
          </div>
          <div>
            <dt>Status atual</dt>
            <dd>{registro.status}</dd>
          </div>
        </dl>
      </section>
      <div className="admin-alerta">
        <strong>Efeito da inativação</strong>
        <p>{cfg.efeito}</p>
      </div>
      <div className="admin-acoes">
        <AcaoAdmin to={retorno}>Manter ativo</AcaoAdmin>
        <AcaoAdmin tipo="primario" onClick={confirmar}>
          Confirmar inativação
        </AcaoAdmin>
      </div>
    </div>
  );
}

// O endereço escolhe a variante, enquanto a query seleciona o registro da tabela.
export default function CadastrosAdmin({ tipo, tela }) {
  const { dados } = useDadosEscolares();
  const [params] = useSearchParams();
  const registro = dados[tipo].find((i) => i.id === params.get("id"));
  if (tela === "lista") return <ListaCadastrosAdmin tipo={tipo} />;
  if (tela === "novo" || tela === "nova")
    return <FormularioCadastroAdmin key={tipo + "-novo"} tipo={tipo} />;
  if (tela === "editar")
    return (
      <FormularioCadastroAdmin
        key={registro.id + "-editar"}
        tipo={tipo}
        registro={registro}
        editar
      />
    );
  if (tela === "inativar")
    return <ConfirmarInativacaoAdmin tipo={tipo} registro={registro} />;
  return (
    <DetalhesCadastroAdmin
      tipo={tipo}
      registro={registro}
      inativo={tela === "detalhes_inativo"}
    />
  );
}
