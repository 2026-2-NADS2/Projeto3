import PainelDashboard from "./PainelDashboard.jsx";
import { revisoes, bimestres, atalhos } from "../../data/dadosAdmin.js";

function ConteudoAdmin({ onNavegar }) {
  return (
    <>
      <div className="dash-duas-colunas dash-duas-colunas--admin">
        <PainelDashboard
          titulo="Fila de revisão"
          acao="Ver todos"
          onAcao={() => onNavegar("Revisão")}
        >
          <div className="dash-lista dash-lista-compacta">
            {revisoes.map(([iniciais, nome, turma, detalhe, data, estado, cor]) => (
              <button
                className="dash-linha"
                type="button"
                key={nome}
                onClick={() => onNavegar("Revisão")}
              >
                <span className="dash-iniciais">{iniciais}</span>
                <span className="dash-linha-texto">
                  <strong>{nome}</strong>
                  <small>{turma}</small>
                  <small>{detalhe}</small>
                </span>
                <small className="dash-data">{data}</small>
                <span className={`dash-status dash-status--${cor}`}>{estado}</span>
                <span className="dash-seta">›</span>
              </button>
            ))}
          </div>
        </PainelDashboard>

        <PainelDashboard
          titulo="Período atual"
          acao="Gerenciar bimestres"
          onAcao={() => onNavegar("Bimestres")}
        >
          <div className="dash-periodo-atual">
            <span className="dash-mini-icone dash-mini-icone--laranja">
              <img src="/img/dashboard/admin/imgIconeDo3Bimestre.png" alt="" />
            </span>
            <span>
              <strong>3º bimestre</strong>
              <small>01 ago — 30 set 2026</small>
            </span>
            <span className="dash-status dash-status--verde">Aberto</span>
          </div>
          <div className="dash-linha-tempo">
            {bimestres.map(([nome, datas, estado]) => (
              <div
                className={`dash-bimestre ${estado === "Aberto" ? "dash-bimestre-atual" : ""}`}
                key={nome}
              >
                <span className="dash-ponto">{estado === "Concluído" ? "✓" : ""}</span>
                <strong>{nome}</strong>
                <small>{datas}</small>
                <small>{estado}</small>
              </div>
            ))}
          </div>
        </PainelDashboard>
      </div>

      <PainelDashboard titulo="Acesso rápido" className="dash-acoes">
        <p className="dash-painel-subtitulo">Vá para as principais áreas da plataforma.</p>
        <div className="dash-acoes-lista dash-acoes-lista--tres">
          {atalhos.map(([titulo, texto, destino, icone]) => (
            <button
              className="dash-linha"
              type="button"
              key={titulo}
              onClick={() => onNavegar(destino)}
            >
              <span className="dash-mini-icone dash-mini-icone--laranja">
                <img src={`/img/dashboard/admin/${icone}.png`} alt="" />
              </span>
              <span className="dash-linha-texto">
                <strong>{titulo}</strong>
                <small>{texto}</small>
              </span>
              <span className="dash-seta">›</span>
            </button>
          ))}
        </div>
        <button className="dash-auditoria" type="button" onClick={() => onNavegar("Auditoria")}>
          Última alteração registrada no histórico de auditoria: 18 set 2026, 16:42 · Ana Costa
          atualizou o período de digitação do 3º bimestre.
          <span>Ver auditoria →</span>
        </button>
      </PainelDashboard>
    </>
  );
}

export default ConteudoAdmin;
