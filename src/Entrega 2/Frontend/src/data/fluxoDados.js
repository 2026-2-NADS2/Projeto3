// Rótulos e filtros das telas de acompanhamento.
export const estadosRegistro = [
  "Publicado",
  "Enviado para revisão",
  "Em revisão",
  "Devolvido para ajustes",
  "Rascunho",
  "Cancelado",
];
export function filtrarRegistros(registros, f) {
  return registros.filter((r) =>
    Object.entries(f).every(
      ([k, v]) =>
        !v ||
        (k === "aluno"
          ? r.aluno
              .toLocaleLowerCase("pt-BR")
              .includes(v.toLocaleLowerCase("pt-BR")) || r.matricula.includes(v)
          : k === "tag"
            ? r.tags.includes(v)
            : String(r[k]) === v),
    ),
  );
}
export const filtroInicial = {
  ano: "",
  bimestre: "",
  turma: "",
  disciplina: "",
  professor: "",
  aluno: "",
  tag: "",
  status: "",
};
export function horarioEvento(data) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(data));
}
