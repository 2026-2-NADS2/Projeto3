// Entrada única para as telas administrativas das seções 04 a 10.
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CabecalhoDashboard from "../componentes/dashboard/CabecalhoDashboard.jsx";
import MenuLateral from "../componentes/dashboard/MenuLateral.jsx";
import NaoEncontrada from "./NaoEncontrada.jsx";
import CadastrosAdmin from "../componentes/admin/CadastrosAdmin.jsx";
import {
  TurmaAdmin,
  EnsinoAdmin,
  FamiliaListaAdmin,
  FamiliaFormularioAdmin,
  ErroVinculoAdmin,
} from "../componentes/admin/TurmasVinculosAdmin.jsx";
import FluxosAdmin from "../componentes/admin/FluxosAdmin.jsx";
import BimestresAdmin from "../componentes/admin/BimestresAdmin.jsx";
import VisaoGeralAdmin from "../componentes/admin/VisaoGeralAdmin.jsx";
import RetornosJornada from "../componentes/jornadas/RetornosJornada.jsx";
import { useDadosEscolares } from "../hooks/useDadosEscolares.jsx";
import { useSessao } from "../hooks/useSessao.jsx";
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import { rotasAdminFigma } from "../data/adminConfiguracao.js";
import "../css/dashboard.css";
import "../css/adminFigma.css";
import "../css/jornadas.css";

// Os arquivos são exportações estáticas do Figma, usadas por todas as telas administrativas.

const imagens = {
  logo: "/img/admin/logo.svg",
  notificacoes: "/img/admin/notificacoes.svg",
  perfil: "/img/admin/perfil.svg",
};
const menu = [
  ["Início", "inicio", "/administrador"],
  ["Usuários", "usuarios", "/administrador/responsaveis/lista"],
  ["Alunos", "alunos", "/administrador/alunos/lista"],
  ["Turmas e vínculos", "usuarios", "/administrador/turmas/lista"],
  ["Disciplinas", "disciplinas", "/administrador/disciplinas/lista"],
  ["Bimestres", "bimestres", "/administrador/bimestres"],
  ["Revisão", "revisao", "/administrador/todas_revisoes"],
  ["Tags", "tags", "/administrador/tags"],
  ["Relatórios", "relatorios", "/administrador/relatorios"],
  ["Auditoria", "auditoria", "/administrador/auditoria"],
  ["Retornos", "retornos", "/administrador/retornos"],
];

// O provider mantém cadastros e vínculos ao navegar entre as telas desta área.
export default function Administracao() {
  return <EstruturaAdministracao />;
}

