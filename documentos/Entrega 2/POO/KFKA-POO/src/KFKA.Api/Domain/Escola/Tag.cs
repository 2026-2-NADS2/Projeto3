namespace KFKA.Api.Domain.Escola
{
    // Etiqueta usada para classificar acompanhamentos (cadastrada pelo Administrador).
    public class Tag
    {
        public int Id { get; private set; }
        public string Nome { get; private set; } = null!;
        public string? Descricao { get; private set; }
        public bool Ativo { get; private set; }

        private Tag()
        {
        }

        public Tag(string nome, string? descricao)
        {
            this.Nome = Validacao.Texto(nome, "Nome da tag", 50);
            this.Descricao = Validacao.TextoOpcional(descricao, "Descrição da tag", 200);
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
