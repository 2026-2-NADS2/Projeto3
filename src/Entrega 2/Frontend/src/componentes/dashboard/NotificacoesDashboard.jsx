import { useState } from "react";
function NotificacoesDashboard({ perfil }) {
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const pastaImagens = `/img/dashboard/${perfil}`;
  const iconeNotificacao =
    perfil === "admin" ? "imgNotificacoesImagemExistente" : "imgNotificacoes";
  return (
    <div className="dash-notificacoes">
      <button
        type="button"
        aria-label="Notificações"
        onClick={() => setNotificacoesAbertas((abertas) => !abertas)}
      >
        <img src={`${pastaImagens}/${iconeNotificacao}.png`} alt="" />
        <span className="dash-contador">1</span>
      </button>
      {notificacoesAbertas && <p className="dash-popover">Você tem 1 notificação de exemplo.</p>}
    </div>
  );
}
export default NotificacoesDashboard;
