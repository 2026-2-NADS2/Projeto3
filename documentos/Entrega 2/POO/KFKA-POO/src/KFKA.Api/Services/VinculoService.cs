using KFKA.Api.Data;
using KFKA.Api.Domain;
using KFKA.Api.Domain.Acompanhamentos;
using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;
using KFKA.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace KFKA.Api.Services
{
    // Vínculos Professor x Turma x Disciplina e Aluno x Responsável.
    public class VinculoService
    {
        private readonly KfkaDbContext _db;

        public VinculoService(KfkaDbContext db)
        {
            _db = db;
        }

        // ---------- Professor x Turma x Disciplina ----------

        public async Task<List<VinculoProfessorResponse>> ListarVinculosProfessoresAsync(int? professorId, int? turmaId)
        {
            IQueryable<VinculoProfessor> consulta = _db.VinculosProfessores
                .Include(v => v.Professor)
                .Include(v => v.Turma)
                .Include(v => v.Disciplina);

            if (professorId != null)
            {
                consulta = consulta.Where(v => v.ProfessorId == professorId);
            }
            if (turmaId != null)
            {
                consulta = consulta.Where(v => v.TurmaId == turmaId);
            }

            List<VinculoProfessor> vinculos = await consulta
                .OrderBy(v => v.AnoLetivo).ThenBy(v => v.Turma.Nome).ThenBy(v => v.Disciplina.Nome)
                .ToListAsync();

            List<VinculoProfessorResponse> resposta = new List<VinculoProfessorResponse>();
            foreach (VinculoProfessor vinculo in vinculos)
            {
                resposta.Add(new VinculoProfessorResponse(vinculo));
            }
            return resposta;
        }

        public async Task<VinculoProfessorResponse> CriarVinculoProfessorAsync(VinculoProfessorRequest dados)
        {
            Professor? professor = await _db.Professores.FindAsync(dados.ProfessorId);
            if (professor == null)
            {
                throw new NaoEncontradoException("Professor não encontrado.");
            }

            Turma? turma = await _db.Turmas.FindAsync(dados.TurmaId);
            if (turma == null)
            {
                throw new NaoEncontradoException("Turma não encontrada.");
            }

            Disciplina? disciplina = await _db.Disciplinas.FindAsync(dados.DisciplinaId);
            if (disciplina == null)
            {
                throw new NaoEncontradoException("Disciplina não encontrada.");
            }

            bool duplicado = await _db.VinculosProfessores.AnyAsync(v =>
                v.ProfessorId == professor.Id && v.TurmaId == turma.Id && v.DisciplinaId == disciplina.Id
                && v.AnoLetivo == turma.AnoLetivo);
            if (duplicado)
            {
                throw new ConflitoException("Este vínculo já existe. Se estiver inativo, reative-o.");
            }

            // Regra: cada disciplina de uma turma tem um único professor ativo no ano.
            bool disciplinaOcupada = await _db.VinculosProfessores.AnyAsync(v =>
                v.TurmaId == turma.Id && v.DisciplinaId == disciplina.Id && v.AnoLetivo == turma.AnoLetivo && v.Ativo);
            if (disciplinaOcupada)
            {
                throw new ConflitoException("Esta disciplina já possui um professor ativo nesta turma.");
            }

            VinculoProfessor vinculo = new VinculoProfessor(professor, turma, disciplina);
            _db.VinculosProfessores.Add(vinculo);
            await _db.SaveChangesAsync();
            return new VinculoProfessorResponse(vinculo);
        }

        public async Task<VinculoProfessorResponse> AlterarSituacaoVinculoProfessorAsync(int id, bool ativo)
        {
            VinculoProfessor? vinculo = await _db.VinculosProfessores
                .Include(v => v.Professor)
                .Include(v => v.Turma)
                .Include(v => v.Disciplina)
                .FirstOrDefaultAsync(v => v.Id == id);
            if (vinculo == null)
            {
                throw new NaoEncontradoException("Vínculo não encontrado.");
            }

            if (ativo)
            {
                bool disciplinaOcupada = await _db.VinculosProfessores.AnyAsync(v =>
                    v.TurmaId == vinculo.TurmaId && v.DisciplinaId == vinculo.DisciplinaId
                    && v.AnoLetivo == vinculo.AnoLetivo && v.Ativo && v.Id != vinculo.Id);
                if (disciplinaOcupada)
                {
                    throw new ConflitoException("Esta disciplina já possui um professor ativo nesta turma.");
                }
                vinculo.Ativar();
            }
            else
            {
                vinculo.Desativar();
            }

            await _db.SaveChangesAsync();
            return new VinculoProfessorResponse(vinculo);
        }

        // ---------- Aluno x Responsável ----------

        public async Task<List<VinculoResponsavelResponse>> ListarVinculosResponsaveisAsync(int? alunoId, int? responsavelId)
        {
            IQueryable<AlunoResponsavel> consulta = _db.AlunosResponsaveis
                .Include(v => v.Aluno)
                .Include(v => v.Responsavel);

            if (alunoId != null)
            {
                consulta = consulta.Where(v => v.AlunoId == alunoId);
            }
            if (responsavelId != null)
            {
                consulta = consulta.Where(v => v.ResponsavelId == responsavelId);
            }

            List<AlunoResponsavel> vinculos = await consulta.OrderBy(v => v.Aluno.Nome).ToListAsync();

            List<VinculoResponsavelResponse> resposta = new List<VinculoResponsavelResponse>();
            foreach (AlunoResponsavel vinculo in vinculos)
            {
                resposta.Add(new VinculoResponsavelResponse(vinculo));
            }
            return resposta;
        }

        public async Task<VinculoResponsavelResponse> CriarVinculoResponsavelAsync(VinculoResponsavelRequest dados)
        {
            Aluno? aluno = await _db.Alunos.FindAsync(dados.AlunoId);
            if (aluno == null)
            {
                throw new NaoEncontradoException("Aluno não encontrado.");
            }

            Responsavel? responsavel = await _db.Responsaveis.FindAsync(dados.ResponsavelId);
            if (responsavel == null)
            {
                throw new NaoEncontradoException("Responsável não encontrado.");
            }

            bool duplicado = await _db.AlunosResponsaveis.AnyAsync(v =>
                v.AlunoId == aluno.Id && v.ResponsavelId == responsavel.Id);
            if (duplicado)
            {
                throw new ConflitoException("Este responsável já está vinculado ao aluno.");
            }

            AlunoResponsavel vinculo = new AlunoResponsavel(aluno, responsavel, dados.Parentesco, dados.Principal);
            _db.AlunosResponsaveis.Add(vinculo);
            await _db.SaveChangesAsync();
            return new VinculoResponsavelResponse(vinculo);
        }

        public async Task RemoverVinculoResponsavelAsync(int alunoId, int responsavelId)
        {
            AlunoResponsavel? vinculo = await _db.AlunosResponsaveis
                .FirstOrDefaultAsync(v => v.AlunoId == alunoId && v.ResponsavelId == responsavelId);
            if (vinculo == null)
            {
                throw new NaoEncontradoException("Vínculo não encontrado.");
            }

            _db.AlunosResponsaveis.Remove(vinculo);
            await _db.SaveChangesAsync();
        }
    }
}
