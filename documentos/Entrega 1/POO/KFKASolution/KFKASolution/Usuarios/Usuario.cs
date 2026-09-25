using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class Usuario
    {
        public int IdUsuario { get; }
        public string Nome { get; private set; }
        public string Email { get; private set; }
        public string Perfil { get; }
        public bool Ativo { get; private set; }

        public Usuario(int idUsuario, string nome, string email, string perfil)
        {
            this.IdUsuario = idUsuario;
            this.Nome = nome;
            this.Email = email;
            this.Perfil = perfil;
            this.Ativo = true;
        }

        public void DesativarUsuario()
        {
            this.Ativo = false;
        }
    }
}
