using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class Professor : Usuario
    {
        public int IdProfessor { get; }
        public string Matricula { get; }

        public Professor(int idProfessor, string matricula, int idUsuario,string nome, string email)
            : base(idUsuario, nome, email, "PROFESSOR")
        {
            this.IdProfessor = idProfessor;
            this.Matricula = matricula;
        }
    }
}
