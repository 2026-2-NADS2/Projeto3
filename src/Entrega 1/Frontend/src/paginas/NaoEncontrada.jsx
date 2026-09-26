import { Link } from "react-router-dom";
import logo from "../assets/img/collision.png";
import ilustracaoErro from "../assets/img/erro404.svg";
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import "../css/erro404.css";

function NaoEncontrada({ emDashboard = false, onVoltar }) {
  useTituloPagina(emDashboard ? "Dashboard" : "Página não encontrada");

  const tituloId = emDashboard ? "titulo-erro-dashboard" : "titulo-erro";
  const cartao = (
    <section className="cartao-erro" aria-labelledby={tituloId}>
      <img src={logo} alt="Collision" className="logo-erro" />
      <img
        src={ilustracaoErro}
        alt="Ilustração de uma página não encontrada"
        className="ilustracao-erro"
      />
      <h1 id={tituloId}>404</h1>
      <h2>Página não encontrada</h2>
      <p className="descricao-erro">
        Não encontramos a página que você procura.
        <br />
        Ela pode ter sido movida ou o endereço pode estar incorreto.
      </p>
      {emDashboard ? (
        <button type="button" className="botao-inicio-erro" onClick={onVoltar}>
          ← Voltar ao início
        </button>
      ) : (
        <Link to="/" className="botao-inicio-erro">
          ← Voltar ao início
        </Link>
      )}
    </section>
  );

  const conteudo = (
    <div
      className={`pagina-erro${emDashboard ? " pagina-erro--dashboard" : ""}`}
    >
      <div className="erro-circulo erro-circulo-superior" aria-hidden="true" />
      <div className="erro-circulo erro-circulo-inferior" aria-hidden="true" />
      {cartao}
    </div>
  );

  if (emDashboard) return conteudo;

  return (
    <>
      <header className="cabecalho-erro">
        <Link to="/" aria-label="Ir para a página inicial">
          <img src={logo} alt="Collision" />
        </Link>
        <nav className="navegacao-erro" aria-label="Navegação principal">
          <ul>
            <li>
              <a href="/#inicio">Início</a>
            </li>
            <li>
              <a href="/#recursos">Recursos</a>
            </li>
            <li>
              <a href="/#noticias">Notícias</a>
            </li>
            <li>
              <a href="/#contato">Fale conosco</a>
            </li>
          </ul>
          <Link to="/login.html" className="botao-login-erro">
            Login
          </Link>
        </nav>
      </header>
      <main>{conteudo}</main>
    </>
  );
}

export default NaoEncontrada;
