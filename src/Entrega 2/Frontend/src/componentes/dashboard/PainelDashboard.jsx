function PainelDashboard({ titulo, acao, onAcao, children, className = "" }) {
  return (
    <section className={`dash-painel ${className}`}>
      <div className="dash-painel-cabecalho">
        <h2>{titulo}</h2>
        {acao && (
          <button type="button" className="dash-link" onClick={onAcao}>
            {acao} <span aria-hidden="true">→ </span>
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export default PainelDashboard;
