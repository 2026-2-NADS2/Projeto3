using KFKA.Api.Dtos;
using KFKA.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KFKA.Api.Controllers
{
    [Route("api/vinculos")]
    [Authorize(Roles = Papeis.Administrador)]
    public class VinculosController : ApiControllerBase
    {
        private readonly VinculoService _vinculos;

        public VinculosController(VinculoService vinculos)
        {
            _vinculos = vinculos;
        }

        // ---------- Professor x Turma x Disciplina ----------

        [HttpGet("professores")]
        public async Task<ActionResult<List<VinculoProfessorResponse>>> ListarProfessores(int? professorId, int? turmaId)
        {
            return Ok(await _vinculos.ListarVinculosProfessoresAsync(professorId, turmaId));
        }

        [HttpPost("professores")]
        public async Task<ActionResult<VinculoProfessorResponse>> VincularProfessor(VinculoProfessorRequest dados)
        {
            return StatusCode(201, await _vinculos.CriarVinculoProfessorAsync(dados));
        }

        [HttpPatch("professores/{id}/situacao")]
        public async Task<ActionResult<VinculoProfessorResponse>> AlterarSituacaoProfessor(int id, SituacaoRequest dados)
        {
            return Ok(await _vinculos.AlterarSituacaoVinculoProfessorAsync(id, dados.Ativo));
        }

        // ---------- Aluno x Responsável ----------

        [HttpGet("responsaveis")]
        public async Task<ActionResult<List<VinculoResponsavelResponse>>> ListarResponsaveis(int? alunoId, int? responsavelId)
        {
            return Ok(await _vinculos.ListarVinculosResponsaveisAsync(alunoId, responsavelId));
        }

        [HttpPost("responsaveis")]
        public async Task<ActionResult<VinculoResponsavelResponse>> VincularResponsavel(VinculoResponsavelRequest dados)
        {
            return StatusCode(201, await _vinculos.CriarVinculoResponsavelAsync(dados));
        }

        [HttpDelete("responsaveis")]
        public async Task<IActionResult> DesvincularResponsavel(int alunoId, int responsavelId)
        {
            await _vinculos.RemoverVinculoResponsavelAsync(alunoId, responsavelId);
            return NoContent();
        }
    }
}
