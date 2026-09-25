using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class Administrador : Usuario
    {
        public Administrador(int idUsuario, string nome, string email)
            : base(idUsuario, nome, email, "ADMIN")
        {
        }
    }
}
