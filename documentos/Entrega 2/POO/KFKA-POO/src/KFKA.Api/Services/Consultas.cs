using KFKA.Api.Data;
using KFKA.Api.Domain.Acompanhamentos;
using Microsoft.EntityFrameworkCore;

namespace KFKA.Api.Services
{
    // Consultas usadas por mais de um serviço.
    public static class Consultas
    {
        // Acompanhamentos já com aluno, bimestre, tags, professor, turma e disciplina carregados
        // (o Include faz o JOIN no banco).
        public static IQueryable<Acompanhamento> AcompanhamentosCompletos(KfkaDbContext db)
        {
            return db.Acompanhamentos
                .Include(a => a.Aluno)
                .Include(a => a.Bimestre)
                .Include(a => a.Tags)
                .Include(a => a.VinculoProfessor).ThenInclude(v => v.Professor)
                .Include(a => a.VinculoProfessor).ThenInclude(v => v.Turma)
                .Include(a => a.VinculoProfessor).ThenInclude(v => v.Disciplina);
        }
    }
}
