namespace KFKA.Api.Domain.Usuarios
{
    // Classe base dos três perfis. É abstrata: não existe "usuário genérico",
    // só Administrador, Professor ou Responsavel.
    public abstract class Usuario
    {
        public int Id { get; private set; }
        public string Nome { get; private set; } = null!;
        public string Email { get; private set; } = null!;
        public string SenhaHash { get; private set; } = null!;
        public Perfil Perfil { get; private set; }
        public bool Ativo { get; private set; }
        public DateTime CriadoEm { get; private set; }

        // Construtor vazio exigido pelo Entity Framework para ler do banco.
        protected Usuario()
        {
        }

        protected Usuario(string nome, string email, string senhaHash, Perfil perfil, DateTime criadoEm)
        {
            AtualizarDados(nome, email);
            DefinirSenha(senhaHash);
            this.Perfil = perfil;
            this.Ativo = true;
            this.CriadoEm = criadoEm;
        }

        public void AtualizarDados(string nome, string email)
        {
            this.Nome = Validacao.Texto(nome, "Nome", 150);
            this.Email = Validacao.Email(email);
        }

        // Recebe a senha já criptografada (o hash), nunca a senha pura.
        public void DefinirSenha(string senhaHash)
        {
            if (string.IsNullOrWhiteSpace(senhaHash))
            {
                throw new ArgumentException("O hash da senha é obrigatório.");
            }

            this.SenhaHash = senhaHash;
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
