import { useState } from "react";
import { obterUsuarioDemo } from "../servicos/servicoUsuario.js";

export function useDashboard() {
  const [perfil, setPerfil] = useState("professor");
  const [secao, setSecao] = useState("Início");
  const [menuAberto, setMenuAberto] = useState(false);
  const usuario = obterUsuarioDemo(perfil);

  function navegar(destino) {
    setSecao(destino);
    setMenuAberto(false);
  }

  function trocarPerfil(novoPerfil) {
    setPerfil(novoPerfil);
    navegar("Início");
  }

  function alternarMenu() {
    setMenuAberto((aberto) => !aberto);
  }

  return { usuario, secao, menuAberto, navegar, trocarPerfil, alternarMenu };
}
