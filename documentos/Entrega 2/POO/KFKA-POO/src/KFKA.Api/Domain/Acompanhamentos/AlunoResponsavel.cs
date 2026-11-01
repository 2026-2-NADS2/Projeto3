using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;

namespace KFKA.Api.Domain.Acompanhamentos
{
    // Autoriza um responsável a ver os relatórios de um aluno.
    // Um aluno pode ter vários responsáveis e um responsável vários alunos.
    public class AlunoResponsavel
    {
        public int AlunoId { get; private set; }
        public Aluno Aluno { get; private set; } = null!;
        public int ResponsavelId { get; private set; }
        public Responsavel Responsavel { get; private set; } = null!;
        public string Parentesco { get; private set; } = null!;
        public bool Principal { get; private set; }

        private AlunoResponsavel()
        {
        }

        public AlunoResponsavel(Aluno aluno, Responsavel responsavel, string parentesco, bool principal)
        {
            Validacao.NaoNulo(aluno, nameof(aluno));
            Validacao.NaoNulo(responsavel, nameof(responsavel));
            Validacao.Ativo(aluno.Ativo, "O aluno");
            Validacao.Ativo(responsavel.Ativo, "O responsável");

            this.Aluno = aluno;
            this.AlunoId = aluno.Id;
            this.Responsavel = responsavel;
            this.ResponsavelId = responsavel.Id;
            this.Parentesco = Validacao.Texto(parentesco, "Parentesco", 30);
            this.Principal = principal;
        }
    }
}
