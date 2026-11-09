import { useDadosEscolares } from "./useDadosEscolares.jsx";
import { useSessao } from "./useSessao.jsx";

export function useDadosJornada() {
  const { dados, periodos } = useDadosEscolares();
  const { usuario } = useSessao();
  const anoAtual = String(new Date().getFullYear());
  const anos = [
    ...new Set([anoAtual, ...periodos.map((p) => String(p.anoLetivo))]),
  ];
  const alunos = dados.alunos.filter((a) => a.ativo);
  const vinculos = dados.ensino;
  return {
    usuario,
    alunos,
    anos,
    anoAtual,
    vinculos,
    turmas: [...new Set(vinculos.map((v) => v.turma))],
    disciplinas: [...new Set(vinculos.map((v) => v.disciplina))],
  };
}
