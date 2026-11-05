const recursos = [
  [
    "desenvolvimento.svg",
    "Desenvolvimento visível",
    "Descrição, média e tags que ajudam a entender os avanços de cada aluno.",
  ],
  [
    "revisao.svg",
    "Revisão pela escola",
    "O acompanhamento passa pela administração antes de chegar à família.",
  ],
  [
    "familia.svg",
    "Família bem informada",
    "Relatórios por bimestre, confirmação de leitura e documento em PDF.",
  ],
];

export default function Recursos() {
  return (
    <section className="recursos" id="recursos">
      <h2>Clareza em cada etapa do acompanhamento</h2>
      <p>
        Uma experiência organizada para professores, gestores e responsáveis.
      </p>
      <div className="grade-recursos">
        {recursos.map(([icone, titulo, descricao]) => (
          <article className="cartao-recurso" key={titulo}>
            <span className="arte-recurso">
              <img src={"/img/acesso/" + icone} alt="" />
            </span>
            <h3>{titulo}</h3>
            <p>{descricao}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
