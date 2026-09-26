import { Link } from "react-router-dom";
import logo from "../assets/img/collision.png";
function Cabecalho() {
  return (
    <header className="cabecalho">
      <img src={logo} alt="Logo Collision" />

      <nav className="navegacao">
        <ul>
          <li>
            <a href="#inicio">Início</a>
          </li>
          <li>
            <a href="#recursos">Recursos</a>
          </li>
          <li>
            <a href="#noticias">Notícias</a>
          </li>
          <li>
            <Link to="/fale-conosco">Fale conosco</Link>
          </li>
        </ul>

        <a href="/login.html" className="botao-login">
          Login
        </a>
      </nav>
    </header>
  );
}
export default Cabecalho;
