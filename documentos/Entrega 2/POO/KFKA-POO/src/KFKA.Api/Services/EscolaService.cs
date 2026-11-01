using KFKA.Api.Data;
using KFKA.Api.Domain;
using KFKA.Api.Domain.Escola;
using KFKA.Api.Dtos;
using KFKA.Api.Infra;
using Microsoft.EntityFrameworkCore;

namespace KFKA.Api.Services
{
    // Estrutura escolar: áreas, disciplinas, turmas, alunos, tags e bimestres.
    public class EscolaService
    {
        private readonly KfkaDbContext _db;
        private readonly IRelogio _relogio;

        public EscolaService(KfkaDbContext db, IRelogio relogio)
        {
            _db = db;
            _relogio = relogio;
        }

        // ---------- Áreas ----------

        public async Task<List<AreaResponse>> ListarAreasAsync()
        {
            List<Area> areas = await _db.Areas.OrderBy(a => a.Nome).ToListAsync();

            List<AreaResponse> resposta = new List<AreaResponse>();
            foreach (Area area in areas)
            {
                resposta.Add(new AreaResponse(area));
            }
            return resposta;
        }

        public async Task<AreaResponse> CriarAreaAsync(AreaRequest dados)
        {
            Area area = new Area(dados.Nome);

            bool existe = await _db.Areas.AnyAsync(a => a.Nome.ToLower() == area.Nome.ToLower());
            if (existe)
            {
                throw new ConflitoException("Já existe uma área com este nome.");
            }

            _db.Areas.Add(area);
            await _db.SaveChangesAsync();
            return new AreaResponse(area);
        }

        // ---------- Disciplinas ----------

        public async Task<List<DisciplinaResponse>> ListarDisciplinasAsync(int? areaId)
        {
            IQueryable<Disciplina> consulta = _db.Disciplinas.Include(d => d.Area);
            if (areaId != null)
            {
                consulta = consulta.Where(d => d.AreaId == areaId);
            }

            List<Disciplina> disciplinas = await consulta.OrderBy(d => d.Nome).ToListAsync();

            List<DisciplinaResponse> resposta = new List<DisciplinaResponse>();
            foreach (Disciplina disciplina in disciplinas)
            {
                resposta.Add(new DisciplinaResponse(disciplina));
            }
            return resposta;
        }

        public async Task<DisciplinaResponse> CriarDisciplinaAsync(DisciplinaRequest dados)
        {
            Area? area = await _db.Areas.FindAsync(dados.AreaId);
            if (area == null)
            {
                throw new NaoEncontradoException("Área não encontrada.");
            }

            Disciplina disciplina = new Disciplina(dados.Nome, area);

            bool existe = await _db.Disciplinas.AnyAsync(d => d.Nome.ToLower() == disciplina.Nome.ToLower());
            if (existe)
            {
                throw new ConflitoException("Já existe uma disciplina com este nome.");
            }

            _db.Disciplinas.Add(disciplina);
            await _db.SaveChangesAsync();
            return new DisciplinaResponse(disciplina);
        }

        public async Task<DisciplinaResponse> AlterarSituacaoDisciplinaAsync(int id, bool ativo)
        {
            Disciplina? disciplina = await _db.Disciplinas.Include(d => d.Area).FirstOrDefaultAsync(d => d.Id == id);
            if (disciplina == null)
            {
                throw new NaoEncontradoException("Disciplina não encontrada.");
            }

            if (ativo)
            {
                disciplina.Ativar();
            }
            else
            {
                disciplina.Desativar();
            }

            await _db.SaveChangesAsync();
            return new DisciplinaResponse(disciplina);
        }

        // ---------- Turmas ----------

        public async Task<List<TurmaResponse>> ListarTurmasAsync(int? anoLetivo)
        {
            IQueryable<Turma> consulta = _db.Turmas;
            if (anoLetivo != null)
            {
                consulta = consulta.Where(t => t.AnoLetivo == anoLetivo);
            }

            List<Turma> turmas = await consulta.OrderBy(t => t.AnoLetivo).ThenBy(t => t.Nome).ToListAsync();

            List<TurmaResponse> resposta = new List<TurmaResponse>();
            foreach (Turma turma in turmas)
            {
                resposta.Add(new TurmaResponse(turma));
            }
            return resposta;
        }

