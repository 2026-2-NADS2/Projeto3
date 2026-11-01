namespace KFKA.Api.Domain.Escola
{
    // Área de conhecimento que agrupa disciplinas (ex.: Exatas, Linguagens).
    public class Area
    {
        public int Id { get; private set; }
        public string Nome { get; private set; } = null!;
        public bool Ativo { get; private set; }

        private Area()
        {
        }

        public Area(string nome)
        {
            this.Nome = Validacao.Texto(nome, "Nome da área", 80);
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
