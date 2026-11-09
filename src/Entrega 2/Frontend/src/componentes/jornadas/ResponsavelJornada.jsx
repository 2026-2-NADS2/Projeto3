// Seções 18 e 19: a família consulta apenas publicações dos filhos vinculados.
import { useState } from "react";
import { useDadosJornada } from "../../hooks/useDadosJornada.js";
import { useSessao } from "../../hooks/useSessao.jsx";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useFluxoAdmin } from "../../hooks/useFluxoAdmin.jsx";
import { podeFamilia, urlJornada } from "../../data/jornadas.js";

import { baixarArquivo } from "../../utilitarios/exportarRelatorio.js";
import {
  Titulo,
  Painel,
  Aviso,
  Acao,
  Campo,
  Tabela,
  Registro,
  Selo,
  ListaPaginada,
  Indisponivel,
  num,
  dataHora,
  imgJornada,
} from "./ElementosJornada.jsx";
const raiz = "/responsavel",
  relatorio = raiz + "/relatorio_publicado";
function TituloFamilia(props) {
  return <Titulo categoria="ÁREA DA FAMÍLIA" {...props} />;
}
function MeusFilhos() {
  const { alunos } = useDadosJornada();
  const { registros } = useFluxoAdmin();
  const { filtroFamilia, setFiltroFamilia } = useFluxoAdmin(),
    [busca, setBusca] = useState("");
  const encontrados = alunos.filter((a) =>
    a.nome
      .toLocaleLowerCase("pt-BR")
      .includes(busca.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <TituloFamilia
        titulo="Meus filhos"
        descricao="Acompanhe a vida escolar dos seus filhos em um só lugar."
        acoes={
          <span className="j-contagem">
            <img src={imgJornada("filhos-imgIconeIcone.png")} alt="" />
            {alunos.length} filhos vinculados
          </span>
        }
      />
      <div className="j-busca-filhos">
        <img src={imgJornada("filhos-imgIconeBusca.png")} alt="" />
        <input
          aria-label="Buscar filho"
          placeholder="Buscar filho"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      {encontrados.map((a) => (
        <article className="j-filho admin-painel" key={a.id}>
          <div className="j-filho-nome">
            <span className="j-avatar">
              {a.nome
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </span>
            <div>
              <h2>{a.nome}</h2>
              <small>{a.turma} · Ensino Fundamental</small>
            </div>
          </div>
          {[
            [
              "Relatórios publicados",
              registros.filter((r) => r.alunoId === a.id).length,
              "filhos-imgIconeIcone1.png",
            ],
          ].map(([label, valor, img]) => (
            <div className="j-filho-indicador" key={label}>
              <span>
                <img src={imgJornada(img)} alt="" />
              </span>
              <div>
                <small>{label}</small>
                <strong>{valor}</strong>
              </div>
            </div>
          ))}
          <Acao
            tipo="primario"
            to="/dashboard_responsavel"
            onClick={() =>
              setFiltroFamilia({
                ...filtroFamilia,
                alunoId: a.id,
                disciplina: "",
              })
            }
          >
            Ver acompanhamento
            <img
              src={imgJornada("filhos-imgIconeSetaDoAcompanhamento.png")}
              alt=""
            />
          </Acao>
        </article>
      ))}
      {!encontrados.length && (
        <Painel>
          <p>Nenhum filho encontrado.</p>
        </Painel>
      )}
      <p className="j-nota">
        <img src={imgJornada("filhos-imgIconeInformacao.png")} alt="" />
        Selecione um filho para ver comunicados e acompanhamentos.
      </p>
    </>
  );
}
function ContextoFamilia({ disciplinas = false }) {
  const { alunos, anos } = useDadosJornada();
  const {
    filtroFamilia: f,
    setFiltroFamilia: setF,
    registros,
  } = useFluxoAdmin();
  const materias = [
    ...new Set(
      registros
        .filter((r) => podeFamilia(r) && r.alunoId === f.alunoId)
        .map((r) => r.disciplina),
    ),
  ];
  return (
    <Painel className="j-contexto">
      <div className={disciplinas ? "j-quatro" : "j-tres"}>
        <Campo
          nome="familia-aluno"
          rotulo="Aluno"
          tipo="select"
          valor={f.alunoId}
          opcoes={alunos.map((a) => [a.id, a.nome + " · " + a.turma])}
          onChange={(e) =>
            setF({ ...f, alunoId: e.target.value, disciplina: "" })
          }
        />
        <Campo
          nome="familia-ano"
          rotulo="Ano letivo"
          tipo="select"
          valor={f.ano}
          opcoes={[["", "Todos os anos"], ...anos]}
          onChange={(e) => setF({ ...f, ano: e.target.value })}
        />
        <Campo
          nome="familia-bimestre"
          rotulo="Bimestre"
          tipo="select"
          valor={f.bimestre}
          opcoes={[1, 2, 3, 4].map((n) => [String(n), n + "º bimestre"])}
          onChange={(e) => setF({ ...f, bimestre: e.target.value })}
        />
        {disciplinas && (
          <Campo
            nome="familia-disciplina"
            rotulo="Disciplina"
            tipo="select"
            valor={f.disciplina}
            opcoes={[["", "Todas"], ...materias]}
            onChange={(e) => setF({ ...f, disciplina: e.target.value })}
          />
        )}
      </div>
      <small>Relatórios publicados pela escola</small>
    </Painel>
  );
}
function ResumoFamilia({ tela }) {
  const { alunos } = useDadosJornada();
  const { registros, filtroFamilia: f } = useFluxoAdmin();
  const aluno = alunos.find((a) => a.id === f.alunoId),
    todos = tela === "todos_relatorios",
    todasPendencias = tela === "todas_pendencias";
  if (!aluno)
    return <Indisponivel voltar="/dashboard_responsavel_meus_filhos" />;
  const linhas = registros.filter(
    (r) =>
      podeFamilia(r) && Object.entries(f).every(([k, v]) => !v || r[k] === v),
  );
  const pendentes = linhas.filter((r) => !r.cienciaEm),
    medias = linhas.filter((r) => r.media != null),
    media = medias.length
      ? medias.reduce((a, r) => a + r.media, 0) / medias.length
      : null;
  return (
    <>
      <TituloFamilia
        titulo={"Acompanhamento de " + aluno.nome.split(" ")[0]}
        descricao="Veja o desenvolvimento escolar e os relatórios publicados."
        acoes={
          <Acao tipo="primario" to="/dashboard_responsavel_meus_filhos">
            Ver outro filho
          </Acao>
        }
      />
      <ContextoFamilia disciplinas={todos} />
      <div className="j-tres j-indicadores">
        {[
          [
            "Média do bimestre",
            num(media),
            "familia-imgGroup7.svg",
            "Média dos relatórios selecionados",
          ],

          [
            "Relatórios publicados",
            linhas.length,
            "familia-imgGroup9.svg",
            "Relatórios do período selecionado",
          ],
        ].map(([titulo, valor, img, ajuda]) => (
          <Painel key={titulo}>
            <span className="j-icone-metrica">
              <img src={imgJornada(img)} alt="" />
            </span>
            <div>
              <small>{titulo}</small>
              <strong className="j-numero">{valor}</strong>
              <small>{ajuda}</small>
            </div>
          </Painel>
        ))}
      </div>
      <div className="j-colunas">
        <Painel
          titulo={todos ? "Todos os relatórios" : "Relatórios mais recentes"}
          acoes={<small>{todos ? "20 por página" : "3 mais recentes"}</small>}
        >
          {todos && (
            <Acao to="/dashboard_responsavel">← Voltar aos mais recentes</Acao>
          )}
          <ListaPaginada
            key={JSON.stringify(f)}
            itens={todos ? linhas : linhas.slice(0, 3)}
            plural="relatórios"
            renderizar={(r) => (
              <article className="j-relatorio-linha" key={r.id}>
                <span className="j-icone-metrica">
                  <img src={imgJornada("familia-imgGroup10.svg")} alt="" />
                </span>
                <div>
                  <strong>{r.titulo || r.disciplina}</strong>{" "}
                  <Selo>Publicado</Selo>
                  <small>
                    Prof. {r.professor} · {r.bimestre}º bimestre ·{" "}
                    {r.disciplina}
                  </small>
                  <small>
                    {r.cienciaEm ? "Leitura confirmada" : "Aguardando leitura"}
                  </small>
                </div>
                <Acao to={urlJornada(relatorio, r.id)}>Ver relatório</Acao>
              </article>
            )}
          />
          <footer>
            <Acao
              to={
                todos ? raiz + "/filtro_disciplina" : raiz + "/todos_relatorios"
              }
            >
              {todos
                ? "Filtrar por disciplina"
                : "Ver todos os " + linhas.length + " relatórios →"}
            </Acao>
          </footer>
        </Painel>
        <Painel
          titulo={todasPendencias ? "Todas as pendências" : "Sua participação"}
          acoes={<small>{pendentes.length} pendências</small>}
        >
          <p>
            Pendências de {aluno.nome.split(" ")[0]} · {f.bimestre}º bimestre de{" "}
            {f.ano}
          </p>
          {(todasPendencias ? pendentes : pendentes.slice(0, 2)).map((r) => (
            <div key={r.id} className="j-pendencia">
              <strong>{r.disciplina}</strong>
              <p>
                O relatório de {aluno.nome.split(" ")[0]} aguarda sua
                confirmação de leitura.
              </p>
              <Acao tipo="primario" to={urlJornada(relatorio, r.id)}>
                Ler acompanhamento
              </Acao>
            </div>
          ))}
          {!pendentes.length && <p>Nenhuma leitura pendente neste período.</p>}
          <footer>
            <Acao
              to={
                todasPendencias
                  ? "/dashboard_responsavel"
                  : raiz + "/todas_pendencias"
              }
            >
              {todasPendencias
                ? "← Voltar ao resumo"
                : "Ver todas as " + pendentes.length + " pendências →"}
            </Acao>
          </footer>
          <Acao to="/dashboard_responsavel_meus_filhos">Ver meus filhos →</Acao>
        </Painel>
      </div>
    </>
  );
}
function Comunicados({ detalhe }) {
  const { comunicados } = useFluxoAdmin();
  const [params] = useSearchParams();
  const c = comunicados.find((item) => item.id === params.get("id"));
  if (detalhe && !c) return <Indisponivel voltar={raiz + "/comunicados"} />;
  if (detalhe)
    return (
      <>
        <TituloFamilia
          titulo={c.titulo}
          descricao={"Publicado em " + c.publicado}
          voltar={raiz + "/comunicados"}
        />
        <Painel titulo="Comunicado da escola">
          <p className="j-texto-preservado">{c.texto}</p>
        </Painel>
      </>
    );
  return (
    <>
      <TituloFamilia
        titulo="Comunicados"
        descricao="Consulte os avisos publicados para as turmas dos alunos vinculados à sua conta."
      />
      <Painel titulo="Avisos da escola">
        <Tabela
          linhas={comunicados}
          plural="comunicados"
          colunas={[
            ["titulo", "Assunto"],
            ["publicado", "Publicado em"],
          ]}
          acao={(item) => (
            <Acao to={urlJornada(raiz + "/comunicado", item.id)}>
              Ler comunicado
            </Acao>
          )}
        />
      </Painel>
    </>
  );
}
function DocumentoPdf({ r, tela }) {
  const { requisitar } = useSessao();
  const { pdf, setPdf } = useFluxoAdmin(),
    nav = useNavigate(),
    [gerando, setGerando] = useState(false);
  const arquivo =
    pdf?.registroId === r.id && pdf.versao === r.versao ? pdf : null;
  async function gerar() {
    if (gerando) return;
    setGerando(true);
    try {
      const blob = await requisitar("/acompanhamentos/" + r.id + "/pdf", {
        arquivo: true,
      });
      setPdf({
        registroId: r.id,
        versao: r.versao,
        nome: "acompanhamento-" + r.id + ".pdf",
        blob,
      });
      nav(urlJornada(raiz + "/pdf_pronto", r.id));
    } catch {
      setPdf(null);
      nav(urlJornada(raiz + "/pdf_erro", r.id));
    } finally {
      setGerando(false);
    }
  }
  const voltar = urlJornada(relatorio, r.id);
  if (tela === "pdf_erro")
    return (
      <>
        <TituloFamilia
          titulo="Não foi possível gerar o PDF"
          descricao="O acompanhamento continua disponível para leitura na tela."
          voltar={voltar}
        />
        <Aviso tom="erro" titulo="Tente novamente">
          Houve uma falha ao preparar o documento. Aguarde alguns instantes e
          tente de novo.
        </Aviso>
        <div className="j-acoes">
          <Acao tipo="primario" onClick={gerar} disabled={gerando}>
            {gerando ? "Gerando..." : "Tentar novamente"}
          </Acao>
          <Acao to={voltar}>Voltar ao relatório</Acao>
        </div>
      </>
    );
  if (tela === "pdf_pronto")
    return (
      <>
        <TituloFamilia
          titulo={
            arquivo ? "PDF pronto para baixar" : "Preparar PDF para download"
          }
          descricao="O documento utiliza os dados do acompanhamento publicado."
          voltar={voltar}
        />
        {arquivo && <Aviso titulo="Documento disponível">{arquivo.nome}</Aviso>}
        <Painel titulo="Conferência do arquivo">
          <dl className="j-dados">
            <dt>Aluno</dt>
            <dd>
              {r.aluno} · {r.turma}
            </dd>
            <dt>Disciplina</dt>
            <dd>{r.disciplina}</dd>
            <dt>Período</dt>
            <dd>
              {r.bimestre}º bimestre de {r.ano}
            </dd>
          </dl>
          <div className="j-acoes">
            {arquivo ? (
              <Acao
                tipo="primario"
                onClick={() => baixarArquivo(arquivo.blob, arquivo.nome)}
              >
                Baixar PDF
              </Acao>
            ) : (
              <Acao tipo="primario" disabled={gerando} onClick={gerar}>
                Gerar PDF
              </Acao>
            )}
            <Acao to={voltar}>Voltar ao relatório</Acao>
          </div>
        </Painel>
      </>
    );
  return (
    <>
      <TituloFamilia
        titulo="Relatório em PDF"
        descricao="Confira o documento antes de gerar a versão para download."
        voltar={voltar}
      />
      <Painel titulo="Documento do aluno">
        <p>Relatório de acompanhamento escolar · Collision</p>
        <dl className="j-dados">
          <dt>Aluno</dt>
          <dd>
            {r.aluno} · {r.turma}
          </dd>
          <dt>Período</dt>
          <dd>
            {r.bimestre}º bimestre de {r.ano}
          </dd>
          <dt>Disciplina</dt>
          <dd>{r.disciplina}</dd>
          <dt>Situação</dt>
          <dd>Publicado pela administração</dd>
        </dl>
      </Painel>
      <Registro r={r} familia />
      <Painel titulo="Autoria e publicação">
        <dl className="j-dados">
          <dt>Professor autor</dt>
          <dd>{r.professor}</dd>
          <dt>Revisão e publicação</dt>
          <dd>{dataHora(r.publicadoEm)}</dd>
        </dl>
      </Painel>
      <Aviso titulo="Dados protegidos">
        O documento contém informações escolares do aluno. Compartilhe apenas
        com pessoas autorizadas.
      </Aviso>
      <div className="j-acoes">
        <Acao tipo="primario" onClick={gerar} disabled={gerando}>
          {gerando ? "Gerando..." : "Gerar PDF"}
        </Acao>
        <Acao to={voltar}>Voltar ao relatório</Acao>
      </div>
    </>
  );
}
function Observacao({ r, enviada }) {
  const { observacoes, enviarObservacao } = useFluxoAdmin(),
    nav = useNavigate(),
    [texto, setTexto] = useState(""),
    [erro, setErro] = useState("");
  const observacao = observacoes.filter((o) => o.registroId === r.id).at(0);
  const voltar = urlJornada(relatorio, r.id);
  if (enviada && observacao)
    return (
      <>
        <TituloFamilia
          titulo="Observação enviada"
          descricao={
            "Sua mensagem foi vinculada ao acompanhamento de " +
            r.aluno.split(" ")[0] +
            "."
          }
          voltar={voltar}
        />
        <Aviso titulo="A escola pode consultar seu retorno">
          Enviado por {observacao.autor} em {dataHora(observacao.quando)}.
        </Aviso>
        <Painel titulo="Sua observação">
          <p className="j-texto-preservado">{observacao.texto}</p>
          <Acao tipo="primario" to={voltar}>
            Voltar ao acompanhamento
          </Acao>
        </Painel>
      </>
    );
  return (
    <>
      <TituloFamilia
        titulo="Enviar observação sobre o acompanhamento"
        descricao={`${r.aluno} · ${r.disciplina} · ${r.bimestre}º bimestre de ${r.ano}`}
        voltar={voltar}
      />
      {!r.cienciaEm ? (
        <>
          <Aviso tom="laranja" titulo="Confirme a leitura">
            Leia o relatório e registre sua ciência antes de enviar uma
            observação.
          </Aviso>
          <Acao tipo="primario" to={voltar}>
            Ler acompanhamento
          </Acao>
        </>
      ) : (
        <>
          <Aviso titulo="Leitura já confirmada">
            Sua confirmação permanece registrada. A observação complementa o
            acompanhamento.
          </Aviso>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const resultado = await enviarObservacao(r.id, texto);
              if (resultado.erro) setErro(resultado.erro);
              else nav(urlJornada(raiz + "/observacao_enviada", r.id));
            }}
          >
            <Painel titulo="Observação para a escola">
              <Campo
                nome="observacao-familia"
                rotulo="Sua observação"
                tipo="textarea"
                valor={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={2000}
                ajuda={texto.length + "/2000 caracteres"}
              />
              <Aviso>
                A professora responsável e a administração poderão consultar
                esta mensagem.
              </Aviso>
              {erro && <Aviso tom="erro">{erro}</Aviso>}
              <div className="j-acoes">
                <Acao tipo="primario" type="submit">
                  Enviar observação
                </Acao>
                <Acao to={voltar}>Cancelar</Acao>
              </div>
            </Painel>
          </form>
        </>
      )}
    </>
  );
}
export default function ResponsavelJornada() {
  const { alunos, usuario } = useDadosJornada();
  const { pathname } = useLocation(),
    [params] = useSearchParams(),
    nav = useNavigate();
  const {
      registros,
      registrarCiencia,
      filtroFamilia: f,
      setFiltroFamilia: setF,
    } = useFluxoAdmin(),
    tela = pathname.split("/").pop();
  if (tela === "dashboard_responsavel_meus_filhos") return <MeusFilhos />;
  if (
    ["dashboard_responsavel", "todos_relatorios", "todas_pendencias"].includes(
      tela,
    )
  )
    return <ResumoFamilia tela={tela} />;
  if (["comunicados", "comunicado"].includes(tela))
    return <Comunicados detalhe={tela === "comunicado"} />;
  if (tela === "filtro_disciplina") {
    const aluno = alunos.find((a) => a.id === f.alunoId);
    const disciplinas = [
      ...new Set(
        registros
          .filter(
            (r) =>
              podeFamilia(r) &&
              r.alunoId === f.alunoId &&
              r.ano === f.ano &&
              r.bimestre === f.bimestre,
          )
          .map((r) => r.disciplina),
      ),
    ];
    return (
      <>
        <TituloFamilia
          titulo="Filtrar relatórios por disciplina"
          descricao={`${aluno?.nome} · Ano letivo ${f.ano} · ${f.bimestre}º bimestre`}
          voltar={raiz + "/todos_relatorios"}
        />
        <Painel titulo="Escolha uma disciplina">
          <div className="j-pilha">
            {["", ...disciplinas].map((disciplina) => (
              <Acao
                key={disciplina}
                to={raiz + "/todos_relatorios"}
                onClick={() => setF({ ...f, disciplina })}
              >
                {disciplina || "Todas as disciplinas"}
              </Acao>
            ))}
          </div>
        </Painel>
        <Aviso titulo="Aluno selecionado">
          O filtro mantém {aluno?.nome} como aluno em acompanhamento.
        </Aviso>
      </>
    );
  }
  const r = registros.find((r) => r.id === params.get("id"));
  if (!podeFamilia(r))
    return <Indisponivel voltar="/dashboard_responsavel_meus_filhos" />;
  if (tela.startsWith("pdf")) return <DocumentoPdf r={r} tela={tela} />;
  if (tela.startsWith("observacao"))
    return <Observacao r={r} enviada={tela === "observacao_enviada"} />;
  return (
    <>
      <TituloFamilia
        titulo="Relatório de acompanhamento"
        descricao={
          "Um registro do desenvolvimento de " +
          r.aluno.split(" ")[0] +
          " neste bimestre."
        }
        caminho={`Relatórios / ${r.aluno} / ${r.disciplina}`}
        acoes={
          <Acao to={urlJornada(raiz + "/pdf", r.id)}>
            <img src={imgJornada("familia-imgGroup4.svg")} alt="" />
            Baixar PDF
          </Acao>
        }
      />
      <div className="j-colunas">
        <Registro r={r} familia>
          {r.cienciaEm ? (
            <Selo>Leitura registrada</Selo>
          ) : (
            <Acao
              tipo="primario"
              onClick={async () => {
                if (await registrarCiencia(r.id))
                  nav(urlJornada(raiz + "/ciencia_registrada", r.id));
              }}
            >
              Confirmar que li
            </Acao>
          )}
        </Registro>
        <Painel titulo="Informações do relatório">
          <Selo>Publicado</Selo>
          <dl className="j-dados j-dados--horizontal">
            <dt>Publicação</dt>
            <dd>{dataHora(r.publicadoEm)}</dd>
            <dt>Período</dt>
            <dd>{r.bimestre}º bimestre</dd>
            <dt>Responsável</dt>
            <dd>{usuario.nome}</dd>
            <dt>Sua ciência</dt>
            <dd>
              <Selo>
                {r.cienciaEm ? "Ciência registrada" : "Aguardando leitura"}
              </Selo>
            </dd>
          </dl>
          <Aviso
            titulo={
              r.cienciaEm
                ? "Leitura confirmada"
                : "Acompanhamento compartilhado"
            }
          >
            {r.cienciaEm
              ? "A escola recebeu sua confirmação de leitura em " +
                dataHora(r.cienciaEm) +
                "."
              : "Este relatório foi revisado e publicado pela escola."}
          </Aviso>
          {r.cienciaEm && (
            <Acao to={urlJornada(raiz + "/observacao", r.id)}>
              Enviar observação
            </Acao>
          )}
        </Painel>
      </div>
    </>
  );
}
