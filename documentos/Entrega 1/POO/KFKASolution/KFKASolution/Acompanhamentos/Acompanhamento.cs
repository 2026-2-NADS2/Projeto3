using System;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Text;

namespace KFKASolution
{
    internal class Acompanhamento
    {

        public int IdAcompanhamento { get; }
        public Aluno Aluno { get; }
        public VinculoProfessor VinculoProfessor { get; }
        public Bimestre Bimestre { get; }
        public string Descricao { get; }
        public decimal Media { get; }
        public string Status { get; private set; }

        public Acompanhamento(int idAcompanhamento, Aluno aluno, VinculoProfessor vinculoProfessor, Bimestre bimestre, string descricao, decimal media)
        {
            if (media < 0 || media > 10)
            {
                throw new ArgumentException("A média deve estar entre 0 e 10.");
            }

            this.IdAcompanhamento = idAcompanhamento;
            this.Aluno = aluno;
            this.VinculoProfessor = vinculoProfessor;
            this.Bimestre = bimestre;
            this.Descricao = descricao;
            this.Media = media;
            this.Status = "RASCUNHO";
        }

        public void EnviarParaRevisao()
        {
            if (this.Status != "RASCUNHO")
            {
                throw new InvalidOperationException("Acompanhamento só pode ser enviado para revisão se estiver em RASCUNHO.");
            }
            this.Status = "ENVIADO";    
        }

        public void IniciarRevisao()
        {
            if (this.Status != "ENVIADO")
            {
                throw new InvalidOperationException("Acompanhamento só pode iniciar revisão se estiver ENVIADO.");
            }
            this.Status = "EM_REVISAO"; 
        }

        public void Publicar()
        {
            if (this.Status != "EM_REVISAO")
            {
                throw new InvalidOperationException("Acompanhamento só pode ser publicado se estiver EM_REVISAO.");
            }
            this.Status = "PUBLICADO";
        }
    }
}
