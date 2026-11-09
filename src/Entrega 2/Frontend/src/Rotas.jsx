import { Routes, Route } from "react-router-dom";
import Home from "./paginas/Home.jsx";
import Login from "./paginas/login.jsx";
import { RotaPrivada } from "./hooks/useSessao.jsx";
import NaoEncontrada from "./paginas/NaoEncontrada.jsx";
import FaleConosco from "./paginas/FaleConosco.jsx";
import Privacidade from "./paginas/Privacidade.jsx";
// Cada componente atende às variantes de uma seção do Figma.
import RecuperacaoSenha from "./paginas/RecuperacaoSenha.jsx";
import EstadoAcesso from "./paginas/EstadoAcesso.jsx";
// A administração reúne as variantes das seções 04 a 14 em uma entrada comum.
import Administracao from "./paginas/Administracao.jsx";
import Jornadas from "./paginas/Jornadas.jsx";
import MapaNavegacao from "./paginas/MapaNavegacao.jsx";
import { rotasJornadas } from "./data/jornadas.js";

function Rotas() {
  return (
    <Routes>
      <Route path="/dashboard.html" element={<RotaPrivada inicio />} />
      <Route path="/escolher-perfil" element={<RotaPrivada inicio />} />
      <Route path="/mapa-navegacao" element={<MapaNavegacao />} />
      {rotasJornadas
        .filter(
          (path) => !["/mapa-navegacao", "/escolher-perfil"].includes(path),
        )
        .map((path) => (
          <Route
            key={path}
            element={
              <RotaPrivada
                perfil={
                  path.startsWith("/professor/") || path === "/dashboard_prof"
                    ? "PROFESSOR"
                    : "RESPONSAVEL"
                }
              />
            }
          >
            <Route
              path={path}
              element={
                <Jornadas
                  perfil={
                    path.startsWith("/professor/") || path === "/dashboard_prof"
                      ? "professor"
                      : "responsavel"
                  }
                />
              }
            />
          </Route>
        ))}
      {/* Uma entrada compartilha o layout e escolhe a tela pela URL. */}
      <Route element={<RotaPrivada perfil="ADMINISTRADOR" />}>
        <Route path="/dashboard_admin" element={<Administracao />} />
        <Route path="/administrador/*" element={<Administracao />} />
      </Route>
      <Route path="/" element={<Home />} />
      <Route path="/index.html" element={<Home />} />
      <Route path="/login.html" element={<Login />} />

      <Route path="/fale-conosco" element={<FaleConosco />} />
      <Route path="*" element={<NaoEncontrada />} />
      <Route path="/privacidade" element={<Privacidade />} />
      {/* Seção 02: a chave reinicia os campos quando a etapa muda. */}
      <Route
        path="/recuperacao_senha/01_solicitar"
        element={<RecuperacaoSenha key="solicitar" etapa="solicitar" />}
      />
      <Route
        path="/recuperacao_senha/03_nova_senha"
        element={<RecuperacaoSenha key="nova" etapa="nova" />}
      />
      <Route
        path="/recuperacao_senha/04_senha_alterada"
        element={<RecuperacaoSenha key="concluida" etapa="concluida" />}
      />
      {/* Seção 03: somente mensagem e ações mudam dentro do layout da família. */}
      <Route
        path="/responsavel/sessao_expirada"
        element={<EstadoAcesso tipo="expirada" />}
      />
      <Route
        path="/responsavel/sem_permissao"
        element={<EstadoAcesso tipo="permissao" />}
      />
    </Routes>
  );
}

export default Rotas;
