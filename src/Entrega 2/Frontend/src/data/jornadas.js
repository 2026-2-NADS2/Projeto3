// A API já aplica o recorte de acesso de cada perfil.
export const podeProfessor = (registro) => Boolean(registro);
export const podeFamilia = (registro) => registro?.status === "Publicado";
export const urlJornada = (rota, id) =>
  rota + (id ? "?id=" + encodeURIComponent(id) : "");
export function caminhoProfessor(r) {
  return urlJornada(
    r.status === "Rascunho"
      ? "/professor/rascunho/editar"
      : r.status === "Devolvido para ajustes"
        ? "/professor/correcao/acompanhamento_devolvido"
        : r.status === "Publicado"
          ? "/professor/publicado"
          : "/professor/criacao/enviado_para_revisao",
    r.id,
  );
}
export const rotasJornadas = [
  "/dashboard_prof",
  "/professor/todos_acompanhamentos",
  "/professor/todos_ajustes",
  ...[
    "novo_acompanhamento",
    "rascunho_salvo",
    "confirmar_envio",
    "enviado_para_revisao",
    "prazo_encerrado",
  ].map((x) => "/professor/criacao/" + x),
  ...[
    "acompanhamento_devolvido",
    "corrigir_acompanhamento",
    "reenviado_para_revisao",
  ].map((x) => "/professor/correcao/" + x),
  "/professor/rascunho/editar",
  ...[
    "publicado",
    "historico",
    "turmas",
    "alunos",
    "aluno",
    "retornos",
    "retorno",
  ].map((x) => "/professor/" + x),
  "/dashboard_responsavel_meus_filhos",
  "/dashboard_responsavel",
  ...[
    "todos_relatorios",
    "todas_pendencias",
    "relatorio_publicado",
    "ciencia_registrada",
    "comunicados",
    "comunicado",
    "pdf",
    "pdf_pronto",
    "pdf_erro",
    "filtro_disciplina",
    "observacao",
    "observacao_enviada",
  ].map((x) => "/responsavel/" + x),
  "/mapa-navegacao",
  "/escolher-perfil",
];
