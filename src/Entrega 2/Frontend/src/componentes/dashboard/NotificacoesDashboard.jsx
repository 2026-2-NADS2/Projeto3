// O estado controla a mensagem de notificações de demonstração.
import { useEffect, useState } from "react";

function NotificacoesDashboard({ perfil, icone }) {
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  // O ícone opcional permite usar o SVG da seção 03 sem trocar as imagens antigas.
  const nomeIcone =
    perfil === "admin" ? "imgNotificacoesImagemExistente" : "imgNotificacoes";
  const imagem = icone || `/img/dashboard/${perfil}/${nomeIcone}.png`;

  // Escape fecha a mensagem; o evento é removido ao fechar ou sair da página.
  useEffect(() => {
    if (!notificacoesAbertas) return;
    function fecharComEscape(evento) {
      if (evento.key === "Escape") setNotificacoesAbertas(false);
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [notificacoesAbertas]);

  return (
    <div className="dash-notificacoes">
      <button
        type="button"
        aria-label="Notificações"
        aria-expanded={notificacoesAbertas}
        onClick={() => setNotificacoesAbertas((atual) => !atual)}
      >
        <img src={imagem} alt="" />
        {/* O contador antigo não faz parte da composição da seção 03. */}
      </button>
      {notificacoesAbertas && (
        <p className="dash-popover">Nenhuma notificação disponível.</p>
      )}
    </div>
  );
}
export default NotificacoesDashboard;
