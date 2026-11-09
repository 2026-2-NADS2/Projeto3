// Notificações e perfil continuam sendo componentes independentes e reutilizáveis.
import MenuPerfil from "./MenuPerfil.jsx";
import NotificacoesDashboard from "./NotificacoesDashboard.jsx";

// Imagens e ações opcionais permitem usar os SVGs específicos da seção 03.
function CabecalhoDashboard({
  usuario,
  onAbrirMenu,
  imagens = {},
  acoesPerfil,
  menuAberto,
  menuId,
}) {
  return (
    <header className="dash-cabecalho">
      {/* O botão aparece no celular; as propriedades ARIA descrevem a navegação. */}
      <button
        className="dash-menu-mobile"
        type="button"
        onClick={onAbrirMenu}
        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuAberto}
        aria-controls={menuId}
      >
        ☰
      </button>
      {/* A logo recebida tem prioridade sobre o caminho padrão do dashboard. */}
      <a className="dash-logo" href="/" aria-label="Ir para a Home">
        <img
          src={
            imagens.logo ||
            `/img/dashboard/${usuario.perfil}/imgLogoCollision.svg`
          }
          alt="Collision"
        />
      </a>
      <div className="dash-cabecalho-direita">
        <NotificacoesDashboard
          perfil={usuario.perfil}
          icone={imagens.notificacoes}
        />
        <MenuPerfil
          usuario={usuario}
          iconeSeta={imagens.perfil}
          acoes={acoesPerfil}
        />
      </div>
    </header>
  );
}
export default CabecalhoDashboard;
