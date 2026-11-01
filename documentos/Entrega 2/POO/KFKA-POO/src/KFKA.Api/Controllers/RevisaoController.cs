using KFKA.Api.Dtos;
using KFKA.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KFKA.Api.Controllers
{
    // Módulo Administrador: revisão, publicação e relatórios.
    [Route("api/admin")]
    [Authorize(Roles = Papeis.Administrador)]
    public class RevisaoController : ApiControllerBase
    {
        private readonly AcompanhamentoService _acompanhamentos;

        public RevisaoController(AcompanhamentoService acompanhamentos)
        {
            _acompanhamentos = acompanhamentos;
        }

        // Filtros opcionais pela URL: status, anoLetivo, bimestreId, turmaId, disciplinaId,
        // professorId, alunoId, tagId, pagina, tamanhoPagina.
        [HttpGet("acompanhamentos")]
        public async Task<ActionResult<PaginaAcompanhamentos>> Listar([FromQuery] FiltroAcompanhamentos filtro)
        {
            return Ok(await _acompanhamentos.ListarAsync(filtro));
        }

        [HttpGet("acompanhamentos/{id}")]
        public async Task<ActionResult<AcompanhamentoResponse>> Obter(int id)
        {
            return Ok(await _acompanhamentos.ObterAsync(id));
        }

        [HttpGet("acompanhamentos/{id}/historico")]
        public async Task<ActionResult<List<HistoricoResponse>>> Historico(int id)
        {
            return Ok(await _acompanhamentos.HistoricoAsync(id, null));
        }

        [HttpPost("acompanhamentos/{id}/iniciar-revisao")]
        public async Task<ActionResult<AcompanhamentoResponse>> IniciarRevisao(int id)
        {
            return Ok(await _acompanhamentos.IniciarRevisaoAsync(UsuarioId, id));
        }

        // Altera descrição, média e tags durante a revisão (fica registrado no histórico).
        [HttpPut("acompanhamentos/{id}")]
        public async Task<ActionResult<AcompanhamentoResponse>> Alterar(int id, ConteudoAcompanhamentoRequest dados)
        {
            return Ok(await _acompanhamentos.AlterarNaRevisaoAsync(UsuarioId, id, dados));
        }

        [HttpPost("acompanhamentos/{id}/devolver")]
        public async Task<ActionResult<AcompanhamentoResponse>> Devolver(int id, MotivoRequest dados)
        {
            return Ok(await _acompanhamentos.DevolverAsync(UsuarioId, id, dados.Motivo));
        }

        [HttpPost("acompanhamentos/{id}/publicar")]
        public async Task<ActionResult<AcompanhamentoResponse>> Publicar(int id)
        {
            return Ok(await _acompanhamentos.PublicarAsync(UsuarioId, id));
        }

        [HttpPost("acompanhamentos/{id}/cancelar")]
        public async Task<ActionResult<AcompanhamentoResponse>> Cancelar(int id, MotivoRequest dados)
        {
            return Ok(await _acompanhamentos.CancelarComoAdministradorAsync(UsuarioId, id, dados.Motivo));
        }

        // Ciências e observações registradas pelos responsáveis.
        [HttpGet("retornos")]
        public async Task<ActionResult<List<RetornoResponse>>> Retornos()
        {
            return Ok(await _acompanhamentos.RetornosAsync(null));
        }
    }
}
