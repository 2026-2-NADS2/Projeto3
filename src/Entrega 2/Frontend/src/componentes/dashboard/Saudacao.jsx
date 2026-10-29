import { obterPrimeiroNome } from "../../utilitarios/nomes.js";
function Saudacao({ usuario, dados, onAcao }) {
  const primeiroNome = obterPrimeiroNome(usuario.nome);
  const titulo =
    usuario.perfil === "professor" ? `Ola, professora ${usuario.nome}!` : `Ola ${primeiroNome}`;

  return (
    <div className="dash-introducao">
      <div>
        <h1>{titulo}</h1>
        <p>{dados ? dados.descricao : `seu perfil é ${usuario.perfil}`}</p>
      </div>
      {dados && (
        <button
          type="button"
          className="dash-botao-principal"
          onClick={() => onAcao(dados.destinoBotao)}
        >
          <span aria-hidden="true">{usuario.perfil === "responsavel" ? "-" : "+"}</span>
          {dados.botao}
        </button>
      )}
    </div>
  );
}

export default Saudacao;
