using KFKA.Api.Domain;
using KFKA.Api.Infra.Seguranca;
using Microsoft.AspNetCore.Mvc;

namespace KFKA.Api.Controllers
{
    // Nomes dos perfis usados em [Authorize(Roles = ...)].
    public static class Papeis
    {
        public const string Administrador = "Administrador";
        public const string Professor = "Professor";
        public const string Responsavel = "Responsavel";
        public const string AdministradorOuProfessor = "Administrador,Professor";
    }

    // Classe base de todos os controllers (herança): guarda o que é comum a todos.
    [ApiController]
    [Produces("application/json")]
    public abstract class ApiControllerBase : ControllerBase
    {
        // Id do usuário logado, lido de dentro do token JWT.
        protected int UsuarioId
        {
            get
            {
                string id = User.FindFirst(ClaimsKfka.Id)!.Value;
                return int.Parse(id);
            }
        }
    }
}
