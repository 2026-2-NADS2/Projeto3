using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class Responsavel : Usuario
    {
        public int IdResponsavel { get; }
        public string Cpf { get; private set; }
        public string Telefone { get; private set; }

        public Responsavel(int idResponsavel, int idUsuario, string nome, string email, string telefone, string cpf)
            : base(idUsuario, nome, email, "RESPONSAVEL")
        {
            this.IdResponsavel = idResponsavel;
            this.Telefone = telefone;
            this.Cpf = cpf;
        }
    }
}
