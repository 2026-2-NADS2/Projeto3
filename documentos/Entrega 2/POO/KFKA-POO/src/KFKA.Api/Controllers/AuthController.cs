using KFKA.Api.Dtos;
using KFKA.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KFKA.Api.Controllers
{
    [Route("api/auth")]
    public class AuthController : ApiControllerBase
    {
        private readonly AuthService _auth;

        public AuthController(AuthService auth)
        {
            _auth = auth;
        }

        // Login: devolve o token JWT (no Swagger, use o botão "Authorize" com ele).
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest dados)
        {
            LoginResponse resposta = await _auth.LoginAsync(dados);
            return Ok(resposta);
        }

        // Dados do usuário logado.
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UsuarioResponse>> Me()
        {
            UsuarioResponse usuario = await _auth.UsuarioAtualAsync(UsuarioId);
            return Ok(usuario);
        }
    }
}
