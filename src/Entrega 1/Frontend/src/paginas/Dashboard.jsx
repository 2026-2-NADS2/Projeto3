import { useDashboard } from "../hooks/useDashboard.js";
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import "../css/dashboard.css";
import { dadosDashboard } from "../data/dadosDashboard.js";
import CabecalhoDashboard from "../componentes/dashboard/CabecalhoDashboard.jsx";
import MenuLateral from "../componentes/dashboard/MenuLateral.jsx";
import CartaoIndicador from "../componentes/dashboard/CartaoIndicador.jsx";
import Saudacao from "../componentes/dashboard/Saudacao.jsx";
import ConteudoProfessor from "../componentes/dashboard/ConteudoProfessor.jsx";
import ConteudoResponsavel from "../componentes/dashboard/ConteudoResponsavel.jsx";
import ConteudoAdmin from "../componentes/dashboard/ConteudoAdmin.jsx";
import NaoEncontrada from "./NaoEncontrada.jsx";

const conteudos = {
  professor: ConteudoProfessor,
  responsavel: ConteudoResponsavel,
  admin: ConteudoAdmin,
};

function Dashboard() {
  useTituloPagina("Dashboard");
  const { usuario, secao, menuAberto, navegar, trocarPerfil, alternarMenu } =
    useDashboard();
  const dados = dadosDashboard[usuario.perfil];
  const Conteudo = conteudos[usuario.perfil];

  return (
    <div className={`dashboard dashboard--${usuario.perfil}`}>
      <CabecalhoDashboard
        key={usuario.perfil}
        usuario={usuario}
        onTrocarPerfil={trocarPerfil}
        onAbrirMenu={alternarMenu}
      />
      <MenuLateral
        perfil={usuario.perfil}
        itens={dados.menu}
        secao={secao}
        onSelecionar={navegar}
        aberto={menuAberto}
      />
      <main className="dash-conteudo">
        {secao === "Início" ? (
          <>
            <Saudacao usuario={usuario} dados={dados} onAcao={navegar} />

            {usuario.perfil === "admin" && (
              <button
                type="button"
                className="dash-aviso"
                onClick={() => navegar("Bimestres")}
              >
                3º bimestre · Digitação aberta até 30 set 2026 →
              </button>
            )}
            <div className="dash-indicadores">
              {dados.indicadores.map((indicador) => (
                <CartaoIndicador
                  key={indicador[0]}
                  perfil={usuario.perfil}
                  indicador={indicador}
                />
              ))}
            </div>

            <Conteudo onNavegar={navegar} />
          </>
        ) : (
          <NaoEncontrada emDashboard onVoltar={() => navegar("Início")} />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
