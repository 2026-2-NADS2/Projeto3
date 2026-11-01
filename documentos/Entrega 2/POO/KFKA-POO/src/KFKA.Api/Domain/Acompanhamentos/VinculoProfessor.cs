using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;

namespace KFKA.Api.Domain.Acompanhamentos
{
    // Liga Professor x Turma x Disciplina em um ano letivo.
    public class VinculoProfessor
    {
        public int Id { get; private set; }
        public int ProfessorId { get; private set; }
        public Professor Professor { get; private set; } = null!;
        public int TurmaId { get; private set; }
        public Turma Turma { get; private set; } = null!;
        public int DisciplinaId { get; private set; }
        public Disciplina Disciplina { get; private set; } = null!;
        public int AnoLetivo { get; private set; }
        public bool Ativo { get; private set; }

        private VinculoProfessor()
        {
        }

        public VinculoProfessor(Professor professor, Turma turma, Disciplina disciplina)
        {
            Validacao.NaoNulo(professor, nameof(professor));
            Validacao.NaoNulo(turma, nameof(turma));
            Validacao.NaoNulo(disciplina, nameof(disciplina));
            Validacao.Ativo(professor.Ativo, "O professor");
            Validacao.Ativo(turma.Ativo, "A turma");
            Validacao.Ativo(disciplina.Ativo, "A disciplina");

            this.Professor = professor;
            this.ProfessorId = professor.Id;
            this.Turma = turma;
            this.TurmaId = turma.Id;
            this.Disciplina = disciplina;
            this.DisciplinaId = disciplina.Id;
            this.AnoLetivo = turma.AnoLetivo;
            this.Ativo = true;
        }

        public bool PertenceA(Professor professor)
        {
            return this.ProfessorId == professor.Id;
        }

        public void Ativar()
        {
            this.Ativo = true;
        }

        public void Desativar()
        {
            this.Ativo = false;
        }
    }
}
