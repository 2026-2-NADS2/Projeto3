import { useTituloPagina } from "../hooks/useTituloPagina.js";
import logo from "../assets/img/collision.png";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  useTituloPagina("Login");
  const navegar = useNavigate();

  function enviarFormulario(event) {
    event.preventDefault();
    navegar("/dashboard.html");
  }

  return (
    <>
      <header className="cabecalho-login">
        <a href="/">
          <img src={logo} alt="Logo Collision" />
        </a>

        <nav className="navegacao-login">
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
          </ul>

          <Link to="/fale-conosco" className="botao-contato">Fale conosco</Link>
        </nav>
      </header>
      <main className="pagina-login">
        <div className="circulo circulo-superior"></div>
        <div className="circulo circulo-inferior"></div>
        <section className="cartao-login">
          <img src={logo} alt="Logo Collision" className="logo-login" />

          <h1>Entre na sua conta</h1>

          <p className="descricao-login">Acesse as informações da sua escola em um só lugar.</p>

          <form className="formulario-login" onSubmit={enviarFormulario}>
            <div className="campo-formulario">
              <label htmlFor="login">Login</label>

              <input type="text" id="login" name="login" placeholder="Digite seu login" required />
            </div>

            <div className="campo-formulario">
              <label htmlFor="senha">Senha</label>

              <input
                type="password"
                id="senha"
                name="senha"
                placeholder="Digite sua senha"
                required
              />
            </div>

            <div className="area-esqueci-senha">
              <a href="#">Esqueci minha senha</a>
            </div>

            <button type="submit" className="botao-entrar">
              Entrar
            </button>
          </form>

          <a href="/" className="voltar-inicio">
            ← Voltar ao início
          </a>
        </section>
      </main>
    </>
  );
}

export default Login;
