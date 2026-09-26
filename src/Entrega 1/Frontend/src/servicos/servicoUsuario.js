import { usuariosMock } from "../data/usuariosMock.js";

// Dados para demonstração. Ainda não existe autenticação por API.
export function obterUsuarioDemo(perfil) {
  const usuario = usuariosMock[perfil];
  if (!usuario) {
    throw new Error(`Perfil de demonstração inválido: ${perfil}`);
  }
  return usuario;
}
