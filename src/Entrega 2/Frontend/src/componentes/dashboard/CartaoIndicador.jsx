function CartaoIndicador({ perfil, indicador }) {
  const [titulo, valor, legenda, icone] = indicador;

  return (
    <article className="dash-indicador">
      <span className="dash-icone-circulo">
        <img src={`/img/dashboard/${perfil}/${icone}.png`} alt="" />
      </span>
      <div>
        <h2>{titulo}</h2>
        <strong>{valor}</strong>
        <p>{legenda}</p>
      </div>
    </article>
  );
}

export default CartaoIndicador;
