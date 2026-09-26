import { Link } from "react-router-dom";
import logo from "../assets/img/collision.png";
function Rodape() {
  return (
    <footer className="rodape">
      <img src={logo} alt="Logo Collision" />

      <div>
        <h3>Nossas Políticas</h3>
        <ul>
          <li>
            <Link to="/politica-de-privacidade">Política de Privacidade</Link>
          </li>
          <li>
            <Link to="/politica-de-cookies">Política de Cookies</Link>
          </li>
          <li>
            <Link to="/perguntas-frequentes">Perguntas Frequentes</Link>
          </li>
        </ul>
      </div>

      <div>
        <h3>Contato</h3>
        <ul>
          <li>
            <Link to="/endereco">Endereço</Link>
          </li>
          <li>
            <Link to="/linkedin">LinkedIn</Link>
          </li>
          <li>
            <Link to="/faq">FAQ</Link>
          </li>
        </ul>
      </div>

      <div>
        <h3>Institucional</h3>
        <ul>
          <li>
            <Link to="/fundamental-i">Fundamental I</Link>
          </li>
          <li>
            <Link to="/fundamental-ii">Fundamental II</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
export default Rodape;
