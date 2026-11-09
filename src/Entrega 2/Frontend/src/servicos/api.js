export class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

export async function api(
  caminho,
  { token, method = "GET", body, signal, arquivo } = {},
) {
  const base = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
  if (!base)
    throw new Error("Configure VITE_API_URL no arquivo .env do frontend.");
  let resposta;
  try {
    resposta = await fetch(base + caminho, {
      method,
      signal,
      headers: {
        ...(token && { Authorization: "Bearer " + token }),
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  } catch (erro) {
    if (erro.name === "AbortError") throw erro;
    throw new Error(
      "Não foi possível conectar à API. Confira se o backend está rodando.",
    );
  }
  if (!resposta.ok) {
    const json = await resposta.json().catch(() => null);
    throw new ErroHttp(
      resposta.status,
      json?.erro?.mensagem || "A API não concluiu a operação.",
    );
  }
  if (resposta.status === 204) return;
  return arquivo ? resposta.blob() : resposta.json();
}

export async function listarApi(requisitar, caminho, signal) {
  const separador = caminho.includes("?") ? "&" : "?";
  const pagina = (n) =>
    requisitar(caminho + separador + "limite=100&pagina=" + n, { signal });
  const primeira = await pagina(1);
  const dados = [...primeira.dados];
  for (let n = 2; n <= Math.ceil((primeira.paginacao?.total ?? 0) / 100); n++) {
    dados.push(...(await pagina(n)).dados);
  }
  return dados;
}
