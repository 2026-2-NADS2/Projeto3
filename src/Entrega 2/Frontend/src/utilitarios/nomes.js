export function obterIniciais(nome) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();
}

export function obterPrimeiroNome(nome) {
  return nome.trim().split(/\s+/)[0];
}
