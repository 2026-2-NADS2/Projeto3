import { useEffect, useState } from "react";
import { carregarDashboardDemo } from "../servicos/servicoUsuario.js";

const estadoCarregando = {
  usuario: null,
  dados: null,
  carregando: true,
  erro: "",
};

export function useDashboard() {
  const [perfil, setPerfil] = useState("professor");
  const [secao, setSecao] = useState("Início");
  const [menuAberto, setMenuAberto] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [dashboard, setDashboard] = useState(estadoCarregando);

  useEffect(() => {
    let ativo = true;

    setDashboard(estadoCarregando);

    async function consultarDashboard() {
      try {
        const resultado = await carregarDashboardDemo(perfil);

        if (ativo) {
          setDashboard({
            ...resultado,
            carregando: false,
            erro: "",
          });
        }
      } catch (erro) {
        if (ativo) {
          setDashboard({
            usuario: null,
            dados: null,
            carregando: false,
            erro: erro.message,
          });
        }
      }
    }

    consultarDashboard();

    return () => {
      ativo = false;
    };
  }, [perfil, tentativa]);

  function navegar(destino) {
    setSecao(destino);
    setMenuAberto(false);
  }

  function trocarPerfil(novoPerfil) {
    setDashboard(estadoCarregando);
    setPerfil(novoPerfil);
    setSecao("Início");
    setMenuAberto(false);
  }

  function alternarMenu() {
    setMenuAberto((aberto) => !aberto);
  }

  function tentarNovamente() {
    setDashboard(estadoCarregando);
    setTentativa((valorAtual) => valorAtual + 1);
  }

  return {
    ...dashboard,
    perfil,
    secao,
    menuAberto,
    navegar,
    trocarPerfil,
    alternarMenu,
    tentarNovamente,
  };
}