        public async Task<TurmaResponse> CriarTurmaAsync(TurmaRequest dados)
        {
            Turma turma = new Turma(dados.Nome, dados.Serie, dados.AnoLetivo);

            bool existe = await _db.Turmas.AnyAsync(t => t.Nome.ToLower() == turma.Nome.ToLower()
                                                       && t.AnoLetivo == turma.AnoLetivo);
            if (existe)
            {
                throw new ConflitoException("Já existe uma turma com este nome neste ano letivo.");
            }

            _db.Turmas.Add(turma);
            await _db.SaveChangesAsync();
            return new TurmaResponse(turma);
        }

        public async Task<TurmaResponse> AlterarSituacaoTurmaAsync(int id, bool ativo)
        {
            Turma turma = await BuscarTurmaAsync(id);
            if (ativo)
            {
                turma.Ativar();
            }
            else
            {
                turma.Desativar();
            }

            await _db.SaveChangesAsync();
            return new TurmaResponse(turma);
        }

        // ---------- Alunos ----------

        public async Task<List<AlunoResponse>> ListarAlunosAsync(int? turmaId, string? busca)
        {
            IQueryable<Aluno> consulta = _db.Alunos.Include(a => a.Turma);

            if (turmaId != null)
            {
                consulta = consulta.Where(a => a.TurmaId == turmaId);
            }

            if (!string.IsNullOrWhiteSpace(busca))
            {
                string termo = busca.Trim().ToLower();
                consulta = consulta.Where(a => a.Nome.ToLower().Contains(termo) || a.Matricula.ToLower() == termo);
            }

            List<Aluno> alunos = await consulta.OrderBy(a => a.Nome).ToListAsync();

            List<AlunoResponse> resposta = new List<AlunoResponse>();
            foreach (Aluno aluno in alunos)
            {
                resposta.Add(new AlunoResponse(aluno));
            }
            return resposta;
        }

        public async Task<AlunoResponse> ObterAlunoAsync(int id)
        {
            Aluno aluno = await BuscarAlunoAsync(id);
            return new AlunoResponse(aluno);
        }

        public async Task<AlunoResponse> CriarAlunoAsync(AlunoRequest dados)
        {
            Turma turma = await BuscarTurmaAsync(dados.TurmaId);
            Aluno aluno = new Aluno(dados.Nome, dados.Matricula, dados.DataNascimento, turma);

            bool existe = await _db.Alunos.AnyAsync(a => a.Matricula == aluno.Matricula);
            if (existe)
            {
                throw new ConflitoException("Já existe um aluno com esta matrícula.");
            }

            _db.Alunos.Add(aluno);
            await _db.SaveChangesAsync();
            return new AlunoResponse(aluno);
        }

        public async Task<AlunoResponse> AtualizarAlunoAsync(int id, AtualizarAlunoRequest dados)
        {
            Aluno aluno = await BuscarAlunoAsync(id);
            aluno.AtualizarDados(dados.Nome, dados.DataNascimento);

            if (aluno.TurmaId != dados.TurmaId)
            {
                Turma novaTurma = await BuscarTurmaAsync(dados.TurmaId);
                aluno.TransferirPara(novaTurma);
            }

            await _db.SaveChangesAsync();
            return new AlunoResponse(aluno);
        }

        public async Task<AlunoResponse> AlterarSituacaoAlunoAsync(int id, bool ativo)
        {
            Aluno aluno = await BuscarAlunoAsync(id);
            if (ativo)
            {
                aluno.Ativar();
            }
            else
            {
                aluno.Desativar();
            }

            await _db.SaveChangesAsync();
            return new AlunoResponse(aluno);
        }

        // ---------- Tags ----------

