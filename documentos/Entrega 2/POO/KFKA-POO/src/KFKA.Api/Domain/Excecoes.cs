namespace KFKA.Api.Domain
{
    // Exceções próprias do sistema. O TratadorDeExcecoes converte cada uma
    // no código HTTP adequado.

    // Violação de uma regra de negócio -> HTTP 422
    public class RegraNegocioException : Exception
    {
        public RegraNegocioException(string mensagem) : base(mensagem)
        {
        }
    }

    // Registro inexistente ou que o usuário não pode ver -> HTTP 404
    public class NaoEncontradoException : Exception
    {
        public NaoEncontradoException(string mensagem) : base(mensagem)
        {
        }
    }

    // Usuário logado sem permissão para a operação -> HTTP 403
    public class AcessoNegadoException : Exception
    {
        public AcessoNegadoException(string mensagem) : base(mensagem)
        {
        }
    }

    // E-mail ou senha errados no login -> HTTP 401
    public class CredenciaisInvalidasException : Exception
    {
        public CredenciaisInvalidasException() : base("E-mail ou senha inválidos.")
        {
        }
    }

    // Registro duplicado -> HTTP 409
    public class ConflitoException : Exception
    {
        public ConflitoException(string mensagem) : base(mensagem)
        {
        }
    }
}
