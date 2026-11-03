import { useNavigate } from "react-router-dom";
import logo from "../assets/img/collision.png";
import "../css/privacidade.css";
import { useEffect } from "react";

const informacoes = [
  {
    titulo: "Finalidade das informações",
    descricao:
      "Os dados são utilizados para identificar os alunos, organizar seus vínculos escolares e permitir o registro, a revisão e a consulta do acompanhamento bimestral.",
  },
  {
    titulo: "Quais dados são utilizados",
    descricao:
      "São necessários dados de identificação e contato dos usuários, matrícula e turma do aluno, vínculos autorizados, descrições do acompanhamento, médias, tags e registros de participação da família.",
  },
  {
    titulo: "Quem pode consultar",
    descricao:
      "O responsável consulta os relatórios publicados dos filhos vinculados à sua conta. O professor acessa suas turmas e disciplinas. A administração organiza os cadastros, revisa e publica os acompanhamentos.",
  },
  {
    titulo: "Registros de leitura e alterações",
    descricao:
      "Confirmações de leitura, observações e alterações relevantes ficam vinculadas ao acompanhamento. O histórico identifica os responsáveis pelas ações e os respectivos momentos.",
  },
  {
    titulo: "Cuidados com os documentos",
    descricao:
      "Relatórios contêm informações de crianças e adolescentes. Ao gerar um PDF, compartilhe o documento somente com pessoas autorizadas e utilize dispositivos de confiança.",
  },
  {
    titulo: "Dúvidas e correção de dados",
    descricao:
      "Para esclarecer o uso das informações ou solicitar a correção de um cadastro e de seus vínculos, procure a administração da escola.",
  },
];

function Privacidade() {
  const navigate = useNavigate();

  function voltar() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }
    useEffect(() => {
    document.body.classList.add("pagina-sem-cabecalho-fixo");

    return () => {
        document.body.classList.remove("pagina-sem-cabecalho-fixo");
    };
    }, []);

  return (
    <div className="pagina-privacidade">
      {/* Cabeçalho simplificado */}
      <header className="privacidade-cabecalho">
        <img src={logo} alt="Collision" />
      </header>

      <main className="privacidade-conteudo">
        {/* Navegação */}
        <button
          type="button"
          className="privacidade-voltar"
          onClick={voltar}
        >
          <span aria-hidden="true">←</span>
          Voltar
        </button>

        {/* Introdução */}
        <div className="privacidade-introducao">
          <h1>Privacidade e uso dos dados</h1>
          <p>
            Como as informações escolares são utilizadas no Collision.
          </p>
        </div>

        {/* Informações */}
        <section
          className="privacidade-lista"
          aria-label="Informações sobre privacidade"
        >
          {informacoes.map((informacao) => (
            <article
              className="privacidade-cartao"
              key={informacao.titulo}
            >
              <h2>{informacao.titulo}</h2>
              <p>{informacao.descricao}</p>
            </article>
          ))}
        </section>

        {/* Retorno */}
        <button
          type="button"
          className="privacidade-voltar-inferior"
          onClick={voltar}
        >
          Voltar à página anterior
        </button>
      </main>
    </div>
  );
}

export default Privacidade;