// Cabeçalho e rodapé opcionais acrescentam recolhimento e ajuda ao menu existente.
function MenuLateral({
  perfil,
  itens,
  secao,
  onSelecionar,
  aberto,
  cabecalho,
  rodape,
  id,
}) {
  return (
    <nav
      id={id}
      className={`dash-lateral ${aberto ? "dash-lateral-aberta" : ""}`}
      aria-label="Menu da dashboard"
    >
      {cabecalho}
      {/* A página que usa o menu define o estado ativo e o destino de cada item. */}
      {itens.map(([titulo, icone]) => {
        // Caminhos completos identificam SVGs; nomes simples usam a pasta do perfil.
        const caminhoCompleto = icone.startsWith("/");
        return (
          <button
            key={titulo}
            type="button"
            className={`dash-item-menu ${secao === titulo ? "dash-item-ativo" : ""}`}
            aria-current={secao === titulo ? "page" : undefined}
            onClick={() => onSelecionar(titulo)}
          >
            {caminhoCompleto ? (
              <span className="estado-icone">
                <img src={icone} alt="" />
              </span>
            ) : (
              <img src={`/img/dashboard/${perfil}/${icone}.png`} alt="" />
            )}
            <span>{titulo}</span>
          </button>
        );
      })}
      {rodape}
    </nav>
  );
}
export default MenuLateral;
