import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/img/collision.png";

function Cabecalho({ ocultarContato = false }) {
  const { pathname } = useLocation();

  // Controla a seção destacada na navegação.
  const [secaoAtiva, setSecaoAtiva] = useState("inicio");

  // Controla a abertura e o fechamento do menu mobile.
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu quando o usuário muda de página.
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  // Identifica a seção ativa durante a rolagem da Home.
  useEffect(() => {
    if (pathname !== "/") return;

    const secoes = ["inicio", "recursos", "noticias"];

    function atualizarSecao() {
      const limite = window.scrollY + 150;
      let atual = "inicio";

      for (const id of secoes) {
        const elemento = document.getElementById(id);

        if (elemento && elemento.offsetTop <= limite) {
          atual = id;
        }
      }

      setSecaoAtiva(atual);
    }

    atualizarSecao();

    window.addEventListener("scroll", atualizarSecao, { passive: true });
    window.addEventListener("resize", atualizarSecao);

    return () => {
      window.removeEventListener("scroll", atualizarSecao);
      window.removeEventListener("resize", atualizarSecao);
    };
  }, [pathname]);

  // Fecha o menu ao pressionar Escape.
  useEffect(() => {
    if (!menuAberto) return;

    function fecharComEscape(evento) {
      if (evento.key === "Escape") {
        setMenuAberto(false);
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, [menuAberto]);

  // Retorna a classe ativa conforme a seção selecionada.
  const linkAtivo = (id) =>
    pathname === "/" && secaoAtiva === id ? "ativo" : "";

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <header className="cabecalho">
      {/* Identidade visual */}
      <Link to="/" className="logo-cabecalho" onClick={fecharMenu}>
        <img src={logo} alt="Logo Collision" />
      </Link>

      {/* Botão hambúrguer — visível apenas no mobile */}
      <button
        type="button"
        className={`botao-menu ${menuAberto ? "aberto" : ""}`}
        onClick={() => setMenuAberto((anterior) => !anterior)}
        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuAberto}
        aria-controls="menu-principal"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navegação principal */}
      <nav
        id="menu-principal"
        className={`navegacao ${menuAberto ? "menu-aberto" : ""}`}
        aria-label="Navegação principal"
      >
        <ul>
          <li>
            <a
              href="/#inicio"
              className={linkAtivo("inicio")}
              onClick={fecharMenu}
            >
              Início
            </a>
          </li>

          <li>
            <a
              href="/#recursos"
              className={linkAtivo("recursos")}
              onClick={fecharMenu}
            >
              Recursos
            </a>
          </li>

          <li>
            <a
              href="/#noticias"
              className={linkAtivo("noticias")}
              onClick={fecharMenu}
            >
              Notícias
            </a>
          </li>

          {!ocultarContato && (
            <li>
              <Link
                to="/fale-conosco"
                className={pathname === "/fale-conosco" ? "ativo" : ""}
                onClick={fecharMenu}
              >
                Fale conosco
              </Link>
            </li>
          )}
        </ul>

        {/* Acesso à autenticação */}
        <Link
          to="/login.html"
          className="botao-login"
          onClick={fecharMenu}
        >
          Login
        </Link>
      </nav>
    </header>
  );
}

export default Cabecalho;