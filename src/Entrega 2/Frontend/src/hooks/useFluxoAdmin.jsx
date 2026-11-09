import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useDadosEscolares } from "./useDadosEscolares.jsx";
import { useSessao } from "./useSessao.jsx";
import { listarApi } from "../servicos/api.js";
import { filtroInicial, horarioEvento } from "../data/fluxoDados.js";

const Contexto = createContext(null);
const rotulos = {
  RASCUNHO: "Rascunho",
  ENVIADO_PARA_REVISAO: "Enviado para revisão",
  EM_REVISAO: "Em revisão",
  DEVOLVIDO: "Devolvido para ajustes",
  PUBLICADO: "Publicado",
  CANCELADO: "Cancelado",
};
const acoes = {
  INICIAR_REVISAO: "Revisão",
  PUBLICAR: "Publicação",
  DEVOLVER: "Devolução",
  EDITAR: "Alteração",
  ENVIAR: "Envio para revisão",
  CRIACAO: "Criação",
};
const modulos = {
  ACOMPANHAMENTO: "Acompanhamentos",
  BIMESTRE: "Bimestres",
  TAG: "Tags",
  USUARIO: "Usuários",
};
function registro(r) {
  return {
    ...r,
    id: String(r.id),
    alunoId: String(r.alunoId),
    status: rotulos[r.status],
    tags: r.tags.map((t) => String(t.id)),
    ano: String(r.anoLetivo),
    bimestre: String(r.bimestre),
    desenvolvimento: r.descricao || "",
    estrategias: r.estrategias || "",
    justificativa: r.motivoDevolucao,
    salvoEm: r.atualizadoEm,
    data: horarioEvento(r.atualizadoEm),
    responsaveis: [],
    leitura: r.cienciaEm ? "Leitura confirmada" : "Aguardando confirmação",
  };
}
function evento(r, id, atual) {
  return {
    ...r,
    id: String(r.id),
    registro: String(id ?? r.acompanhamentoId ?? r.entidadeId ?? ""),
    modulo: modulos[r.entidade] || r.entidade || "Acompanhamentos",
    acao: acoes[r.acao] || r.acao,
    aluno: atual?.aluno || r.depois?.nome || r.antes?.nome || "—",
    antes: r.antes || {},
    depois: r.depois || {},
    motivo: r.motivo || "",
  };
}
const vazio = {
  registros: [],
  tags: [],
  eventos: [],
  observacoes: [],
  comunicados: [],
  retornos: [],
};

