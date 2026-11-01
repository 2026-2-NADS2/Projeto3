using KFKA.Api.Domain;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KFKA.Api.Infra
{
    // Ponto único de tratamento de erros: qualquer exceção lançada em um
    // controller ou serviço chega aqui e vira uma resposta JSON padronizada.
    // Assim os controllers não precisam de try/catch.
    public class TratadorDeExcecoes : IExceptionHandler
    {
        private readonly ILogger<TratadorDeExcecoes> _logger;

        public TratadorDeExcecoes(ILogger<TratadorDeExcecoes> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(HttpContext contexto, Exception excecao, CancellationToken cancellationToken)
        {
            int status;
            string titulo;
            string mensagem = excecao.Message;

            if (excecao is CredenciaisInvalidasException)
            {
                status = 401;
                titulo = "Não autenticado";
            }
            else if (excecao is AcessoNegadoException)
            {
                status = 403;
                titulo = "Acesso negado";
            }
            else if (excecao is NaoEncontradoException)
            {
                status = 404;
                titulo = "Não encontrado";
            }
            else if (excecao is ConflitoException)
            {
                status = 409;
                titulo = "Conflito";
            }
            else if (excecao is DbUpdateException)
            {
                status = 409;
                titulo = "Conflito";
                mensagem = "Os dados conflitam com um registro existente.";
                _logger.LogWarning(excecao, "Falha de restrição ao gravar no banco");
            }
            else if (excecao is RegraNegocioException)
            {
                status = 422;
                titulo = "Regra de negócio violada";
            }
            else
            {
                status = 500;
                titulo = "Erro interno";
                mensagem = "Ocorreu um erro inesperado. Tente novamente.";
                _logger.LogError(excecao, "Erro não tratado em {Caminho}", contexto.Request.Path);
            }

            ProblemDetails resposta = new ProblemDetails();
            resposta.Status = status;
            resposta.Title = titulo;
            resposta.Detail = mensagem;

            contexto.Response.StatusCode = status;
            await contexto.Response.WriteAsJsonAsync(resposta, options: null,
                contentType: "application/problem+json", cancellationToken: cancellationToken);
            return true;
        }
    }
}
