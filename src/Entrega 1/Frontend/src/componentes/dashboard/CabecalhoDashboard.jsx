import MenuPerfil from "./MenuPerfil.jsx";
import NotificacoesDashboard from "./NotificacoesDashboard.jsx";

function CabecalhoDashboard({ usuario, onTrocarPerfil, onAbrirMenu }) {
  return (
    <header className="dash-cabecalho">
      <button
        className="dash-menu-mobile"
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menu"
      >
        ☰
      </button>
      <a className="dash-logo" href="/" aria-label="Ir para a Home">
        <img src={`/img/dashboard/${usuario.perfil}/imgLogoCollision.svg`} alt="Collision" />
      </a>
      <div className="dash-cabecalho-direita">
        <NotificacoesDashboard perfil={usuario.perfil} />
        <MenuPerfil usuario={usuario} onTrocarPerfil={onTrocarPerfil} />
      </div>
    </header>
  );
}
export default CabecalhoDashboard;
