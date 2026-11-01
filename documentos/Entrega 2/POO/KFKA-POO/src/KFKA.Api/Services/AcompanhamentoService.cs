using KFKA.Api.Data;
using KFKA.Api.Domain;
using KFKA.Api.Domain.Acompanhamentos;
using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;
using KFKA.Api.Dtos;
using KFKA.Api.Infra;
using Microsoft.EntityFrameworkCore;

namespace KFKA.Api.Services
{
    // Fluxo do acompanhamento. O professor cria, edita e envia; o administrador
    // revisa, altera, devolve, publica ou cancela.
    // As REGRAS ficam na classe Acompanhamento; aqui só buscamos os dados,
    // chamamos o método da entidade e salvamos.
    public class AcompanhamentoService
    {
        private readonly KfkaDbContext _db;
        private readonly IRelogio _relogio;

        public AcompanhamentoService(KfkaDbContext db, IRelogio relogio)
        {
            _db = db;
            _relogio = relogio;
        }

        // ================= PROFESSOR =================

        public async Task<List<VinculoProfessorResponse>> VinculosDoProfessorAsync(int professorId)
        {
            await BuscarProfessorLogadoAsync(professorId);

            List<VinculoProfessor> vinculos = await _db.VinculosProfessores
                .Include(v => v.Professor)
                .Include(v => v.Turma)
                .Include(v => v.Disciplina)
                .Where(v => v.ProfessorId == professorId && v.Ativo)
                .OrderBy(v => v.Turma.Nome).ThenBy(v => v.Disciplina.Nome)
                .ToListAsync();

            List<VinculoProfessorResponse> resposta = new List<VinculoProfessorResponse>();
            foreach (VinculoProfessor vinculo in vinculos)
            {
                resposta.Add(new VinculoProfessorResponse(vinculo));
            }
            return resposta;
        }

        public async Task<List<AlunoResponse>> AlunosDoVinculoAsync(int professorId, int vinculoId)
        {
            await BuscarProfessorLogadoAsync(professorId);
            VinculoProfessor vinculo = await BuscarVinculoDoProfessorAsync(professorId, vinculoId);

            List<Aluno> alunos = await _db.Alunos
                .Include(a => a.Turma)
                .Where(a => a.TurmaId == vinculo.TurmaId && a.Ativo)
                .OrderBy(a => a.Nome)
                .ToListAsync();

            List<AlunoResponse> resposta = new List<AlunoResponse>();
            foreach (Aluno aluno in alunos)
            {
                resposta.Add(new AlunoResponse(aluno));
            }
            return resposta;
        }

        public async Task<PaginaAcompanhamentos> ListarDoProfessorAsync(int professorId, FiltroAcompanhamentos filtro)
        {
            // O professor só vê os próprios: forçamos o filtro pelo id dele.
            filtro.ProfessorId = professorId;
            return await ListarAsync(filtro);
        }

        public async Task<AcompanhamentoResponse> ObterDoProfessorAsync(int professorId, int id)
        {
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, professorId);
            return new AcompanhamentoResponse(acompanhamento);
        }

        public async Task<AcompanhamentoResponse> CriarAsync(int professorId, CriarAcompanhamentoRequest dados)
        {
            Professor professor = await BuscarProfessorLogadoAsync(professorId);
            VinculoProfessor vinculo = await BuscarVinculoDoProfessorAsync(professorId, dados.VinculoProfessorId);

            Aluno? aluno = await _db.Alunos.FindAsync(dados.AlunoId);
            if (aluno == null)
            {
                throw new NaoEncontradoException("Aluno não encontrado.");
            }

            Bimestre? bimestre = await _db.Bimestres.FindAsync(dados.BimestreId);
            if (bimestre == null)
            {
                throw new NaoEncontradoException("Bimestre não encontrado.");
            }

            List<Tag> tags = await BuscarTagsAsync(dados.TagIds);

            // Só pode existir um acompanhamento (não cancelado) por aluno + disciplina + bimestre.
            bool duplicado = await _db.Acompanhamentos.AnyAsync(a =>
                a.AlunoId == dados.AlunoId
                && a.VinculoProfessorId == dados.VinculoProfessorId
                && a.BimestreId == dados.BimestreId
                && a.Status != StatusAcompanhamento.Cancelado);
            if (duplicado)
            {
                throw new ConflitoException("Já existe um acompanhamento deste aluno nesta disciplina e bimestre.");
            }

            Acompanhamento acompanhamento = new Acompanhamento(aluno, vinculo, bimestre, professor,
                dados.Descricao, dados.Media, tags, _relogio.Agora());

            _db.Acompanhamentos.Add(acompanhamento);
            await _db.SaveChangesAsync();
            return new AcompanhamentoResponse(acompanhamento);
        }

        public async Task<AcompanhamentoResponse> EditarAsync(int professorId, int id, ConteudoAcompanhamentoRequest dados)
        {
            Professor professor = await BuscarProfessorLogadoAsync(professorId);
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, professorId);
            List<Tag> tags = await BuscarTagsAsync(dados.TagIds);

