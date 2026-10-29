import { usuariosMock } from "../data/usuariosMock.js";
import { dadosDashboard } from "../data/dadosDashboard.js";

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

export async function carregarDashboardDemo(perfil) {
  // Simula um  tempo de resposta
  await esperar(700);

  // Use ?simularErro=1 no endereço para demonstrar o estado de erro.
  const simularErro = new URLSearchParams(window.location.search).get("simularErro");

  if (simularErro === "1") {
    throw new Error("Falha simulada ao buscar os dados. Tente novamente.");
  }

  const usuario = usuariosMock[perfil];
  const dados = dadosDashboard[perfil];

  if (!usuario || !dados) {
    throw new Error(`Não encontramos dados para o perfil "${perfil}".`);
  }

  return { usuario, dados };
}