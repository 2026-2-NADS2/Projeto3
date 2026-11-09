// Componentes da seção 08: turmas, alunos e permissões de acompanhamento.
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDadosEscolares } from "../../hooks/useDadosEscolares.jsx";

import { caminhoCadastro } from "../../data/adminConfiguracao.js";
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

const abasTurmas = [
  ["Turmas", caminhoCadastro("turmas")],
  ["Vínculos de ensino", "/administrador/vinculos/ensino_por_turma"],
  ["Responsáveis e alunos", "/administrador/vinculos/responsaveis_alunos"],
];
const dadosPadraoEnsino = {
  ano: String(new Date().getFullYear()),
  professor: "",
  disciplina: "",
  abrangencia: "Toda a turma",
  turma: "",
  status: "Ativo",
  aluno: "",
};

// A modal mantém a seleção enquanto a busca filtra apenas os candidatos visíveis.
function AdicionarAlunosAdmin({ turma, linhas, aoFechar }) {
  const { dados, matricular } = useDadosEscolares();
  const candidatos = dados.alunos.filter(
    (i) => i.ativo && !linhas.some((linha) => linha.id === i.id),
  );
  const [selecionados, setSelecionados] = useState(() =>
    candidatos.slice(0, 2).map((i) => i.id),
  );
  const [busca, setBusca] = useState("");
  const visiveis = candidatos.filter((i) =>
    normalizarAdmin(i.nome + " " + i.matricula).includes(
      normalizarAdmin(busca),
    ),
  );
  async function adicionar() {
    for (const id of selecionados)
      if (!(await matricular(id, turma.id))) return;
    aoFechar();
  }
  return (
    <DialogoAdmin
      categoria={`TURMA ${turma.nome} · ${turma.ano}`}
      titulo="Adicionar alunos"
      aoFechar={aoFechar}
    >
      <CampoAdmin
        nome="busca-alunos"
        rotulo="Buscar alunos"
        placeholder="Nome ou matrícula"
        valor={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      <p className="admin-texto-suave">
        Alunos ativos sem turma no ano letivo de {turma.ano}.
      </p>
      <div className="admin-opcoes-checkbox">
        {visiveis.map((i) => (
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
              <small>
                Matrícula {i.matricula} · {i.turma || "Sem turma"}
              </small>
            </span>
          </label>
        ))}
      </div>
      <strong className="admin-selecao-total">
        {selecionados.length} alunos selecionados
      </strong>
      <p className="admin-alerta">
        Alunos já vinculados a outra turma precisam ter seu vínculo atual
        conferido antes de uma transferência.
      </p>
      <div className="admin-formulario-acoes">
        <AcaoAdmin onClick={aoFechar}>Cancelar</AcaoAdmin>
        <AcaoAdmin
          tipo="primario"
          disabled={!selecionados.length}
          onClick={adicionar}
        >
          Adicionar {selecionados.length} alunos
        </AcaoAdmin>
      </div>
    </DialogoAdmin>
  );
}

// Alunos e professores compartilham a identificação e as abas da mesma turma.
export function TurmaAdmin({ tela }) {
  const { dados, encerrarMatricula } = useDadosEscolares();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const turma = dados.turmas.find((i) => i.id === params.get("id"));
  if (!turma)
    return (
      <AcaoAdmin to={caminhoCadastro("turmas")}>Voltar às turmas</AcaoAdmin>
    );
  const linhas = dados.alunos.filter((i) => i.turmaId === Number(turma.id));
  const ensino = dados.ensino.filter(
    (i) => i.turma === turma.nome && i.ano === turma.ano,
  );
  const professores = tela === "professores_disciplinas";
  const retorno = caminhoCadastro("turmas", "alunos", turma.id);
  async function remover(item) {
    if (item.matriculaTurmaId) await encerrarMatricula(item.matriculaTurmaId);
  }
  return (
    <>
      <TituloAdmin
        titulo={"Turma " + turma.nome}
        descricao="Consulte os alunos e organize quem pode registrar acompanhamentos nesta turma."
        caminho={["Turmas e vínculos"]}
        acoes={
          <>
            <AcaoAdmin to={caminhoCadastro("turmas")}>
              ← Voltar às turmas
            </AcaoAdmin>
            <AcaoAdmin
              tipo="primario"
              to={caminhoCadastro("turmas", "editar", turma.id)}
            >
              Editar turma
            </AcaoAdmin>
          </>
        }
      />
      <section className="admin-painel admin-turma-resumo">
        <div>
          <span className="admin-selo">TURMA</span>
          <h2>{turma.nome}</h2>
          <p>
            {turma.etapa} · Ano letivo {turma.ano}
          </p>
        </div>
        <div>
          <strong>{turma.alunos}</strong>
          <small>alunos vinculados</small>
        </div>
        <div>
          <strong>{ensino.length}</strong>
          <small>vínculos de ensino</small>
        </div>
        <StatusAdmin valor={turma.status} />
      </section>
      <AbasAdmin
        atual={professores ? "Professores e disciplinas" : "Alunos"}
        itens={[
          ["Alunos", retorno],
          [
            "Professores e disciplinas",
            caminhoCadastro("turmas", "professores_disciplinas", turma.id),
          ],
        ]}
      />
      <section className="admin-painel">
        <div className="admin-bloco-titulo">
          <div>
            <h2>
              {professores ? "Professores e disciplinas" : "Alunos da turma"}
            </h2>
            <p>
              {professores
                ? `Vínculos válidos para o ano letivo de ${turma.ano}.`
                : `${turma.alunos} alunos nesta turma · Exibindo os 5 primeiros nesta prévia.`}
            </p>
          </div>
          <AcaoAdmin
            tipo="primario"
            to={
              professores
                ? "/administrador/vinculos/ensino_por_turma"
                : caminhoCadastro("turmas", "adicionar_alunos", turma.id)
            }
          >
            {professores ? "+ Adicionar vínculo" : "+ Adicionar alunos"}
          </AcaoAdmin>
        </div>
        {professores ? (
          <TabelaAdmin
            linhas={ensino}
            plural="vínculos"
            colunas={[
              ["professor", "Professor"],
              ["disciplina", "Disciplina"],
              ["abrangencia", "Abrangência"],
              ["status", "Status"],
            ]}
            renderizar={(item, chave) =>
              chave === "status" ? (
                <StatusAdmin valor={item.status} />
              ) : chave === "abrangencia" ? (
                item.abrangencia === "Por aluno" ? (
                  item.aluno
                ) : (
                  item.abrangencia
                )
              ) : chave === "professor" ? (
                <strong>{item.professor}</strong>
              ) : (
                item[chave]
              )
            }
            acao={(item) => (
              <AcaoAdmin
                className="admin-link"
                to={"/administrador/vinculos/ensino_por_turma?id=" + item.id}
              >
                Editar vínculo
              </AcaoAdmin>
            )}
          />
        ) : (
          <TabelaAdmin
            linhas={linhas}
            tamanho={5}
            plural="alunos"
            colunas={[
              ["nome", "Aluno"],
              ["matricula", "Matrícula"],
              ["status", "Status"],
            ]}
            renderizar={(item, chave) =>
              chave === "status" ? (
                <StatusAdmin valor={item.status} />
              ) : chave === "nome" ? (
                <strong>{item.nome}</strong>
              ) : (
                item[chave]
              )
            }
            acao={(item) => (
              <button
                type="button"
                className="admin-link"
                onClick={() => remover(item)}
              >
                Remover da turma
              </button>
            )}
          />
        )}
      </section>
      {tela === "adicionar_alunos" && (
        <AdicionarAlunosAdmin
          key={turma.id}
          turma={turma}
          linhas={linhas}
          aoFechar={() => navegar(retorno)}
        />
      )}
    </>
  );
}

// O vínculo de ensino valida ano, turma, abrangência e duplicidade antes de salvar.
export function EnsinoAdmin() {
  const { dados, salvar, rascunhoEnsino, setRascunhoEnsino } =
    useDadosEscolares();
  const [params] = useSearchParams();
  const registro = dados.ensino.find((i) => i.id === params.get("id"));
  const [valores, setValores] = useState(() =>
    registro
      ? { ...registro }
      : rascunhoEnsino
        ? { ...rascunhoEnsino }
        : dadosPadraoEnsino,
  );
  const [erro, setErro] = useState("");
  const navegar = useNavigate();
  function atualizar(e) {
    setValores((atuais) => ({ ...atuais, [e.target.name]: e.target.value }));
    setErro("");
  }
  async function salvarVinculo(evento) {
    evento.preventDefault();
    if (
      !valores.professor ||
      !valores.disciplina ||
      !valores.turma ||
      !valores.ano ||
      (valores.abrangencia === "Por aluno" && !valores.aluno)
    ) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    const turma = dados.turmas.find((i) => i.nome === valores.turma);
    setRascunhoEnsino({ ...valores });
    if (!turma || turma.ano !== valores.ano) {
      navegar("/administrador/vinculo_incompativel");
      return;
    }
    const duplicado = dados.ensino.some(
      (i) =>
        i.id !== valores.id &&
        ["professor", "disciplina", "turma", "ano", "abrangencia"].every(
          (c) => i[c] === valores[c],
        ) &&
        (i.abrangencia !== "Por aluno" || i.aluno === valores.aluno),
    );
    if (duplicado) {
      navegar("/administrador/vinculo_duplicado");
      return;
    }
    if (!(await salvar("ensino", valores))) return;
    setRascunhoEnsino(null);
    navegar(caminhoCadastro("turmas", "professores_disciplinas", turma.id));
  }
  const campos = [
    ["ano", "Ano letivo", [...new Set(dados.turmas.map((t) => t.ano))]],
    [
      "professor",
      "Professor",
      dados.professores.filter((i) => i.status === "Ativo").map((i) => i.nome),
    ],
    [
      "disciplina",
      "Disciplina",
      dados.disciplinas.filter((i) => i.status === "Ativo").map((i) => i.nome),
    ],
    ["abrangencia", "Abrangência", ["Toda a turma", "Por aluno"]],
    [
      "turma",
      "Turma",
      dados.turmas.filter((i) => i.status === "Ativo").map((i) => i.nome),
    ],
    ["status", "Status", ["Ativo", "Inativo"]],
  ];
  return (
    <>
      <TituloAdmin
        titulo={
          registro ? "Editar vínculo de ensino" : "Novo vínculo de ensino"
        }
        descricao="Defina o professor, a disciplina e os alunos que ele poderá acompanhar."
        caminho={["Turmas e vínculos"]}
      />
      <div className="admin-colunas">
        <form
          className="admin-painel admin-formulario"
          onSubmit={salvarVinculo}
        >
          <div className="admin-bloco-titulo">
            <h2>Dados do vínculo</h2>
            <small>
              Campos com <span className="admin-obrigatorio">*</span> são
              obrigatórios
            </small>
          </div>
          <div className="admin-grade-campos">
            {campos.map(([nome, rotulo, opcoes]) => (
              <CampoAdmin
                key={nome}
                nome={nome}
                rotulo={rotulo}
                tipo="select"
                obrigatorio
                valor={valores[nome]}
                opcoes={opcoes}
                onChange={atualizar}
              />
            ))}
            {valores.abrangencia === "Por aluno" && (
              <CampoAdmin
                nome="aluno"
                rotulo="Aluno"
                tipo="select"
                obrigatorio
                valor={valores.aluno}
                opcoes={[
                  ["", "Selecionar aluno"],
                  ...dados.alunos
                    .filter(
                      (i) => i.turma === valores.turma && i.ano === valores.ano,
                    )
                    .map((i) => i.nome),
                ]}
                onChange={atualizar}
              />
            )}
          </div>
          {erro && (
            <p className="admin-erro" role="alert">
              {erro}
            </p>
          )}
          <div className="admin-alerta">
            <strong>
              {valores.abrangencia === "Toda a turma"
                ? "Este vínculo abrange toda a turma " + valores.turma + "."
                : "Este vínculo permite acompanhar somente o aluno selecionado."}
            </strong>
            <p>
              O professor terá acesso aos alunos vinculados a essa turma no ano
              letivo selecionado.
            </p>
          </div>
          <div className="admin-formulario-acoes">
            <AcaoAdmin to={caminhoCadastro("turmas")}>Cancelar</AcaoAdmin>
            <AcaoAdmin tipo="primario" type="submit">
              {registro ? "Salvar alterações" : "Salvar vínculo"}
            </AcaoAdmin>
          </div>
        </form>
        <InformacoesAdmin
          blocos={[
            {
              titulo: "Permissão para acompanhar",
              texto:
                "O vínculo define para quais alunos e disciplinas o professor poderá registrar acompanhamentos.",
            },
            {
              titulo: "Antes de salvar",
              texto:
                "Confira professor, disciplina, turma e abrangência. Um vínculo por aluno permite autorizar apenas os estudantes selecionados.",
            },
          ]}
        />
      </div>
    </>
  );
}

// A listagem cruza os vínculos com os cadastros para aplicar busca e turma atual.
export function FamiliaListaAdmin() {
  const { dados, removerVinculo } = useDadosEscolares();
  const [filtros, setFiltros] = useState({ busca: "", turma: "" });
  const linhas = dados.familia.filter(
    (i) =>
      (!filtros.turma || i.turma === filtros.turma) &&
      normalizarAdmin(
        [
          i.responsavel,
          i.aluno,
          dados.responsaveis.find((r) => r.nome === i.responsavel)?.email,
          dados.alunos.find((a) => a.nome === i.aluno)?.matricula,
        ].join(" "),
      ).includes(normalizarAdmin(filtros.busca)),
  );
  function atualizar(e) {
    setFiltros((atuais) => ({ ...atuais, [e.target.name]: e.target.value }));
  }
  return (
    <>
      <TituloAdmin
        titulo="Responsáveis e alunos"
        descricao="Confira quem está autorizado a acompanhar os relatórios de cada aluno."
        caminho={["Turmas e vínculos"]}
        acoes={
          <AcaoAdmin
            tipo="primario"
            to="/administrador/vinculos/novo_responsavel_aluno"
          >
            + Vincular responsável
          </AcaoAdmin>
        }
      />
      <AbasAdmin itens={abasTurmas} atual="Responsáveis e alunos" />
      <section className="admin-painel admin-lista">
        <div className="admin-filtros admin-filtros--duas">
          <CampoAdmin
            nome="busca"
            rotulo="Buscar responsável ou aluno"
            placeholder="Nome, e-mail ou matrícula"
            valor={filtros.busca}
            onChange={atualizar}
          />
          <CampoAdmin
            nome="turma"
            rotulo="Turma atual"
            tipo="select"
            valor={filtros.turma}
            onChange={atualizar}
            opcoes={[["", "Todas"], ...dados.turmas.map((i) => i.nome)]}
          />
        </div>
        <div className="admin-resumo-lista">
          <span>{linhas.length} vínculos encontrados</span>
          <button
            type="button"
            className="admin-link"
            onClick={() => setFiltros({ busca: "", turma: "" })}
          >
            Limpar filtros
          </button>
        </div>
        <TabelaAdmin
          key={JSON.stringify(filtros)}
          linhas={linhas}
          plural="vínculos"
          classe="admin-tabela--cadastros"
          colunas={[
            ["responsavel", "Responsável"],
            ["aluno", "Aluno"],
            ["turma", "Turma atual"],
            ["acesso", "Acesso"],
          ]}
          renderizar={(i, c) =>
            c === "acesso" ? (
              <span className="admin-status">Relatórios publicados</span>
            ) : c === "responsavel" ? (
              <strong>{i[c]}</strong>
            ) : (
              i[c]
            )
          }
          acao={(i) => (
            <AcaoAdmin onClick={() => removerVinculo("familia", i.id)}>
              Remover vínculo
            </AcaoAdmin>
          )}
        />
      </section>
    </>
  );
}

// Os dois nomes são entradas com sugestões; é necessário escolher cadastros existentes.
export function FamiliaFormularioAdmin() {
  const { dados, salvar } = useDadosEscolares();
  const [responsavel, setResponsavel] = useState("");
  const [aluno, setAluno] = useState("");
  const [erro, setErro] = useState("");
  const navegar = useNavigate();
  const pessoa = dados.responsaveis.find(
    (i) => i.nome === responsavel && i.status === "Ativo",
  );
  const estudante = dados.alunos.find(
    (i) => i.nome === aluno && i.status === "Ativo",
  );
  async function confirmar(evento) {
    evento.preventDefault();
    if (!pessoa || !estudante) {
      setErro("Selecione um responsável e um aluno ativos.");
      return;
    }
    if (
      dados.familia.some(
        (i) => i.responsavel === responsavel && i.aluno === aluno,
      )
    ) {
      setErro("Este responsável já está vinculado ao aluno.");
      return;
    }
    if (
      !(await salvar("familia", {
        alunoId: estudante.id,
        responsavelId: pessoa.responsavelId,
      }))
    )
      return;
    navegar("/administrador/vinculos/responsaveis_alunos");
  }
  const iniciais = (nome) =>
    nome
      .split(" ")
      .slice(0, 2)
      .map((v) => v[0])
      .join("");
  return (
    <>
      <TituloAdmin
        titulo="Vincular responsável e aluno"
        descricao="Autorize o acesso de um responsável aos relatórios publicados de um aluno."
        caminho={["Turmas e vínculos"]}
      />
      <div className="admin-colunas">
        <form className="admin-painel admin-formulario" onSubmit={confirmar}>
          <h2>Dados do vínculo</h2>
          <div className="admin-grade-campos">
            <CampoAdmin
              nome="responsavel"
              rotulo="Buscar responsável"
              obrigatorio
              valor={responsavel}
              onChange={(e) => {
                setResponsavel(e.target.value);
                setErro("");
              }}
              list="responsaveis-opcoes"
            />
            <CampoAdmin
              nome="aluno"
              rotulo="Buscar aluno"
              obrigatorio
              valor={aluno}
              onChange={(e) => {
                setAluno(e.target.value);
                setErro("");
              }}
              list="alunos-opcoes"
            />
          </div>
          <datalist id="responsaveis-opcoes">
            {dados.responsaveis
              .filter((i) => i.status === "Ativo")
              .map((i) => (
                <option key={i.id} value={i.nome} />
              ))}
          </datalist>
          <datalist id="alunos-opcoes">
            {dados.alunos
              .filter((i) => i.status === "Ativo")
              .map((i) => (
                <option key={i.id} value={i.nome} />
              ))}
          </datalist>
          <div className="admin-vinculo-preview">
            <span className="admin-avatar">{iniciais(responsavel)}</span>
            <div>
              <strong>{responsavel}</strong>
              <small>{pessoa?.email || "Selecione um cadastro"}</small>
            </div>
            <span aria-hidden="true">↔</span>
            <span className="admin-avatar">{iniciais(aluno)}</span>
            <div>
              <strong>{aluno}</strong>
              <small>
                Matrícula {estudante?.matricula || "—"} ·{" "}
                {estudante?.turma || "—"}
              </small>
            </div>
          </div>
          {erro && (
            <p className="admin-erro" role="alert">
              {erro}
            </p>
          )}
          <p className="admin-alerta">
            {responsavel.split(" ")[0]} poderá consultar os relatórios de{" "}
            {aluno.split(" ")[0]} somente após a publicação pela administração.
            Os relatórios dos demais alunos não serão liberados por este
            vínculo.
          </p>
          <div className="admin-formulario-acoes">
            <AcaoAdmin to="/administrador/vinculos/responsaveis_alunos">
              Cancelar
            </AcaoAdmin>
            <AcaoAdmin tipo="primario" type="submit">
              Confirmar vínculo
            </AcaoAdmin>
          </div>
        </form>
        <InformacoesAdmin
          blocos={[
            {
              titulo: "Acesso autorizado",
              texto:
                "Um aluno pode ter vários responsáveis e um responsável pode acompanhar vários alunos.",
            },
            {
              titulo: "Antes de salvar",
              texto:
                "Confira a identidade do responsável e o aluno selecionado. Este vínculo não concede acesso aos rascunhos ou aos registros em revisão.",
            },
          ]}
        />
      </div>
    </>
  );
}

// Os erros são telas reais, acessíveis diretamente e também pelas validações do formulário.
export function ErroVinculoAdmin({ incompativel = false }) {
  const { rascunhoEnsino, setRascunhoEnsino } = useDadosEscolares();
  const [correcao, setCorrecao] = useState(() => ({
    ...dadosPadraoEnsino,
    ...rascunhoEnsino,
  }));
  const navegar = useNavigate();
  const dados = { ...dadosPadraoEnsino, ...rascunhoEnsino };
  function corrigir() {
    setRascunhoEnsino(correcao);
    navegar("/administrador/vinculos/ensino_por_turma");
  }
  return (
    <div className="admin-confirmacao">
      <AcaoAdmin to="/administrador/vinculos/ensino_por_turma">
        ← Voltar
      </AcaoAdmin>
      <TituloAdmin
        titulo={
          incompativel
            ? "Confira o ano letivo do vínculo"
            : "Vínculo já cadastrado"
        }
        descricao={
          incompativel
            ? "A turma selecionada deve pertencer ao mesmo ano letivo informado."
            : "O mesmo vínculo não pode ser incluído novamente."
        }
      />
      <div className="admin-alerta admin-alerta--erro">
        <strong>
          {incompativel ? "Dados incompatíveis" : "Vínculo duplicado"}
        </strong>
        <p>
          {incompativel
            ? `A turma selecionada não está disponível no ano letivo informado.`
            : `${dados.professor} já está vinculada à turma ${dados.turma}, em ${dados.disciplina}, no ano letivo ${dados.ano}.`}
        </p>
      </div>
      <section className="admin-painel">
        <h2>{incompativel ? "Corrigir seleção" : "Vínculo existente"}</h2>
        {incompativel ? (
          <div className="admin-campos-coluna">
            <CampoAdmin
              nome="ano"
              rotulo="Ano letivo"
              valor={correcao.ano}
              onChange={(e) =>
                setCorrecao((v) => ({ ...v, ano: e.target.value }))
              }
            />
            <CampoAdmin
              nome="turma"
              rotulo="Turma"
              valor={correcao.turma}
              onChange={(e) =>
                setCorrecao((v) => ({
                  ...v,
                  turma: e.target.value.split(" · ")[0],
                }))
              }
            />
          </div>
        ) : (
          <dl className="admin-dados admin-dados--coluna">
            <div>
              <dt>Professora</dt>
              <dd>{dados.professor}</dd>
            </div>
            <div>
              <dt>Turma e disciplina</dt>
              <dd>
                {dados.turma} · {dados.disciplina}
              </dd>
            </div>
            <div>
              <dt>Ano letivo</dt>
              <dd>{dados.ano}</dd>
            </div>
          </dl>
        )}
        <div className="admin-acoes">
          {incompativel ? (
            <>
              <AcaoAdmin tipo="primario" onClick={corrigir}>
                Voltar e corrigir
              </AcaoAdmin>
              <AcaoAdmin to={caminhoCadastro("turmas")}>Cancelar</AcaoAdmin>
            </>
          ) : (
            <>
              <AcaoAdmin
                tipo="primario"
                to={caminhoCadastro("turmas", "professores_disciplinas")}
              >
                Ver vínculos existentes
              </AcaoAdmin>
              <AcaoAdmin to="/administrador/vinculos/ensino_por_turma">
                Voltar ao formulário
              </AcaoAdmin>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
