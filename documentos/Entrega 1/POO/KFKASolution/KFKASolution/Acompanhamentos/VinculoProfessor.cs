using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class VinculoProfessor
    {
        public int IdVinculo { get; }
        public Professor Professor { get; }
        public Turma Turma { get; }
        public Disciplina Disciplina { get; }
        public int AnoLetivo { get; }

        
        public VinculoProfessor(int idVinculo, Professor professor, Turma turma, Disciplina disciplina, int anoLetivo)
        {
            this.IdVinculo = idVinculo;
            this.Professor = professor;
            this.Turma = turma;
            this.Disciplina = disciplina;
            this.AnoLetivo = anoLetivo;
        }
    }
}