function EstruturaAdministracao() {
  const { pathname, search } = useLocation();
  const navegar = useNavigate();
  const { aviso, setAviso } = useDadosEscolares();
  const { usuario, sair } = useSessao();
  const [menuAberto, setMenuAberto] = useState(false);
  const [recolhido, setRecolhido] = useState(false);
  useTituloPagina("Administração");

  // Fecha o menu móvel ao navegar e devolve a leitura ao início da nova tela.
  useEffect(() => {
    setMenuAberto(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  useEffect(() => {
    function fechar(e) {
      if (e.key === "Escape") setMenuAberto(false);
    }
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, []);

  // A rota determina qual componente e qual configuração serão exibidos.
  const relativo = pathname.replace(/^\/administrador\/?/, "");
  const [tipo, tela = "lista"] = relativo.split("/");
  const visao =
    pathname === "/dashboard_admin" ||
    pathname === "/administrador" ||
    pathname === "/administrador/";
  const conhecida =
    visao ||
    pathname === "/administrador/bimestres" ||
    rotasAdminFigma.some(([rota]) => rota === pathname);
  let conteudo;
  if (!conhecida)
    conteudo = (
      <NaoEncontrada emDashboard onVoltar={() => navegar("/administrador")} />
    );
  else if (visao) conteudo = <VisaoGeralAdmin />;
  else if (tipo === "retornos" || tipo === "retorno")
    conteudo = (
      <RetornosJornada
        key={pathname + search}
        admin
        detalhe={tipo === "retorno"}
      />
    );
  // As seções 11 a 14 compartilham registros, tags, filtros e histórico.
  else if (
    [
      "tags",
      "relatorios",
      "auditoria",
      "revisao",
      "todas_revisoes",
      "revisar_acompanhamento",
    ].includes(tipo)
  )
    conteudo = <FluxosAdmin />;
  // A seção 10 compartilha o provider e reinicia somente os rascunhos ao trocar de tela.
  else if (tipo === "bimestres")
    conteudo = (
      <BimestresAdmin
        key={pathname + search}
        tela={tela === "lista" ? "visao_geral" : tela}
      />
    );
  else if (tipo === "vinculo_duplicado" || tipo === "vinculo_incompativel")
    conteudo = (
      <ErroVinculoAdmin
        key={pathname}
        incompativel={tipo === "vinculo_incompativel"}
      />
    );
  else if (tipo.endsWith("_inativar"))
    conteudo = (
      <CadastrosAdmin
        tipo={
          {
            responsavel_inativar: "responsaveis",
            professor_inativar: "professores",
            aluno_inativar: "alunos",
          }[tipo]
        }
        tela="inativar"
      />
    );
  else if (tipo === "vinculos")
    conteudo =
      tela === "ensino_por_turma" ? (
        <EnsinoAdmin key={pathname + search} />
      ) : tela === "responsaveis_alunos" ? (
        <FamiliaListaAdmin />
      ) : (
        <FamiliaFormularioAdmin />
      );
  else if (
    tipo === "turmas" &&
    ["alunos", "adicionar_alunos", "professores_disciplinas"].includes(tela)
  )
    conteudo = <TurmaAdmin tela={tela} />;
  else
    conteudo = (
      <CadastrosAdmin
        key={tipo + "-" + tela + search}
        tipo={tipo}
        tela={tela}
      />
    );

  const atual = visao
    ? "Início"
    : ["retornos", "retorno"].includes(tipo)
      ? "Retornos"
      : ["tags", "relatorios", "auditoria"].includes(tipo)
        ? { tags: "Tags", relatorios: "Relatórios", auditoria: "Auditoria" }[
            tipo
          ]
        : ["revisao", "todas_revisoes", "revisar_acompanhamento"].includes(tipo)
          ? "Revisão"
          : tipo === "bimestres"
            ? "Bimestres"
            : pathname.includes("/turmas/") || pathname.includes("/vinculo")
              ? "Turmas e vínculos"
              : pathname.includes("responsave") ||
                  pathname.includes("professor")
                ? "Usuários"
                : pathname.includes("aluno")
                  ? "Alunos"
                  : pathname.includes("disciplina")
                    ? "Disciplinas"
                    : menu.find(([, , destino]) => destino === pathname)?.[0] ||
                      "Início";
  function selecionar(titulo) {
    navegar(menu.find(([nome]) => nome === titulo)?.[2] || "/administrador");
  }

  return (
    <div
      className={`dashboard dashboard--admin pagina-admin ${recolhido ? "admin-menu-recolhido" : ""}`}
    >
      <CabecalhoDashboard
        usuario={{ ...usuario, perfil: "admin", papel: "Administrador" }}
        imagens={imagens}
        menuAberto={menuAberto}
        menuId="menu-administracao"
        onAbrirMenu={() => setMenuAberto((v) => !v)}
        acoesPerfil={
          <>
            <Link to="/administrador">Início</Link>

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
        id="menu-administracao"
        perfil="admin"
        itens={menu.map(([titulo, icone]) => [
          titulo,
          "/img/admin/" + icone + ".svg",
        ])}
        secao={atual}
        aberto={menuAberto}
        onSelecionar={selecionar}
        cabecalho={
          <div className="admin-menu-topo">
            <button
              type="button"
              className="admin-recolher"
              onClick={() => setRecolhido((v) => !v)}
              aria-expanded={!recolhido}
              aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            >
              <span>Recolher menu</span>
              <span aria-hidden="true">{recolhido ? "›" : "‹"}</span>
            </button>
            <p>ÁREA ADMINISTRADORA</p>
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
      <main
        className={`admin-conteudo ${visao ? "admin-conteudo--visao" : ""}`}
      >
        {/* O aviso descreve a alteração em memória e pode ser dispensado após a leitura. */}
        {aviso && (
          <div className="admin-aviso-sucesso" role="status">
            <span>{aviso}</span>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => setAviso("")}
            >
              ×
            </button>
          </div>
        )}
        {conteudo}
      </main>
    </div>
  );
}
