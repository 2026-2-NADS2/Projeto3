using System;
using System.Collections.Generic;
using System.Text;

namespace KFKASolution
{
    internal class Bimestre
    {
        public int IdBimestre { get; }
        public int Numero { get; }
        public int AnoLetivo { get; }
        public DateTime DataInicio { get; }
        public DateTime DataFim { get; }
        public bool Ativo { get; private set; }

        public Bimestre(int idBimestre, int numero, int anoLetivo, DateTime dataInicio, DateTime dataFim)
        {
            if (numero < 1 || numero > 4)
            {
                throw new ArgumentException("Número do bimestre deve ser entre 1 e 4.");
            }

            if (dataFim <= dataInicio)
            {
                throw new ArgumentException("A data de fim do bimestre deve ser posterior à data de início.");
            }

            this.IdBimestre = idBimestre;
            this.Numero = numero;
            this.AnoLetivo = anoLetivo;
            this.DataInicio = dataInicio;
            this.DataFim = dataFim;
            this.Ativo = true;
        }
    }
}
