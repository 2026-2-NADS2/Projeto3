using KFKA.Api.Data;
using KFKA.Api.Domain;
using KFKA.Api.Domain.Usuarios;
using KFKA.Api.Dtos;
using KFKA.Api.Infra.Seguranca;
using Microsoft.EntityFrameworkCore;

namespace KFKA.Api.Services
{
    public class AuthService
    {
        private readonly KfkaDbContext _db;
        private readonly IHasherSenha _hasher;
        private readonly GeradorToken _geradorToken;

        public AuthService(KfkaDbContext db, IHasherSenha hasher, GeradorToken geradorToken)
        {
            _db = db;
            _hasher = hasher;
            _geradorToken = geradorToken;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest dados)
        {
            string email = dados.Email.Trim().ToLower();
            Usuario? usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

            // Mesma mensagem para e-mail inexistente e senha errada (não revela qual dos dois errou).
            if (usuario == null || !_hasher.Verificar(dados.Senha, usuario.SenhaHash))
            {
                throw new CredenciaisInvalidasException();
            }

            if (!usuario.Ativo)
            {
                throw new AcessoNegadoException("Usuário inativo. Procure a administração da escola.");
            }

            TokenGerado token = _geradorToken.Gerar(usuario);

            LoginResponse resposta = new LoginResponse();
            resposta.Token = token.Token;
            resposta.ExpiraEm = token.ExpiraEm;
            resposta.Usuario = new UsuarioResponse(usuario);
            return resposta;
        }

        public async Task<UsuarioResponse> UsuarioAtualAsync(int usuarioId)
        {
            Usuario? usuario = await _db.Usuarios.FindAsync(usuarioId);
            if (usuario == null || !usuario.Ativo)
            {
                throw new AcessoNegadoException("Usuário inativo ou inexistente.");
            }

            return new UsuarioResponse(usuario);
        }
    }
}
