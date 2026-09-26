import { Link } from "react-router-dom";
import Cabecalho from "../componentes/Cabecalho.jsx";
import Rodape from "../componentes/Rodape.jsx";
import Recursos from "../componentes/home/Recursos.jsx";
import Noticias from "../componentes/home/Noticias.jsx";
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import imagemDashboard from "../assets/img/dashboard.png";
import imagemAluno from "../assets/img/aluno.png";

function Home() {
  useTituloPagina("Home");
  return (
    <>
      <Cabecalho />

      <main>
        <section className="hero" id="inicio">
          <div className="conteudo-hero">
            <h1>
              Escola e família
              <br />
              mais próximas.
            </h1>

            <p>
              Acompanhe notas, frequência, comunicados e o desenvolvimento dos alunos em um só
              lugar.
            </p>

            <div className="publicos">
              <span>Para escolas</span>
              <span>Para professores</span>
              <span>Para famílias</span>
            </div>
          </div>

          <div className="imagem-hero">
            <img src={imagemDashboard} alt="Painel de acompanhamento escolar" />
          </div>
        </section>
        <Recursos />
        <section className="acompanhamento">
          <div className="conteudo-acompanhamento">
            <h2>
              Acompanhe de perto
              <br />a vida escolar
            </h2>

            <p>
              A Collision facilita o acompanhamento da rotina escolar, reunindo as informações mais
              importantes em um só lugar, de forma clara e acessível.
            </p>

            <ul>
              <li>Notas e avaliações</li>
              <li>Frequência</li>
              <li>Comunicados</li>
              <li>Desenvolvimento</li>
            </ul>
          </div>

          <div className="imagem-acompanhamento">
            <img src={imagemAluno} alt="Painel de acompanhamento do aluno" />
          </div>
        </section>
        <Noticias />
        <section className="contato" id="contato">
          <h2>Quer conhecer melhor a Collision?</h2>

          <p>
            Nossa equipe está pronta para mostrar como podemos aproximar sua escola e sua família.
          </p>

          <Link to="/fale-conosco" className="contato-botao">Fale conosco →</Link>
        </section>
      </main>
      <Rodape />
    </>
  );
}

export default Home;
