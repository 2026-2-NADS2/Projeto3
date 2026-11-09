import { ErroApi } from "./erros.js";
const invalido = (campo, mensagem) => {
  throw new ErroApi(400, "VALIDACAO", mensagem, { [campo]: mensagem });
};
export function objeto(valor, permitidos) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor))
    invalido("corpo", "Envie um objeto JSON.");
  for (const chave of Object.keys(valor))
    if (!permitidos.includes(chave))
      invalido(chave, `Campo não permitido: ${chave}.`);
  return valor;
}
export function texto(valor, campo, max = 100, obrigatorio = true) {
  if (valor == null && !obrigatorio) return null;
  if (typeof valor !== "string")
    invalido(campo, `Informe ${campo} como texto.`);
  const retorno = valor.trim();
  if ((obrigatorio && !retorno) || retorno.length > max)
    invalido(campo, `Informe ${campo} com até ${max} caracteres.`);
  return retorno || null;
}
export function inteiro(valor, campo = "id", min = 1, max = 2147483647) {
  if (
    (typeof valor !== "number" && typeof valor !== "string") ||
    !/^\d+$/.test(String(valor))
  )
    invalido(campo, `Informe ${campo} como inteiro válido.`);
  const n = Number(valor);
  if (!Number.isSafeInteger(n) || n < min || n > max)
    invalido(campo, `Informe ${campo} entre ${min} e ${max}.`);
  return n;
}
export function booleano(valor, campo = "ativo") {
  if (typeof valor !== "boolean")
    invalido(campo, `Informe ${campo} como true ou false.`);
  return valor;
}
export function opcao(valor, campo, opcoes) {
  if (!opcoes.includes(valor)) invalido(campo, `Valor inválido para ${campo}.`);
  return valor;
}
export function email(valor) {
  const retorno = texto(valor, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(retorno))
    invalido("email", "Informe um email válido.");
  return retorno;
}
export function senha(valor) {
  // bcrypt considera no maximo 72 bytes; nao truncar uma senha silenciosamente.
  if (
    typeof valor !== "string" ||
    valor.length < 10 ||
    Buffer.byteLength(valor, "utf8") > 72
  )
    invalido(
      "senha",
      "A senha deve ter ao menos 10 caracteres e no máximo 72 bytes.",
    );
  return valor;
}
export function instante(valor, campo) {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d{1,3})?)?(Z|[+-]\d\d:\d\d)$/.test(
      valor,
    ) ||
    !Number.isFinite(Date.parse(valor))
  )
    invalido(campo, `Informe ${campo} em ISO 8601 com fuso horário.`);
  const data = valor.slice(0, 10);
  dataCivil(data, campo);
  return new Date(valor);
}
export function dataCivil(valor, campo) {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d\d-\d\d$/.test(valor) ||
    !Number.isFinite(Date.parse(valor)) ||
    new Date(valor).toISOString().slice(0, 10) !== valor
  )
    invalido(campo, `Informe ${campo} como data válida AAAA-MM-DD.`);
  return valor;
}
export function nota(valor) {
  if (valor == null) return null;
  if (
    typeof valor !== "number" ||
    !Number.isFinite(valor) ||
    valor < 0 ||
    valor > 10 ||
    Math.abs(valor * 100 - Math.round(valor * 100)) > 0.00001
  )
    invalido(
      "media",
      "Informe média numérica de 0 a 10, com até duas casas decimais.",
    );
  return valor;
}
export function ids(valor, campo = "tagIds") {
  if (!Array.isArray(valor) || valor.length > 30)
    invalido(campo, "Informe uma lista com até 30 identificadores.");
  const resultado = valor.map((x) => inteiro(x, campo));
  if (new Set(resultado).size !== resultado.length)
    invalido(campo, "Não repita identificadores.");
  return resultado;
}
export function paginacao(query) {
  const pagina = inteiro(query.pagina ?? 1, "pagina", 1, 100000),
    limite = inteiro(query.limite ?? 20, "limite", 1, 100);
  return { pagina, limite, offset: (pagina - 1) * limite };
}
