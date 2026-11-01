using KFKA.Api.Dtos;
using KFKA.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KFKA.Api.Controllers
{
    // Módulo Professor: só enxerga as próprias turmas, disciplinas e acompanhamentos.
    [Route("api/professor")]
    [Authorize(Roles = Papeis.Professor)]
    public class ProfessorController : ApiControllerBase
    {
        private readonly AcompanhamentoService _acompanhamentos;

        public ProfessorController(AcompanhamentoService acompanhamentos)
        {
            _acompanhamentos = acompanhamentos;
        }

        // Turmas e disciplinas do professor logado.
        [HttpGet("vinculos")]
        public async Task<ActionResult<List<VinculoProfessorResponse>>> MeusVinculos()
        {
            return Ok(await _acompanhamentos.VinculosDoProfessorAsync(UsuarioId));
        }

        [HttpGet("vinculos/{vinculoId}/alunos")]
        public async Task<ActionResult<List<AlunoResponse>>> AlunosDoVinculo(int vinculoId)
        {
            return Ok(await _acompanhamentos.AlunosDoVinculoAsync(UsuarioId, vinculoId));
        }

        [HttpGet("acompanhamentos")]
        public async Task<ActionResult<PaginaAcompanhamentos>> Listar([FromQuery] FiltroAcompanhamentos filtro)
        {
            return Ok(await _acompanhamentos.ListarDoProfessorAsync(UsuarioId, filtro));
        }

        [HttpGet("acompanhamentos/{id}")]
        public async Task<ActionResult<AcompanhamentoResponse>> Obter(int id)
        {
            return Ok(await _acompanhamentos.ObterDoProfessorAsync(UsuarioId, id));
        }

        // Cria como rascunho (exige período de digitação aberto).
        [HttpPost("acompanhamentos")]
        public async Task<ActionResult<AcompanhamentoResponse>> Criar(CriarAcompanhamentoRequest dados)
        {
            return StatusCode(201, await _acompanhamentos.CriarAsync(UsuarioId, dados));
        }

        // Edita um rascunho ou um acompanhamento devolvido para ajustes.
        [HttpPut("acompanhamentos/{id}")]
        public async Task<ActionResult<AcompanhamentoResponse>> Editar(int id, ConteudoAcompanhamentoRequest dados)
        {
            return Ok(await _acompanhamentos.EditarAsync(UsuarioId, id, dados));
        }

        [HttpPost("acompanhamentos/{id}/enviar")]
        public async Task<ActionResult<AcompanhamentoResponse>> Enviar(int id)
        {
            return Ok(await _acompanhamentos.EnviarParaRevisaoAsync(UsuarioId, id));
        }

        [HttpPost("acompanhamentos/{id}/cancelar")]
        public async Task<ActionResult<AcompanhamentoResponse>> Cancelar(int id, MotivoRequest dados)
        {
            return Ok(await _acompanhamentos.CancelarComoProfessorAsync(UsuarioId, id, dados.Motivo));
        }

        [HttpGet("acompanhamentos/{id}/historico")]
        public async Task<ActionResult<List<HistoricoResponse>>> Historico(int id)
        {
            return Ok(await _acompanhamentos.HistoricoAsync(id, UsuarioId));
        }

        // Retornos dos responsáveis sobre relatórios das turmas do professor.
        [HttpGet("retornos")]
        public async Task<ActionResult<List<RetornoResponse>>> Retornos()
        {
            return Ok(await _acompanhamentos.RetornosAsync(UsuarioId));
        }
    }
}
