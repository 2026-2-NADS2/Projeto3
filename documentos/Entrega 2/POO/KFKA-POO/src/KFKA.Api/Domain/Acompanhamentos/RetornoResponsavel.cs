using KFKA.Api.Domain.Usuarios;

namespace KFKA.Api.Domain.Acompanhamentos
{
    // Ciência do responsável sobre um relatório publicado, com observação opcional.
    public class RetornoResponsavel
    {
        public int Id { get; private set; }
        public int AcompanhamentoId { get; private set; }
        public Acompanhamento Acompanhamento { get; private set; } = null!;
        public int ResponsavelId { get; private set; }
        public Responsavel Responsavel { get; private set; } = null!;
        public string? Observacao { get; private set; }
        public DateTime CienteEm { get; private set; }

        private RetornoResponsavel()
        {
        }

        public RetornoResponsavel(Acompanhamento acompanhamento, Responsavel responsavel, string? observacao, DateTime agora)
        {
            Validacao.NaoNulo(acompanhamento, nameof(acompanhamento));
            Validacao.NaoNulo(responsavel, nameof(responsavel));

            if (!acompanhamento.VisivelParaResponsavel)
            {
                throw new RegraNegocioException("Só é possível registrar ciência em acompanhamentos publicados.");
            }

            this.Acompanhamento = acompanhamento;
            this.AcompanhamentoId = acompanhamento.Id;
            this.Responsavel = responsavel;
            this.ResponsavelId = responsavel.Id;
            this.Observacao = Validacao.TextoOpcional(observacao, "Observação", 1000);
            this.CienteEm = agora;
        }
    }
}
