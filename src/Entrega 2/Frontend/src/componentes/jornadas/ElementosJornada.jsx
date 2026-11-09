// Peças comuns às jornadas: os campos, botões e diálogos continuam vindo da biblioteca do projeto.
import { useState } from "react";
import { AcaoAdmin } from "../admin/ElementosAdmin.jsx";
import { useFluxoAdmin } from "../../hooks/useFluxoAdmin.jsx";
import { horarioEvento } from "../../data/fluxoDados.js";
export {
  AcaoAdmin as Acao,
  CampoAdmin as Campo,
  TabelaAdmin as Tabela,
  DialogoAdmin as Dialogo,
} from "../admin/ElementosAdmin.jsx";
export const num = (v) =>
  v == null
    ? "—"
    : Number(v).toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
export const dataHora = (v) => (v ? horarioEvento(v) : "—");
export const imgJornada = (nome) => "/img/jornadas/" + nome;
export function Titulo({
  titulo,
  descricao,
  categoria = "ÁREA DA PROFESSORA",
  voltar,
  acoes,
  caminho,
}) {
  return (
    <>
      {voltar && (
        <AcaoAdmin to={voltar} className="j-voltar">
          ← Voltar
        </AcaoAdmin>
      )}
      {caminho && <p className="admin-caminho">{caminho}</p>}
      <header className="admin-titulo">
        <div>
          <p className="admin-categoria">{categoria}</p>
          <h1>{titulo}</h1>
          {descricao && <p className="admin-descricao">{descricao}</p>}
        </div>
        {acoes && <div className="admin-titulo-acoes">{acoes}</div>}
      </header>
    </>
  );
}
export function Painel({ titulo, children, acoes, className = "" }) {
  return (
    <section className={"admin-painel j-painel " + className}>
      {titulo && (
        <div className="j-bloco-titulo">
          <h2>{titulo}</h2>
          {acoes}
        </div>
      )}
      {children}
    </section>
  );
}
export function Aviso({ titulo, children, tom = "verde" }) {
  return (
    <div
      className={"j-aviso j-aviso--" + tom}
      role={tom === "erro" ? "alert" : "status"}
    >
      {titulo && <strong>{titulo}</strong>}
      {children && <p>{children}</p>}
    </div>
  );
}
export function Selo({ children }) {
  return (
    <span
      className={
        "j-selo j-selo--" +
        (/Publicado|confirmada|registrada|Aberto/.test(children)
          ? "verde"
          : /Devolvido|aguardando leitura|encerrad/i.test(children)
            ? "laranja"
            : /Rascunho/.test(children)
              ? "cinza"
              : "azul")
      }
    >
      {children}
    </span>
  );
}
export function TagsRegistro({ ids = [] }) {
  const { tags } = useFluxoAdmin();
  return (
    <div className="j-tags">
      {ids.map((id) => (
        <Selo key={id}>{tags.find((t) => t.id === id)?.nome || id}</Selo>
      ))}
    </div>
  );
}
export function Identidade({ r, media = true }) {
  return (
    <div className="j-identidade">
      <span className="j-avatar">
        {r.aluno
          .split(" ")
          .slice(0, 2)
          .map((s) => s[0])
          .join("")}
      </span>
      <div>
        <strong>{r.aluno}</strong>
        <small>
          {r.turma} · {r.disciplina} · {r.bimestre}º bimestre de {r.ano}
        </small>
      </div>
      {media && (
        <div className="j-media">
          <b>{num(r.media)}</b>
          <small>
            Média
            <br />
            do bimestre
          </small>
        </div>
      )}
    </div>
  );
}
export function Registro({ r, familia = false, children }) {
  return (
    <Painel
      titulo={familia ? r.disciplina : "Registro do acompanhamento"}
      acoes={!familia && <small>Somente consulta</small>}
    >
      <Identidade r={r} />
      <h3>
        {familia
          ? "Como " + r.aluno.split(" ")[0] + " se desenvolveu"
          : "Desenvolvimento do aluno"}
      </h3>
      <p className="j-texto-preservado">
        {r.desenvolvimento || "Ainda não preenchido."}
      </p>
      <h3>
        {familia ? "O que vamos acompanhar" : "Estratégias de acompanhamento"}
      </h3>
      <p className="j-texto-preservado">{r.estrategias || "Não informadas."}</p>
      {familia && (
        <>
          <h3>Como a família pode ajudar</h3>
          <p>
            {r.ajudaFamilia ||
              "Converse com o aluno sobre as atividades e acompanhe as orientações da escola."}
          </p>
        </>
      )}
      <TagsRegistro ids={r.tags} />
      <footer>
        <small>
          Prof. {r.professor}
          {familia
            ? " · Revisado pela escola"
            : " · " + r.id + " · Versão " + r.versao}
        </small>
        {children}
      </footer>
    </Painel>
  );
}
export function Historico({ id, comparar = false }) {
  const { eventos } = useFluxoAdmin();
  const linhas = eventos
    .filter((e) => e.registro === id)
    .sort((a, b) => Date.parse(b.quando) - Date.parse(a.quando));
  const alteracao = linhas.find(
    (e) =>
      e.antes.desenvolvimento &&
      e.depois.desenvolvimento &&
      e.antes.desenvolvimento !== e.depois.desenvolvimento,
  );
  return (
    <>
      <Painel titulo="Histórico do acompanhamento">
        <ol className="j-historico">
          {linhas.map((e) => (
            <li key={e.id}>
              <strong>
                {e.acao}
                {e.depois.versao ? " · Versão " + e.depois.versao : ""}
              </strong>
              <small>
                {e.autor} · {e.perfil} · {dataHora(e.quando)}
              </small>
              {e.motivo && <p>{e.motivo}</p>}
            </li>
          ))}
        </ol>
        {!linhas.length && (
          <p>Nenhum evento registrado para este acompanhamento.</p>
        )}
      </Painel>
      {comparar && (
        <Painel titulo="Comparação entre versões">
          {alteracao ? (
            <div className="j-duas">
              <div>
                <h3>Antes</h3>
                <p>{alteracao.antes.desenvolvimento}</p>
              </div>
              <div>
                <h3>Depois</h3>
                <p>{alteracao.depois.desenvolvimento}</p>
              </div>
            </div>
          ) : (
            <p>
              A comparação aparecerá após uma alteração de conteúdo nesta
              sessão.
            </p>
          )}
        </Painel>
      )}
    </>
  );
}
export function ListaPaginada({
  itens,
  renderizar,
  plural = "registros",
  tamanho = 20,
}) {
  const [pagina, setPagina] = useState(1),
    total = Math.max(1, Math.ceil(itens.length / tamanho)),
    atual = Math.min(pagina, total);
  return (
    <>
      {itens.slice((atual - 1) * tamanho, atual * tamanho).map(renderizar)}
      {!itens.length && (
        <p className="j-vazio">
          Nenhum {plural} encontrado para os filtros selecionados.
        </p>
      )}
      <footer className="j-paginacao">
        <span>
          Mostrando {itens.length ? (atual - 1) * tamanho + 1 : 0}–
          {Math.min(atual * tamanho, itens.length)} de {itens.length} {plural}
        </span>
        <AcaoAdmin disabled={atual === 1} onClick={() => setPagina(atual - 1)}>
          Anterior
        </AcaoAdmin>
        <strong>
          Página {atual} de {total}
        </strong>
        <AcaoAdmin
          disabled={atual === total}
          onClick={() => setPagina(atual + 1)}
        >
          Próxima →
        </AcaoAdmin>
      </footer>
    </>
  );
}
export function Indisponivel({ voltar = "/mapa-navegacao" }) {
  return (
    <>
      <Titulo
        titulo="Registro indisponível"
        descricao="O registro não foi encontrado ou não está disponível para este perfil."
      />
      <AcaoAdmin to={voltar}>Voltar</AcaoAdmin>
    </>
  );
}
