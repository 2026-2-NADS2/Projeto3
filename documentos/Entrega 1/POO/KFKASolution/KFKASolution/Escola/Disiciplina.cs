using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class Disciplina
    {
        public int IdDisciplina { get; }
        public string Nome { get; private set; }
        public string Area { get; private set; }
        public bool Ativo { get; private set; }

        public Disciplina(int idDisciplina, string nome, string area)
        {
            this.IdDisciplina = idDisciplina;
            this.Nome = nome;
            this.Area = area;
            this.Ativo = true;
        }

        public void DesativarDisciplina()
        {
            this.Ativo = false;
        }
    }
}
