// A visão geral da seção 04 usa os mesmos filtros, tabela e paginação das demais áreas.
import { useState } from "react";
import { useFluxoAdmin } from "../../hooks/useFluxoAdmin.jsx";
import {
  AcaoAdmin,
  CampoAdmin,
  TituloAdmin,
  TabelaAdmin,
} from "./ElementosAdmin.jsx";

export default function VisaoGeralAdmin() {
  const { registros } = useFluxoAdmin();
  // Os mesmos IDs abrem a seção 14; publicação e devolução atualizam esta fila ao voltar.
  const revisoesAdmin = registros
    .filter((item) => !["Rascunho", "Cancelado"].includes(item.status))
    .map((item) => ({
      ...item,
      nome: item.aluno,
      bimestre: item.bimestre + "º bimestre",
      status:
        item.status === "Devolvido para ajustes" ? "Devolvido" : item.status,
    }));
  const [filtros, setFiltros] = useState({
    ano: "",
    bimestre: "",
    turma: "",
    disciplina: "",
    professor: "",
    status: "",
  });
  const linhas = revisoesAdmin.filter((item) =>
    Object.entries(filtros).every(
      ([campo, valor]) => !valor || item[campo] === valor,
    ),
  );
  function atualizar(e) {
    setFiltros((atuais) => ({ ...atuais, [e.target.name]: e.target.value }));
  }

  // O CSV contém apenas o resultado filtrado, com células entre aspas e texto em UTF-8.
  function exportar() {
    const celula = (valor) =>
      '"' + String(valor ?? "").replaceAll('"', '""') + '"';
    const cabecalho = [
      "Aluno",
      "Turma",
      "Disciplina",
      "Professor",
      "Enviado em",
      "Status",
    ];
    const conteudo = [
      cabecalho,
      ...linhas.map((i) => [
        i.nome,
        i.turma,
        i.disciplina,
        i.professor,
        i.data,
        i.status,
      ]),
    ]
      .map((linha) => linha.map(celula).join(";"))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "revisoes-collision.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const indicadores = [
    [
      "Aguardando revisão",
      String(
        linhas.filter((item) => item.status === "Enviado para revisão").length,
      ),
      "Enviados pelos professores",
      "revisao",
      "laranja",
    ],
    [
      "Em revisão",
      String(linhas.filter((item) => item.status === "Em revisão").length),
      "Revisões em andamento",
      "editar",
      "azul",
    ],
    [
      "Devolvidos",
      String(linhas.filter((item) => item.status === "Devolvido").length),
      "Aguardando ajuste do professor",
      "devolvidos",
      "laranja",
    ],
    [
      "Publicados",
      String(linhas.filter((item) => item.status === "Publicado").length),
      "Disponíveis às famílias",
      "publicados",
      "verde",
    ],
  ];
  const controles = [
    ["turma", "Turma", [...new Set(revisoesAdmin.map((r) => r.turma))]],
    [
      "disciplina",
      "Disciplina",
      [...new Set(revisoesAdmin.map((r) => r.disciplina))],
    ],
    [
      "professor",
      "Professor",
      [...new Set(revisoesAdmin.map((r) => r.professor))],
    ],
    [
      "status",
      "Status",
      ["Enviado para revisão", "Em revisão", "Devolvido", "Publicado"],
    ],
  ];
  return (
    <div className="admin-visao">
      <TituloAdmin
        visaoGeral
        titulo="Visão geral da escola"
        descricao="Acompanhe os períodos, revise registros e publique para as famílias."
        acoes={
          <AcaoAdmin tipo="primario" to="/administrador/responsaveis/novo">
            ＋ Novo cadastro
          </AcaoAdmin>
        }
      />
      <section
        className="admin-painel admin-contexto"
        aria-label="Período atual"
      >
        <CampoAdmin
          nome="ano"
          rotulo="Ano letivo"
          tipo="select"
          valor={filtros.ano}
          onChange={atualizar}
          opcoes={[["", "Todos"], ...new Set(revisoesAdmin.map((r) => r.ano))]}
        />
        <CampoAdmin
          nome="bimestre"
          rotulo="Bimestre"
          tipo="select"
          valor={filtros.bimestre}
          onChange={atualizar}
          opcoes={[
            ["", "Todos"],
            "1º bimestre",
            "2º bimestre",
            "3º bimestre",
            "4º bimestre",
          ]}
        />
      </section>
      <div className="admin-metricas">
        {indicadores.map(([titulo, valor, legenda, icone, cor]) => (
          <article key={titulo} className="admin-painel admin-metrica">
            <span className={`admin-metrica-icone admin-metrica-icone--${cor}`}>
              <img src={`/img/admin/metrica-${icone}.svg`} alt="" />
            </span>
            <div>
              <h2>{titulo}</h2>
              <strong>{valor}</strong>
              <p>{legenda}</p>
            </div>
          </article>
        ))}
      </div>
      <section className="admin-painel admin-fila-revisao">
        <div className="admin-bloco-titulo">
          <h2>Fila de revisão</h2>
          <AcaoAdmin className="admin-botao--pequeno" onClick={exportar}>
            Exportar dados
          </AcaoAdmin>
        </div>
        <div className="admin-filtros">
          {controles.map(([nome, rotulo, opcoes]) => (
            <CampoAdmin
              key={nome}
              nome={nome}
              rotulo={rotulo}
              tipo="select"
              valor={filtros[nome]}
              onChange={atualizar}
              opcoes={[
                [
                  "",
                  nome === "status"
                    ? "Todos os status"
                    : nome === "professor"
                      ? "Todos"
                      : "Todas",
                ],
                ...opcoes,
              ]}
            />
          ))}
        </div>
        <p className="admin-total-acompanhamentos">
          {linhas.length} acompanhamentos encontrados
        </p>
        <TabelaAdmin
          key={JSON.stringify(filtros)}
          linhas={linhas}
          tamanho={20}
          plural="revisões"
          classe="admin-tabela--revisoes"
          colunas={[
            ["nome", "Aluno"],
            ["turma", "Turma"],
            ["disciplina", "Disciplina / professor"],
            ["data", "Enviado em"],
            ["status", "Status"],
          ]}
          renderizar={(item, chave) =>
            chave === "nome" ? (
              <strong>{item.nome}</strong>
            ) : chave === "disciplina" ? (
              <>
                {item.disciplina}
                <small>{item.professor}</small>
              </>
            ) : chave === "status" ? (
              <span
                className={`admin-status admin-status--${item.status === "Em revisão" ? "laranja" : "azul"}`}
              >
                {item.status}
              </span>
            ) : (
              item[chave]
            )
          }
          acao={(item) => (
            <AcaoAdmin
              className="admin-botao--pequeno"
              to={"/administrador/revisar_acompanhamento?id=" + item.id}
            >
              Revisar
            </AcaoAdmin>
          )}
        />
      </section>
    </div>
  );
}
