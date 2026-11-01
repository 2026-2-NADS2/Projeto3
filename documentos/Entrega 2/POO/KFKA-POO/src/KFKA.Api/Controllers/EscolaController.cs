using KFKA.Api.Dtos;
using KFKA.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KFKA.Api.Controllers
{
    // Cadastros da estrutura escolar. A maioria é só do Administrador;
    // a listagem de tags e de bimestres também é liberada para o Professor.
    [Route("api")]
    [Authorize]
    public class EscolaController : ApiControllerBase
    {
        private readonly EscolaService _escola;

        public EscolaController(EscolaService escola)
        {
            _escola = escola;
        }

        // ---------- Áreas ----------

        [HttpGet("areas")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<List<AreaResponse>>> ListarAreas()
        {
            return Ok(await _escola.ListarAreasAsync());
        }

        [HttpPost("areas")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<AreaResponse>> CriarArea(AreaRequest dados)
        {
            return StatusCode(201, await _escola.CriarAreaAsync(dados));
        }

        // ---------- Disciplinas ----------

        [HttpGet("disciplinas")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<List<DisciplinaResponse>>> ListarDisciplinas(int? areaId)
        {
            return Ok(await _escola.ListarDisciplinasAsync(areaId));
        }

        [HttpPost("disciplinas")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<DisciplinaResponse>> CriarDisciplina(DisciplinaRequest dados)
        {
            return StatusCode(201, await _escola.CriarDisciplinaAsync(dados));
        }

        [HttpPatch("disciplinas/{id}/situacao")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<DisciplinaResponse>> AlterarSituacaoDisciplina(int id, SituacaoRequest dados)
        {
            return Ok(await _escola.AlterarSituacaoDisciplinaAsync(id, dados.Ativo));
        }

        // ---------- Turmas ----------

        [HttpGet("turmas")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<List<TurmaResponse>>> ListarTurmas(int? anoLetivo)
        {
            return Ok(await _escola.ListarTurmasAsync(anoLetivo));
        }

        [HttpPost("turmas")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<TurmaResponse>> CriarTurma(TurmaRequest dados)
        {
            return StatusCode(201, await _escola.CriarTurmaAsync(dados));
        }

        [HttpPatch("turmas/{id}/situacao")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<TurmaResponse>> AlterarSituacaoTurma(int id, SituacaoRequest dados)
        {
            return Ok(await _escola.AlterarSituacaoTurmaAsync(id, dados.Ativo));
        }

        // ---------- Alunos ----------

        [HttpGet("alunos")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<List<AlunoResponse>>> ListarAlunos(int? turmaId, string? busca)
        {
            return Ok(await _escola.ListarAlunosAsync(turmaId, busca));
        }

        [HttpGet("alunos/{id}")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<AlunoResponse>> ObterAluno(int id)
        {
            return Ok(await _escola.ObterAlunoAsync(id));
        }

        [HttpPost("alunos")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<AlunoResponse>> CriarAluno(AlunoRequest dados)
        {
            return StatusCode(201, await _escola.CriarAlunoAsync(dados));
        }

        [HttpPut("alunos/{id}")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<AlunoResponse>> AtualizarAluno(int id, AtualizarAlunoRequest dados)
        {
            return Ok(await _escola.AtualizarAlunoAsync(id, dados));
        }

        [HttpPatch("alunos/{id}/situacao")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<AlunoResponse>> AlterarSituacaoAluno(int id, SituacaoRequest dados)
        {
            return Ok(await _escola.AlterarSituacaoAlunoAsync(id, dados.Ativo));
        }

        // ---------- Tags ----------

        // O professor também consulta as tags (e só recebe as ativas).
        [HttpGet("tags")]
        [Authorize(Roles = Papeis.AdministradorOuProfessor)]
        public async Task<ActionResult<List<TagResponse>>> ListarTags(bool somenteAtivas = false)
        {
            if (!User.IsInRole(Papeis.Administrador))
            {
                somenteAtivas = true;
            }
            return Ok(await _escola.ListarTagsAsync(somenteAtivas));
        }

        [HttpPost("tags")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<TagResponse>> CriarTag(TagRequest dados)
        {
            return StatusCode(201, await _escola.CriarTagAsync(dados));
        }

        [HttpPatch("tags/{id}/situacao")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<TagResponse>> AlterarSituacaoTag(int id, SituacaoRequest dados)
        {
            return Ok(await _escola.AlterarSituacaoTagAsync(id, dados.Ativo));
        }

        // ---------- Bimestres ----------

        [HttpGet("bimestres")]
        [Authorize(Roles = Papeis.AdministradorOuProfessor)]
        public async Task<ActionResult<List<BimestreResponse>>> ListarBimestres(int? anoLetivo)
        {
            return Ok(await _escola.ListarBimestresAsync(anoLetivo));
        }

        [HttpPost("bimestres")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<BimestreResponse>> CriarBimestre(BimestreRequest dados)
        {
            return StatusCode(201, await _escola.CriarBimestreAsync(dados));
        }

        // Abre, prorroga ou encerra o período de digitação do bimestre.
        [HttpPut("bimestres/{id}/periodo")]
        [Authorize(Roles = Papeis.Administrador)]
        public async Task<ActionResult<BimestreResponse>> DefinirPeriodo(int id, PeriodoDigitacaoRequest dados)
        {
            return Ok(await _escola.DefinirPeriodoAsync(id, dados));
        }
    }
}
