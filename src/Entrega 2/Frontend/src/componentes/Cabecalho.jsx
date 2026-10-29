import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/img/collision.png";
function Cabecalho({ ocultarContato = false }) {
  // Identifica a página atual para controlar os links ativos.
  const { pathname } = useLocation();
  const [secaoAtiva, setSecaoAtiva] = useState("inicio");
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

    // Atualiza o menu durante a rolagem e o redimensionamento da janela.
    window.addEventListener("scroll", atualizarSecao, { passive: true });
    window.addEventListener("resize", atualizarSecao);

    return () => {
      window.removeEventListener("scroll", atualizarSecao);
      window.removeEventListener("resize", atualizarSecao);
    };
  }, [pathname]);

  // Retorna a classe CSS "ativo" quando a seção corresponde à posição atual.
  const linkAtivo = (id) =>
    pathname === "/" && secaoAtiva === id ? "ativo" : "";

   // Remove os eventos quando o componente é desmontado ou a rota muda.
  return (
    <header className="cabecalho">
      <img src={logo} alt="Logo Collision" />

      <nav className="navegacao" aria-label="Navegação principal">
        <ul>
          <li>
            <a href="/#inicio" className={linkAtivo("inicio")}>Início</a>
          </li>
          <li>
            <a href="/#recursos" className={linkAtivo("recursos")}>Recursos</a>
          </li>
          <li>
            <a href="/#noticias" className={linkAtivo("noticias")}>Notícias</a>
          </li>
         {!ocultarContato && (
            <li>
              <Link to="/fale-conosco" className={pathname === "/fale-conosco" ? "ativo" : ""}>Fale conosco</Link>
            </li>
          )}
          </ul>

        <Link to="/login.html" className="botao-login">
          Login
        </Link>
      </nav>
    </header>
  );
}
export default Cabecalho;

