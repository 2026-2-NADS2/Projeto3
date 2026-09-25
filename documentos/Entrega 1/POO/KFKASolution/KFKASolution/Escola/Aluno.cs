using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class Aluno
    {
        public int IdAluno { get; }
        public string Nome { get; private set; }
        public string Matricula { get; }
        public DateOnly DataNascimento { get; private set; }
        public Turma Turma { get; }
        public bool Ativo { get; private set; }

        public Aluno(int idAluno, string nome, string matricula, DateOnly dataNascimento, Turma turma)
        {
            if (turma == null)
            {
                throw new ArgumentNullException(nameof(turma));
            }

            this.IdAluno = idAluno;
            this.Nome = nome;
            this.Matricula = matricula;
            this.DataNascimento = dataNascimento;
            this.Turma = turma;
            this.Ativo = true;
        }

        public void DesativarAluno()
        {
            this.Ativo = false;
        }
    }
}
