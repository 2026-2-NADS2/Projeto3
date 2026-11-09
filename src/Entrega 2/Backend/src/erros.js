export class ErroApi extends Error {
  constructor(status, codigo, mensagem, campos = {}) {
    super(mensagem);
    Object.assign(this, { status, codigo, campos });
  }
}
export const exigir = (condicao, status, codigo, mensagem) => {
  if (!condicao) throw new ErroApi(status, codigo, mensagem);
};
export const naoEncontrado = () =>
  new ErroApi(404, "NAO_ENCONTRADO", "Registro não encontrado.");

// Nunca devolve SQL, parametros, stack ou credenciais na resposta HTTP.
export function tratarErro(erro, req, res, next) {
  if (res.headersSent) return next(erro);
  if (erro.code === "ER_DUP_ENTRY")
    erro = new ErroApi(
      409,
      "DUPLICADO",
      "Já existe um registro com esses dados.",
    );
  if (
    [
      "ER_NO_REFERENCED_ROW_2",
      "ER_ROW_IS_REFERENCED_2",
      "ER_CHECK_CONSTRAINT_VIOLATED",
    ].includes(erro.code)
  )
    erro = new ErroApi(
      409,
      "INTEGRIDADE",
      "A operação é incompatível com os vínculos ou valores cadastrados.",
    );
  if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(erro.code))
    erro = new ErroApi(
      409,
      "CONCORRENCIA",
      "Os dados estão sendo alterados. Atualize e tente novamente.",
    );
  if (erro.type === "entity.parse.failed")
    erro = new ErroApi(
      400,
      "JSON_INVALIDO",
      "O corpo deve conter JSON válido.",
    );
  if (erro.type === "entity.too.large")
    erro = new ErroApi(
      413,
      "CORPO_GRANDE",
      "O conteúdo enviado excede o limite.",
    );
  const conhecido = erro instanceof ErroApi;
  if (!conhecido)
    console.error(
      JSON.stringify({
        evento: "erro_interno",
        requisicao: req.id,
        tipo: erro.name,
        codigo: erro.code || "INTERNO",
      }),
    );
  res.status(conhecido ? erro.status : 500).json({
    erro: {
      codigo: conhecido ? erro.codigo : "ERRO_INTERNO",
      mensagem: conhecido
        ? erro.message
        : "Não foi possível concluir a operação.",
      campos: conhecido ? erro.campos : {},
      requisicaoId: req.id,
    },
  });
}
