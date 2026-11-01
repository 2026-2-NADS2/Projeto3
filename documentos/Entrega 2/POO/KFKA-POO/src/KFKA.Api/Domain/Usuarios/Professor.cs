namespace KFKA.Api.Domain.Usuarios
{
    public class Professor : Usuario
    {
        public string Matricula { get; private set; } = null!;

        private Professor()
        {
        }

        public Professor(string nome, string email, string senhaHash, string matricula, DateTime criadoEm)
            : base(nome, email, senhaHash, Perfil.Professor, criadoEm)
        {
            this.Matricula = Validacao.Texto(matricula, "Matrícula", 20).ToUpper();
        }
    }
}
