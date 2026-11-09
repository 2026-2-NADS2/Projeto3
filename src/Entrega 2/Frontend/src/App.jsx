import { BrowserRouter } from "react-router-dom";
import Rotas from "./Rotas.jsx";
import { SessaoProvider, useSessao } from "./hooks/useSessao.jsx";
import {
  DadosEscolaresProvider,
  useDadosEscolares,
} from "./hooks/useDadosEscolares.jsx";
import { FluxoAdminProvider, useFluxoAdmin } from "./hooks/useFluxoAdmin.jsx";

function Aplicacao() {
  const { usuario, sair } = useSessao();
  const admin = useDadosEscolares(),
    fluxo = useFluxoAdmin();
  if (usuario && (admin.erro || fluxo.erro)) {
    return (
      <main>
        <p role="alert">{admin.erro || fluxo.erro}</p>
        <button
          onClick={() =>
            Promise.all([admin.recarregar(), fluxo.recarregar()]).catch(
              () => {},
            )
          }
        >
          Tentar novamente
        </button>
        <button onClick={() => sair().catch(() => {})}>Sair</button>
      </main>
    );
  }
  if (usuario && (admin.carregando || fluxo.carregando))
    return <p role="status">Carregando dados da escola…</p>;
  return <Rotas />;
}

function DadosDaSessao() {
  const { token } = useSessao();
  return (
    <DadosEscolaresProvider key={token}>
      <FluxoAdminProvider>
        <Aplicacao />
      </FluxoAdminProvider>
    </DadosEscolaresProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessaoProvider>
        <DadosDaSessao />
      </SessaoProvider>
    </BrowserRouter>
  );
}
