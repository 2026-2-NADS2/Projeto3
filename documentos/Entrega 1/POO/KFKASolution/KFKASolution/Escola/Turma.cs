using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class Turma
    {
        public int IdTurma { get; }
        public string Nome { get; private set; }
        public int AnoLetivo { get; private set; }
        public bool Ativo { get; private set; }

        public Turma(int idTurma, string nome, int anoLetivo)
        {
            this.IdTurma = idTurma;
            this.Nome = nome;
            this.AnoLetivo = anoLetivo;
            this.Ativo = true;
        }

        public void DesativarTurma()
        {
            this.Ativo = false;
        }
    }
}
