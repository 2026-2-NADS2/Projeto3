import { Link } from "react-router-dom";
import Cabecalho from "../componentes/Cabecalho.jsx";
import Rodape from "../componentes/Rodape.jsx";
import Recursos from "../componentes/home/Recursos.jsx";
import Noticias from "../componentes/home/Noticias.jsx";
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import textoEducacao from "../assets/img/texto-educacao.png";
import "../css/home.css";

// Exemplo público do Figma, com dados ilustrativos para explicar o relatório.
function PreviaAcompanhamento() {
  return (
    <article className="previa-acompanhamento">
      <header className="previa-cabecalho">
        <small>Relatório de acompanhamento</small>
        <span className="previa-publicado">Publicado</span>
      </header>
      <h2>Acompanhamento de Pedro</h2>
      <p>8º A · Ano letivo 2026 · 3º bimestre</p>

      <div className="previa-grade">
        <section>
          <h3>Matemática</h3>
          <small>Prof. Ana Paula · 3º bimestre</small>
          <p>
            <strong>Como Pedro se desenvolveu</strong>
          </p>
          <p>
            Pedro avançou em Matemática e participa mais das atividades em
            grupo.
          </p>
          <ul className="previa-tags">
            <li>Participação</li>
            <li>Em evolução</li>
          </ul>
          <small>Ciências · Prof. João Lima</small>
        </section>
        <section>
          <h3>Informações</h3>
          <dl className="previa-indicadores">
            <div>
              <dt>Média</dt>
              <dd>8,7</dd>
            </div>
            <div>
              <dt>Frequência</dt>
              <dd>98%</dd>
            </div>
            <div>
              <dt>Relatórios</dt>
              <dd>2</dd>
            </div>
            <div>
              <dt>Situação</dt>
              <dd>Publicado</dd>
            </div>
          </dl>
        </section>
      </div>

      <small>
        Prévia ilustrativa · Disponível à família após revisão da escola
      </small>
    </article>
  );
}

export default function Home() {
  useTituloPagina("Home");

  return (
    <>
      <Cabecalho />
      <main className="home-acesso">
        <section className="hero" id="inicio">
          <div className="conteudo-hero">
            <small>Acompanhamento escolar compartilhado</small>
            <h1>
              Escola e família,
              <br />
              mais próximas.
            </h1>
            <p>
              Acompanhe o desenvolvimento dos alunos com relatórios bimestrais
              claros, revisados pela escola e acessíveis à família.
            </p>
            <div className="hero-acoes">
              <a className="hero-botao hero-botao-principal" href="#recursos">
                Conhecer a plataforma
              </a>
              <Link className="hero-botao" to="/login.html">
                Já tenho acesso
              </Link>
            </div>
            <ul className="publicos">
              <li>
                <img src="/img/acesso/publico-escolas.svg" alt="" /> Escolas
              </li>
              <li>
                <img src="/img/acesso/publico-professores.svg" alt="" />{" "}
                Professores
              </li>
              <li>
                <img src="/img/acesso/publico-familias.svg" alt="" /> Famílias
              </li>
            </ul>
          </div>
          <PreviaAcompanhamento />
        </section>

        <Recursos />

        <section className="acompanhamento">
          <div>
            <small>Como funciona</small>
            <h2>
              Da sala de aula à família,
              <br />
              com cuidado e transparência.
            </h2>
            <p>
              Cada pessoa encontra o que precisa, com informações organizadas
              por aluno, disciplina e bimestre.
            </p>
          </div>
          <ol>
            <li>O professor registra o acompanhamento.</li>
            <li>A escola revisa e publica o relatório.</li>
            <li>A família consulta, confirma a leitura e baixa o PDF.</li>
          </ol>
        </section>

        <Noticias />

        <section className="contato" id="contato">
          <div className="contato-aviao" aria-hidden="true">
            <img
              src="/img/acesso/tracado-aviao.png"
              alt=""
              className="contato-tracado"
            />
            <img src="/img/acesso/aviao.svg" alt="" />
          </div>
          <div>
            <h2>Quer conhecer melhor a Collision?</h2>
            <p>
              Nossa equipe está pronta para mostrar como podemos aproximar sua
              escola e sua família.
            </p>
            <Link to="/fale-conosco" className="contato-botao">
              Fale conosco →
            </Link>
          </div>
          <img src={textoEducacao} alt="Educação conecta pessoas" />
        </section>
      </main>
      <Rodape />
    </>
  );
}
