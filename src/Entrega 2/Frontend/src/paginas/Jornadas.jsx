// Layout dos perfis professora e responsável; o estado dos registros fica acima das rotas.
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CabecalhoDashboard from "../componentes/dashboard/CabecalhoDashboard.jsx";
import MenuLateral from "../componentes/dashboard/MenuLateral.jsx";
import ProfessorJornada from "../componentes/jornadas/ProfessorJornada.jsx";
import ResponsavelJornada from "../componentes/jornadas/ResponsavelJornada.jsx";
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import { useSessao } from "../hooks/useSessao.jsx";
import { useDadosEscolares } from "../hooks/useDadosEscolares.jsx";
import "../css/dashboard.css";
import "../css/adminFigma.css";
import "../css/jornadas.css";
export default function Jornadas({ perfil }) {
  const { usuario, sair } = useSessao();
  const { aviso, setAviso } = useDadosEscolares();
  const familia = perfil === "responsavel",
    { pathname, search } = useLocation(),
    navegar = useNavigate();
  const [aberto, setAberto] = useState(false),
    [recolhido, setRecolhido] = useState(false);
  useTituloPagina(familia ? "Área da família" : "Área da professora");
  const menu = familia
    ? [
        ["Início", "familia-imgGroup1.svg", "/dashboard_responsavel"],
        [
          "Meus filhos",
          "familia-imgGroup3.svg",
          "/dashboard_responsavel_meus_filhos",
        ],
        [
          "Relatórios",
          "familia-imgGroup4.svg",
          "/responsavel/todos_relatorios",
        ],
        ["Comunicados", "familia-imgGroup5.svg", "/responsavel/comunicados"],
      ]
    : [
        ["Início", "prof-imgGroup3.svg", "/dashboard_prof"],
        ["Minhas turmas", "prof-imgGroup4.svg", "/professor/turmas"],
        ["Alunos", "prof-imgGroup5.svg", "/professor/alunos"],
        [
          "Acompanhamentos",
          "prof-imgGroup6.svg",
          "/professor/todos_acompanhamentos",
        ],
        ["Retornos", "prof-imgGroup7.svg", "/professor/retornos"],
      ];
  const secao = familia
    ? pathname.includes("meus_filhos")
      ? "Meus filhos"
      : pathname.includes("comunicad")
        ? "Comunicados"
        : pathname === "/dashboard_responsavel" ||
            pathname.includes("pendencias")
          ? "Início"
          : "Relatórios"
    : pathname.includes("retorno")
      ? "Retornos"
      : pathname.includes("turmas")
        ? "Minhas turmas"
        : pathname.includes("aluno")
          ? "Alunos"
          : pathname === "/dashboard_prof" || pathname.includes("ajustes")
            ? "Início"
            : "Acompanhamentos";
  useEffect(() => {
    setAberto(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, search]);
  useEffect(() => {
    const fechar = (e) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, []);
  return (
    <div
      className={`dashboard dashboard--${perfil} pagina-admin pagina-jornada ${familia ? "j-familia" : "j-professor"} ${recolhido ? "admin-menu-recolhido" : ""}`}
    >
      <CabecalhoDashboard
        usuario={{
          nome: usuario.nome,
          perfil,
          papel: familia ? "Responsável" : "Professor",
        }}
        imagens={{
          logo: "/img/admin/logo.svg",
          notificacoes: "/img/admin/notificacoes.svg",
          perfil: "/img/admin/perfil.svg",
        }}
        menuAberto={aberto}
        menuId="menu-jornadas"
        onAbrirMenu={() => setAberto((v) => !v)}
        acoesPerfil={
          <>
            <Link to="/mapa-navegacao">Mapa de navegação</Link>
            <Link
              to="/login.html"
              onClick={(e) => {
                e.preventDefault();
                sair().catch(() => {});
              }}
            >
              Sair
            </Link>
          </>
        }
      />
      <MenuLateral
        perfil={perfil}
        id="menu-jornadas"
        aberto={aberto}
        itens={menu.map(([nome, icone]) => [nome, "/img/jornadas/" + icone])}
        secao={secao}
        onSelecionar={(nome) => navegar(menu.find((x) => x[0] === nome)[2])}
        cabecalho={
          <div className="admin-menu-topo">
            <button
              className="admin-recolher"
              onClick={() => setRecolhido((v) => !v)}
              aria-expanded={!recolhido}
              aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            >
              <span>Recolher menu</span>
              <span>{recolhido ? "›" : "‹"}</span>
            </button>
            <p>ÁREA {familia ? "RESPONSÁVEL" : "PROFESSORA"}</p>
          </div>
        }
        rodape={
          <div className="admin-menu-rodape">
            <Link className="dash-item-menu" to="/fale-conosco">
              <span className="estado-icone">
                <img src="/img/admin/ajuda.svg" alt="" />
              </span>
              <span>Ajuda e suporte</span>
            </Link>
            <small>Ano letivo {new Date().getFullYear()}</small>
          </div>
        }
      />
      <main className="admin-conteudo">
        {aviso && (
          <p role="status">
            {aviso} <button onClick={() => setAviso("")}>Fechar</button>
          </p>
        )}
        {familia ? (
          <ResponsavelJornada key={pathname + search} />
        ) : (
          <ProfessorJornada key={pathname + search} />
        )}
      </main>
    </div>
  );
}
