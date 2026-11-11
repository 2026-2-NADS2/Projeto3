import { useTituloPagina } from "../hooks/useTituloPagina.js";
import logo from "../assets/img/collision.png";
import { Link, useNavigate } from "react-router-dom";
import Cabecalho from "../componentes/Cabecalho.jsx";
import { useState } from "react";
import { destinos, useSessao } from "../hooks/useSessao.jsx";
import { ErroHttp } from "../servicos/api.js";
import "../css/login.css";

function mensagemLogin(erro) {
  if (erro instanceof ErroHttp) {
    if (erro.status === 0) return erro.message;
    if (erro.status === 400)
      return "Confira o e-mail e a senha e tente novamente.";
    if (erro.status === 401)
      return "E-mail ou senha incorretos. Confira os dados ou use “Esqueci minha senha”.";
    if (erro.status === 429)
      return "Você fez muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  return "O login está indisponível no momento. Tente novamente em instantes.";
}

function Login() {
  useTituloPagina("Login");
  const navegar = useNavigate();
  const { entrar } = useSessao();
  const [enviando, setEnviando] = useState(false);
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
      servidor: "",
    }));
  }

  async function enviarFormulario(event) {
    event.preventDefault();

    const novosErros = {};
    const email = campos.login.trim();

    if (!email) {
      novosErros.login = "Digite seu e-mail.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      novosErros.login = "Digite um e-mail válido.";
    }

    if (!campos.senha) {
      novosErros.senha = "Digite sua senha.";
    }

    setErros(novosErros);

    if (enviando || Object.keys(novosErros).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      const usuario = await entrar(email, campos.senha);
      navegar(destinos[usuario.perfil], { replace: true });
    } catch (erro) {
      setErros({ servidor: mensagemLogin(erro) });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Cabecalho ocultarLogin />
      <main className="pagina-login">
        <div className="circulo circulo-superior" aria-hidden="true" />
        <div className="circulo circulo-inferior" aria-hidden="true" />
        <section className="cartao-login">
          <img src={logo} alt="Logo Collision" className="logo-login" />

          <h1>Entre na sua conta</h1>

          <p className="descricao-login">
            Acesse as informações da sua escola em um só lugar.
          </p>

          {erros.servidor && (
            <p role="alert" className="erro-campo">
              {erros.servidor}
            </p>
          )}
          <form
            className="formulario-login"
            onSubmit={enviarFormulario}
            aria-busy={enviando}
            noValidate
          >
            <div className="campo-formulario">
              <label htmlFor="login">E-mail</label>

              <input
                type="text"
                inputMode="email"
                id="login"
                name="login"
                autoComplete="username"
                placeholder="Digite seu e-mail"
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
                autoComplete="current-password"
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
              {/* O Router abre a recuperação sem recarregar a página. */}
              <Link to="/recuperacao_senha/01_solicitar">
                Esqueci minha senha
              </Link>
            </div>

            <button type="submit" disabled={enviando} className="botao-entrar">
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
