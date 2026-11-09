import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { listarApi } from "../servicos/api.js";
import { useSessao } from "./useSessao.jsx";

const ContextoAdmin = createContext(null);
const vazio = {
  alunos: [],
  turmas: [],
  disciplinas: [],
  areas_disciplinas: [],
  responsaveis: [],
  professores: [],
  ensino: [],
  familia: [],
  periodos: [],
};
const anoAtual = new Date().getFullYear();
const cadastro = (r) => ({
  ...r,
  id: String(r.id),
  status: r.ativo ? "Ativo" : "Inativo",
});
const nomes = (lista) =>
  [...new Set(lista.filter(Boolean))].join(" · ") || "Sem vínculo";
const rota = (tipo) =>
  ({
    areas_disciplinas: "areas",
    professores: "usuarios",
    responsaveis: "usuarios",
    ensino: "vinculos/professores",
    familia: "vinculos/responsaveis",
  })[tipo] || tipo;
const horario = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
function periodo(r) {
  const [aberturaData, aberturaHora] = horario
    .format(new Date(r.abertura))
    .split(" ");
  const [encerramentoData, encerramentoHora] = horario
    .format(new Date(r.encerramento))
    .split(" ");
  return {
    ...r,
    aberturaData,
    aberturaHora,
    encerramentoData,
    encerramentoHora,
  };
}

