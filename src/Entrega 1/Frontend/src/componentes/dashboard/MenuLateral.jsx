function MenuLateral({ perfil, itens, secao, onSelecionar, aberto }) {
  return (
    <nav
      className={`dash-lateral ${aberto ? "dash-lateral-aberta" : ""}`}
      aria-label="Menu da dashboard"
    >
      {itens.map(([titulo, icone]) => (
        <button
          key={titulo}
          type="button"
          className={`dash-item-menu ${secao === titulo ? "dash-item-ativo" : ""}`}
          aria-current={secao === titulo ? "page" : undefined}
          onClick={() => onSelecionar(titulo)}
        >
          <img src={`/img/dashboard/${perfil}/${icone}.png`} alt="" />
          <span>{titulo}</span>
        </button>
      ))}
    </nav>
  );
}

export default MenuLateral;
