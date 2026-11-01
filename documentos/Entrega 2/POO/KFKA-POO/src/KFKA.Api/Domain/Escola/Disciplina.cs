namespace KFKA.Api.Domain.Escola
{
    public class Disciplina
    {
        public int Id { get; private set; }
        public string Nome { get; private set; } = null!;
        public int AreaId { get; private set; }
        public Area Area { get; private set; } = null!;
        public bool Ativo { get; private set; }

        private Disciplina()
        {
        }

        public Disciplina(string nome, Area area)
        {
            Validacao.NaoNulo(area, nameof(area));
            Validacao.Ativo(area.Ativo, "A área");

            this.Nome = Validacao.Texto(nome, "Nome da disciplina", 100);
            this.Area = area;
            this.AreaId = area.Id;
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