export function FluxoAdminProvider({ children }) {
  const { usuario, requisitar } = useSessao();
  const { dados, periodos, setAviso } = useDadosEscolares();
  const perfil = usuario?.perfil;
  const admin = perfil === "ADMINISTRADOR",
    professor = perfil === "PROFESSOR";
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState(filtroInicial);
  const [filtrosRevisao, setFiltrosRevisao] = useState(filtroInicial);
  const [arquivo, setArquivo] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [filtroFamilia, setFiltroFamilia] = useState({
    alunoId: "",
    ano: "",
    bimestre: "",
    disciplina: "",
  });
  const [filtroProfessor, setFiltroProfessor] = useState({
    ano: "",
    bimestre: "",
    turma: "",
  });

  const recarregar = useCallback(
    async (signal) => {
      if (!perfil) return;
      const lista = (path) => listarApi(requisitar, path, signal);
      const [acomp, tags, auditoria, comunicados, retornos] = await Promise.all(
        [
          lista("/acompanhamentos"),
          lista("/tags"),
          admin ? lista("/auditoria") : [],
          perfil === "RESPONSAVEL" ? lista("/comunicados") : [],
          admin || professor ? lista("/retornos") : [],
        ],
      );
      const registros = acomp.map(registro);
      const porId = new Map(registros.map((r) => [r.id, r]));
      for (const retorno of retornos) {
        const r = porId.get(String(retorno.acompanhamentoId));
        if (!r) continue;
        r.responsaveis.push(retorno.responsavel);
        r.leitura = "Leitura confirmada";
        r.cienciaEm = r.cienciaEm || retorno.cienciaEm;
      }
      const observacoes = (
        await Promise.all(
          registros
            .filter((r) => r.cienciaEm)
            .map(async (r) =>
              (await lista("/acompanhamentos/" + r.id + "/observacoes")).map(
                (o) => ({ ...o, registroId: r.id, quando: o.criadoEm }),
              ),
            ),
        )
      ).flat();
      const eventos = admin
        ? auditoria.map((e) =>
            evento(e, null, porId.get(String(e.acompanhamentoId))),
          )
        : professor
          ? (
              await Promise.all(
                registros.map(async (r) =>
                  (await lista("/acompanhamentos/" + r.id + "/historico")).map(
                    (e) => evento(e, r.id, r),
                  ),
                ),
              )
            ).flat()
          : [];
      for (const r of registros) {
        const criacao = eventos.find(
          (e) => e.registro === r.id && e.acao === "Criação",
        );
        r.original = {
          desenvolvimento: criacao?.depois?.descricao ?? r.desenvolvimento,
          estrategias: criacao?.depois?.estrategias ?? r.estrategias,
        };
      }
      if (signal?.aborted) return;
      setEstado({
        registros,
        retornos,
        observacoes,
        eventos,
        tags: tags.map((t) => ({
          ...t,
          id: String(t.id),
          status: t.ativo ? "Ativa" : "Inativa",
        })),
        comunicados: comunicados.map((c) => ({
          ...c,
          id: String(c.id),
          texto: c.conteudo,
          ano: String(new Date(c.publicadoEm).getFullYear()),
          publicado: horarioEvento(c.publicadoEm),
        })),
      });
      setErro("");
    },
    [perfil, admin, professor, requisitar],
  );

  useEffect(() => {
    const controle = new AbortController();
    recarregar(controle.signal).catch((falha) => {
      if (!controle.signal.aborted) setErro(falha.message);
    });
    return () => controle.abort();
  }, [recarregar]);

  const atual = estado || vazio;
  function gravar(caminho, method, body) {
    return requisitar(caminho, { method, body });
  }
  async function atualizar() {
    try {
      await recarregar();
    } catch (falha) {
      setAviso(
        "Alteração gravada. Falha ao atualizar os dados: " + falha.message,
      );
    }
  }
  const conteudo = (r) => ({
    descricao: r.desenvolvimento,
    estrategias: r.estrategias,
    ...(r.ajudaFamilia !== undefined && { ajudaFamilia: r.ajudaFamilia }),
    media:
      r.media === "" || r.media == null
        ? null
        : Number(String(r.media).replace(",", ".")),
    tagIds: r.tags.map(Number),
  });
  function periodoAberto(numero, ano) {
    return periodos.some(
      (p) =>
        String(p.numero) === String(numero) &&
        (!ano || String(p.anoLetivo) === ano) &&
        p.ativo &&
        Date.now() >= Date.parse(p.abertura) &&
        Date.now() <= Date.parse(p.encerramento),
    );
  }
  async function salvarProfessor(form, enviar = false) {
    let salvo;
    try {
      const antes = atual.registros.find((r) => r.id === form.id);
      const path = "/acompanhamentos";
      const campos = conteudo(form);
      if (
        enviar &&
        (!campos.descricao?.trim() ||
          campos.media == null ||
          !campos.tagIds.length)
      ) {
        throw new Error(
          "Preencha o desenvolvimento, a média e ao menos uma tag.",
        );
      }
      if (antes) {
        salvo = await gravar(path + "/" + antes.id, "PATCH", {
          ...campos,
          versao: form.versao ?? antes.versao,
        });
      } else {
        const aluno = dados.alunos.find((a) => a.id === form.alunoId);
        const vinculo = dados.ensino.find(
          (v) =>
            v.turmaId === aluno?.turmaId &&
            v.disciplina === form.disciplina &&
            v.ano === form.ano,
        );
        const bimestre = periodos.find(
          (p) =>
            String(p.numero) === form.bimestre &&
            String(p.anoLetivo) === form.ano,
        );
        if (!vinculo || !bimestre)
          throw new Error(
            "Selecione um aluno, uma disciplina vinculada e um bimestre cadastrado.",
          );
        salvo = await gravar(path, "POST", {
          ...campos,
          alunoId: Number(form.alunoId),
          vinculoId: Number(vinculo.id),
          bimestreId: bimestre.id,
        });
      }
      if (enviar)
        salvo = await gravar(path + "/" + salvo.id + "/enviar", "POST", {
          versao: salvo.versao,
        });
      await atualizar();
      return { registro: registro(salvo) };
    } catch (falha) {
      if (salvo) await atualizar();
      return {
        erro: (salvo ? "Rascunho gravado. " : "") + falha.message,
        registro: salvo && registro(salvo),
      };
    }
  }
  async function mudarRegistro(id, acao, campos = {}, motivo = "", versao) {
    const r = atual.registros.find((i) => i.id === id);
    if (!r) return false;
    const rota = {
      Revisão: "/iniciar-revisao",
      Publicação: "/publicar",
      Devolução: "/devolver",
      Cancelamento: "/cancelar",
    }[acao];
    try {
      await gravar(
        "/acompanhamentos/" + id + (rota || ""),
        rota ? "POST" : "PATCH",
        {
          versao: versao ?? r.versao,
          ...(motivo && { motivo }),
          ...(!rota && conteudo({ ...r, ...campos })),
        },
      );
      await atualizar();
      return true;
    } catch (falha) {
      setAviso(falha.message);
      return false;
    }
  }
  async function registrarCiencia(id) {
    try {
      await gravar("/acompanhamentos/" + id + "/ciencia", "PUT");
      await atualizar();
      return true;
    } catch (falha) {
      setAviso(falha.message);
      return false;
    }
  }
  async function enviarObservacao(id, texto) {
    try {
      const observacao = await gravar(
        "/acompanhamentos/" + id + "/observacoes",
        "POST",
        { texto },
      );
      await atualizar();
      return { observacao };
    } catch (falha) {
      return { erro: falha.message };
    }
  }
  async function salvarTag(tag) {
    try {
      await gravar(
        "/tags" + (tag.id ? "/" + tag.id : ""),
        tag.id ? "PATCH" : "POST",
        {
          nome: tag.nome,
          cor: tag.cor,
          descricao: tag.descricao,
          ativo: tag.status === "Ativa",
        },
      );
      await atualizar();
      return "";
    } catch (falha) {
      return falha.message;
    }
  }
  return (
    <Contexto.Provider
      value={{
        ...atual,
        registros: admin
          ? atual.registros.map((r) => ({
              ...r,
              responsaveis: dados.familia
                .filter((v) => String(v.alunoId) === r.alunoId)
                .map((v) => v.responsavel),
            }))
          : atual.registros,
        filtros,
        setFiltros,
        filtrosRevisao,
        setFiltrosRevisao,
        arquivo,
        setArquivo,
        pdf,
        setPdf,
        filtroFamilia: {
          ...filtroFamilia,
          alunoId:
            filtroFamilia.alunoId ||
            dados.alunos.find((a) => a.ativo)?.id ||
            "",
        },
        setFiltroFamilia,
        filtroProfessor,
        setFiltroProfessor,
        periodoAberto,
        salvarProfessor,
        mudarRegistro,
        registrarCiencia,
        enviarObservacao,
        salvarTag,
        recarregar,
        erro,
        carregando: !!perfil && !estado,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}
export const useFluxoAdmin = () => useContext(Contexto);
