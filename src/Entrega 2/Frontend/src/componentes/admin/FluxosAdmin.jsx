// Componentes das seções 11 a 14, com consultas e decisões mantidas em memória.
import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AcaoAdmin,
  CampoAdmin,
  TituloAdmin,
  TabelaAdmin,
  InformacoesAdmin,
  DialogoAdmin,
  normalizarAdmin,
} from "./ElementosAdmin.jsx";
import { useFluxoAdmin } from "../../hooks/useFluxoAdmin.jsx";

import {
  filtrarRegistros,
  filtroInicial,
  estadosRegistro,
  horarioEvento,
} from "../../data/fluxoDados.js";
import {
  linhasRelatorio,
  criarArquivo,
  baixarArquivo,
} from "../../utilitarios/exportarRelatorio.js";
import "../../css/fluxosAdmin.css";
const raiz = "/administrador";
const rel = raiz + "/relatorios/";
const aud = raiz + "/auditoria/";
const rev = raiz + "/revisao/";
const urlRegistro = (rota, id) => rota + "?id=" + encodeURIComponent(id);
const numero = (n) =>
  Number(n).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
function Selo({ children }) {
  return (
    <span
      className={
        "fluxo-selo " +
        (["Publicado", "Ativa"].includes(children)
          ? "fluxo-selo--verde"
          : ["Em revisão", "Devolvido para ajustes"].includes(children)
            ? "fluxo-selo--laranja"
            : "")
      }
    >
      {children}
    </span>
  );
}
function Painel({ titulo, children }) {
  return (
    <section className="admin-painel fluxo-painel">
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}
function Aviso({ children }) {
  return <div className="fluxo-aviso">{children}</div>;
}
function Tags({ ids }) {
  const { tags } = useFluxoAdmin();
  return (
    <div className="fluxo-tags">
      {ids.map((id) => (
        <Selo key={id}>{tags.find((t) => t.id === id)?.nome || id}</Selo>
      ))}
    </div>
  );
}
function Voltar({ to, children = "Voltar" }) {
  return <AcaoAdmin to={to}>← {children}</AcaoAdmin>;
}

// Cadastro de tags preserva IDs para manter os usos anteriores mesmo após renomear.
export function TagsAdmin({ tela }) {
  const { tags, salvarTag } = useFluxoAdmin(),
    [params] = useSearchParams(),
    nav = useNavigate();
  const existente = tags.find((t) => t.id === params.get("id"));
  const [form, setForm] = useState(() =>
    tela === "nova"
      ? { nome: "", descricao: "", status: "Ativa", cor: "#246BC0" }
      : { ...existente },
  );
  const [busca, setBusca] = useState(""),
    [status, setStatus] = useState(""),
    [erro, setErro] = useState("");
  const campo = (nome, valor) => setForm((f) => ({ ...f, [nome]: valor }));
  if (tela === "lista")
    return (
      <>
        <TituloAdmin
          caminho={["Tags"]}
          titulo="Tags de acompanhamento"
          descricao="Organize as classificações utilizadas pelos professores nos acompanhamentos escolares."
          acoes={
            <AcaoAdmin tipo="primario" to={raiz + "/tags/nova"}>
              + Nova tag
            </AcaoAdmin>
          }
        />
        <Painel>
          <div className="fluxo-duas">
            <CampoAdmin
              nome="busca-tag"
              rotulo="Buscar tag"
              placeholder="Nome ou descrição"
              valor={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <CampoAdmin
              nome="status-tag"
              rotulo="Status"
              tipo="select"
              valor={status}
              opcoes={[["", "Todos os status"], "Ativa", "Inativa"]}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
          <div className="fluxo-acoes">
            <span>{tags.length} tags cadastradas</span>
            <AcaoAdmin
              onClick={() => {
                setBusca("");
                setStatus("");
              }}
            >
              Limpar filtros
            </AcaoAdmin>
          </div>
          <TabelaAdmin
            plural="tags"
            colunas={[
              ["nome", "Tag"],
              ["descricao", "Descrição"],
              ["status", "Status"],
            ]}
            linhas={tags.filter(
              (t) =>
                (!status || t.status === status) &&
                normalizarAdmin(t.nome + " " + t.descricao).includes(
                  normalizarAdmin(busca),
                ),
            )}
            renderizar={(t, k) =>
              k === "descricao" ? t[k] : <Selo>{t[k]}</Selo>
            }
            acao={(t) => (
              <AcaoAdmin to={urlRegistro(raiz + "/tags/editar", t.id)}>
                Ver detalhes
              </AcaoAdmin>
            )}
          />
        </Painel>
      </>
    );
  if (tela !== "nova" && !existente)
    return (
      <Painel titulo="Tag não encontrada">
        <Voltar to={raiz + "/tags/lista"} />
      </Painel>
    );
  return (
    <>
      <TituloAdmin
        caminho={[
          "Tags",
          tela === "nova" ? "Novo cadastro" : "Editar cadastro",
        ]}
        titulo={tela === "nova" ? "Nova tag" : "Editar tag"}
        descricao="Defina o nome e oriente como a tag deve ser utilizada nos acompanhamentos."
      />
      <div className="fluxo-colunas">
        <form
          className="admin-painel fluxo-painel"
          onSubmit={async (e) => {
            e.preventDefault();
            const msg = await salvarTag(form);
            setErro(msg);
            if (!msg) nav(raiz + "/tags/lista");
          }}
        >
          <h2>Dados da tag</h2>
          <div className="fluxo-duas">
            <CampoAdmin
              nome="nome-tag"
              rotulo="Nome da tag"
              valor={form.nome}
              obrigatorio
              erro={erro}
              onChange={(e) => campo("nome", e.target.value)}
            />
            <CampoAdmin
              nome="situacao-tag"
              rotulo="Status"
              tipo="select"
              valor={form.status}
              opcoes={["Ativa", "Inativa"]}
              onChange={(e) => campo("status", e.target.value)}
            />
          </div>
          <CampoAdmin
            nome="descricao-tag"
            rotulo="Descrição"
            tipo="textarea"
            opcional
            valor={form.descricao}
            onChange={(e) => campo("descricao", e.target.value)}
          />
          <p>
            A tag poderá ser selecionada em diferentes disciplinas, turmas e
            bimestres.
          </p>
          <div className="fluxo-acoes">
            <Voltar to={raiz + "/tags/lista"}>Cancelar</Voltar>
            <button className="admin-botao admin-botao--primario">
              {tela === "nova" ? "Salvar tag" : "Salvar alterações"}
            </button>
          </div>
        </form>
        <InformacoesAdmin
          blocos={[
            {
              titulo: "Prévia no acompanhamento",
              texto:
                "Exemplo de seleção de várias tags em um mesmo acompanhamento.",
              conteudo: (
                <div className="fluxo-tags">
                  <Selo>{form.nome || "Nome da tag"}</Selo>
                  <Selo>Em evolução</Selo>
                  <Selo>Organização</Selo>
                </div>
              ),
            },
            {
              titulo: "Uso das tags",
              texto:
                "O professor poderá selecionar mais de uma tag para classificar o registro do aluno.",
            },
            {
              titulo: "Nome e descrição",
              texto:
                "Use um nome claro. A descrição ajuda os professores a entender em quais situações aplicar a classificação.",
            },
            {
              titulo: "Evite duplicações",
              texto:
                "Consulte as tags existentes antes de cadastrar uma nova classificação.",
            },
          ]}
        />
      </div>
    </>
  );
}

// A mesma tabela atende ao recorte do relatório e à fila de revisão.
function TabelaRegistros({ linhas, revisao = false }) {
  return (
    <TabelaAdmin
      linhas={linhas}
      plural="acompanhamentos"
      classe={revisao ? "admin-tabela--revisoes" : ""}
      colunas={
        revisao
          ? [
              ["aluno", "Aluno"],
              ["turma", "Turma"],
              ["disciplina", "Disciplina / professor"],
              ["data", "Enviado em"],
              ["status", "Status"],
            ]
          : [
              ["aluno", "Aluno / turma"],
              ["disciplina", "Disciplina / professor"],
              ["media", "Média"],
              ["tags", "Tags"],
              ["status", "Status"],
            ]
      }
      renderizar={(r, k) =>
        k === "tags" ? (
          <Tags ids={r.tags} />
        ) : k === "status" ? (
          <Selo>{r.status}</Selo>
        ) : k === "media" ? (
          numero(r.media)
        ) : k === "aluno" ? (
          <>
            <strong>{r.aluno}</strong>
            {!revisao && <small>{r.turma}</small>}
          </>
        ) : k === "turma" ? (
          r.turma
        ) : k === "data" ? (
          r.data || "30 out, 10:30"
        ) : (
          <>
            <strong>{r.disciplina}</strong>
            <small>{r.professor}</small>
          </>
        )
      }
      acao={(r) => (
        <AcaoAdmin
          to={urlRegistro(
            revisao
              ? raiz + "/revisar_acompanhamento"
              : rel + "05-detalhe-do-acompanhamento",
            r.id,
          )}
        >
          {revisao ? "Revisar" : "Ver registro"}
        </AcaoAdmin>
      )}
    />
  );
}

// A lista da seção 14 mantém o contexto separado dos quatro filtros, como no Figma.
function ListaRevisoes() {
  const {
    registros,
    tags,
    filtrosRevisao: filtros,
    setFiltrosRevisao: setFiltros,
  } = useFluxoAdmin();
  const linhas = filtrarRegistros(registros, filtros);
  function campo(k, rotulo) {
    return (
      <CampoAdmin
        key={k}
        nome={"revisoes-" + k}
        rotulo={rotulo}
        tipo="select"
        valor={filtros[k]}
        opcoes={[["", "Todos"], ...new Set(registros.map((r) => r[k]))]}
        onChange={(e) =>
          setFiltros((atuais) => ({ ...atuais, [k]: e.target.value }))
        }
      />
    );
  }
  return (
    <>
      <TituloAdmin
        titulo="Todas as revisões"
        descricao="Consulte os acompanhamentos e abra um registro para revisar."
      />
      <section
        className="admin-painel admin-contexto"
        aria-label="Contexto das revisões"
      >
        {campo("ano", "Ano letivo")}
        {campo("bimestre", "Bimestre")}
      </section>
      <section className="admin-painel fluxo-painel">
        <div className="admin-bloco-titulo">
          <h2>Lista de revisões</h2>
          <AcaoAdmin
            className="admin-botao--pequeno"
            onClick={() =>
              baixarArquivo(
                criarArquivo(linhasRelatorio(linhas, tags, false), "csv"),
                "revisoes-collision.csv",
              )
            }
          >
            Exportar dados
          </AcaoAdmin>
        </div>
        <div className="fluxo-filtros">
          {campo("turma", "Turma")}
          {campo("disciplina", "Disciplina")}
          {campo("professor", "Professor")}
          {campo("status", "Status")}
        </div>
        <p>{linhas.length} acompanhamentos encontrados</p>
        <TabelaRegistros
          key={JSON.stringify(filtros)}
          linhas={linhas}
          revisao
        />
      </section>
    </>
  );
}

function FiltrosRegistros({ revisao = false }) {
  const contexto = useFluxoAdmin();
  const { registros, tags } = contexto;
  const filtros = revisao ? contexto.filtrosRevisao : contexto.filtros;
  const setFiltros = revisao ? contexto.setFiltrosRevisao : contexto.setFiltros;
  const [rascunho, setRascunho] = useState(filtros);
  return (
    <form
      className="admin-painel fluxo-painel"
      onSubmit={(e) => {
        e.preventDefault();
        setFiltros(rascunho);
      }}
    >
      <h2>{revisao ? "Filtros da revisão" : "Filtros do relatório"}</h2>
      <p>Defina o recorte dos indicadores e dos acompanhamentos.</p>
      <div className="fluxo-filtros">
        {Object.entries({
          ano: "Ano letivo",
          bimestre: "Bimestre",
          turma: "Turma",
          disciplina: "Disciplina",
          professor: "Professor",
          aluno: "Aluno",
          tag: "Tags",
          status: "Status",
        }).map(([k, label]) => (
          <CampoAdmin
            key={k}
            nome={"filtro-" + k}
            rotulo={label}
            tipo={k === "aluno" ? "text" : "select"}
            valor={rascunho[k]}
            opcoes={
              k === "tag"
                ? [["", "Todas as tags"], ...tags.map((t) => [t.id, t.nome])]
                : [["", "Todos"], ...new Set(registros.map((r) => r[k]))]
            }
            onChange={(e) =>
              setRascunho((f) => ({ ...f, [k]: e.target.value }))
            }
          />
        ))}
      </div>
      <div className="fluxo-acoes">
        <span>Os indicadores consideram somente o recorte selecionado.</span>
        <AcaoAdmin
          onClick={() => {
            const f = { ...filtroInicial, bimestre: revisao ? "4" : "3" };
            setRascunho(f);
            setFiltros(f);
          }}
        >
          Limpar filtros
        </AcaoAdmin>
        <button className="admin-botao admin-botao--primario">
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}

// Relatórios calculam totais, médias e agrupamentos a partir das mesmas linhas exportadas.
export function RelatoriosAdmin({ tela }) {
  const { registros, tags, filtros, setFiltros, arquivo, setArquivo } =
      useFluxoAdmin(),
    nav = useNavigate();
  const [params] = useSearchParams();
  const linhas = filtrarRegistros(registros, filtros),
    [grupo, setGrupo] = useState("turma"),
    [formato, setFormato] = useState("xlsx"),
    [descricao, setDescricao] = useState(false);
  const lista = tela === "04-acompanhamentos";
  const modal = ["07-exportar-dados", "08-arquivo-pronto"].includes(tela);
  if (tela === "05-detalhe-do-acompanhamento")
    return (
      <DetalheRegistro
        registro={registros.find((r) => r.id === params.get("id"))}
      />
    );
  const grupos = [...new Set(linhas.map((r) => r[grupo]))].map((nome) => {
    const itens = linhas.filter((r) => r[grupo] === nome);
    return {
      id: nome,
      nome,
      total: itens.length,
      publicados: itens.filter((r) => r.status === "Publicado").length,
      media: numero(itens.reduce((s, r) => s + r.media, 0) / itens.length),
    };
  });
  function gerar() {
    const nome =
      "relatorios_" + (filtros.bimestre || "todos") + "-bimestre." + formato;
    setArquivo({
      blob: criarArquivo(linhasRelatorio(linhas, tags, descricao), formato),
      nome,
      total: linhas.length,
    });
    nav(rel + "08-arquivo-pronto");
  }
  return (
    <>
      <TituloAdmin
        caminho={["Relatórios", ...(lista ? ["Acompanhamentos"] : [])]}
        titulo={
          lista ? "Acompanhamentos do relatório" : "Relatórios gerenciais"
        }
        descricao="Acompanhe os registros escolares e consulte os indicadores por período."
        acoes={
          <>
            <Voltar to={lista ? rel + "01-visao-geral" : raiz}>
              {" "}
              {lista ? "Voltar aos indicadores" : "Início"}
            </Voltar>
            <AcaoAdmin tipo="primario" to={rel + "07-exportar-dados"}>
              Exportar dados
            </AcaoAdmin>
          </>
        }
      />
      {lista ? (
        <Painel titulo="Registros do período">
          <p>{linhas.length} acompanhamentos encontrados</p>
          <TabelaRegistros linhas={linhas} />
        </Painel>
      ) : (
        <>
          <FiltrosRegistros />
          <div className="fluxo-metricas">
            {[
              ["Acompanhamentos", linhas.length],
              [
                "Publicados",
                linhas.filter((r) => r.status === "Publicado").length,
              ],
              [
                "Média dos registros",
                linhas.length
                  ? numero(
                      linhas.reduce((n, r) => n + r.media, 0) / linhas.length,
                    )
                  : "—",
              ],
              [
                "Com a tag “Precisa de apoio”",
                linhas.filter((r) => r.tags.includes("TAG-5")).length,
              ],
            ].map(([t, v]) => (
              <Painel key={t}>
                <p>{t}</p>
                <strong className="fluxo-numero">{v}</strong>
              </Painel>
            ))}
          </div>
          <div className="fluxo-colunas">
            <Painel titulo={"Resumo por " + grupo}>
              <CampoAdmin
                nome="agrupar"
                rotulo="Agrupar por"
                tipo="select"
                valor={grupo}
                opcoes={["turma", "disciplina", "professor"]}
                onChange={(e) => setGrupo(e.target.value)}
              />
              <TabelaAdmin
                linhas={grupos}
                colunas={[
                  ["nome", grupo],
                  ["total", "Registros"],
                  ["publicados", "Publicados"],
                  ["media", "Média"],
                ]}
                acao={(g) => (
                  <AcaoAdmin
                    onClick={() => {
                      setFiltros((f) => ({ ...f, [grupo]: g.nome }));
                      nav(rel + "04-acompanhamentos");
                    }}
                  >
                    Ver registros
                  </AcaoAdmin>
                )}
              />
              <AcaoAdmin to={rel + "04-acompanhamentos"}>
                Ver todos os {linhas.length} acompanhamentos →
              </AcaoAdmin>
            </Painel>
            <Painel titulo="Situação dos registros">
              {estadosRegistro.map((s) => {
                const n = linhas.filter((r) => r.status === s).length;
                return (
                  <div className="fluxo-progresso" key={s}>
                    <p>
                      {s} <strong>{n}</strong>
                    </p>
                    <progress max={linhas.length || 1} value={n} />
                  </div>
                );
              })}
            </Painel>
          </div>
          <Aviso>
            Um acompanhamento é um registro de aluno, turma, disciplina,
            professor e bimestre. Como um registro pode ter várias tags, a soma
            por tag pode superar o total de acompanhamentos.
          </Aviso>
        </>
      )}
      {modal && (
        <DialogoAdmin
          categoria="EXPORTAÇÃO DO RELATÓRIO"
          titulo={
            tela === "08-arquivo-pronto" && arquivo
              ? "Arquivo pronto para baixar"
              : "Exportar dados"
          }
          aoFechar={() => nav(rel + "01-visao-geral")}
        >
          <p>O arquivo inclui todas as páginas do recorte selecionado.</p>
          <Aviso>
            {arquivo && tela === "08-arquivo-pronto"
              ? arquivo.total
              : linhas.length}{" "}
            acompanhamentos · Ano letivo {filtros.ano || "Todos"} · Bimestre{" "}
            {filtros.bimestre || "Todos"}
          </Aviso>
          {tela === "08-arquivo-pronto" && arquivo ? (
            <>
              <p>{arquivo.nome}</p>
              <div className="fluxo-acoes">
                <AcaoAdmin to={rel + "01-visao-geral"}>Concluir</AcaoAdmin>
                <AcaoAdmin
                  tipo="primario"
                  onClick={() => baixarArquivo(arquivo.blob, arquivo.nome)}
                >
                  Baixar arquivo
                </AcaoAdmin>
              </div>
            </>
          ) : (
            <>
              <CampoAdmin
                nome="formato"
                rotulo="Formato do arquivo"
                tipo="select"
                valor={formato}
                opcoes={[
                  ["xlsx", "Excel (.xlsx)"],
                  ["csv", "CSV (.csv)"],
                ]}
                onChange={(e) => setFormato(e.target.value)}
              />
              <label className="fluxo-check">
                <input
                  type="checkbox"
                  checked={descricao}
                  onChange={(e) => setDescricao(e.target.checked)}
                />{" "}
                Incluir a descrição do acompanhamento
              </label>
              <p>
                Dados de acesso e contatos dos responsáveis não fazem parte da
                exportação.
              </p>
              <div className="fluxo-acoes">
                <AcaoAdmin to={rel + "01-visao-geral"}>Cancelar</AcaoAdmin>
                <AcaoAdmin tipo="primario" onClick={gerar}>
                  Gerar arquivo
                </AcaoAdmin>
              </div>
            </>
          )}
        </DialogoAdmin>
      )}
    </>
  );
}

function ConteudoRegistro({ r }) {
  return (
    <Painel titulo="Registro do acompanhamento">
      <div className="fluxo-identidade">
        <span className="dash-avatar">
          {r.aluno
            .split(" ")
            .map((x) => x[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div>
          <h3>{r.aluno}</h3>
          <p>
            {r.turma} · {r.disciplina} · {r.bimestre}º bimestre de {r.ano}
          </p>
        </div>
        <strong className="fluxo-numero">{numero(r.media)}</strong>
      </div>
      <h3>Desenvolvimento do aluno</h3>
      <p>{r.desenvolvimento}</p>
      <h3>Estratégias de acompanhamento</h3>
      <p>{r.estrategias}</p>
      <Tags ids={r.tags} />
      <footer>
        Professor autor: {r.professor} · Registro {r.id} · Versão {r.versao}
      </footer>
    </Painel>
  );
}
function DetalheRegistro({ registro: r }) {
  if (!r)
    return (
      <Painel titulo="Registro não encontrado">
        <Voltar to={rel + "04-acompanhamentos"} />
      </Painel>
    );
  return (
    <>
      <TituloAdmin
        caminho={["Relatórios", r.aluno]}
        titulo={"Acompanhamento de " + r.aluno.split(" ")[0]}
        descricao="Consulte o conteúdo, a publicação e as classificações do registro."
        acoes={
          <Voltar to={rel + "04-acompanhamentos"}>Voltar aos registros</Voltar>
        }
      />
      <div className="fluxo-colunas">
        <ConteudoRegistro r={r} />
        <Painel titulo="Publicação e leitura">
          <Selo>{r.status}</Selo>
          <h3>Ciência dos responsáveis</h3>
          {r.responsaveis.map((nome) => (
            <p key={nome}>
              <strong>{nome}</strong>
              <br />
              {r.status === "Publicado"
                ? r.leitura
                : "Registro ainda não publicado"}
            </p>
          ))}
          <Aviso>
            As ações de revisão, alteração, devolução e publicação ficam na área
            de Revisão.
          </Aviso>
          <AcaoAdmin
            to={urlRegistro(aud + "10-historico-do-acompanhamento", r.id)}
          >
            Ver histórico do registro →
          </AcaoAdmin>
        </Painel>
      </div>
    </>
  );
}

// A auditoria é somente leitura: o detalhe mostra a fotografia do momento da ação.
export function AuditoriaAdmin({ tela }) {
  const { eventos: eventosFluxo, registros } = useFluxoAdmin(),
    [params] = useSearchParams();
  const eventos = eventosFluxo;
  // Compare instantes reais e filtre o dia no mesmo fuso exibido na interface.
  const diaBrasilia = (quando) =>
    new Date(new Date(quando).getTime() - 3 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  const [f, setF] = useState({
      inicio: "",
      fim: "",
      autor: "",
      modulo: "",
      acao: "",
      busca: "",
      ano: "",
      perfil: "",
    }),
    [aplicados, setAplicados] = useState(f);
  const ordenados = [...eventos].sort(
    (a, b) => Date.parse(b.quando) - Date.parse(a.quando),
  );
  const selecionado = eventos.find((e) => e.id === params.get("id"));
  const historico = tela === "10-historico-do-acompanhamento";
  if (tela !== "01-lista-de-eventos") {
    const id = historico ? params.get("id") : selecionado?.registro;
    const r = registros.find((r) => r.id === id);
    if (!historico && !selecionado)
      return (
        <Painel titulo="Evento não encontrado">
          <Voltar to={aud + "01-lista-de-eventos"} />
        </Painel>
      );
    return (
      <>
        <TituloAdmin
          caminho={[
            "Auditoria",
            historico ? "Histórico" : "Detalhes do evento",
          ]}
          titulo={
            historico
              ? "Histórico do acompanhamento"
              : selecionado.acao + " do registro"
          }
          descricao="Consulte a autoria, os valores anteriores e os valores novos."
          acoes={
            <Voltar to={aud + "01-lista-de-eventos"}>
              Voltar aos resultados
            </Voltar>
          }
        />
        {historico ? (
          <Painel titulo={r?.aluno || id}>
            <div className="fluxo-timeline">
              {ordenados
                .filter((e) => e.registro === id)
                .map((e) => (
                  <article key={e.id}>
                    <small>{horarioEvento(e.quando)} · Brasília</small>
                    <h3>{e.acao}</h3>
                    <p>
                      {e.autor} · {e.perfil}
                    </p>
                    <Selo>
                      {e.antes.status || "Sem registro"} →{" "}
                      {e.depois.status || e.acao}
                    </Selo>
                    <p>{e.motivo}</p>
                    <AcaoAdmin
                      to={urlRegistro(aud + "04-alteracao-de-conteudo", e.id)}
                    >
                      Ver detalhes da ação
                    </AcaoAdmin>
                  </article>
                ))}
            </div>
          </Painel>
        ) : (
          <>
            <Painel titulo={selecionado.aluno}>
              <Selo>{selecionado.id}</Selo>
            </Painel>
            <div className="fluxo-colunas">
              <Painel titulo="Alterações registradas">
                <div className="fluxo-duas">
                  {[
                    ["ANTES DA AÇÃO", selecionado.antes],
                    ["DEPOIS DA AÇÃO", selecionado.depois],
                  ].map(([t, obj]) => (
                    <Aviso key={t}>
                      <h3>{t}</h3>
                      {Object.entries(obj)
                        .filter(
                          ([k, v]) =>
                            JSON.stringify(v) !==
                            JSON.stringify(
                              (t === "ANTES DA AÇÃO"
                                ? selecionado.depois
                                : selecionado.antes)[k],
                            ),
                        )
                        .map(([k, v]) => (
                          <p key={k}>
                            <strong>{k}:</strong>{" "}
                            {Array.isArray(v) ? v.join(", ") : String(v)}
                          </p>
                        ))}
                    </Aviso>
                  ))}
                </div>
                <Aviso>{selecionado.motivo}</Aviso>
                {r && (
                  <AcaoAdmin
                    to={urlRegistro(aud + "10-historico-do-acompanhamento", id)}
                  >
                    Ver histórico do acompanhamento →
                  </AcaoAdmin>
                )}
              </Painel>
              <Painel titulo="Identificação do evento">
                <h3>{selecionado.autor}</h3>
                <p>{selecionado.perfil}</p>
                <h3>Realizado em</h3>
                <p>{horarioEvento(selecionado.quando)} · Brasília</p>
                <h3>Módulo</h3>
                <p>{selecionado.modulo}</p>
                <h3>Ação registrada</h3>
                <p>{selecionado.acao}</p>
                {r && (
                  <AcaoAdmin
                    to={urlRegistro(rel + "05-detalhe-do-acompanhamento", id)}
                  >
                    Consultar acompanhamento
                  </AcaoAdmin>
                )}
                <p>Esta comparação representa o momento da ação.</p>
              </Painel>
            </div>
          </>
        )}
      </>
    );
  }
  const linhas = ordenados.filter(
    (e) =>
      (!aplicados.inicio || diaBrasilia(e.quando) >= aplicados.inicio) &&
      (!aplicados.fim || diaBrasilia(e.quando) <= aplicados.fim) &&
      (!aplicados.ano || diaBrasilia(e.quando).startsWith(aplicados.ano)) &&
      ["autor", "modulo", "acao", "perfil"].every(
        (k) => !aplicados[k] || e[k] === aplicados[k],
      ) &&
      normalizarAdmin(e.aluno + " " + e.registro + " " + e.id).includes(
        normalizarAdmin(aplicados.busca),
      ),
  );
  return (
    <>
      <TituloAdmin
        caminho={["Auditoria"]}
        titulo="Auditoria do sistema"
        descricao="Consulte as ações realizadas e acompanhe a rastreabilidade das alterações."
      />
      <form
        className="admin-painel fluxo-painel"
        onSubmit={(e) => {
          e.preventDefault();
          setAplicados(f);
        }}
      >
        <h2>Filtros da auditoria</h2>
        <div className="fluxo-filtros">
          {Object.entries({
            inicio: "Data inicial",
            fim: "Data final",
            autor: "Quem realizou",
            modulo: "Módulo",
            acao: "Ação",
            busca: "Aluno ou registro",
            ano: "Ano letivo",
            perfil: "Perfil",
          }).map(([k, label]) => (
            <CampoAdmin
              key={k}
              nome={"aud-" + k}
              rotulo={label}
              tipo={
                ["inicio", "fim"].includes(k)
                  ? "date"
                  : k === "busca"
                    ? "text"
                    : "select"
              }
              valor={f[k]}
              opcoes={[
                ["", "Todos"],
                ...new Set(
                  eventos.map((e) =>
                    k === "ano" ? diaBrasilia(e.quando).slice(0, 4) : e[k],
                  ),
                ),
              ]}
              onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))}
            />
          ))}
        </div>
        <div className="fluxo-acoes">
          <span>Somente leitura · Horário de Brasília</span>
          <AcaoAdmin
            onClick={() => {
              const limpo = {
                inicio: "",
                fim: "",
                autor: "",
                modulo: "",
                acao: "",
                busca: "",
                ano: "",
                perfil: "",
              };
              setF(limpo);
              setAplicados(limpo);
            }}
          >
            Limpar filtros
          </AcaoAdmin>
          <button className="admin-botao admin-botao--primario">
            Aplicar filtros
          </button>
        </div>
      </form>
      <Painel titulo="Eventos registrados">
        <p>{linhas.length} eventos encontrados · Mais recentes primeiro</p>
        <TabelaAdmin
          linhas={linhas}
          plural="eventos"
          colunas={[
            ["quando", "Data e hora"],
            ["autor", "Quem realizou"],
            ["modulo", "Módulo / ação"],
            ["aluno", "Registro relacionado"],
          ]}
          renderizar={(e, k) =>
            k === "quando" ? (
              horarioEvento(e.quando)
            ) : k === "modulo" ? (
              <>
                {e.modulo}
                <br />
                <Selo>{e.acao}</Selo>
              </>
            ) : (
              e[k]
            )
          }
          acao={(e) => (
            <AcaoAdmin to={urlRegistro(aud + "04-alteracao-de-conteudo", e.id)}>
              Ver evento
            </AcaoAdmin>
          )}
        />
      </Painel>
      <Aviso>
        Histórico salvo no servidor. A auditoria permite consultar; os dados são
        mantidos nas áreas de origem.
      </Aviso>
    </>
  );
}

// Revisão mantém rascunhos separados, confirma decisões e preserva a versão do professor.
export function RevisaoAdmin({ tela }) {
  const { registros, tags, eventos, mudarRegistro } = useFluxoAdmin(),
    [params] = useSearchParams(),
    nav = useNavigate();
  const r = registros.find((r) => r.id === params.get("id"));
  const [form, setForm] = useState(() =>
      r
        ? {
            desenvolvimento: r.desenvolvimento,
            estrategias: r.estrategias,
            media: String(r.media),
            tags: [...r.tags],
          }
        : {},
    ),
    [motivo, setMotivo] = useState(""),
    [erro, setErro] = useState(""),
    [confirmar, setConfirmar] = useState(false);
  if (tela === "todas_revisoes") return <ListaRevisoes />;
  if (!r)
    return (
      <Painel titulo="Registro não encontrado">
        <Voltar to={raiz + "/todas_revisoes"} />
      </Painel>
    );
  const edicao = tela === "editar_acompanhamento",
    devolver = tela === "justificar_devolucao",
    publicar = tela === "confirmar_publicacao";
  const pode = r.status === "Em revisão";
  const titulo = edicao
    ? "Editar acompanhamento"
    : devolver
      ? "Devolver acompanhamento"
      : publicar
        ? "Publicar acompanhamento"
        : r.status === "Publicado"
          ? "Acompanhamento publicado"
          : r.status === "Devolvido para ajustes"
            ? "Acompanhamento devolvido"
            : "Revisar acompanhamento";
  function revisar(e) {
    e.preventDefault();
    const media = Number(form.media.replace(",", "."));
    if (
      edicao &&
      (!form.desenvolvimento.trim() ||
        !form.estrategias.trim() ||
        !form.media.trim() ||
        !Number.isFinite(media) ||
        media < 0 ||
        media > 10)
    ) {
      setErro("Preencha os textos e informe uma média de 0 a 10.");
      return;
    }
    if ((edicao || devolver) && !motivo.trim()) {
      setErro("Informe a justificativa.");
      return;
    }
    setErro("");
    setConfirmar(true);
  }
  async function salvar() {
    const acao = edicao ? "Alteração" : devolver ? "Devolução" : "Publicação";
    if (
      await mudarRegistro(
        r.id,
        acao,
        edicao ? { ...form, media: Number(form.media.replace(",", ".")) } : {},
        motivo,
        r.versao,
      )
    ) {
      setConfirmar(false);
      nav(
        urlRegistro(
          edicao
            ? raiz + "/revisar_acompanhamento"
            : rev +
                (devolver
                  ? "acompanhamento_devolvido"
                  : "acompanhamento_publicado"),
          r.id,
        ),
      );
    } else {
      setConfirmar(false);
      setErro("A situação atual não permite esta ação.");
    }
  }
  return (
    <>
      <TituloAdmin
        caminho={["Revisão", r.aluno]}
        titulo={titulo}
        descricao="Confira o conteúdo e a decisão antes de disponibilizar o registro à família."
        acoes={<Selo>{r.status}</Selo>}
      />
      <div className="fluxo-colunas">
        <div>
          {edicao && pode ? (
            <form className="admin-painel fluxo-painel" onSubmit={revisar}>
              <h2>Conteúdo do acompanhamento</h2>
              <div className="fluxo-identidade">
                <h3>{r.aluno}</h3>
                <p>
                  {r.turma} · {r.disciplina} · {r.bimestre}º bimestre
                </p>
              </div>
              {[
                ["desenvolvimento", "Desenvolvimento do aluno"],
                ["estrategias", "Estratégias de acompanhamento"],
                ["media", "Média do bimestre"],
              ].map(([k, label]) => (
                <CampoAdmin
                  key={k}
                  nome={"revisao-" + k}
                  rotulo={label}
                  tipo={k === "media" ? "text" : "textarea"}
                  obrigatorio
                  valor={form[k]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [k]: e.target.value }))
                  }
                />
              ))}
              <fieldset>
                <legend>Tags de acompanhamento</legend>
                {tags
                  .filter(
                    (t) => t.status === "Ativa" || form.tags.includes(t.id),
                  )
                  .map((t) => (
                    <label className="fluxo-check" key={t.id}>
                      <input
                        type="checkbox"
                        checked={form.tags.includes(t.id)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            tags: e.target.checked
                              ? [...f.tags, t.id]
                              : f.tags.filter((id) => id !== t.id),
                          }))
                        }
                      />
                      {t.nome}
                    </label>
                  ))}
              </fieldset>
              <CampoAdmin
                nome="motivo-edicao"
                rotulo="Motivo da alteração"
                obrigatorio
                valor={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
              {erro && <p role="alert">{erro}</p>}
              <div className="fluxo-acoes">
                <Voltar
                  to={urlRegistro(raiz + "/revisar_acompanhamento", r.id)}
                >
                  Cancelar
                </Voltar>
                <button className="admin-botao admin-botao--primario">
                  Conferir alterações
                </button>
              </div>
            </form>
          ) : (
            <ConteudoRegistro r={r} />
          )}
          {devolver && pode && (
            <form className="admin-painel fluxo-painel" onSubmit={revisar}>
              <h2>Justificativa da devolução</h2>
              <CampoAdmin
                nome="justificativa"
                rotulo="O que precisa ser ajustado?"
                tipo="textarea"
                obrigatorio
                valor={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
              {erro && <p role="alert">{erro}</p>}
              <div className="fluxo-acoes">
                <Voltar
                  to={urlRegistro(raiz + "/revisar_acompanhamento", r.id)}
                >
                  Cancelar
                </Voltar>
                <button className="admin-botao admin-botao--primario">
                  Conferir devolução
                </button>
              </div>
            </form>
          )}
          {publicar && pode && (
            <Painel titulo="Antes de publicar">
              <p>
                Confira o aluno, a disciplina, o bimestre e o conteúdo do
                acompanhamento.
              </p>
              <Aviso>O registro ainda não foi publicado.</Aviso>
              <AcaoAdmin tipo="primario" onClick={() => setConfirmar(true)}>
                Conferir publicação
              </AcaoAdmin>
            </Painel>
          )}
          {!edicao && !devolver && !publicar && pode && (
            <AcaoAdmin to={urlRegistro(rev + "editar_acompanhamento", r.id)}>
              Editar registro
            </AcaoAdmin>
          )}
          <Painel titulo="Histórico do registro">
            <div className="fluxo-timeline">
              {eventos
                .filter((e) => e.registro === r.id)
                .map((e) => (
                  <article key={e.id}>
                    <h3>{e.acao}</h3>
                    <p>
                      {e.autor} · {horarioEvento(e.quando)}
                    </p>
                    <p>{e.motivo}</p>
                  </article>
                ))}
            </div>
            <Voltar to={raiz + "/todas_revisoes"}>
              Voltar à fila de revisão
            </Voltar>
          </Painel>
        </div>
        <div>
          <Painel titulo={edicao ? "Sobre esta edição" : "Decisão da revisão"}>
            <h3>Professor autor</h3>
            <p>{r.professor}</p>
            {pode ? (
              <>
                <Aviso>
                  A família ainda não tem acesso. Salvar uma edição não publica
                  o relatório.
                </Aviso>
                {!edicao && !devolver && !publicar && (
                  <div className="fluxo-pilha">
                    <AcaoAdmin
                      tipo="primario"
                      to={urlRegistro(rev + "confirmar_publicacao", r.id)}
                    >
                      Publicar para responsáveis
                    </AcaoAdmin>
                    <AcaoAdmin
                      to={urlRegistro(rev + "justificar_devolucao", r.id)}
                    >
                      Devolver para ajustes
                    </AcaoAdmin>
                  </div>
                )}
              </>
            ) : r.status === "Enviado para revisão" ? (
              <AcaoAdmin
                tipo="primario"
                onClick={() => mudarRegistro(r.id, "Revisão")}
              >
                Iniciar revisão
              </AcaoAdmin>
            ) : (
              <Aviso>
                {r.status === "Publicado"
                  ? "Disponível para a família. " + r.leitura
                  : "Aguardando a professora. " + (r.justificativa || "")}
              </Aviso>
            )}
            <h3>Histórico preservado</h3>
            <p>
              A versão anterior permanece na auditoria, com autoria, data e
              motivo.
            </p>
          </Painel>
          {edicao ? (
            <Painel titulo="Versão enviada pelo professor">
              <details open>
                <summary>Desenvolvimento do aluno</summary>
                <p>{r.original.desenvolvimento}</p>
              </details>
              <details>
                <summary>Estratégias de acompanhamento</summary>
                <p>{r.original.estrategias}</p>
              </details>
            </Painel>
          ) : (
            <Painel titulo="Responsáveis com acesso">
              {r.responsaveis.map((n) => (
                <p key={n}>
                  <strong>{n}</strong>
                  <br />
                  Responsável vinculada a {r.aluno.split(" ")[0]}
                </p>
              ))}
              <p>
                Publicar não significa que a responsável já leu o
                acompanhamento.
              </p>
              <AcaoAdmin to={raiz + "/bimestres/visao_geral"}>
                Consultar prazos do bimestre →
              </AcaoAdmin>
            </Painel>
          )}
        </div>
      </div>
      {confirmar && (
        <DialogoAdmin
          categoria="CONFIRMAR DECISÃO"
          titulo={
            edicao
              ? "Conferir alterações"
              : devolver
                ? "Confirmar devolução"
                : "Publicar para a responsável?"
          }
          aoFechar={() => setConfirmar(false)}
        >
          <h3>{r.aluno}</h3>
          <p>
            {r.turma} · {r.disciplina} · {r.bimestre}º bimestre
          </p>
          {edicao ? (
            <>
              <h3>Antes</h3>
              <p>{r.desenvolvimento}</p>
              <h3>Depois</h3>
              <p>{form.desenvolvimento}</p>
              <p>{form.estrategias}</p>
              <p>Média: {form.media}</p>
              <Tags ids={form.tags} />
            </>
          ) : devolver ? (
            <Aviso>{motivo}</Aviso>
          ) : (
            <Aviso>Quem terá acesso: {r.responsaveis.join(", ")}</Aviso>
          )}
          <p>
            A decisão e os valores anteriores e novos serão registrados no
            histórico.
          </p>
          <div className="fluxo-acoes">
            <AcaoAdmin onClick={() => setConfirmar(false)}>
              Voltar e conferir
            </AcaoAdmin>
            <AcaoAdmin tipo="primario" onClick={salvar}>
              {edicao
                ? "Salvar alterações"
                : devolver
                  ? "Confirmar devolução"
                  : "Confirmar publicação"}
            </AcaoAdmin>
          </div>
        </DialogoAdmin>
      )}
    </>
  );
}

// Resolve só as rotas documentadas. O layout superior continua sendo compartilhado.
export default function FluxosAdmin() {
  const { pathname, search } = useLocation();
  const partes = pathname.split("/").filter(Boolean),
    tipo = partes[1],
    tela = partes[2];
  if (tipo === "tags")
    return <TagsAdmin key={pathname + search} tela={tela || "lista"} />;
  if (tipo === "relatorios")
    return <RelatoriosAdmin tela={tela || "01-visao-geral"} />;
  if (tipo === "auditoria")
    return (
      <AuditoriaAdmin
        key={pathname + search}
        tela={tela || "01-lista-de-eventos"}
      />
    );
  return (
    <RevisaoAdmin
      key={pathname + search}
      tela={
        tipo === "todas_revisoes"
          ? "todas_revisoes"
          : tela || "revisar_acompanhamento"
      }
    />
  );
}
