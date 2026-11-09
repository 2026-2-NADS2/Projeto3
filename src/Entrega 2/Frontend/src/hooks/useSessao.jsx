import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "../servicos/api.js";

const Contexto = createContext(null);
const chave = "collision.sessao";
export const destinos = {
  ADMINISTRADOR: "/dashboard_admin",
  PROFESSOR: "/dashboard_prof",
  RESPONSAVEL: "/dashboard_responsavel_meus_filhos",
};

export function SessaoProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(chave));
  const [usuario, setUsuario] = useState(null);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  const limpar = useCallback((anterior) => {
    if (localStorage.getItem(chave) !== anterior) return;
    localStorage.removeItem(chave);
    setToken(null);
    setUsuario(null);
    setErro("");
  }, []);

  const requisitar = useCallback(
    async (caminho, opcoes) => {
      try {
        return await api(caminho, { ...opcoes, token });
      } catch (falha) {
        if (falha.status === 401) limpar(token);
        throw falha;
      }
    },
    [token, limpar],
  );

  useEffect(() => {
    if (!token) return;
    const controle = new AbortController();
    requisitar("/auth/me", { signal: controle.signal })
      .then((dados) => setUsuario(dados.usuario))
      .catch((falha) => {
        if (!controle.signal.aborted && falha.status !== 401)
          setErro(falha.message);
      });
    return () => controle.abort();
  }, [token, requisitar, tentativa]);

  async function entrar(email, senha) {
    const dados = await api("/auth/login", {
      method: "POST",
      body: { email, senha },
    });
    localStorage.setItem(chave, dados.token);
    setErro("");
    setUsuario(dados.usuario);
    setToken(dados.token);
    return dados.usuario;
  }
  async function sair() {
    try {
      await requisitar("/auth/logout", { method: "POST" });
    } finally {
      limpar(token);
    }
  }
  return (
    <Contexto.Provider
      value={{
        usuario,
        token,
        erro,
        requisitar,
        entrar,
        sair,
        tentar: () => {
          setErro("");
          setTentativa((n) => n + 1);
        },
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export const useSessao = () => useContext(Contexto);

export function RotaPrivada({ perfil, inicio = false }) {
  const { usuario, token, erro, tentar } = useSessao();
  if (!token) return <Navigate to="/login.html" replace />;
  if (erro)
    return (
      <main>
        <p role="alert">{erro}</p>
        <button onClick={tentar}>Tentar novamente</button>
      </main>
    );
  if (!usuario) return <p role="status">Validando sessão…</p>;
  if (inicio || (perfil && usuario.perfil !== perfil)) {
    return <Navigate to={destinos[usuario.perfil]} replace />;
  }
  return <Outlet />;
}
