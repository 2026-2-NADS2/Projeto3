namespace KFKA.Api.Domain.Escola
{
    public class Aluno
    {
        public int Id { get; private set; }
        public string Nome { get; private set; } = null!;
        public string Matricula { get; private set; } = null!;
        public DateOnly DataNascimento { get; private set; }
        public int TurmaId { get; private set; }
        public Turma Turma { get; private set; } = null!;
        public bool Ativo { get; private set; }

        private Aluno()
        {
        }

        public Aluno(string nome, string matricula, DateOnly dataNascimento, Turma turma)
        {
            this.Matricula = Validacao.Texto(matricula, "Matrícula", 20).ToUpper();
            AtualizarDados(nome, dataNascimento);
            TransferirPara(turma);
            this.Ativo = true;
        }

        public void AtualizarDados(string nome, DateOnly dataNascimento)
        {
            if (dataNascimento == default)
            {
                throw new RegraNegocioException("Data de nascimento é obrigatória.");
            }

            this.Nome = Validacao.Texto(nome, "Nome do aluno", 150);
            this.DataNascimento = dataNascimento;
        }

        public void TransferirPara(Turma turma)
        {
            Validacao.NaoNulo(turma, nameof(turma));
            Validacao.Ativo(turma.Ativo, "A turma");

            this.Turma = turma;
            this.TurmaId = turma.Id;
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
