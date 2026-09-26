import { useTituloPagina } from "../hooks/useTituloPagina.js";
import logo from "../assets/img/collision.png";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  useTituloPagina("Login");
  const navegar = useNavigate();
  const [campos, setCampos] = useState({ login: "", senha: "" });
  const [erros, setErros] = useState({});

  function atualizarCampo(event) {
  const { name, value } = event.target;

  setCampos((valoresAtuais) => ({
    ...valoresAtuais,
    [name]: value,
  }));

  setErros((errosAtuais) => ({
    ...errosAtuais,
    [name]: "",
  }));
}

function enviarFormulario(event) {
  event.preventDefault();

  const novosErros = {};

  if (!campos.login.trim()) {
    novosErros.login = "Digite seu login.";
  }

  if (!campos.senha.trim()) {
    novosErros.senha = "Digite sua senha.";
  } else if (campos.senha.trim().length < 6) {
    novosErros.senha = "A senha deve ter pelo menos 6 caracteres.";
  }

  setErros(novosErros);

  if (Object.keys(novosErros).length > 0) {
    return;
  }

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

          <form className="formulario-login" onSubmit={enviarFormulario} noValidate>
            <div className="campo-formulario">
              <label htmlFor="login">Login</label>

              <input
                  type="text"
                  id="login"
                  name="login"
                  placeholder="Digite seu login"
                  value={campos.login}
                  onChange={atualizarCampo}
                  aria-invalid={Boolean(erros.login)}
                  aria-describedby={erros.login ? "erro-login" : undefined}
                />
                {erros.login && (
                  <small id="erro-login" className="erro-campo">
                    {erros.login}
                  </small>
                )}
            </div>

            <div className="campo-formulario">
              <label htmlFor="senha">Senha</label>

              <input
                type="password"
                id="senha"
                name="senha"
                placeholder="Digite sua senha"
                value={campos.senha}
                onChange={atualizarCampo}
                aria-invalid={Boolean(erros.senha)}
                aria-describedby={erros.senha ? "erro-senha" : undefined}
              />
              {erros.senha && (
                <small id="erro-senha" className="erro-campo">
                  {erros.senha}
                </small>
              )}
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
