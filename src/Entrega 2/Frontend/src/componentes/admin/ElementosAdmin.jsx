// Elementos visuais reutilizados por listas, formulários e detalhes administrativos.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// O mesmo botão pode navegar como link ou executar uma ação como botão.
export function AcaoAdmin({
  to,
  tipo = "secundario",
  children,
  className = "",
  ...props
}) {
  const classe = `admin-botao admin-botao--${tipo} ${className}`;
  return to ? (
    <Link to={to} className={classe} {...props}>
      {children}
    </Link>
  ) : (
    <button type="button" className={classe} {...props}>
      {children}
    </button>
  );
}

// O selo mantém o texto do estado, além da indicação por cor.
export function StatusAdmin({
  valor = "Ativo",
  feminino = false,
  verde = false,
}) {
  const inativo = valor === "Inativo" || valor === "Inativa";
  const texto = feminino ? (inativo ? "Inativa" : "Ativa") : valor;
  return (
    <span
      className={`admin-status ${inativo && !verde ? "admin-status--inativo" : ""}`}
    >
      {texto}
    </span>
  );
}

// Título e navegação seguem a hierarquia comum das telas 05 a 09.
export function TituloAdmin({
  titulo,
  descricao,
  caminho = [],
  acoes,
  visaoGeral = false,
}) {
  return (
    <>
      {caminho.length > 0 && (
        <nav className="admin-caminho" aria-label="Caminho de navegação">
          {["Administração", ...caminho].map((item, i) => (
            <span key={i}>
              {i > 0 && <span aria-hidden="true"> › </span>}
              {item}
            </span>
          ))}
        </nav>
      )}
      <div
        className={`admin-titulo ${visaoGeral ? "admin-titulo--visao" : ""}`}
      >
        <div>
          <p className="admin-categoria">GESTÃO ESCOLAR</p>
          <h1>{titulo}</h1>
          <p className="admin-descricao">{descricao}</p>
        </div>
        {acoes && <div className="admin-titulo-acoes">{acoes}</div>}
      </div>
    </>
  );
}

// As abas usam URLs reais para permitir voltar pelo navegador.
export function AbasAdmin({ itens, atual, linha = false }) {
  return (
    <nav
      className={`admin-abas ${linha ? "admin-abas--linha" : ""}`}
      aria-label="Seções"
    >
      {itens.map(([texto, to]) => (
        <Link
          key={to}
          to={to}
          aria-current={atual === texto ? "page" : undefined}
        >
          {texto}
        </Link>
      ))}
    </nav>
  );
}

// Centraliza rótulo, entrada, seleção, ajuda e erro em um único componente.
export function CampoAdmin({
  nome,
  rotulo,
  tipo = "text",
  valor = "",
  onChange,
  opcoes = [],
  obrigatorio = false,
  placeholder = "",
  erro,
  ajuda,
  opcional = false,
  className = "",
  busca = false,
  ...props
}) {
  const id = "admin-" + nome;
  const comum = {
    id,
    name: nome,
    value: valor,
    onChange,
    required: obrigatorio,
    "aria-invalid": Boolean(erro),
    "aria-describedby": erro ? id + "-erro" : ajuda ? id + "-ajuda" : undefined,
    ...props,
  };
  return (
    <div
      className={`admin-campo ${tipo === "textarea" ? "admin-campo--largo" : ""} ${className}`}
    >
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && <span className="admin-obrigatorio"> *</span>}
        {opcional && <small> Opcional</small>}
      </label>
      <div className={`admin-entrada ${busca ? "admin-entrada--busca" : ""}`}>
        {busca && (
          <span className="admin-busca-icone">
            <img src="/img/admin/busca.svg" alt="" />
          </span>
        )}
        {tipo === "select" ? (
          <>
            <select {...comum}>
              {opcoes.map((opcao) => {
                const [value, texto] = Array.isArray(opcao)
                  ? opcao
                  : [opcao, opcao];
                return (
                  <option key={value} value={value}>
                    {texto}
                  </option>
                );
              })}
            </select>
            <span className="admin-seta">
              <img src="/img/admin/seta-campo.svg" alt="" />
            </span>
          </>
        ) : tipo === "textarea" ? (
          <textarea {...comum} placeholder={placeholder} />
        ) : (
          <input {...comum} type={tipo} placeholder={placeholder} />
        )}
      </div>
      {ajuda && <small id={id + "-ajuda"}>{ajuda}</small>}
      {erro && (
        <small id={id + "-erro"} className="admin-erro" role="alert">
          {erro}
        </small>
      )}
    </div>
  );
}

