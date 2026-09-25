using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace KFKASolution
{
    internal class SistemaKFKA
    {
        private readonly List<Aluno> alunos = new List<Aluno>();
        private readonly List<Professor> professores = new List<Professor>();
        private readonly List<Acompanhamento> acompanhamentos = new List<Acompanhamento>();
        private readonly List<Responsavel> responsaveis = new List<Responsavel>();
        private readonly List<Turma> turmas = new List<Turma>();
        private readonly List<Disciplina> disciplinas = new List<Disciplina>();
        private readonly List<Bimestre> bimestres = new List<Bimestre>();


        private readonly List<AlunoResponsavel> vinculosResponsaveis = new List<AlunoResponsavel>();
        private readonly List<VinculoProfessor> vinculosProfessores = new List<VinculoProfessor>();

        public List<Acompanhamento> ConsultarAcompanhamentos(Responsavel responsavel)
        {
            if (responsavel == null ||
                responsavel.Ativo == false)
            {
                throw new InvalidOperationException("Responsável inválido.");
            }
            if (!responsaveis.Contains(responsavel))
            {
                throw new InvalidOperationException("Responsável não cadastrado.");
            }

            List<Acompanhamento> resultado = new List<Acompanhamento>();

            foreach (Acompanhamento acompanhamento in acompanhamentos)
            {
                if (acompanhamento.Status == "PUBLICADO" && 
                    vinculosResponsaveis.Exists(v => v.Responsavel.IdResponsavel == responsavel.IdResponsavel &&
                    v.Aluno.IdAluno == acompanhamento.Aluno.IdAluno))
                {
                    resultado.Add(acompanhamento);
                }
            }

            return resultado;
        }

        public void CadastrarAluno(Administrador administrador, Aluno aluno)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (aluno == null)
            {
                throw new ArgumentNullException(nameof(aluno));
            }
            if (!turmas.Contains(aluno.Turma))
            {
                throw new InvalidOperationException("Turma do aluno não cadastrada.");
            }

            foreach (Aluno alunoExistente in alunos)
            {
                if (alunoExistente.IdAluno == aluno.IdAluno || alunoExistente.Matricula == aluno.Matricula)
                {
                    throw new InvalidOperationException("Aluno já cadastrado.");
                }
            }

            this.alunos.Add(aluno);
        }

        public void CadastrarResponsavel(Administrador administrador, Responsavel responsavel)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (responsavel == null)
            {
                throw new ArgumentNullException(nameof(responsavel));
            }
            foreach (Responsavel responsavelExistente in responsaveis)
            {
                if (responsavelExistente.IdResponsavel == responsavel.IdResponsavel ||
                    responsavelExistente.Cpf == responsavel.Cpf)
                {
                    throw new InvalidOperationException("Responsável já cadastrado.");
                }
            }
            this.responsaveis.Add(responsavel);
        }

        public void CadastrarProfessor(Administrador administrador, Professor professor)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (professor == null)
            {
                throw new ArgumentNullException(nameof(professor));
            }
            foreach (Professor professorExistente in professores)
            {
                if (professorExistente.IdProfessor == professor.IdProfessor ||
                    professorExistente.Matricula == professor.Matricula ||
                    professorExistente.IdUsuario == professor.IdUsuario)
                {
                    throw new InvalidOperationException("Professor já cadastrado.");
                }
            }
            this.professores.Add(professor);
        }

        public void CadastrarTurma(Administrador administrador, Turma turma)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (turma == null)
            {
                throw new ArgumentNullException(nameof(turma));
            }
            foreach (Turma turmaExistente in turmas)
            {
                if (turmaExistente.IdTurma == turma.IdTurma ||
                    turmaExistente.Nome == turma.Nome &&
                    turmaExistente.AnoLetivo == turma.AnoLetivo)
                {
                    throw new InvalidOperationException("Turma já cadastrada.");
                }
            }
            this.turmas.Add(turma);
        }

        public void CadastrarDisciplina(Administrador administrador, Disciplina disciplina)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (disciplina == null)
            {
                throw new ArgumentNullException(nameof(disciplina));
            }
            foreach (Disciplina disciplinaExistente in disciplinas)
            {
                if (disciplinaExistente.IdDisciplina == disciplina.IdDisciplina)
                {
                    throw new InvalidOperationException("Disciplina já cadastrada.");
                }
            }
            this.disciplinas.Add(disciplina);
        }

        public void CadastrarBimestre(Administrador administrador, Bimestre bimestre)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (bimestre == null)
            {
                throw new ArgumentNullException(nameof(bimestre));
            }
            foreach (Bimestre bimestreExistente in bimestres)
            {
                if (bimestreExistente.IdBimestre == bimestre.IdBimestre ||
                    (bimestreExistente.Numero == bimestre.Numero &&
                    bimestreExistente.AnoLetivo == bimestre.AnoLetivo))
                {
                    throw new InvalidOperationException("Bimestre já cadastrado.");
                }
            }
            this.bimestres.Add(bimestre);
        }


        public void VincularAlunoResponsavel(Administrador administrador, AlunoResponsavel vinculo)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (vinculo == null)
            {
                throw new ArgumentNullException(nameof(vinculo));
            }
            if (!alunos.Contains(vinculo.Aluno))
            {
                throw new InvalidOperationException("Aluno não cadastrado.");
            }
            if (!responsaveis.Contains(vinculo.Responsavel))
            {
                throw new InvalidOperationException("Responsável não cadastrado.");
            }
            foreach (AlunoResponsavel vinculoExistente in vinculosResponsaveis)
            {
                if (vinculoExistente.Aluno == vinculo.Aluno &&
                    vinculoExistente.Responsavel == vinculo.Responsavel)
                {
                    throw new InvalidOperationException("Vínculo já existente.");
                }
            }
            this.vinculosResponsaveis.Add(vinculo);
        }

        public void VincularProfessor(Administrador administrador, VinculoProfessor vinculo)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (vinculo == null)
            {
                throw new ArgumentNullException(nameof(vinculo));
            }
            if (!professores.Contains(vinculo.Professor))
            {
                throw new InvalidOperationException("Professor não cadastrado.");
            }
            if (!disciplinas.Contains(vinculo.Disciplina))
            {
                throw new InvalidOperationException("Disciplina não cadastrada.");
            }
            if (!turmas.Contains(vinculo.Turma))
            {
                throw new InvalidOperationException("Turma não cadastrada.");
            }
            if (vinculo.AnoLetivo != vinculo.Turma.AnoLetivo)
            {
                throw new InvalidOperationException("Ano letivo diferente do ano da turma.");
            }
            foreach (VinculoProfessor vinculoExistente in vinculosProfessores)
            {
                if (vinculoExistente.IdVinculo == vinculo.IdVinculo ||
                   (vinculoExistente.Professor.IdProfessor == vinculo.Professor.IdProfessor &&
                   vinculoExistente.Disciplina.IdDisciplina == vinculo.Disciplina.IdDisciplina &&
                   vinculoExistente.Turma.IdTurma == vinculo.Turma.IdTurma &&
                   vinculoExistente.AnoLetivo == vinculo.AnoLetivo))
                {
                    throw new InvalidOperationException("Vínculo já existente.");
                }
            }
            this.vinculosProfessores.Add(vinculo);
        }

        public void RegistrarAcompanhamento(Professor professor, Acompanhamento acompanhamento)
        {
            if (professor == null || professor.Ativo == false)
            {
                throw new InvalidOperationException("Professor inválido.");
            }
            if (acompanhamento == null)
            {
                throw new ArgumentNullException(nameof(acompanhamento));
            }
            if (!vinculosProfessores.Contains(acompanhamento.VinculoProfessor) ||
                acompanhamento.VinculoProfessor.Professor != professor)
            {
                throw new InvalidOperationException(
                    "Professor não vinculado à turma e disciplina do acompanhamento.");
            }
            if (!alunos.Contains(acompanhamento.Aluno))
            {
                throw new InvalidOperationException("Aluno não cadastrado.");
            }
            if (!bimestres.Contains(acompanhamento.Bimestre))
            {
                throw new InvalidOperationException("Bimestre não cadastrado.");
            }
            if (acompanhamento.Aluno.Turma != acompanhamento.VinculoProfessor.Turma)
            {
                throw new InvalidOperationException("Turma do aluno diferente da turma do vínculo.");
            }
            if (acompanhamento.Bimestre.AnoLetivo !=
                acompanhamento.VinculoProfessor.AnoLetivo)
            {
                throw new InvalidOperationException("Bimestre e vínculo pertencem a anos letivos diferentes.");
            }

            DateTime agora = DateTime.Now;

            if (agora < acompanhamento.Bimestre.DataInicio ||
                agora > acompanhamento.Bimestre.DataFim)
            {
                throw new InvalidOperationException("Acompanhamento fora do período do bimestre.");
            }

            foreach (Acompanhamento a in acompanhamentos)
            {
                if (a.IdAcompanhamento == acompanhamento.IdAcompanhamento ||
                    (a.Aluno == acompanhamento.Aluno &&
                    a.Bimestre == acompanhamento.Bimestre &&
                    a.VinculoProfessor == acompanhamento.VinculoProfessor))
                {
                    throw new InvalidOperationException("Acompanhamento já registrado.");
                }
            }
            acompanhamentos.Add(acompanhamento);
        }

        public void EnviarAcompanhamentoParaRevisao(Professor professor, Acompanhamento acompanhamento)
        {
            if (professor == null || professor.Ativo == false)
            {
                throw new InvalidOperationException("Professor inválido.");
            }
            if (acompanhamento == null)
            {
                throw new ArgumentNullException(nameof(acompanhamento));
            }
            if (!acompanhamentos.Contains(acompanhamento))
            {
                throw new InvalidOperationException("Acompanhamento não registrado.");
            }
            if (acompanhamento.VinculoProfessor.Professor != professor)
            {
                throw new InvalidOperationException("Professor não vinculado ao acompanhamento.");
            }
            acompanhamento.EnviarParaRevisao();

        }

        public void IniciarRevisaoAcompanhamento(Administrador administrador, Acompanhamento acompanhamento)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (acompanhamento == null)
            {
                throw new ArgumentNullException(nameof(acompanhamento));
            }
            if (!acompanhamentos.Contains(acompanhamento))
            {
                throw new InvalidOperationException("Acompanhamento não registrado.");
            }
            acompanhamento.IniciarRevisao();
        }

        public void PublicarAcompanhamento(Administrador administrador, Acompanhamento acompanhamento)
        {
            if (administrador == null || administrador.Ativo == false)
            {
                throw new InvalidOperationException("Administrador inválido.");
            }
            if (acompanhamento == null)
            {
                throw new ArgumentNullException(nameof(acompanhamento));
            }
            if (!acompanhamentos.Contains(acompanhamento))
            {
                throw new InvalidOperationException("Acompanhamento não registrado.");
            }
            acompanhamento.Publicar();
        }
    }
}
