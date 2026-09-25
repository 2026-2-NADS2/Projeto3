using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class AlunoResponsavel
    {
        public Aluno Aluno { get; }
        public Responsavel Responsavel { get; }
        public string Parentesco { get; }
        public bool Principal { get; }

        
        public AlunoResponsavel(Aluno aluno, Responsavel responsavel, string parentesco, bool principal)
        {
            this.Aluno = aluno;
            this.Responsavel = responsavel;
            this.Parentesco = parentesco;
            this.Principal = principal;
        }
    }
}