        public async Task<List<TagResponse>> ListarTagsAsync(bool somenteAtivas)
        {
            IQueryable<Tag> consulta = _db.Tags;
            if (somenteAtivas)
            {
                consulta = consulta.Where(t => t.Ativo);
            }

            List<Tag> tags = await consulta.OrderBy(t => t.Nome).ToListAsync();

            List<TagResponse> resposta = new List<TagResponse>();
            foreach (Tag tag in tags)
            {
                resposta.Add(new TagResponse(tag));
            }
            return resposta;
        }

        public async Task<TagResponse> CriarTagAsync(TagRequest dados)
        {
            Tag tag = new Tag(dados.Nome, dados.Descricao);

            bool existe = await _db.Tags.AnyAsync(t => t.Nome.ToLower() == tag.Nome.ToLower());
            if (existe)
            {
                throw new ConflitoException("Já existe uma tag com este nome.");
            }

            _db.Tags.Add(tag);
            await _db.SaveChangesAsync();
            return new TagResponse(tag);
        }

        public async Task<TagResponse> AlterarSituacaoTagAsync(int id, bool ativo)
        {
            Tag? tag = await _db.Tags.FindAsync(id);
            if (tag == null)
            {
                throw new NaoEncontradoException("Tag não encontrada.");
            }

            if (ativo)
            {
                tag.Ativar();
            }
            else
            {
                tag.Desativar();
            }

            await _db.SaveChangesAsync();
            return new TagResponse(tag);
        }

        // ---------- Bimestres ----------

        public async Task<List<BimestreResponse>> ListarBimestresAsync(int? anoLetivo)
        {
            IQueryable<Bimestre> consulta = _db.Bimestres;
            if (anoLetivo != null)
            {
                consulta = consulta.Where(b => b.AnoLetivo == anoLetivo);
            }

            List<Bimestre> bimestres = await consulta.OrderBy(b => b.AnoLetivo).ThenBy(b => b.Numero).ToListAsync();

            DateTime agora = _relogio.Agora();
            List<BimestreResponse> resposta = new List<BimestreResponse>();
            foreach (Bimestre bimestre in bimestres)
            {
                resposta.Add(new BimestreResponse(bimestre, agora));
            }
            return resposta;
        }

        public async Task<BimestreResponse> CriarBimestreAsync(BimestreRequest dados)
        {
            Bimestre bimestre = new Bimestre(dados.Numero, dados.AnoLetivo,
                dados.AberturaDigitacao.UtcDateTime, dados.EncerramentoDigitacao.UtcDateTime);

            bool existe = await _db.Bimestres.AnyAsync(b => b.Numero == dados.Numero && b.AnoLetivo == dados.AnoLetivo);
            if (existe)
            {
                throw new ConflitoException("O " + dados.Numero + "º bimestre de " + dados.AnoLetivo + " já está cadastrado.");
            }

            _db.Bimestres.Add(bimestre);
            await _db.SaveChangesAsync();
            return new BimestreResponse(bimestre, _relogio.Agora());
        }

        public async Task<BimestreResponse> DefinirPeriodoAsync(int id, PeriodoDigitacaoRequest dados)
        {
            Bimestre? bimestre = await _db.Bimestres.FindAsync(id);
            if (bimestre == null)
            {
                throw new NaoEncontradoException("Bimestre não encontrado.");
            }

            bimestre.DefinirPeriodoDigitacao(dados.AberturaDigitacao.UtcDateTime, dados.EncerramentoDigitacao.UtcDateTime);
            await _db.SaveChangesAsync();
            return new BimestreResponse(bimestre, _relogio.Agora());
        }

        // ---------- Buscas auxiliares ----------

        private async Task<Turma> BuscarTurmaAsync(int id)
        {
            Turma? turma = await _db.Turmas.FindAsync(id);
            if (turma == null)
            {
                throw new NaoEncontradoException("Turma não encontrada.");
            }
            return turma;
        }

        private async Task<Aluno> BuscarAlunoAsync(int id)
        {
            Aluno? aluno = await _db.Alunos.Include(a => a.Turma).FirstOrDefaultAsync(a => a.Id == id);
            if (aluno == null)
            {
                throw new NaoEncontradoException("Aluno não encontrado.");
            }
            return aluno;
        }
    }
}
