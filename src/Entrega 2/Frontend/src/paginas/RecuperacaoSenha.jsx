// Os hooks controlam os campos; o Router faz a navegação entre as etapas.
import { useState } from "react";
import { api } from "../servicos/api.js";
import { Link, useNavigate } from "react-router-dom";
import Cabecalho from "../componentes/Cabecalho.jsx";
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import "../css/acessoFluxos.css";

// Os textos e nomes das etapas correspondem à seção 02 do Figma.
const caminhoRecuperacao = "/recuperacao_senha";
const conteudos = {
  solicitar: {
    titulo: "Esqueceu sua senha?",
    descricao:
      "Informe o e-mail cadastrado na escola para receber um link de recuperação.",
    botao: "Enviar link de recuperação",
  },
  nova: {
    titulo: "Crie uma nova senha",
    descricao: "Altere a senha para voltar a acessar sua conta com segurança.",
    botao: "Salvar nova senha",
  },
  concluida: {
    titulo: "Senha alterada!",
    descricao:
      "Sua nova senha foi salva. Agora você já pode entrar na sua conta.",
    botao: "Ir para o login",
  },
};

// Um único campo reutilizável reúne rótulo, entrada, ajuda e mensagem de erro.
function CampoRecuperacao({
  nome,
  rotulo,
  tipo = "text",
  placeholder,
  ajuda,
  valor,
  erro,
  onChange,
}) {
  // Cada campo de senha controla sua própria visibilidade, sem alterar o valor.
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const ehSenha = tipo === "password";
  const id = `recuperacao-${nome}`;
  const tipoEntrada = ehSenha && mostrarSenha ? "text" : tipo;

  return (
    <div className="recuperacao-campo">
      {/* O rótulo e as descrições são associados à entrada para leitores de tela. */}
      <label htmlFor={id}>{rotulo}</label>
      <div className="recuperacao-entrada">
        <input
          id={id}
          name={nome}
          type={tipoEntrada}
          placeholder={placeholder}
          value={valor}
          onChange={onChange}
          autoComplete={ehSenha ? "new-password" : "email"}
          required
          aria-invalid={Boolean(erro)}
          aria-describedby={`${id}-ajuda${erro ? ` ${id}-erro` : ""}`}
        />
        {/* type="button" impede que mostrar a senha envie o formulário. */}
        {ehSenha && (
          <button
            type="button"
            className="recuperacao-mostrar"
            onClick={() => setMostrarSenha((atual) => !atual)}
            aria-controls={id}
            aria-pressed={mostrarSenha}
            aria-label={`${mostrarSenha ? "Ocultar" : "Mostrar"} ${rotulo.toLowerCase()}`}
          >
            {mostrarSenha ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </div>
      <small id={`${id}-ajuda`} className="recuperacao-ajuda-campo">
        {ajuda}
      </small>
      {/* O erro só aparece quando a validação encontra um problema no campo. */}
      {erro && (
        <small id={`${id}-erro`} className="erro-campo" role="alert">
          {erro}
        </small>
      )}
    </div>
  );
}

// A propriedade etapa permite montar as três telas sem copiar toda a página.
export default function RecuperacaoSenha({ etapa = "solicitar" }) {
  const navegar = useNavigate();
  const conteudo = conteudos[etapa];
  useTituloPagina(conteudo.titulo);

  // Os valores existem somente na memória desta tela; a senha não é persistida.
  const [campos, setCampos] = useState({
    email: "",
    senha: "",
    confirmacao: "",
  });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // Atualiza apenas o campo digitado e retira seu erro enquanto ele é corrigido.
  function atualizarCampo(evento) {
    const { name, value } = evento.target;
    setCampos((atuais) => ({ ...atuais, [name]: value }));
    setErros((atuais) => ({ ...atuais, [name]: "" }));
  }

  // Valida a etapa atual antes de permitir a passagem para a tela seguinte.
  async function enviarFormulario(evento) {
    evento.preventDefault();
    if (enviando) return;
    const formulario = evento.currentTarget;
    const novosErros = {};

    if (etapa === "solicitar") {
      // O navegador verifica a sintaxe do e-mail; as mensagens são exibidas no JSX.
      const entradaEmail = formulario.elements.namedItem("email");
      if (!campos.email.trim()) {
        novosErros.email = "Digite seu e-mail.";
      } else if (!entradaEmail.validity.valid) {
        novosErros.email = "Digite um e-mail válido.";
      }
    } else {
      // O mínimo de oito caracteres e a confirmação seguem as ajudas do Figma.
      if (campos.senha.length < 10) {
        novosErros.senha = "Use pelo menos 10 caracteres.";
      }
      if (!campos.confirmacao) {
        novosErros.confirmacao = "Confirme sua nova senha.";
      } else if (campos.confirmacao !== campos.senha) {
        novosErros.confirmacao = "As senhas precisam ser iguais.";
      }
    }

    setErros(novosErros);
    // Leva o teclado ao primeiro campo que precisa ser corrigido.
    const primeiroCampoComErro = Object.keys(novosErros)[0];
    if (primeiroCampoComErro) {
      formulario.elements.namedItem(primeiroCampoComErro)?.focus();
      return;
    }

    setEnviando(true);
    try {
      if (etapa === "solicitar") {
        const resposta = await api("/auth/recuperacao", {
          method: "POST",
          body: { email: campos.email.trim() },
        });
        setMensagem(resposta.mensagem);
      } else {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token)
          throw new Error("Abra o link de recuperação enviado para sua conta.");
        await api("/auth/redefinicao", {
          method: "POST",
          body: { token, senha: campos.senha },
        });
        navegar(caminhoRecuperacao + "/04_senha_alterada", { replace: true });
      }
    } catch (erro) {
      setErros({ servidor: erro.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`pagina-recuperacao recuperacao--${etapa}`}>
      {mensagem && <p role="status">{mensagem}</p>}
      {erros.servidor && <p role="alert">{erros.servidor}</p>}
      {/* Reutiliza o cabeçalho público com a logo e a composição desta seção. */}
      <Cabecalho
        ocultarLogin
        className="cabecalho-recuperacao"
        logoSrc="/img/acesso/recuperacao/logo-cabecalho.svg"
      />
      <main className="recuperacao-fundo">
        {/* As formas são decorativas; os SVGs mantêm suas dimensões originais. */}
        <img
          className="recuperacao-forma recuperacao-forma-superior"
          src="/img/acesso/recuperacao/forma-superior.svg"
          alt=""
        />
        <img
          className="recuperacao-forma recuperacao-forma-inferior"
          src="/img/acesso/recuperacao/forma-inferior.svg"
          alt=""
        />
        <div className="recuperacao-conteudo">
          <section
            className="recuperacao-cartao"
            aria-labelledby="titulo-recuperacao"
          >
            <div className="recuperacao-logo">
              <img
                src="/img/acesso/recuperacao/logo-cartao.svg"
                alt="Collision"
              />
            </div>
            {/* A confirmação acrescenta o selo verde acima do mesmo título. */}
            {etapa === "concluida" && (
              <span className="recuperacao-status">Tudo certo</span>
            )}
            <h1 id="titulo-recuperacao">{conteudo.titulo}</h1>
            <p className="recuperacao-descricao">{conteudo.descricao}</p>

            {etapa === "concluida" ? (
              <>
                {/* A última etapa apresenta o resultado visual do protótipo. */}
                <p className="recuperacao-mensagem-sucesso">
                  Use sua nova senha no próximo acesso à Collision.
                </p>
                <div className="recuperacao-acoes">
                  <Link
                    to="/login.html"
                    className="acesso-botao acesso-botao-principal"
                  >
                    {conteudo.botao}
                  </Link>
                </div>
              </>
            ) : (
              <form
                className="recuperacao-formulario"
                onSubmit={enviarFormulario}
                noValidate
              >
                <div className="recuperacao-campos">
                  {/* Apenas os campos mudam entre solicitação e nova senha. */}
                  {etapa === "solicitar" ? (
                    <CampoRecuperacao
                      nome="email"
                      rotulo="E-mail"
                      tipo="email"
                      placeholder="Digite seu e-mail cadastrado"
                      ajuda="Use o mesmo e-mail vinculado à sua conta."
                      valor={campos.email}
                      erro={erros.email}
                      onChange={atualizarCampo}
                    />
                  ) : (
                    <>
                      <CampoRecuperacao
                        nome="senha"
                        rotulo="Nova senha"
                        tipo="password"
                        placeholder="••••••••••••••••"
                        ajuda="Use pelo menos 10 caracteres."
                        valor={campos.senha}
                        erro={erros.senha}
                        onChange={atualizarCampo}
                      />
                      <CampoRecuperacao
                        nome="confirmacao"
                        rotulo="Confirmar nova senha"
                        tipo="password"
                        placeholder="••••••••••••••••"
                        ajuda="Digite a mesma senha nos dois campos."
                        valor={campos.confirmacao}
                        erro={erros.confirmacao}
                        onChange={atualizarCampo}
                      />
                    </>
                  )}
                </div>
                {/* As duas etapas compartilham o envio e o retorno ao login. */}
                <div className="recuperacao-acoes">
                  <button
                    type="submit"
                    disabled={enviando}
                    className="acesso-botao acesso-botao-principal"
                  >
                    {conteudo.botao}
                  </button>
                  <Link to="/login.html" className="recuperacao-voltar">
                    ← Voltar para o login
                  </Link>
                </div>
              </form>
            )}
          </section>
          {/* A ajuda permanece fora do cartão, como no Figma. */}
          <p className="recuperacao-suporte">
            Precisa de ajuda? <Link to="/fale-conosco">Fale com a escola</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