export function DadosEscolaresProvider({ children }) {
  const { usuario, requisitar } = useSessao();
  const perfil = usuario?.perfil;
  const admin = perfil === "ADMINISTRADOR";
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [rascunhoEnsino, setRascunhoEnsino] = useState(null);

  const recarregar = useCallback(
    async (signal) => {
      if (!perfil) return;
      const lista = (path) => listarApi(requisitar, path, signal);
      const [
        alunos,
        turmas,
        disciplinas,
        areas,
        usuarios,
        ensino,
        familia,
        periodos,
        auditoria,
      ] = await Promise.all([
        lista(admin ? "/alunos" : "/meus-alunos"),
        lista("/turmas"),
        lista("/disciplinas"),
        admin ? lista("/areas") : [],
        admin ? lista("/usuarios") : [],
        perfil !== "RESPONSAVEL" ? lista("/vinculos/professores") : [],
        admin ? lista("/vinculos/responsaveis") : [],
        lista("/bimestres"),
        admin ? lista("/auditoria?entidade=BIMESTRE") : [],
      ]);
      if (signal?.aborted) return;
      const professores = usuarios.filter((u) => u.perfil === "PROFESSOR");
      const responsaveis = usuarios.filter((u) => u.perfil === "RESPONSAVEL");
      const vinculosFamilia = familia.filter((v) => v.ativo);
      const vinculosEnsino = ensino.filter((v) => v.ativo);
      setEstado({
        alunos: alunos.map((r) => {
          const vinculos = vinculosFamilia
            .filter((v) => v.alunoId === r.id)
            .map((v) => ({
              id: String(
                responsaveis.find((u) => u.responsavelId === v.responsavelId)
                  ?.id,
              ),
              nome: v.responsavel,
            }));
          return {
            ...cadastro(r),
            ano: String(r.anoLetivo ?? anoAtual),
            turma: r.turma || "",
            vinculos,
            resumo: nomes(vinculos.map((v) => v.nome)),
          };
        }),
        turmas: turmas.map((r) => ({
          ...cadastro(r),
          ano: String(r.anoLetivo),
          etapa: r.serie || "",
          alunos: alunos.filter((a) => a.turmaId === r.id && a.ativo).length,
        })),
        disciplinas: disciplinas.map((r) => ({
          ...cadastro(r),
          area: areas.find((a) => a.id === r.areaId)?.nome || "",
          descricao: r.descricao || "",
        })),
        areas_disciplinas: areas.map((r) => ({
          ...cadastro(r),
          disciplinasArea: nomes(
            disciplinas.filter((d) => d.areaId === r.id).map((d) => d.nome),
          ),
        })),
        responsaveis: responsaveis.map((r) => {
          const vinculos = vinculosFamilia
            .filter((v) => v.responsavelId === r.responsavelId)
            .map((v) => ({ id: String(v.alunoId), nome: v.aluno }));
          return {
            ...cadastro(r),
            vinculos,
            resumo: nomes(vinculos.map((v) => v.nome)),
          };
        }),
        professores: professores.map((r) => {
          const links = vinculosEnsino.filter(
            (v) => v.professorId === r.professorId,
          );
          return {
            ...cadastro(r),
            turmas: nomes(links.map((v) => v.turma)),
            disciplinas: nomes(links.map((v) => v.disciplina)),
            vinculos: links.map((v) => ({
              id: String(v.id),
              nome: v.turma + " · " + v.disciplina,
            })),
          };
        }),
        ensino: vinculosEnsino.map((v) => ({
          ...cadastro(v),
          ano: String(v.anoLetivo),
        })),
        familia: vinculosFamilia.map((v) => ({
          ...v,
          id: v.alunoId + "/" + v.responsavelId,
          turma: alunos.find((a) => a.id === v.alunoId)?.turma || "",
          status: "Ativo",
        })),
        periodos: periodos.map(periodo),
        historicoPeriodos: auditoria
          .filter(
            (e) =>
              e.antes?.abertura &&
              e.depois?.abertura &&
              e.entidade === "BIMESTRE",
          )
          .map((e) => ({
            id: String(e.id),
            numero: e.depois.numero,
            periodoId: e.depois.id,
            administrador: e.autor,
            quando: e.quando,
            antes: periodo(e.antes),
            depois: periodo(e.depois),
          })),
      });
      setErro("");
    },
    [perfil, admin, requisitar],
  );

  useEffect(() => {
    const controle = new AbortController();
    recarregar(controle.signal).catch((falha) => {
      if (!controle.signal.aborted) setErro(falha.message);
    });
    return () => controle.abort();
  }, [recarregar]);

  const dados = estado || vazio;
  const escrever = (path, method, body) => requisitar(path, { method, body });
  async function executar(operacao, mensagem) {
    setAviso("");
    try {
      const resultado = await operacao();
      try {
        await recarregar();
        if (!resultado?.parcial) setAviso(mensagem);
      } catch (falha) {
        setAviso(
          mensagem + " Não foi possível atualizar a lista: " + falha.message,
        );
      }
      return resultado ?? true;
    } catch (falha) {
      setAviso(falha.message);
      return false;
    }
  }

  function vincularFamilia(alunoId, responsavelId, parentesco = "OUTRO") {
    return escrever("/vinculos/responsaveis", "POST", {
      alunoId: Number(alunoId),
      responsavelId,
      parentesco,
      principal: false,
    });
  }
  function salvar(tipo, r) {
    return executar(async () => {
      if (tipo === "familia")
        return vincularFamilia(r.alunoId, r.responsavelId, r.parentesco);
      if (tipo === "ensino") {
        if (r.id)
          throw new Error(
            "Inative o vínculo anterior antes de cadastrar outra atribuição.",
          );
        const turma = dados.turmas.find(
          (t) => t.nome === r.turma && t.ano === r.ano,
        );
        const professor = dados.professores.find((p) => p.nome === r.professor);
        const disciplina = dados.disciplinas.find(
          (d) => d.nome === r.disciplina,
        );
        return escrever("/vinculos/professores", "POST", {
          professorId: professor?.professorId,
          turmaId: Number(turma?.id),
          disciplinaId: Number(disciplina?.id),
        });
      }
      const ativo = r.status === "Ativo";
      let corpo;
      if (["professores", "responsaveis"].includes(tipo)) {
        corpo = { nome: r.nome, email: r.email, telefone: r.telefone || "" };
        if (r.id) corpo.ativo = ativo;
        else {
          corpo.perfil = tipo === "professores" ? "PROFESSOR" : "RESPONSAVEL";
          corpo.senha = r.senha;
          if (tipo === "professores") corpo.matricula = r.matricula;
        }
      } else if (tipo === "alunos") {
        corpo = {
          nome: r.nome,
          matricula: r.matricula,
          dataNascimento: r.dataNascimento,
          ativo,
        };
      } else if (tipo === "turmas") {
        corpo = {
          nome: r.nome,
          anoLetivo: Number(r.ano),
          serie: r.etapa,
          ativo,
        };
      } else if (tipo === "disciplinas") {
        corpo = {
          nome: r.nome,
          areaId: Number(
            dados.areas_disciplinas.find((a) => a.nome === r.area)?.id,
          ),
          ativo,
        };
      } else {
        corpo = { nome: r.nome, descricao: r.descricao, ativo };
      }
      const novo = await escrever(
        "/" + rota(tipo) + (r.id ? "/" + r.id : ""),
        r.id ? "PATCH" : "POST",
        corpo,
      );
      try {
        if (tipo === "alunos" && r.turma) {
          const turma = dados.turmas.find(
            (t) => t.nome === r.turma && t.ano === r.ano,
          );
          if (Number(turma?.id) !== r.turmaId) {
            await escrever("/matriculas", "POST", {
              alunoId: novo.id,
              turmaId: Number(turma?.id),
            });
          }
        }
        if (r.vinculos) await gravarVinculos(tipo, r, novo.id);
      } catch (falha) {
        await recarregar().catch(() => {});
        setAviso(
          "Cadastro salvo. Revise os vínculos pendentes: " + falha.message,
        );
        return { parcial: true, id: String(novo.id) };
      }
      return String(novo.id);
    }, "Cadastro salvo.");
  }
  async function gravarVinculos(tipo, r, id) {
    const anterior = dados[tipo].find((i) => i.id === String(id));
    const antigos = anterior?.vinculos || [];
    if (tipo === "professores") {
      const professorId =
        anterior?.professorId ??
        (await requisitar("/usuarios/" + id)).professorId;
      for (const v of r.vinculos.filter(
        (v) => !antigos.some((a) => a.id === v.id),
      )) {
        await escrever("/vinculos/professores", "POST", {
          professorId,
          turmaId: v.turmaId,
          disciplinaId: v.disciplinaId,
        });
      }
      for (const v of antigos.filter(
        (v) => !r.vinculos.some((a) => a.id === v.id),
      )) {
        await escrever("/vinculos/professores/" + v.id, "PATCH", {
          ativo: false,
        });
      }
    }
    if (!["alunos", "responsaveis"].includes(tipo)) return;
    const responsavelId =
      tipo === "responsaveis"
        ? (anterior?.responsavelId ??
          (await requisitar("/usuarios/" + id)).responsavelId)
        : null;
    const chave = (v) =>
      tipo === "alunos"
        ? [id, dados.responsaveis.find((u) => u.id === v.id)?.responsavelId]
        : [v.id, responsavelId];
    for (const v of r.vinculos.filter(
      (v) => !antigos.some((a) => a.id === v.id),
    )) {
      await vincularFamilia(...chave(v));
    }
    for (const v of antigos.filter(
      (v) => !r.vinculos.some((a) => a.id === v.id),
    )) {
      await escrever("/vinculos/responsaveis/" + chave(v).join("/"), "PATCH", {
        ativo: false,
      });
    }
  }
  function encerrarMatricula(id) {
    return executar(
      () => escrever("/matriculas/" + id + "/encerrar", "POST"),
      "Matrícula encerrada.",
    );
  }
  function mudarStatus(tipo, id, status) {
    return executar(
      () =>
        escrever("/" + rota(tipo) + "/" + id, "PATCH", {
          ativo: status === "Ativo",
        }),
      "Situação atualizada.",
    );
  }
  function removerVinculo(tipo, id) {
    return executar(
      () => escrever("/" + rota(tipo) + "/" + id, "PATCH", { ativo: false }),
      "Vínculo inativado.",
    );
  }
  function matricular(alunoId, turmaId) {
    return executar(
      () =>
        escrever("/matriculas", "POST", {
          alunoId: Number(alunoId),
          turmaId: Number(turmaId),
        }),
      "Matrícula atualizada.",
    );
  }
  function salvarPeriodos(rascunhos) {
    return executar(async () => {
      for (const r of rascunhos) {
        const antes = dados.periodos.find((p) => p.id === r.id);
        if (
          !antes ||
          [
            "aberturaData",
            "aberturaHora",
            "encerramentoData",
            "encerramentoHora",
          ].every((k) => antes[k] === r[k])
        )
          continue;
        await escrever("/bimestres/" + r.id, "PATCH", {
          abertura: r.aberturaData + "T" + r.aberturaHora + ":00-03:00",
          encerramento:
            r.encerramentoData + "T" + r.encerramentoHora + ":00-03:00",
        });
      }
    }, "Períodos atualizados.");
  }
  return (
    <ContextoAdmin.Provider
      value={{
        dados,
        periodos: dados.periodos,
        historicoPeriodos: dados.historicoPeriodos || [],
        salvarPeriodos,
        salvar,
        mudarStatus,
        removerVinculo,
        matricular,
        encerrarMatricula,
        recarregar,
        rascunhoEnsino,
        setRascunhoEnsino,
        aviso,
        setAviso,
        carregando: !!perfil && !estado,
        erro,
      }}
    >
      {children}
    </ContextoAdmin.Provider>
  );
}
export function useDadosEscolares() {
  return useContext(ContextoAdmin);
}
