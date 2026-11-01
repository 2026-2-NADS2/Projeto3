using KFKA.Api.Dtos;
using KFKA.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KFKA.Api.Controllers
{
    // Módulo Pai/Responsável.
    [Route("api/responsavel")]
    [Authorize(Roles = Papeis.Responsavel)]
    public class ResponsavelController : ApiControllerBase
    {
        private readonly ResponsavelService _responsaveis;

        public ResponsavelController(ResponsavelService responsaveis)
        {
            _responsaveis = responsaveis;
        }

        [HttpGet("alunos")]
        public async Task<ActionResult<List<AlunoResponse>>> MeusAlunos()
        {
            return Ok(await _responsaveis.MeusAlunosAsync(UsuarioId));
        }

        // Relatórios publicados, com filtros opcionais por aluno, ano, bimestre e disciplina.
        [HttpGet("relatorios")]
        public async Task<ActionResult<List<RelatorioPublicadoResponse>>> Relatorios(int? alunoId, int? anoLetivo,
            int? bimestre, int? disciplinaId)
        {
            return Ok(await _responsaveis.RelatoriosAsync(UsuarioId, alunoId, anoLetivo, bimestre, disciplinaId));
        }

        [HttpGet("relatorios/{id}")]
        public async Task<ActionResult<RelatorioPublicadoResponse>> Relatorio(int id)
        {
            return Ok(await _responsaveis.RelatorioAsync(UsuarioId, id));
        }

        // Registra ciência do relatório, com observação opcional.
        [HttpPost("relatorios/{id}/ciencia")]
        public async Task<ActionResult<RetornoResponse>> RegistrarCiencia(int id, RetornoRequest dados)
        {
            return StatusCode(201, await _responsaveis.RegistrarCienciaAsync(UsuarioId, id, dados.Observacao));
        }
    }
}
