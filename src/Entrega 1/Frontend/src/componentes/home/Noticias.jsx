function Noticias() {
  return (
    <section className="noticias" id="noticias">
      <h2>Notícias</h2>

      <p>Acompanhe as principais novidades da plataforma e da comunidade escolar.</p>

      <div className="grade-noticias">
        <article className="cartao-noticia">
          <div className="cabecalho-noticia">
            <time dateTime="2026-09-20">20 de Setembro de 2026</time>

            <h3>Novas funcionalidades na plataforma</h3>
          </div>

          <div className="conteudo-noticia">
            <p>Confira as principais novidades que chegam para facilitar o dia a dia da escola.</p>
            <button type="button">Saiba mais</button>
          </div>
        </article>

        <article className="cartao-noticia">
          <div className="cabecalho-noticia">
            <time dateTime="2026-09-20">20 de Setembro de 2026</time>

            <h3>Dicas para um acompanhamento mais próximo</h3>
          </div>

          <div className="conteudo-noticia">
            <p>Veja como usar a plataforma para fortalecer a parceria entre escola e família.</p>
            <button type="button">Saiba mais</button>
          </div>
        </article>

        <article className="cartao-noticia">
          <div className="cabecalho-noticia">
            <time dateTime="2026-09-20">20 de Setembro de 2026</time>

            <h3>Juntos por uma educação mais conectada</h3>
          </div>

          <div className="conteudo-noticia">
            <p>Conheça iniciativas que estão fazendo a diferença na nossa comunidade escolar.</p>
            <button type="button">Saiba mais</button>
          </div>
        </article>
      </div>
    </section>
  );
}
export default Noticias;
