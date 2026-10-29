import PainelDashboard from "./PainelDashboard.jsx";
import { turmas, recentes } from "../../data/dadosProfessor.js";

function ConteudoProfessor({ onNavegar }) {
  return (
    <>
      <div className="dash-duas-colunas">
        <PainelDashboard
          titulo="Minhas turmas"
          acao="Ver todas"
          onAcao={() => onNavegar("Minhas Turmas")}
        >
          <div className="dash-lista">
            {turmas.map(([nome, materia, alunos]) => (
              <button
                className="dash-linha dash-linha-turma"
                type="button"
                key={nome}
                onClick={() => onNavegar("Minhas Turmas")}
              >
                <span className="dash-mini-icone">
                  <img src="/img/dashboard/professor/imgIconeTeamBlue.png" alt="" />
                </span>
                <span className="dash-linha-texto">
                  <strong>{nome}</strong>
                  <small>{materia}</small>
                  <small>{alunos}</small>
                </span>
                <span className="dash-linha-link">Ver turma →</span>
              </button>
            ))}
          </div>
        </PainelDashboard>

        <PainelDashboard
          titulo="Acompanhamentos recentes"
          acao="Ver todos"
          onAcao={() => onNavegar("Acompanhamentos")}
        >
          <div className="dash-lista dash-lista-compacta">
            {recentes.map(([iniciais, nome, turma, data, estado, cor]) => (
              <button
                className="dash-linha"
                type="button"
                key={nome}
                onClick={() => onNavegar("Acompanhamentos")}
              >
                <span className="dash-iniciais">{iniciais}</span>
                <span className="dash-linha-texto">
                  <strong>{nome}</strong>
                  <small>{turma} • Matemática</small>
                </span>
                <small className="dash-data">{data}</small>
                <span className={`dash-status dash-status--${cor}`}>{estado}</span>
                <span className="dash-seta">›</span>
              </button>
            ))}
          </div>
        </PainelDashboard>
      </div>

      <PainelDashboard titulo="Próximas ações" className="dash-acoes">
        <p className="dash-painel-subtitulo">
          Mantenha sua rotina em dia e fortaleça o acompanhamento dos seus alunos.
        </p>
        <div className="dash-acoes-lista">
          <button className="dash-linha" type="button" onClick={() => onNavegar("Acompanhamentos")}>
            <span className="dash-mini-icone dash-mini-icone--laranja">
              <img src="/img/dashboard/professor/imgIconeCalendarPlainOrange.png" alt="" />
            </span>
            <span className="dash-linha-texto">
              <strong>Revisar acompanhamentos pendentes</strong>
              <small>Você tem 3 acompanhamentos para enviar.</small>
            </span>
            <span className="dash-seta">›</span>
          </button>
          <button className="dash-linha" type="button" onClick={() => onNavegar("Retornos")}>
            <span className="dash-mini-icone">
              <img src="/img/dashboard/professor/imgIconeChatBlue.png" alt="" />
            </span>
            <span className="dash-linha-texto">
              <strong>Ver retornos dos responsáveis</strong>
              <small>Acompanhe as respostas das famílias.</small>
            </span>
            <span className="dash-seta">›</span>
          </button>
        </div>
      </PainelDashboard>
    </>
  );
}

export default ConteudoProfessor;
