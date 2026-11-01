namespace KFKA.Api.Domain.Escola
{
    public class Turma
    {
        public int Id { get; private set; }
        public string Nome { get; private set; } = null!;
        // Ano/série do Ensino Fundamental (ex.: "5º ano").
        public string Serie { get; private set; } = null!;
        public int AnoLetivo { get; private set; }
        public bool Ativo { get; private set; }

        private Turma()
        {
        }

        public Turma(string nome, string serie, int anoLetivo)
        {
            if (anoLetivo < 2000 || anoLetivo > 2100)
            {
                throw new RegraNegocioException("Ano letivo inválido.");
            }

            this.Nome = Validacao.Texto(nome, "Nome da turma", 50);
            this.Serie = Validacao.Texto(serie, "Série", 30);
            this.AnoLetivo = anoLetivo;
            this.Ativo = true;
        }

        public void Ativar()
        {
            this.Ativo = true;
        }

        public void Desativar()
        {
            this.Ativo = false;
        }
    }
}
