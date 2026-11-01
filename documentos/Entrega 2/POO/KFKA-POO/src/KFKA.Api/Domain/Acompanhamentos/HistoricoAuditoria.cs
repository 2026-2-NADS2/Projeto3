using KFKA.Api.Domain.Usuarios;

namespace KFKA.Api.Domain.Acompanhamentos
{
    // Uma linha do histórico: quem fez o quê, quando, e como o status mudou.
    // Só a classe Acompanhamento cria registros (o construtor é internal).
    public class HistoricoAuditoria
    {
        public const int TamanhoMaximoDetalhes = 2000;

        public int Id { get; private set; }
        public int AcompanhamentoId { get; private set; }
        public int UsuarioId { get; private set; }
        public Usuario Usuario { get; private set; } = null!;
        public string Acao { get; private set; } = null!;
        public StatusAcompanhamento? StatusAnterior { get; private set; }
        public StatusAcompanhamento StatusPosterior { get; private set; }
        public string? Detalhes { get; private set; }
        public DateTime DataHora { get; private set; }

        private HistoricoAuditoria()
        {
        }

        internal HistoricoAuditoria(Usuario usuario, string acao, StatusAcompanhamento? statusAnterior,
            StatusAcompanhamento statusPosterior, string? detalhes, DateTime dataHora)
        {
            if (detalhes != null && detalhes.Length > TamanhoMaximoDetalhes)
            {
                detalhes = detalhes.Substring(0, TamanhoMaximoDetalhes);
            }

            this.Usuario = usuario;
            this.UsuarioId = usuario.Id;
            this.Acao = acao;
            this.StatusAnterior = statusAnterior;
            this.StatusPosterior = statusPosterior;
            this.Detalhes = detalhes;
            this.DataHora = dataHora;
        }
    }
}
