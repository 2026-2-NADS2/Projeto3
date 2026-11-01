namespace KFKA.Api.Domain.Usuarios
{
    public class Administrador : Usuario
    {
        public string? Cargo { get; private set; }

        private Administrador()
        {
        }

        public Administrador(string nome, string email, string senhaHash, string? cargo, DateTime criadoEm)
            : base(nome, email, senhaHash, Perfil.Administrador, criadoEm)
        {
            this.Cargo = Validacao.TextoOpcional(cargo, "Cargo", 60);
        }
    }
}
