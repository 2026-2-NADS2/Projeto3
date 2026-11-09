// Jornadas 16 e 17: rascunho, envio, correção e consulta compartilham registros e regras.
import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useFluxoAdmin } from "../../hooks/useFluxoAdmin.jsx";
import { useDadosEscolares } from "../../hooks/useDadosEscolares.jsx";
import { caminhoProfessor, urlJornada } from "../../data/jornadas.js";
import { useDadosJornada } from "../../hooks/useDadosJornada.js";
import { podeProfessor } from "../../data/jornadas.js";
import { dataPeriodo } from "../../data/bimestres.js";
import {
  Titulo,
  Painel,
  Aviso,
  Acao,
  Campo,
  Tabela,
  Selo,
  Registro,
  Identidade,
  Historico,
  Dialogo,
  ListaPaginada,
  Indisponivel,
  dataHora,
  imgJornada,
} from "./ElementosJornada.jsx";
import RetornosJornada from "./RetornosJornada.jsx";
const raiz = "/professor",
  lista = raiz + "/todos_acompanhamentos",
  novo = raiz + "/criacao/novo_acompanhamento";
const bimestres = [1, 2, 3, 4].map((n) => [String(n), n + "º bimestre"]);

function BotaoNovo({ alunoId }) {
  return (
    <Acao tipo="primario" to={novo + (alunoId ? "?aluno=" + alunoId : "")}>
      <img src={imgJornada("prof-imgGroup1.svg")} alt="" />
      Novo acompanhamento
    </Acao>
  );
}
function TabelaProfessor({ registros, resumida = false }) {
  return (
    <Tabela
      linhas={resumida ? registros.slice(0, 3) : registros}
      tamanho={20}
      plural="acompanhamentos"
      colunas={[
        ["aluno", "Aluno / disciplina"],
        ["turma", "Turma"],
        ["bimestre", "Bimestre"],
        ["status", "Status"],
      ]}
      renderizar={(r, k) =>
        k === "aluno" ? (
          <>
            <strong>{r.aluno}</strong>
            <small>
              {r.disciplina}
              {r.titulo && " · " + r.titulo}
            </small>
          </>
        ) : k === "status" ? (
          <Selo>{r.status}</Selo>
        ) : k === "bimestre" ? (
          r.bimestre + "º bimestre"
        ) : (
          r[k]
        )
      }
      acao={(r) => (
        <Acao to={caminhoProfessor(r)}>
          {r.status === "Rascunho"
            ? "Continuar"
            : r.status === "Devolvido para ajustes"
              ? "Corrigir"
              : "Acompanhar"}
        </Acao>
      )}
    />
  );
}
function Prazo({ bimestre, correcao = false }) {
  const { periodos } = useDadosEscolares(),
    { periodoAberto } = useFluxoAdmin();
  const p = periodos.find((p) => String(p.numero) === bimestre);
  return (
    <Painel
      titulo={correcao ? "Prazo de correção" : "Prazo de digitação"}
      acoes={<Selo>{periodoAberto(bimestre) ? "Aberto" : "Indisponível"}</Selo>}
    >
      <div className="j-resumo">
        <small>{bimestre}º bimestre</small>
        <strong>
          {p
            ? "Até " + dataPeriodo(p.encerramentoData)
            : "Período não disponível"}
        </strong>
      </div>
      <p>
        Salve e edite seus acompanhamentos dentro do período autorizado pela
        administração.
      </p>
    </Painel>
  );
}
function PainelOrientacao({ r }) {
  return (
    <Painel titulo="O que precisa ser ajustado">
      <Aviso tom="laranja" titulo="Justificativa da administração">
        {r.justificativa}
      </Aviso>
      <dl className="j-dados">
        <dt>Devolvido por</dt>
        <dd>Administração escolar</dd>
      </dl>
      <p>Use estas orientações para revisar o registro antes de reenviar.</p>
    </Painel>
  );
}
function ResumoProfessor({ tela }) {
  const { usuario, turmas: vinculosProfessora, anos } = useDadosJornada();
  const {
    registros,
    filtroProfessor: f,
    setFiltroProfessor: setF,
    periodoAberto,
  } = useFluxoAdmin();
  const linhas = registros.filter(
    (r) =>
      podeProfessor(r) && Object.entries(f).every(([k, v]) => !v || r[k] === v),
  );
  const ajustes = linhas.filter((r) => r.status === "Devolvido para ajustes");
  const todos = tela === "todos_acompanhamentos",
    todosAjustes = tela === "todos_ajustes";
  return (
    <>
      <Titulo
        titulo={"Olá, " + usuario.nome}
        descricao="Organize seus acompanhamentos e veja o que precisa de atenção."
        acoes={<BotaoNovo />}
      />
      <Painel className="j-contexto">
        <div className="j-tres">
          {[
            ["ano", "Ano letivo", [["", "Todos os anos"], ...anos]],
            [
              "bimestre",
              "Bimestre",
              [["", "Todos os bimestres"], ...bimestres],
            ],
            [
              "turma",
              "Turma",
              [["", "Todas as turmas"], ...vinculosProfessora],
            ],
          ].map(([k, label, opcoes]) => (
            <Campo
              key={k}
              nome={"prof-filtro-" + k}
              rotulo={label}
              tipo="select"
              valor={f[k]}
              opcoes={opcoes}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          ))}
        </div>
        <small>
          {periodoAberto(f.bimestre)
            ? "Digitação aberta"
            : "Digitação indisponível"}
        </small>
      </Painel>
      <div className="j-tres j-indicadores">
        {[
          [
            "Para enviar",
            "Rascunho",
            "prof-imgGroup9.svg",
            "Rascunhos no período",
          ],
          [
            "Devolvidos para ajustes",
            "Devolvido para ajustes",
            "prof-imgGroup10.svg",
            "Veja a orientação da coordenação",
          ],
          [
            "Publicados",
            "Publicado",
            "prof-imgGroup11.svg",
            "Disponíveis para as famílias",
          ],
        ].map(([titulo, status, img, ajuda]) => (
          <Painel key={status}>
            <span className="j-icone-metrica">
              <img src={imgJornada(img)} alt="" />
            </span>
            <div>
              <small>{titulo}</small>
              <strong className="j-numero">
                {linhas.filter((r) => r.status === status).length}
              </strong>
              <small>{ajuda}</small>
            </div>
          </Painel>
        ))}
      </div>
      <div className="j-colunas">
        <Painel
          titulo={todos ? "Todos os acompanhamentos" : "Meus acompanhamentos"}
          acoes={<small>{todos ? "20 por página" : "3 mais recentes"}</small>}
        >
          <TabelaProfessor
            key={JSON.stringify(f)}
            registros={linhas}
            resumida={!todos}
          />
          <footer>
            <Acao to={todos ? "/dashboard_prof" : lista}>
              {todos
                ? "← Voltar ao resumo"
                : "Ver todos os " + linhas.length + " acompanhamentos →"}
            </Acao>
          </footer>
        </Painel>
        <Painel
          titulo="Atenção aos ajustes"
          acoes={<small>{ajustes.length} devolvidos</small>}
        >
          <Aviso
            tom="laranja"
            titulo={ajustes.length + " registros devolvidos"}
          >
            A coordenação deixou orientações para você complementar os
            acompanhamentos.
          </Aviso>
          <ListaPaginada
            key={JSON.stringify(f)}
            itens={todosAjustes ? ajustes : ajustes.slice(0, 2)}
            plural="ajustes"
            renderizar={(r) => (
              <article className="j-linha" key={r.id}>
                <Acao to={caminhoProfessor(r)}>
                  <span>
                    <strong>{r.aluno}</strong>
                    <small>{r.justificativa}</small>
                  </span>
                </Acao>
              </article>
            )}
          />
          <footer>
            <Acao
              to={todosAjustes ? "/dashboard_prof" : raiz + "/todos_ajustes"}
            >
              {todosAjustes
                ? "← Voltar ao resumo"
                : "Ver todos os " + ajustes.length + " ajustes →"}
            </Acao>
          </footer>
        </Painel>
      </div>
    </>
  );
}
function ConsultasProfessor({ tela }) {
  const {
    alunos: alunosPermitidos,
    turmas: vinculosProfessora,
    anos,
    anoAtual,
    disciplinas,
    vinculos,
  } = useDadosJornada();
  const { registros } = useFluxoAdmin(),
    [params] = useSearchParams();
  const [f, setF] = useState({
      busca: "",
      turma: params.get("turma") || "",
      bimestre: "",
      ano: anoAtual,
      disciplina: "",
    }),
    [aplicados, setAplicados] = useState(f);
  const aluno = alunosPermitidos.find((a) => a.id === params.get("id"));
  if (tela === "aluno" && !aluno)
    return <Indisponivel voltar={raiz + "/alunos"} />;
  const filtrar = (e) => {
    e.preventDefault();
    setAplicados(f);
  };
  const campo = (k, label, opcoes, tipo = "select") => (
    <Campo
      nome={"consulta-" + k}
      rotulo={label}
      tipo={tipo}
      valor={f[k]}
      opcoes={opcoes}
      onChange={(e) => setF({ ...f, [k]: e.target.value })}
    />
  );
  const listaAlunos = alunosPermitidos.filter(
    (a) =>
      (!aplicados.turma || a.turma === aplicados.turma) &&
      (a.nome + " " + a.matricula)
        .toLocaleLowerCase("pt-BR")
        .includes(aplicados.busca.toLocaleLowerCase("pt-BR")),
  );
  const rAluno = registros.filter(
    (r) =>
      podeProfessor(r) &&
      r.alunoId === aluno?.id &&
      (!aplicados.bimestre || r.bimestre === aplicados.bimestre) &&
      r.ano === aplicados.ano,
  );
  return (
    <>
      <Titulo
        titulo={
          tela === "turmas"
            ? "Minhas turmas"
            : tela === "alunos"
              ? "Alunos"
              : "Acompanhamentos de " + aluno.nome.split(" ")[0]
        }
        descricao={
          tela === "turmas"
            ? "Consulte as turmas e disciplinas vinculadas a você no ano letivo."
            : "Consulte apenas os alunos das suas turmas e disciplinas."
        }
        voltar="/dashboard_prof"
      />
      {tela === "aluno" && (
        <Painel titulo="Identificação do aluno">
          <p>
            {aluno.nome} · Matrícula {aluno.matricula} · {aluno.turma} · Ensino
            Fundamental
          </p>
        </Painel>
      )}
      <form onSubmit={filtrar}>
        <Painel titulo={tela === "alunos" ? "Buscar alunos" : "Filtros"}>
          <div className={tela === "alunos" ? "j-duas" : "j-tres"}>
            {tela === "alunos"
              ? campo("busca", "Nome ou matrícula", [], "text")
              : campo("ano", "Ano letivo", anos)}
            {tela === "aluno"
              ? campo("bimestre", "Bimestre", [["", "Todos"], ...bimestres])
              : campo("turma", "Turma", [
                  ["", "Todas as minhas turmas"],
                  ...vinculosProfessora,
                ])}
            {tela !== "alunos" &&
              campo("disciplina", "Disciplina", [
                ["", "Todas as minhas disciplinas"],
                ...disciplinas,
              ])}
          </div>
          <div className="j-acoes">
            <Acao tipo="primario" type="submit">
              {tela === "alunos" ? "Buscar" : "Aplicar filtros"}
            </Acao>
            <Acao
              onClick={() => {
                const novo = {
                  busca: "",
                  turma: "",
                  bimestre: "",
                  ano: anoAtual,
                  disciplina: "",
                };
                setF(novo);
                setAplicados(novo);
              }}
            >
              Limpar filtros
            </Acao>
          </div>
        </Painel>
      </form>
      {tela === "turmas" ? (
        <>
          <div className="j-tres">
            {vinculosProfessora
              .filter((t) => !aplicados.turma || t === aplicados.turma)
              .map((turma) => (
                <Painel key={turma}>
                  <span className="estado-icone">
                    <img src={imgJornada("turmas-imgGroup8.svg")} alt="" />
                  </span>
                  <h2>{turma}</h2>
                  <p>Ano letivo {aplicados.ano}</p>
                  <p>
                    {[
                      ...new Set(
                        vinculos
                          .filter(
                            (v) => v.turma === turma && v.ano === aplicados.ano,
                          )
                          .map((v) => v.disciplina),
                      ),
                    ].join(" · ")}{" "}
                    · {alunosPermitidos.filter((a) => a.turma === turma).length}{" "}
                    alunos matriculados
                  </p>
                  <Acao
                    to={raiz + "/alunos?turma=" + encodeURIComponent(turma)}
                  >
                    Ver turma
                  </Acao>
                </Painel>
              ))}
          </div>
          <Aviso titulo="Seus vínculos">
            A lista apresenta somente turmas e disciplinas atribuídas a você
            pela administração.
          </Aviso>
        </>
      ) : (
        <Painel
          titulo={tela === "aluno" ? "Registros do aluno" : "Alunos vinculados"}
        >
          {tela === "aluno" ? (
            <>
              <TabelaProfessor registros={rAluno} />
              <BotaoNovo alunoId={aluno.id} />
            </>
          ) : (
            <Tabela
              key={JSON.stringify(aplicados)}
              linhas={listaAlunos}
              plural="alunos"
              colunas={[
                ["nome", "Aluno"],
                ["turma", "Turma"],
                ["disciplina", "Disciplina"],
              ]}
              renderizar={(r, k) =>
                k === "disciplina"
                  ? [
                      ...new Set(
                        vinculos
                          .filter((v) => v.turma === r.turma && v.ano === r.ano)
                          .map((v) => v.disciplina),
                      ),
                    ].join(" · ")
                  : r[k]
              }
              acao={(r) => (
                <Acao to={urlJornada(raiz + "/aluno", r.id)}>
                  Ver acompanhamentos
                </Acao>
              )}
            />
          )}
        </Painel>
      )}
    </>
  );
}
function FormularioProfessor({ tela, r }) {
  const {
    alunos: alunosPermitidos,
    usuario,
    anos,
    anoAtual,
    vinculos,
    turmas: vinculosProfessora,
  } = useDadosJornada();
  const { tags, salvarProfessor, periodoAberto } = useFluxoAdmin(),
    nav = useNavigate(),
    location = useLocation(),
    [params] = useSearchParams();
  const [form, setForm] = useState(
    () =>
      location.state?.rascunho || {
        id: r?.id,
        versao: r?.versao,
        alunoId: r?.alunoId || params.get("aluno") || "",
        ano: r?.ano || anoAtual,
        bimestre: r?.bimestre || "4",
        turma:
          r?.turma ||
          alunosPermitidos.find((a) => a.id === params.get("aluno"))?.turma ||
          vinculosProfessora[0] ||
          "",
        disciplina: r?.disciplina || "",
        desenvolvimento: r?.desenvolvimento || "",
        estrategias: r?.estrategias || "",
        media: r?.media == null ? "" : String(r.media).replace(".", ","),
        tags: r ? [...r.tags] : [],
      },
  );
  const [erro, setErro] = useState(""),
    [confirmando, setConfirmando] = useState(tela === "confirmar_envio");
  const correcao = r?.status === "Devolvido para ajustes",
    aberto = periodoAberto(form.bimestre, form.ano);
  const permitido =
    !r || ["Rascunho", "Devolvido para ajustes"].includes(r.status);
  const aluno = alunosPermitidos.find((a) => a.id === form.alunoId);
  const [salvando, setSalvando] = useState(false);
  async function salvar(enviar) {
    if (salvando) return;
    setSalvando(true);
    const resultado = await salvarProfessor(form, enviar);
    setSalvando(false);
    if (resultado.erro) {
      if (resultado.registro)
        setForm((atual) => ({
          ...atual,
          id: resultado.registro.id,
          versao: resultado.registro.versao,
        }));
      setErro(resultado.erro);
      setConfirmando(false);
      return;
    }
    const destino = enviar
      ? correcao
        ? raiz + "/correcao/reenviado_para_revisao"
        : raiz + "/criacao/enviado_para_revisao"
      : correcao
        ? raiz + "/correcao/corrigir_acompanhamento"
        : raiz + "/criacao/rascunho_salvo";
    nav(urlJornada(destino, resultado.registro.id), { state: { salvo: true } });
  }
  function conferir(e) {
    e.preventDefault();
    const media = Number(String(form.media).replace(",", "."));
    if (
      !aluno ||
      !form.disciplina ||
      !form.desenvolvimento.trim() ||
      !String(form.media).trim() ||
      !Number.isFinite(media) ||
      media < 0 ||
      media > 10 ||
      !form.tags.length
    ) {
      setErro(
        "Para enviar, selecione o aluno, preencha o desenvolvimento, uma média de 0 a 10 e ao menos uma tag.",
      );
      return;
    }
    setErro("");
    if (correcao) setConfirmando(true);
    else
      nav(urlJornada(raiz + "/criacao/confirmar_envio", r?.id), {
        state: { rascunho: form },
      });
  }
  const atualizar = (k) => (e) =>
    setForm({
      ...form,
      [k]: e.target.value,
      ...(["turma", "ano"].includes(k) ? { alunoId: "", disciplina: "" } : {}),
    });
  return (
    <>
      {location.state?.salvo && (
        <Aviso
          titulo={correcao ? "Correção salva." : "Rascunho salvo com sucesso."}
        >
          Salvar não envia o registro para revisão.
        </Aviso>
      )}
      <Titulo
        titulo={
          correcao
            ? "Corrigir acompanhamento"
            : r
              ? "Editar rascunho"
              : "Novo acompanhamento"
        }
        categoria={
          correcao
            ? "AJUSTES SOLICITADOS PELA ADMINISTRAÇÃO"
            : "ACOMPANHAMENTO BIMESTRAL"
        }
        caminho="Área da professora › Acompanhamentos"
        descricao="Registre o desenvolvimento do aluno e encaminhe para revisão da escola."
        acoes={<Selo>{r?.status || "Em preenchimento"}</Selo>}
      />
      {!permitido ? (
        <>
          <Aviso titulo="Registro somente para consulta">
            Este acompanhamento já foi enviado e não pode ser editado pela
            professora.
          </Aviso>
          <Acao to={caminhoProfessor(r)}>Consultar acompanhamento</Acao>
        </>
      ) : (
        <form onSubmit={conferir} noValidate>
          <div className="j-colunas">
            <div>
              <Painel
                titulo={
                  correcao ? "Aluno e período do registro" : "Aluno e período"
                }
              >
                {r ? (
                  <Identidade r={r} media={false} />
                ) : (
                  <>
                    <div className="j-quatro">
                      <Campo
                        nome="prof-ano"
                        rotulo="Ano letivo"
                        obrigatorio
                        tipo="select"
                        valor={form.ano}
                        opcoes={anos}
                        onChange={atualizar("ano")}
                      />
                      <Campo
                        nome="prof-bimestre"
                        rotulo="Bimestre"
                        obrigatorio
                        tipo="select"
                        valor={form.bimestre}
                        opcoes={bimestres}
                        onChange={atualizar("bimestre")}
                      />
                      <Campo
                        nome="prof-turma"
                        rotulo="Turma"
                        obrigatorio
                        tipo="select"
                        valor={form.turma}
                        opcoes={vinculosProfessora}
                        onChange={atualizar("turma")}
                      />
                      <Campo
                        nome="prof-disciplina"
                        rotulo="Disciplina"
                        obrigatorio
                        tipo="select"
                        valor={form.disciplina}
                        opcoes={[
                          ["", "Selecione"],
                          ...new Set(
                            vinculos
                              .filter(
                                (v) =>
                                  v.turma === form.turma && v.ano === form.ano,
                              )
                              .map((v) => v.disciplina),
                          ),
                        ]}
                        onChange={atualizar("disciplina")}
                      />
                    </div>
                    <Campo
                      nome="prof-aluno"
                      rotulo="Aluno"
                      obrigatorio
                      tipo="select"
                      valor={form.alunoId}
                      opcoes={[
                        ["", "Selecione o aluno"],
                        ...alunosPermitidos
                          .filter(
                            (a) => a.turma === form.turma && a.ano === form.ano,
                          )
                          .map((a) => [a.id, a.nome]),
                      ]}
                      onChange={atualizar("alunoId")}
                    />
                    <p>
                      São exibidos apenas os alunos, turmas e disciplinas
                      vinculados à professora.
                    </p>
                  </>
                )}
              </Painel>
              {!aberto && (
                <Aviso tom="laranja" titulo="Digitação indisponível">
                  O período selecionado não está aberto. Consulte a
                  administração sobre os prazos autorizados.
                </Aviso>
              )}
              <Painel titulo="Conteúdo do acompanhamento">
                <Campo
                  nome="prof-desenvolvimento"
                  rotulo="Desenvolvimento do aluno"
                  tipo="textarea"
                  obrigatorio
                  valor={form.desenvolvimento}
                  onChange={atualizar("desenvolvimento")}
                  disabled={!aberto}
                  maxLength={10000}
                  placeholder="Descreva o desenvolvimento do aluno, os avanços observados e os pontos que precisam de apoio."
                  ajuda="Use observações claras sobre o desenvolvimento ao longo do bimestre."
                />
                <Campo
                  nome="prof-estrategias"
                  rotulo="Estratégias de acompanhamento"
                  tipo="textarea"
                  opcional
                  valor={form.estrategias}
                  onChange={atualizar("estrategias")}
                  disabled={!aberto}
                  maxLength={10000}
                  placeholder="Descreva as estratégias de apoio e os próximos passos."
                />
                <div className="j-nota-tags">
                  <Campo
                    nome="prof-media"
                    rotulo="Média do bimestre"
                    obrigatorio
                    valor={form.media}
                    onChange={atualizar("media")}
                    disabled={!aberto}
                    inputMode="decimal"
                    ajuda="Escala de 0 a 10."
                  />
                  <div>
                    <strong>Tags de acompanhamento</strong>
                    <div className="j-tags">
                      {form.tags.map((id) => (
                        <button
                          type="button"
                          className="j-chip"
                          key={id}
                          disabled={!aberto}
                          aria-label={
                            "Remover tag " + tags.find((t) => t.id === id)?.nome
                          }
                          onClick={() =>
                            setForm({
                              ...form,
                              tags: form.tags.filter((t) => t !== id),
                            })
                          }
                        >
                          {tags.find((t) => t.id === id)?.nome} ×
                        </button>
                      ))}
                    </div>
                    <details className="j-selecionar-tags">
                      <summary>+ Selecionar tags</summary>
                      {tags
                        .filter(
                          (t) =>
                            t.status === "Ativa" || form.tags.includes(t.id),
                        )
                        .map((t) => (
                          <label key={t.id}>
                            <input
                              type="checkbox"
                              disabled={!aberto}
                              checked={form.tags.includes(t.id)}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  tags: e.target.checked
                                    ? [...form.tags, t.id]
                                    : form.tags.filter((id) => id !== t.id),
                                })
                              }
                            />
                            {t.nome}
                          </label>
                        ))}
                    </details>
                  </div>
                </div>
                {erro && <Aviso tom="erro">{erro}</Aviso>}
                <footer>
                  <small>
                    {r?.salvoEm
                      ? "Último salvamento: " + dataHora(r.salvoEm)
                      : "Você pode salvar e continuar depois."}
                  </small>
                  <div className="j-acoes">
                    <Acao to={lista}>Cancelar</Acao>
                    <Acao
                      disabled={!aberto || salvando}
                      onClick={() => salvar(false)}
                    >
                      {correcao ? "Salvar correção" : "Salvar rascunho"}
                    </Acao>
                    <Acao tipo="primario" type="submit" disabled={!aberto}>
                      {correcao
                        ? "Reenviar para revisão"
                        : "Enviar para revisão"}
                    </Acao>
                  </div>
                </footer>
              </Painel>
            </div>
            <aside>
              {correcao && <PainelOrientacao r={r} />}
              <Prazo bimestre={form.bimestre} correcao={correcao} />
              <Painel titulo="Como funciona o envio">
                <ol className="j-passos">
                  <li>Preencha o acompanhamento e selecione as tags.</li>
                  <li>Salve um rascunho ou envie para revisão.</li>
                  <li>
                    A administração revisa e pode devolver para ajustes ou
                    publicar para a família.
                  </li>
                </ol>
                <Aviso tom="azul" titulo="A família ainda não tem acesso">
                  Enviar para revisão não publica o acompanhamento.
                </Aviso>
              </Painel>
            </aside>
          </div>
        </form>
      )}
      {confirmando && permitido && (
        <Dialogo
          titulo={
            correcao
              ? "Reenviar este acompanhamento?"
              : "Enviar este acompanhamento?"
          }
          categoria="ENVIAR PARA REVISÃO"
          aoFechar={() => {
            setConfirmando(false);
            if (tela === "confirmar_envio")
              nav(r ? urlJornada(raiz + "/rascunho/editar", r.id) : novo, {
                state: { rascunho: form },
              });
          }}
        >
          <p>
            O registro será encaminhado para a administração conferir o conteúdo
            antes da publicação.
          </p>
          <div className="j-resumo">
            <strong>{aluno?.nome || "Selecione um aluno"}</strong>
            <p>
              {aluno?.turma} · {form.disciplina} · {form.bimestre}º bimestre de{" "}
              {form.ano}
            </p>
            <small>Autor: {usuario.nome}</small>
          </div>
          <Aviso tom="azul" titulo="Os responsáveis ainda não terão acesso">
            A publicação será feita pela administração após a revisão.
          </Aviso>
          <div className="j-acoes">
            <Acao
              onClick={() => {
                setConfirmando(false);
                if (tela === "confirmar_envio")
                  nav(r ? urlJornada(raiz + "/rascunho/editar", r.id) : novo, {
                    state: { rascunho: form },
                  });
              }}
            >
              Voltar e conferir
            </Acao>
            <Acao
              tipo="primario"
              disabled={salvando}
              onClick={() => salvar(true)}
            >
              Confirmar envio
            </Acao>
          </div>
        </Dialogo>
      )}
    </>
  );
}
export default function ProfessorJornada() {
  const { pathname } = useLocation(),
    [params] = useSearchParams(),
    { registros } = useFluxoAdmin();
  const tela = pathname.split("/").pop();
  if (
    ["dashboard_prof", "todos_acompanhamentos", "todos_ajustes"].includes(tela)
  )
    return <ResumoProfessor tela={tela} />;
  if (["turmas", "alunos", "aluno"].includes(tela))
    return <ConsultasProfessor tela={tela} />;
  if (["retornos", "retorno"].includes(tela))
    return <RetornosJornada detalhe={tela === "retorno"} />;
  if (tela === "prazo_encerrado")
    return (
      <>
        <Titulo
          titulo="Novo acompanhamento"
          descricao="Confira o período autorizado antes de iniciar um novo registro."
        />
        <Painel className="j-centralizado">
          <Selo>Digitação encerrada</Selo>
          <h2>O prazo deste bimestre terminou</h2>
          <p>
            Não é possível criar ou editar acompanhamentos para o período
            selecionado.
          </p>
          <p>Consulte a administração sobre os prazos autorizados.</p>
          <div className="j-acoes">
            <Acao to={lista}>Voltar aos acompanhamentos</Acao>
            <Acao tipo="primario" to={novo}>
              Consultar outro período
            </Acao>
          </div>
        </Painel>
      </>
    );
  const novoRegistro =
    tela === "novo_acompanhamento" ||
    (tela === "confirmar_envio" && !params.has("id"));
  const r = novoRegistro
    ? null
    : registros.find((r) => r.id === params.get("id"));
  if (!novoRegistro && !podeProfessor(r))
    return <Indisponivel voltar={lista} />;
  if (
    [
      "novo_acompanhamento",
      "confirmar_envio",
      "rascunho_salvo",
      "editar",
      "corrigir_acompanhamento",
    ].includes(tela)
  )
    return <FormularioProfessor tela={tela} r={r} />;
  if (tela === "historico")
    return (
      <>
        <Titulo
          titulo="Histórico do acompanhamento"
          descricao={"Autoria, alterações e etapas do registro " + r.id + "."}
          voltar={caminhoProfessor(r)}
        />
        <Historico id={r.id} comparar />
      </>
    );
  const devolvido = r.status === "Devolvido para ajustes",
    publicado = r.status === "Publicado";
  return (
    <>
      <Titulo
        titulo={
          publicado
            ? "Acompanhamento publicado"
            : devolvido
              ? "Acompanhamento devolvido"
              : r.status === "Rascunho"
                ? "Rascunho do acompanhamento"
                : tela === "reenviado_para_revisao"
                  ? "Acompanhamento reenviado"
                  : "Acompanhamento enviado"
        }
        descricao={
          devolvido
            ? "Consulte a justificativa e corrija o registro para uma nova revisão."
            : "Consulte o registro e acompanhe os próximos passos."
        }
        voltar={lista}
        acoes={<Selo>{r.status}</Selo>}
      />
      <div className="j-colunas">
        <div>
          <Registro r={r} />
          {devolvido && (
            <Painel titulo="Este acompanhamento precisa de ajustes">
              <p>
                Leia as orientações da administração. Suas alterações serão
                encaminhadas para uma nova revisão.
              </p>
              <Acao
                tipo="primario"
                to={urlJornada(
                  raiz + "/correcao/corrigir_acompanhamento",
                  r.id,
                )}
              >
                Corrigir acompanhamento
              </Acao>
            </Painel>
          )}
          <Historico id={r.id} />
          <Acao to={urlJornada(raiz + "/historico", r.id)}>
            Ver histórico e comparação
          </Acao>
        </div>
        <aside>
          {devolvido ? (
            <>
              <PainelOrientacao r={r} />
              <Prazo bimestre={r.bimestre} correcao />
            </>
          ) : (
            <Painel
              titulo={
                publicado
                  ? "Participação dos responsáveis"
                  : "Aguardando a administração"
              }
            >
              <p>
                {publicado
                  ? r.cienciaEm
                    ? r.responsaveis[0] +
                      " confirmou a leitura em " +
                      dataHora(r.cienciaEm) +
                      "."
                    : "Aguardando confirmação de leitura."
                  : "A administração pode revisar o conteúdo, devolver com orientações ou publicar para os responsáveis."}
              </p>
              {publicado && (
                <Acao to={urlJornada(raiz + "/retorno", r.id)}>
                  Ver retorno da família
                </Acao>
              )}
            </Painel>
          )}
          <Painel titulo="Acesso da família">
            <p>
              {publicado
                ? "Este acompanhamento foi publicado pela administração."
                : "Este registro ainda não foi publicado. A família terá acesso somente após a publicação pela administração."}
            </p>
          </Painel>
        </aside>
      </div>
    </>
  );
}