// A tabela pagina os dados fornecidos; as células podem conter texto ou componentes.
export function TabelaAdmin({
  colunas,
  linhas,
  renderizar,
  acao,
  tamanho = 20,
  plural = "cadastros",
  classe = "",
}) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(linhas.length / tamanho));
  const atual = Math.min(pagina, totalPaginas);
  const inicio = (atual - 1) * tamanho;
  const visiveis = linhas.slice(inicio, inicio + tamanho);
  return (
    <>
      <div className="admin-tabela-rolagem">
        <table className={`admin-tabela ${classe}`}>
          <thead>
            <tr>
              {colunas.map(([chave, titulo]) => (
                <th key={chave} scope="col">
                  {titulo}
                </th>
              ))}
              {acao && <th scope="col">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((linha, i) => (
              <tr key={linha.id || i}>
                {colunas.map(([chave]) => (
                  <td key={chave}>
                    {renderizar
                      ? renderizar(linha, chave, inicio + i)
                      : linha[chave]}
                  </td>
                ))}
                {acao && <td>{acao(linha)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {linhas.length === 0 && (
          <p className="admin-vazio" role="status">
            Nenhum resultado encontrado. Ajuste ou limpe os filtros.
          </p>
        )}
      </div>
      <div className="admin-paginacao">
        <span>
          Mostrando {linhas.length ? inicio + 1 : 0}–
          {Math.min(inicio + tamanho, linhas.length)} de {linhas.length}{" "}
          {plural}
        </span>
        <div>
          <AcaoAdmin
            disabled={atual === 1}
            onClick={() => setPagina(atual - 1)}
          >
            Anterior
          </AcaoAdmin>
          <strong>
            Página {atual} de {totalPaginas}
          </strong>
          <AcaoAdmin
            disabled={atual === totalPaginas}
            onClick={() => setPagina(atual + 1)}
          >
            Próxima →
          </AcaoAdmin>
        </div>
      </div>
    </>
  );
}

// A coluna lateral explica regras de uso sem repetir os mesmos blocos de marcação.
export function InformacoesAdmin({ blocos }) {
  return (
    <aside className="admin-informacoes">
      {blocos.map((bloco, i) => (
        <section key={bloco.titulo}>
          {i === 0 ? <h2>{bloco.titulo}</h2> : <h3>{bloco.titulo}</h3>}
          {bloco.selo && <span className="admin-selo">{bloco.selo}</span>}
          {bloco.texto && <p>{bloco.texto}</p>}
          {bloco.conteudo}
        </section>
      ))}
    </aside>
  );
}

// O dialog nativo mantém o foco dentro da janela e permite fechá-la com Escape.
export function DialogoAdmin({ titulo, categoria, aoFechar, children }) {
  const ref = useRef(null);
  const fecharRef = useRef(aoFechar);
  fecharRef.current = aoFechar;
  useEffect(() => {
    const dialogo = ref.current;
    dialogo.showModal();
    return () => {
      if (dialogo.open) dialogo.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="admin-dialogo"
      aria-labelledby="admin-dialogo-titulo"
      onCancel={(evento) => {
        evento.preventDefault();
        fecharRef.current();
      }}
    >
      {categoria && <p className="admin-categoria">{categoria}</p>}
      <h2 id="admin-dialogo-titulo">{titulo}</h2>
      {children}
    </dialog>
  );
}

// Busca desconsidera acentos e caixa, mantendo os valores originais na tela.
export function normalizarAdmin(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