            acompanhamento.EditarRascunho(professor, dados.Descricao, dados.Media, tags, _relogio.Agora());

            await _db.SaveChangesAsync();
            return new AcompanhamentoResponse(acompanhamento);
        }

        public async Task<AcompanhamentoResponse> EnviarParaRevisaoAsync(int professorId, int id)
        {
            Professor professor = await BuscarProfessorLogadoAsync(professorId);
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, professorId);

            acompanhamento.EnviarParaRevisao(professor, _relogio.Agora());

            await _db.SaveChangesAsync();
            return new AcompanhamentoResponse(acompanhamento);
        }

        public async Task<AcompanhamentoResponse> CancelarComoProfessorAsync(int professorId, int id, string motivo)
        {
            Professor professor = await BuscarProfessorLogadoAsync(professorId);
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, professorId);

            acompanhamento.Cancelar(professor, motivo, _relogio.Agora());

            await _db.SaveChangesAsync();
            return new AcompanhamentoResponse(acompanhamento);
        }

        // ================= ADMINISTRADOR =================

        // Lista com filtros e paginação (relatório gerencial).
        public async Task<PaginaAcompanhamentos> ListarAsync(FiltroAcompanhamentos filtro)
        {
            IQueryable<Acompanhamento> consulta = Consultas.AcompanhamentosCompletos(_db);

            if (filtro.Status != null)
            {
                consulta = consulta.Where(a => a.Status == filtro.Status);
            }
            if (filtro.AnoLetivo != null)
            {
                consulta = consulta.Where(a => a.Bimestre.AnoLetivo == filtro.AnoLetivo);
            }
            if (filtro.BimestreId != null)
            {
                consulta = consulta.Where(a => a.BimestreId == filtro.BimestreId);
            }
            if (filtro.TurmaId != null)
            {
                consulta = consulta.Where(a => a.VinculoProfessor.TurmaId == filtro.TurmaId);
            }
            if (filtro.DisciplinaId != null)
            {
                consulta = consulta.Where(a => a.VinculoProfessor.DisciplinaId == filtro.DisciplinaId);
            }
            if (filtro.ProfessorId != null)
            {
                consulta = consulta.Where(a => a.VinculoProfessor.ProfessorId == filtro.ProfessorId);
            }
            if (filtro.AlunoId != null)
            {
                consulta = consulta.Where(a => a.AlunoId == filtro.AlunoId);
            }
            if (filtro.TagId != null)
            {
                consulta = consulta.Where(a => a.Tags.Any(t => t.Id == filtro.TagId));
            }

            // Paginação: limita o tamanho da página entre 1 e 100.
            int pagina = Math.Max(1, filtro.Pagina);
            int tamanho = Math.Clamp(filtro.TamanhoPagina, 1, 100);

            int total = await consulta.CountAsync();
            List<Acompanhamento> acompanhamentos = await consulta
                .OrderByDescending(a => a.AtualizadoEm).ThenByDescending(a => a.Id)
                .Skip((pagina - 1) * tamanho)
                .Take(tamanho)
                .ToListAsync();

            PaginaAcompanhamentos resultado = new PaginaAcompanhamentos();
            resultado.NumeroPagina = pagina;
            resultado.TamanhoPagina = tamanho;
            resultado.TotalItens = total;
            resultado.TotalPaginas = (int)Math.Ceiling(total / (double)tamanho);
            foreach (Acompanhamento acompanhamento in acompanhamentos)
            {
                resultado.Itens.Add(new AcompanhamentoResponse(acompanhamento));
            }
            return resultado;
        }

        public async Task<AcompanhamentoResponse> ObterAsync(int id)
        {
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, null);
            return new AcompanhamentoResponse(acompanhamento);
        }

        public async Task<AcompanhamentoResponse> IniciarRevisaoAsync(int administradorId, int id)
        {
            Administrador administrador = await BuscarAdministradorLogadoAsync(administradorId);
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, null);

            acompanhamento.IniciarRevisao(administrador, _relogio.Agora());

            await _db.SaveChangesAsync();
            return new AcompanhamentoResponse(acompanhamento);
        }

        public async Task<AcompanhamentoResponse> AlterarNaRevisaoAsync(int administradorId, int id, ConteudoAcompanhamentoRequest dados)
        {
            Administrador administrador = await BuscarAdministradorLogadoAsync(administradorId);
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, null);
            List<Tag> tags = await BuscarTagsAsync(dados.TagIds);

            acompanhamento.AlterarNaRevisao(administrador, dados.Descricao, dados.Media, tags, _relogio.Agora());

            await _db.SaveChangesAsync();
            return new AcompanhamentoResponse(acompanhamento);
        }

        public async Task<AcompanhamentoResponse> DevolverAsync(int administradorId, int id, string motivo)
        {
            Administrador administrador = await BuscarAdministradorLogadoAsync(administradorId);
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, null);

            acompanhamento.Devolver(administrador, motivo, _relogio.Agora());

            await _db.SaveChangesAsync();
            return new AcompanhamentoResponse(acompanhamento);
        }

        public async Task<AcompanhamentoResponse> PublicarAsync(int administradorId, int id)
        {
            Administrador administrador = await BuscarAdministradorLogadoAsync(administradorId);
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, null);

            acompanhamento.Publicar(administrador, _relogio.Agora());

            await _db.SaveChangesAsync();
            return new AcompanhamentoResponse(acompanhamento);
        }

        public async Task<AcompanhamentoResponse> CancelarComoAdministradorAsync(int administradorId, int id, string motivo)
        {
            Administrador administrador = await BuscarAdministradorLogadoAsync(administradorId);
            Acompanhamento acompanhamento = await BuscarAcompanhamentoAsync(id, null);

            acompanhamento.Cancelar(administrador, motivo, _relogio.Agora());

            await _db.SaveChangesAsync();
            return new AcompanhamentoResponse(acompanhamento);
        }

        // ================= CONSULTAS COMPARTILHADAS =================

        // professorId = null -> administrador (vê tudo); com valor -> só se for do professor.
        public async Task<List<HistoricoResponse>> HistoricoAsync(int id, int? professorId)
        {
            await BuscarAcompanhamentoAsync(id, professorId);

            List<HistoricoAuditoria> historico = await _db.Historicos
                .Include(h => h.Usuario)
                .Where(h => h.AcompanhamentoId == id)
                .OrderBy(h => h.DataHora).ThenBy(h => h.Id)
                .ToListAsync();

            List<HistoricoResponse> resposta = new List<HistoricoResponse>();
            foreach (HistoricoAuditoria item in historico)
            {
                resposta.Add(new HistoricoResponse(item));
            }
            return resposta;
        }

        // professorId = null -> todos os retornos; com valor -> só das turmas do professor.
        public async Task<List<RetornoResponse>> RetornosAsync(int? professorId)
        {
            IQueryable<RetornoResponsavel> consulta = _db.Retornos
                .Include(r => r.Responsavel)
                .Include(r => r.Acompanhamento).ThenInclude(a => a.Aluno)
                .Include(r => r.Acompanhamento).ThenInclude(a => a.Bimestre)
                .Include(r => r.Acompanhamento).ThenInclude(a => a.VinculoProfessor).ThenInclude(v => v.Disciplina);

            if (professorId != null)
            {
                consulta = consulta.Where(r => r.Acompanhamento.VinculoProfessor.ProfessorId == professorId);
            }

            List<RetornoResponsavel> retornos = await consulta.OrderByDescending(r => r.CienteEm).ToListAsync();

            List<RetornoResponse> resposta = new List<RetornoResponse>();
            foreach (RetornoResponsavel retorno in retornos)
            {
                resposta.Add(new RetornoResponse(retorno));
            }
            return resposta;
        }

        // ================= BUSCAS AUXILIARES =================

        private async Task<Professor> BuscarProfessorLogadoAsync(int id)
        {
            Professor? professor = await _db.Professores.FindAsync(id);
            if (professor == null || !professor.Ativo)
            {
                throw new AcessoNegadoException("Professor inativo ou inexistente.");
            }
            return professor;
        }

        private async Task<Administrador> BuscarAdministradorLogadoAsync(int id)
        {
            Administrador? administrador = await _db.Administradores.FindAsync(id);
            if (administrador == null || !administrador.Ativo)
            {
                throw new AcessoNegadoException("Administrador inativo ou inexistente.");
            }
            return administrador;
        }

        // Se professorId vier preenchido, acompanhamentos de outros professores
        // são tratados como "não encontrados" (não revelamos que existem).
        private async Task<Acompanhamento> BuscarAcompanhamentoAsync(int id, int? professorId)
        {
            Acompanhamento? acompanhamento = await Consultas.AcompanhamentosCompletos(_db)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (acompanhamento == null)
            {
                throw new NaoEncontradoException("Acompanhamento não encontrado.");
            }
            if (professorId != null && acompanhamento.VinculoProfessor.ProfessorId != professorId)
            {
                throw new NaoEncontradoException("Acompanhamento não encontrado.");
            }
            return acompanhamento;
        }

        private async Task<VinculoProfessor> BuscarVinculoDoProfessorAsync(int professorId, int vinculoId)
        {
            VinculoProfessor? vinculo = await _db.VinculosProfessores
                .Include(v => v.Professor)
                .Include(v => v.Turma)
                .Include(v => v.Disciplina)
                .FirstOrDefaultAsync(v => v.Id == vinculoId && v.ProfessorId == professorId);

            if (vinculo == null)
            {
                throw new NaoEncontradoException("Vínculo não encontrado para este professor.");
            }
            return vinculo;
        }

        private async Task<List<Tag>> BuscarTagsAsync(List<int> ids)
        {
            List<int> idsSemRepeticao = ids.Distinct().ToList();
            List<Tag> tags = await _db.Tags.Where(t => idsSemRepeticao.Contains(t.Id)).ToListAsync();

            if (tags.Count != idsSemRepeticao.Count)
            {
                throw new NaoEncontradoException("Uma ou mais tags não foram encontradas.");
            }
            return tags;
        }
    }
}
