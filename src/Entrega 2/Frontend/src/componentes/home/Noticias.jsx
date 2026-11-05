const orientacoes = [
  [
    "familias.svg",
    "Para famílias",
    "Como ler o acompanhamento bimestral",
    "Entenda as informações do relatório e transforme a leitura em uma conversa sobre aprendizagem.",
  ],
  [
    "professores.svg",
    "Para professores",
    "Registros claros e úteis",
    "Conheça uma estrutura simples para descrever avanços, dificuldades e estratégias de apoio.",
  ],
  [
    "escolas.svg",
    "Para escolas",
    "Uma comunicação mais organizada",
    "Veja como revisão e publicação ajudam a compartilhar informações com segurança.",
  ],
];

export default function Noticias() {
  return (
    <section className="noticias" id="noticias">
      <h2>Para a comunidade escolar</h2>
      <p>
        Orientações para tornar o acompanhamento mais próximo e participativo.
      </p>
      <div className="grade-noticias">
        {orientacoes.map(([icone, publico, titulo, descricao]) => (
          <article className="cartao-noticia" key={titulo}>
            <div className="cabecalho-noticia">
              <img src={"/img/acesso/" + icone} alt="" />
            </div>
            <div className="conteudo-noticia">
              <small>{publico}</small>
              <h3>{titulo}</h3>
              <p>{descricao}</p>
              {/* O Figma define o rótulo. A orientação precisa de um destino para virar link. */}
              <span className="orientacao-rotulo">Ler orientação →</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
