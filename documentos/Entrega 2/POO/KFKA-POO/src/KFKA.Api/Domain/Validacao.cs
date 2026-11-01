using System.Net.Mail;

namespace KFKA.Api.Domain
{
    // Validações repetidas em várias entidades.
    internal static class Validacao
    {
        // Garante que o texto foi preenchido e não passa do tamanho máximo.
        public static string Texto(string? valor, string campo, int tamanhoMaximo)
        {
            if (string.IsNullOrWhiteSpace(valor))
            {
                throw new RegraNegocioException(campo + " é obrigatório.");
            }

            valor = valor.Trim();
            if (valor.Length > tamanhoMaximo)
            {
                throw new RegraNegocioException(campo + " deve ter no máximo " + tamanhoMaximo + " caracteres.");
            }

            return valor;
        }

        // Igual ao Texto, mas aceita vazio (devolve null).
        public static string? TextoOpcional(string? valor, string campo, int tamanhoMaximo)
        {
            if (string.IsNullOrWhiteSpace(valor))
            {
                return null;
            }

            return Texto(valor, campo, tamanhoMaximo);
        }

        public static string Email(string? valor)
        {
            string email = Texto(valor, "E-mail", 150).ToLower();
            if (!MailAddress.TryCreate(email, out _))
            {
                throw new RegraNegocioException("E-mail inválido.");
            }

            return email;
        }

        public static void Ativo(bool ativo, string descricao)
        {
            if (!ativo)
            {
                throw new RegraNegocioException(descricao + " está inativo(a).");
            }
        }

        public static void NaoNulo(object? valor, string nome)
        {
            if (valor == null)
            {
                throw new ArgumentNullException(nome);
            }
        }
    }
}
