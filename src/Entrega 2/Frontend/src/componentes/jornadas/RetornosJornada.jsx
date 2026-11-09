// Retornos consultam os mesmos registros publicados e observações enviados pela família.
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFluxoAdmin } from "../../hooks/useFluxoAdmin.jsx";
import { podeProfessor, urlJornada } from "../../data/jornadas.js";
import {
  Titulo,
  Painel,
  Aviso,
  Acao,
  Campo,
  Tabela,
  dataHora,
  Indisponivel,
} from "./ElementosJornada.jsx";
export default function RetornosJornada({ admin = false, detalhe = false }) {
  const { registros, observacoes } = useFluxoAdmin(),
    [params] = useSearchParams();
  const [form, setForm] = useState({ turma: "", bimestre: "", situacao: "" }),
    [filtros, setFiltros] = useState(form);
  const base = admin ? "/administrador" : "/professor";
  const linhas = registros
    .filter((r) => r.status === "Publicado" && (admin || podeProfessor(r)))
    .map((r) => ({
      ...r,
      observacoes: observacoes.filter((o) => o.registroId === r.id),
    }));
  const r = linhas.find((x) => x.id === params.get("id"));
  if (detalhe && !r) return <Indisponivel voltar={base + "/retornos"} />;
  if (detalhe)
    return (
      <>
        <Titulo
          categoria={admin ? "GESTÃO ESCOLAR" : "ÁREA DA PROFESSORA"}
          titulo={
            (admin ? "Participação de " : "Retorno de ") +
            (r.responsaveis[0] || r.aluno)
          }
          descricao={`${r.aluno} · ${r.turma} · ${r.disciplina} · ${r.bimestre}º bimestre de ${r.ano}`}
          voltar={base + "/retornos"}
        />
        <Aviso
          titulo={r.cienciaEm ? "Leitura confirmada" : "Aguardando confirmação"}
        >
          {r.cienciaEm
            ? "Leitura confirmada em " + dataHora(r.cienciaEm) + "."
            : "A família ainda não confirmou a leitura deste acompanhamento."}
        </Aviso>
        <Painel titulo="Observação da responsável">
          {r.observacoes.length ? (
            r.observacoes.map((o) => (
              <article key={o.id}>
                <p className="j-texto-preservado">{o.texto}</p>
                <dl className="j-dados">
                  <dt>Enviada por</dt>
                  <dd>{o.autor} · Responsável autorizada</dd>
                  <dt>Data e horário</dt>
                  <dd>{dataHora(o.quando)}</dd>
                </dl>
              </article>
            ))
          ) : (
            <p>Nenhuma observação enviada.</p>
          )}
        </Painel>
        <Painel
          titulo={admin ? "Visibilidade do retorno" : "Sobre este retorno"}
        >
          <p>
            A observação fica vinculada ao acompanhamento e pode ser consultada
            pela professora responsável e pela administração.
          </p>
          <Acao
            to={urlJornada(
              admin
                ? "/administrador/relatorios/05-detalhe-do-acompanhamento"
                : "/professor/publicado",
              r.id,
            )}
          >
            Consultar acompanhamento
          </Acao>
        </Painel>
      </>
    );
  const filtradas = linhas.filter(
    (r) =>
      (!filtros.turma || r.turma === filtros.turma) &&
      (!filtros.bimestre || r.bimestre === filtros.bimestre) &&
      (!filtros.situacao ||
        (filtros.situacao === "observacao"
          ? r.observacoes.length
          : filtros.situacao === "confirmada"
            ? r.cienciaEm
            : !r.cienciaEm)),
  );
  return (
    <>
      <Titulo
        categoria={admin ? "GESTÃO ESCOLAR" : "ÁREA DA PROFESSORA"}
        titulo={admin ? "Participação das famílias" : "Retornos das famílias"}
        descricao="Acompanhe confirmações de leitura e observações vinculadas aos acompanhamentos."
        voltar={admin ? "/administrador" : "/dashboard_prof"}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFiltros(form);
        }}
      >
        <Painel titulo="Filtros">
          <div className="j-tres">
            {[
              [
                "turma",
                "Turma",
                [
                  ["", "Todas as turmas"],
                  ...new Set(linhas.map((r) => r.turma)),
                ],
              ],
              [
                "bimestre",
                "Bimestre",
                [
                  ["", "Todos"],
                  ...[1, 2, 3, 4].map((n) => [String(n), n + "º bimestre"]),
                ],
              ],
              [
                "situacao",
                "Situação",
                [
                  ["", "Todos"],
                  ["observacao", "Com observação"],
                  ["confirmada", "Leitura confirmada"],
                  ["pendente", "Aguardando confirmação"],
                ],
              ],
            ].map(([k, label, opcoes]) => (
              <Campo
                key={k}
                nome={"retorno-" + k}
                rotulo={label}
                tipo="select"
                valor={form[k]}
                opcoes={opcoes}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            ))}
          </div>
          <Acao tipo="primario" type="submit">
            Aplicar filtros
          </Acao>
        </Painel>
      </form>
      <Painel titulo="Leituras e observações">
        <Tabela
          key={JSON.stringify(filtros)}
          linhas={filtradas}
          plural="retornos"
          colunas={[
            ["aluno", "Aluno"],
            ["responsaveis", "Responsável"],
            ["leitura", "Participação"],
          ]}
          renderizar={(r, k) =>
            k === "aluno" ? (
              <strong>
                {r.aluno} · {r.disciplina}
              </strong>
            ) : k === "responsaveis" ? (
              r.responsaveis.join(", ")
            ) : (
              (r.cienciaEm ? "Leitura confirmada" : "Aguardando confirmação") +
              (r.observacoes.length ? " · Com observação" : "")
            )
          }
          acao={(r) => (
            <Acao to={urlJornada(base + "/retorno", r.id)}>
              Ver participação
            </Acao>
          )}
        />
      </Painel>
    </>
  );
}
