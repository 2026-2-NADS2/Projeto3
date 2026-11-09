// A página compartilha os componentes do dashboard com as telas da seção 03.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CabecalhoDashboard from "../componentes/dashboard/CabecalhoDashboard.jsx";
import MenuLateral from "../componentes/dashboard/MenuLateral.jsx";
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import "../css/dashboard.css";
import "../css/acessoFluxos.css";

// A família e os textos abaixo são os exemplos visuais destas telas no Figma.
const inicioFamilia = "/dashboard.html?perfil=responsavel";
const usuario = { nome: "Área da família", perfil: "responsavel" };
const imagens = {
  logo: "/img/acesso/sessao/logo.svg",
  notificacoes: "/img/acesso/sessao/notificacoes.svg",
  perfil: "/img/acesso/sessao/perfil.svg",
};
const itensMenu = [
  ["Início", "/img/acesso/sessao/inicio.svg"],
  ["Meus filhos", "/img/acesso/sessao/filhos.svg"],
  ["Relatórios", "/img/acesso/sessao/relatorios.svg"],
  ["Comunicados", "/img/acesso/sessao/comunicados.svg"],
];
// A estrutura é a mesma: somente os textos e as ações variam conforme o tipo.
const conteudos = {
  expirada: {
    titulo: "Sua sessão expirou",
    descricao: "Entre novamente para continuar com segurança.",
    tituloCartao: "Acesso encerrado",
    mensagem:
      "Por segurança, o acesso foi encerrado após um período de inatividade.",
  },
  permissao: {
    titulo: "Você não tem acesso a este conteúdo",
    descricao:
      "Somente usuários autorizados podem consultar estas informações.",
    tituloCartao: "Acesso restrito",
    mensagem:
      "Não é possível acessar relatórios de alunos que não estejam vinculados ao seu cadastro.",
  },
};

export default function EstadoAcesso({ tipo = "expirada" }) {
  const navegar = useNavigate();
  const conteudo = conteudos[tipo];
  useTituloPagina(conteudo.titulo);

  // A abertura no celular e o recolhimento no desktop são estados independentes.
  const [menuAberto, setMenuAberto] = useState(false);
  const [menuRecolhido, setMenuRecolhido] = useState(false);

  // Permite fechar a navegação do celular pelo teclado e remove o evento ao sair.
  useEffect(() => {
    function fecharComEscape(evento) {
      if (evento.key === "Escape") setMenuAberto(false);
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, []);

  // Os filhos já aparecem no resumo da família; outras seções usam o destino existente.
  function selecionarMenu(titulo) {
    setMenuAberto(false);
    if (titulo === "Início" || titulo === "Meus filhos") {
      navegar(inicioFamilia);
      return;
    }
    navegar(`${inicioFamilia}&secao=${encodeURIComponent(titulo)}`);
  }

  // Ao abrir por um link direto, usa a área da família como retorno seguro da interface.
  function voltar() {
    if (window.history.state?.idx > 0) navegar(-1);
    else navegar(inicioFamilia);
  }

  return (
    <div
      className={`dashboard dashboard--responsavel pagina-estado-acesso ${menuRecolhido ? "estado-menu-recolhido" : ""}`}
    >
      {/* O cabeçalho recebe as imagens originais e as ações da conta desta seção. */}
      <CabecalhoDashboard
        usuario={usuario}
        imagens={imagens}
        menuAberto={menuAberto}
        menuId="menu-estado-acesso"
        onAbrirMenu={() => setMenuAberto((atual) => !atual)}
        acoesPerfil={
          <>
            <Link to={inicioFamilia}>Início</Link>
            <Link to="/login.html">Sair</Link>
          </>
        }
      />
      <MenuLateral
        id="menu-estado-acesso"
        perfil="responsavel"
        itens={itensMenu}
        secao=""
        aberto={menuAberto}
        onSelecionar={selecionarMenu}
        cabecalho={
          <div className="estado-menu-topo">
            {/* Recolhe a lateral no desktop sem duplicar os itens do menu. */}
            <button
              type="button"
              className="estado-recolher-menu"
              onClick={() => setMenuRecolhido((atual) => !atual)}
              aria-expanded={!menuRecolhido}
              aria-label={menuRecolhido ? "Expandir menu" : "Recolher menu"}
            >
              <span>Recolher menu</span>
              <span aria-hidden="true">{menuRecolhido ? "›" : "‹"}</span>
            </button>
            <p className="estado-menu-titulo">ÁREA RESPONSÁVEL</p>
          </div>
        }
        rodape={
          <div className="estado-menu-rodape">
            {/* A ajuda leva ao formulário de contato que já existe no projeto. */}
            <Link to="/fale-conosco" className="dash-item-menu">
              <span className="estado-icone">
                <img src="/img/acesso/sessao/ajuda.svg" alt="" />
              </span>
              <span>Ajuda e suporte</span>
            </Link>
            <small>Ano letivo 2026</small>
          </div>
        }
      />
      <main className="estado-acesso-conteudo">
        <p className="estado-acesso-categoria">ÁREA DA FAMÍLIA</p>
        <h1>{conteudo.titulo}</h1>
        <p className="estado-acesso-descricao">{conteudo.descricao}</p>
        {/* A mensagem é informativa; a autorização real deverá vir do backend. */}
        <section
          className="estado-acesso-cartao"
          aria-labelledby="titulo-estado-acesso"
        >
          <h2 id="titulo-estado-acesso">{conteudo.tituloCartao}</h2>
          <p>{conteudo.mensagem}</p>
          <div className="estado-acesso-acoes">
            {tipo === "expirada" ? (
              <Link
                to="/login.html"
                className="acesso-botao acesso-botao-principal estado-acesso-entrar"
              >
                Entrar novamente
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={voltar}
                  className="acesso-botao acesso-botao-principal"
                >
                  Voltar
                </button>
                <Link
                  to={inicioFamilia}
                  className="acesso-botao acesso-botao-secundario"
                >
                  Meus filhos
                </Link>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
