using KFKA.Api.Data;
using KFKA.Api.Domain;
using KFKA.Api.Domain.Acompanhamentos;
using KFKA.Api.Domain.Usuarios;
using KFKA.Api.Dtos;
using KFKA.Api.Infra;
using Microsoft.EntityFrameworkCore;

namespace KFKA.Api.Services
{
    // Módulo Pai/Responsável: só vê relatórios PUBLICADOS dos alunos vinculados a ele.
    public class ResponsavelService
    {
        private readonly KfkaDbContext _db;
        private readonly IRelogio _relogio;

        public ResponsavelService(KfkaDbContext db, IRelogio relogio)
        {
            _db = db;
            _relogio = relogio;
        }

        public async Task<List<AlunoResponse>> MeusAlunosAsync(int responsavelId)
        {
            await BuscarResponsavelLogadoAsync(responsavelId);

            List<AlunoResponsavel> vinculos = await _db.AlunosResponsaveis
                .Include(v => v.Aluno).ThenInclude(a => a.Turma)
                .Where(v => v.ResponsavelId == responsavelId && v.Aluno.Ativo)
                .OrderBy(v => v.Aluno.Nome)
                .ToListAsync();

            List<AlunoResponse> resposta = new List<AlunoResponse>();
            foreach (AlunoResponsavel vinculo in vinculos)
            {
                resposta.Add(new AlunoResponse(vinculo.Aluno));
            }
            return resposta;
        }

        public async Task<List<RelatorioPublicadoResponse>> RelatoriosAsync(int responsavelId, int? alunoId,
            int? anoLetivo, int? bimestre, int? disciplinaId)
        {
            await BuscarResponsavelLogadoAsync(responsavelId);

            IQueryable<Acompanhamento> consulta = PublicadosDoResponsavel(responsavelId);
            if (alunoId != null)
            {
                consulta = consulta.Where(a => a.AlunoId == alunoId);
            }
            if (anoLetivo != null)
            {
                consulta = consulta.Where(a => a.Bimestre.AnoLetivo == anoLetivo);
            }
            if (bimestre != null)
            {
                consulta = consulta.Where(a => a.Bimestre.Numero == bimestre);
            }
            if (disciplinaId != null)
            {
                consulta = consulta.Where(a => a.VinculoProfessor.DisciplinaId == disciplinaId);
            }

            List<Acompanhamento> relatorios = await consulta
                .OrderBy(a => a.Aluno.Nome).ThenByDescending(a => a.Bimestre.Numero)
                .ToListAsync();

            List<RelatorioPublicadoResponse> resposta = new List<RelatorioPublicadoResponse>();
            foreach (Acompanhamento relatorio in relatorios)
            {
                DateTime? cienteEm = await DataDaCienciaAsync(responsavelId, relatorio.Id);
                resposta.Add(new RelatorioPublicadoResponse(relatorio, cienteEm));
            }
            return resposta;
        }

        public async Task<RelatorioPublicadoResponse> RelatorioAsync(int responsavelId, int id)
        {
            await BuscarResponsavelLogadoAsync(responsavelId);
            Acompanhamento acompanhamento = await BuscarPublicadoAsync(responsavelId, id);

            DateTime? cienteEm = await DataDaCienciaAsync(responsavelId, id);
            return new RelatorioPublicadoResponse(acompanhamento, cienteEm);
        }

        public async Task<RetornoResponse> RegistrarCienciaAsync(int responsavelId, int id, string? observacao)
        {
            Responsavel responsavel = await BuscarResponsavelLogadoAsync(responsavelId);
            Acompanhamento acompanhamento = await BuscarPublicadoAsync(responsavelId, id);

            bool jaRegistrou = await _db.Retornos.AnyAsync(r => r.AcompanhamentoId == id && r.ResponsavelId == responsavelId);
            if (jaRegistrou)
            {
                throw new ConflitoException("A ciência deste relatório já foi registrada.");
            }

            RetornoResponsavel retorno = new RetornoResponsavel(acompanhamento, responsavel, observacao, _relogio.Agora());
            _db.Retornos.Add(retorno);
            await _db.SaveChangesAsync();
            return new RetornoResponse(retorno);
        }

        // ---------- Auxiliares ----------

        // Publicados E de alunos vinculados a este responsável.
        private IQueryable<Acompanhamento> PublicadosDoResponsavel(int responsavelId)
        {
            return Consultas.AcompanhamentosCompletos(_db).Where(a =>
                a.Status == StatusAcompanhamento.Publicado
                && _db.AlunosResponsaveis.Any(v => v.ResponsavelId == responsavelId && v.AlunoId == a.AlunoId));
        }

        private async Task<Acompanhamento> BuscarPublicadoAsync(int responsavelId, int id)
        {
            Acompanhamento? acompanhamento = await PublicadosDoResponsavel(responsavelId).FirstOrDefaultAsync(a => a.Id == id);
            if (acompanhamento == null)
            {
                throw new NaoEncontradoException("Relatório não encontrado.");
            }
            return acompanhamento;
        }

        private async Task<DateTime?> DataDaCienciaAsync(int responsavelId, int acompanhamentoId)
        {
            RetornoResponsavel? retorno = await _db.Retornos
                .FirstOrDefaultAsync(r => r.AcompanhamentoId == acompanhamentoId && r.ResponsavelId == responsavelId);

            if (retorno == null)
            {
                return null;
            }
            return retorno.CienteEm;
        }

        private async Task<Responsavel> BuscarResponsavelLogadoAsync(int id)
        {
            Responsavel? responsavel = await _db.Responsaveis.FindAsync(id);
            if (responsavel == null || !responsavel.Ativo)
            {
                throw new AcessoNegadoException("Responsável inativo ou inexistente.");
            }
            return responsavel;
        }
    }
}
