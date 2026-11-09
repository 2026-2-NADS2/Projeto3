// Datas de digitação exibidas no horário de Brasília.
export function instantePeriodo(data, hora) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)
  )
    return NaN;
  const instante = Date.parse(`${data}T${hora}:00-03:00`);
  // O round-trip rejeita datas inexistentes que o JavaScript normalizaria, como 31/02.
  if (
    !Number.isFinite(instante) ||
    new Date(instante - 3 * 3600000).toISOString().slice(0, 10) !== data
  )
    return NaN;
  return instante;
}

// Os selos são derivados das datas; o usuário não altera a situação manualmente.
export function situacaoPeriodo(
  periodo,
  referencia = new Date().toISOString(),
) {
  const abertura = instantePeriodo(periodo.aberturaData, periodo.aberturaHora);
  const encerramento = instantePeriodo(
    periodo.encerramentoData,
    periodo.encerramentoHora,
  );
  if (
    !Number.isFinite(abertura) ||
    !Number.isFinite(encerramento) ||
    encerramento <= abertura
  )
    return "Incompleto";
  const agora = Date.parse(referencia);
  return agora < abertura
    ? "Agendado"
    : agora <= encerramento
      ? "Aberto"
      : "Encerrado";
}

// Os erros usam o número do bimestre e o nome do campo para chegar à entrada correta.
export function validarPeriodos(periodos) {
  const erros = {};
  for (const periodo of periodos) {
    for (const extremo of ["abertura", "encerramento"]) {
      if (
        !Number.isFinite(
          instantePeriodo(periodo[extremo + "Data"], periodo[extremo + "Hora"]),
        )
      ) {
        erros[`${periodo.numero}-${extremo}Data`] =
          "Informe uma data e um horário válidos.";
      }
    }
    const abertura = instantePeriodo(
      periodo.aberturaData,
      periodo.aberturaHora,
    );
    const encerramento = instantePeriodo(
      periodo.encerramentoData,
      periodo.encerramentoHora,
    );
    if (
      Number.isFinite(abertura) &&
      Number.isFinite(encerramento) &&
      encerramento <= abertura
    ) {
      erros[`${periodo.numero}-encerramentoData`] =
        "O encerramento deve ser posterior à abertura.";
    }
  }
  return erros;
}

// Formata a data sem converter fuso nem deslocar o dia selecionado.
export function dataPeriodo(data) {
  return data.split("-").reverse().join("/");
}
