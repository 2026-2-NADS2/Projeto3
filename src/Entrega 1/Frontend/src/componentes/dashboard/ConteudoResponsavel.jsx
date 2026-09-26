import PainelDashboard from "./PainelDashboard.jsx";
import { recentes } from "../../data/dadosResponsavel.js";

function ConteudoResponsavel({ onNavegar }) {
  return (
    <>
      <div className="dash-duas-colunas">
        <PainelDashboard
          titulo="Meus Filhos"
          acao="Ver Todos"
          onAcao={() => onNavegar("Meus Filhos")}
        >
          <button className="dash-filho" type="button" onClick={() => onNavegar("Meus Filhos")}>
            <span className="dash-mini-icone">
              <img src="/img/dashboard/responsavel/imgIconeUserGreen.png" alt="" />
            </span>
            <span className="dash-filho-dados">
              <strong>Luffy</strong>
              <small>8º A - Ensino Fundamental</small>{" "}
            </span>
            <span className="dash-filho-rodape">
              <span>Matemarica . nota 9.0</span>
              <b>Ver prefil</b>
            </span>
          </button>
        </PainelDashboard>
        <PainelDashboard
          titulo="Acompanhamentos Recentes"
          acao="Ver Todos"
          onAcao={() => onNavegar("Acompanhamentos")}
        >
          <div className="dash-lista dash-lista-compacta">
            {recentes.map(([titulo, data, estado, cor, icone]) => (
              <button
                className="dash-linha"
                type="button"
                key={titulo}
                onClick={() => onNavegar("Acompanhamentos")}
              >
                <span className="dash-mini-icone">
                  <img src={`/img/dashboard/responsavel/${icone}.png`} alt="" />
                </span>
                <span className="dash-linha-texto">
                  <strong>{titulo}</strong>
                  <small>{data}</small>
                </span>
                <span className={`dash-status dash-status--${cor}`}>{estado}</span>
              </button>
            ))}
          </div>
        </PainelDashboard>
      </div>

      <PainelDashboard titulo="Proximas Ações" className="dash-acoes">
        <p className="dash-painel-subtitulo"> fique por dentro das atividades </p>
        <div className="dash-acoes-lista">
          <button className="dash-linha" type="button" onClick={() => onNavegar("Acompanhamentos")}>
            <span className="dash-mini-icone dash-mini-icone--laranja">
              <img src="/img/dashboard/responsavel/imgIconeCalendarPlainOrange.png" alt="" />
            </span>
            <span className="dash-linha-texto">
              <strong>Ler Novo Acompanhamento</strong>
              <small>Confira o Feedback de Zoro</small>
            </span>
          </button>
        </div>
      </PainelDashboard>
    </>
  );
}

export default ConteudoResponsavel;
