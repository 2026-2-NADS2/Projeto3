using KFKA.Api.Domain;
using KFKA.Api.Dtos;
using KFKA.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KFKA.Api.Controllers
{
    [Route("api/usuarios")]
    [Authorize(Roles = Papeis.Administrador)]
    public class UsuariosController : ApiControllerBase
    {
        private readonly UsuarioService _usuarios;

        public UsuariosController(UsuarioService usuarios)
        {
            _usuarios = usuarios;
        }

        [HttpGet]
        public async Task<ActionResult<List<UsuarioResponse>>> Listar(Perfil? perfil, string? busca)
        {
            return Ok(await _usuarios.ListarAsync(perfil, busca));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UsuarioResponse>> Obter(int id)
        {
            return Ok(await _usuarios.ObterAsync(id));
        }

        [HttpPost("administradores")]
        public async Task<ActionResult<UsuarioResponse>> CriarAdministrador(CriarAdministradorRequest dados)
        {
            UsuarioResponse criado = await _usuarios.CriarAdministradorAsync(dados);
            return StatusCode(201, criado);
        }

        [HttpPost("professores")]
        public async Task<ActionResult<UsuarioResponse>> CriarProfessor(CriarProfessorRequest dados)
        {
            UsuarioResponse criado = await _usuarios.CriarProfessorAsync(dados);
            return StatusCode(201, criado);
        }

        [HttpPost("responsaveis")]
        public async Task<ActionResult<UsuarioResponse>> CriarResponsavel(CriarResponsavelRequest dados)
        {
            UsuarioResponse criado = await _usuarios.CriarResponsavelAsync(dados);
            return StatusCode(201, criado);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UsuarioResponse>> Atualizar(int id, AtualizarUsuarioRequest dados)
        {
            return Ok(await _usuarios.AtualizarAsync(id, dados));
        }

        [HttpPatch("{id}/situacao")]
        public async Task<ActionResult<UsuarioResponse>> AlterarSituacao(int id, SituacaoRequest dados)
        {
            return Ok(await _usuarios.AlterarSituacaoAsync(id, dados.Ativo, UsuarioId));
        }
    }
}
