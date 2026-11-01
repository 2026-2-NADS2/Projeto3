using System.Text;
using KFKA.Api.Domain.Usuarios;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace KFKA.Api.Infra.Seguranca
{
    // Configurações do JWT, lidas da seção "Jwt" do appsettings / variáveis de ambiente.
    public class JwtOptions
    {
        public string Chave { get; set; } = "";
        public string Emissor { get; set; } = "kfka-api";
        public string Audiencia { get; set; } = "kfka-clientes";
        public int ExpiracaoMinutos { get; set; } = 120;

        public SymmetricSecurityKey ChaveAssinatura()
        {
            return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(this.Chave));
        }
    }

    // Nomes das informações (claims) gravadas dentro do token.
    public static class ClaimsKfka
    {
        public const string Id = "sub";
        public const string Nome = "name";
        public const string Email = "email";
        public const string Perfil = "role";
    }

    public class TokenGerado
    {
        public string Token { get; set; } = "";
        public DateTime ExpiraEm { get; set; }
    }

    // Cria o token JWT entregue no login.
    public class GeradorToken
    {
        private readonly JwtOptions _opcoes;
        private readonly IRelogio _relogio;

        public GeradorToken(IOptions<JwtOptions> opcoes, IRelogio relogio)
        {
            _opcoes = opcoes.Value;
            _relogio = relogio;
        }

        public TokenGerado Gerar(Usuario usuario)
        {
            DateTime agora = _relogio.Agora();
            DateTime expiraEm = agora.AddMinutes(_opcoes.ExpiracaoMinutos);

            Dictionary<string, object> claims = new Dictionary<string, object>();
            claims.Add(ClaimsKfka.Id, usuario.Id.ToString());
            claims.Add(ClaimsKfka.Nome, usuario.Nome);
            claims.Add(ClaimsKfka.Email, usuario.Email);
            claims.Add(ClaimsKfka.Perfil, usuario.Perfil.ToString());

            SecurityTokenDescriptor descritor = new SecurityTokenDescriptor();
            descritor.Issuer = _opcoes.Emissor;
            descritor.Audience = _opcoes.Audiencia;
            descritor.IssuedAt = agora;
            descritor.NotBefore = agora;
            descritor.Expires = expiraEm;
            descritor.Claims = claims;
            descritor.SigningCredentials = new SigningCredentials(_opcoes.ChaveAssinatura(), SecurityAlgorithms.HmacSha256);

            TokenGerado resultado = new TokenGerado();
            resultado.Token = new JsonWebTokenHandler().CreateToken(descritor);
            resultado.ExpiraEm = expiraEm;
            return resultado;
        }
    }
}
