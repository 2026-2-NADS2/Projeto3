namespace KFKA.Api.Domain.Escola
{
    // Um dos quatro bimestres do ano. As datas ficam em UTC (horário universal)
    // para funcionar igual em qualquer servidor.
    public class Bimestre
    {
        public int Id { get; private set; }
        public int Numero { get; private set; }
        public int AnoLetivo { get; private set; }
        public DateTime AberturaDigitacao { get; private set; }
        public DateTime EncerramentoDigitacao { get; private set; }

        private Bimestre()
        {
        }

        public Bimestre(int numero, int anoLetivo, DateTime aberturaDigitacao, DateTime encerramentoDigitacao)
        {
            if (numero < 1 || numero > 4)
            {
                throw new RegraNegocioException("O número do bimestre deve estar entre 1 e 4.");
            }

            if (anoLetivo < 2000 || anoLetivo > 2100)
            {
                throw new RegraNegocioException("Ano letivo inválido.");
            }

            this.Numero = numero;
            this.AnoLetivo = anoLetivo;
            DefinirPeriodoDigitacao(aberturaDigitacao, encerramentoDigitacao);
        }

        public void DefinirPeriodoDigitacao(DateTime abertura, DateTime encerramento)
        {
            if (abertura.Kind != DateTimeKind.Utc || encerramento.Kind != DateTimeKind.Utc)
            {
                throw new ArgumentException("As datas do período de digitação devem estar em UTC.");
            }

            if (encerramento <= abertura)
            {
                throw new RegraNegocioException("O encerramento da digitação deve ser posterior à abertura.");
            }

            this.AberturaDigitacao = abertura;
            this.EncerramentoDigitacao = encerramento;
        }

        public bool EstaAberto(DateTime agora)
        {
            return agora >= this.AberturaDigitacao && agora <= this.EncerramentoDigitacao;
        }
    }
}
