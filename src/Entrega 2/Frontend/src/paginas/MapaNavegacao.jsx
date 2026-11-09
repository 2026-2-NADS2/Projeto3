// A seção 20 documenta jornadas e abre as rotas reais; não simula autorização de servidor.
import { Link } from "react-router-dom";
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import "../css/jornadas.css";
const grupos = [
  [
    "01 · Acesso e autenticação",
    [
      ["Landing", "Página institucional", "/"],
      ["Login", "Acesso à conta", "/login.html"],
      ["Escolher perfil", "Simulação no protótipo", "/escolher-perfil"],
      [
        "Recuperar senha",
        "Recuperação de acesso",
        "/recuperacao_senha/01_solicitar",
      ],
    ],
  ],
  [
    "02 · Administrador — estrutura e revisão",
    [
      ["Visão geral", "Painel de controle", "/administrador"],
      [
        "Cadastros",
        "Alunos, responsáveis e professores",
        "/administrador/responsaveis/lista",
      ],
      [
        "Turmas e vínculos",
        "Autorizações e disciplinas",
        "/administrador/turmas/lista",
      ],
      ["Bimestres", "Períodos de digitação", "/administrador/bimestres"],
    ],
  ],
  [
    "Administrador — publicação e gestão",
    [
      [
        "Fila de revisão",
        "Receber os enviados",
        "/administrador/todas_revisoes",
      ],
      [
        "Revisar e decidir",
        "Editar, devolver ou publicar",
        "/administrador/revisar_acompanhamento",
      ],
      ["Auditoria", "Histórico rastreável", "/administrador/auditoria"],
      [
        "Exportação Excel",
        "Relatórios e dados",
        "/administrador/relatorios/07-exportar-dados",
      ],
    ],
  ],
  [
    "03 · Professor — criação",
    [
      ["Minhas turmas", "Somente turmas vinculadas", "/professor/turmas"],
      [
        "Novo registro",
        "Descrição, média e tags",
        "/professor/criacao/novo_acompanhamento",
      ],
      [
        "Salvar rascunho",
        "Editar posteriormente",
        "/professor/rascunho/editar",
      ],
      [
        "Enviar à revisão",
        "Aguardando escola",
        "/professor/criacao/confirmar_envio?",
      ],
    ],
  ],
  [
    "Professor — correção e consultas",
    [
      [
        "Acompanhamentos",
        "Status do registro",
        "/professor/todos_acompanhamentos",
      ],
      [
        "Devolvido",
        "Justificativa administrativa",
        "/professor/correcao/acompanhamento_devolvido",
      ],
      [
        "Corrigir",
        "Ajustes solicitados",
        "/professor/correcao/corrigir_acompanhamento",
      ],
      ["Retornos", "Comunicação da família", "/professor/retornos"],
    ],
  ],
  [
    "04 · Pai/Responsável — relatório publicado",
    [
      [
        "Selecionar filho",
        "Somente vínculos cadastrados",
        "/dashboard_responsavel_meus_filhos",
      ],
      [
        "Relatórios",
        "Ano, bimestre e disciplina",
        "/responsavel/todos_relatorios",
      ],
      [
        "Consultar e dar ciência",
        "Apenas publicados",
        "/responsavel/relatorio_publicado",
      ],
      ["Gerar PDF", "Baixar documento", "/responsavel/pdf"],
    ],
  ],
  [
    "Responsável — observações e comunicados",
    [
      [
        "Registrar ciência",
        "Confirmação de leitura",
        "/responsavel/relatorio_publicado",
      ],
      ["Enviar observação", "Retorno opcional", "/responsavel/observacao"],
      ["Comunicados", "Informações da escola", "/responsavel/comunicados"],
      [
        "Estados e avisos",
        "Erro, vazio, prazo e permissão",
        "/mapa-navegacao#cenarios",
      ],
    ],
  ],
];
export default function MapaNavegacao() {
  useTituloPagina("Mapa de navegação");
  return (
    <main className="j-mapa">
      <p className="j-mapa-categoria">COLLISION · PROJETO INTERDISCIPLINAR</p>
      <h1>Mapa de navegação</h1>
      <p>
        Os cartões abrem as áreas do sistema conforme as permissões da conta.
        Acesse sua área com o e-mail e a senha cadastrados pela escola.
      </p>
      <nav className="j-perfis" aria-label="Perfis do sistema">
        {[
          [
            "Administrador",
            "Cadastros, revisão e publicação",
            "/administrador",
          ],
          ["Professor", "Turmas, registros e correções", "/dashboard_prof"],
          [
            "Responsável",
            "Filhos, relatórios e ciência",
            "/dashboard_responsavel_meus_filhos",
          ],
        ].map(([titulo, texto, to]) => (
          <Link className="j-mapa-card" key={to} to={to}>
            <strong>{titulo}</strong>
            <span>{texto}</span>
          </Link>
        ))}
      </nav>
      <>
        {grupos.map(([titulo, itens]) => (
          <section className="j-mapa-grupo" key={titulo}>
            <h2>{titulo}</h2>
            <div className="j-mapa-etapas">
              {itens.map(([nome, descricao, to]) => (
                <Link className="j-mapa-card" key={nome} to={to}>
                  <strong>{nome}</strong>
                  <span>{descricao}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <section id="cenarios" className="j-mapa-grupo">
          <h2>Cenários de interface</h2>
          <div className="j-mapa-etapas">
            {[
              ["Prazo encerrado", "/professor/criacao/prazo_encerrado"],
              ["Falha ao gerar PDF", "/responsavel/pdf_erro"],
              [
                "Registro indisponível",
                "/responsavel/relatorio_publicado?id=inexistente",
              ],
              ["Sem permissão", "/responsavel/sem_permissao"],
            ].map(([nome, to]) => (
              <Link className="j-mapa-card" key={to} to={to}>
                {nome}
              </Link>
            ))}
          </div>
        </section>
      </>
    </main>
  );
}
