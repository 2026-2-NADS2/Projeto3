using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using KFKA.Api.Infra;

namespace KFKA.Tests.Api;

/// <summary>Sobe a API em memória com um banco SQLite temporário e um relógio fixo.</summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    /// <summary>Data dentro do 4º bimestre de 2026 dos dados de demonstração.</summary>
    public static readonly DateTimeOffset Agora = new(2026, 10, 20, 15, 0, 0, TimeSpan.Zero);
    public const string SenhaSeed = "Senha@Teste1";

    private readonly string _arquivoBanco = Path.Combine(Path.GetTempPath(), $"kfka-teste-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Kfka", $"Data Source={_arquivoBanco};Pooling=False");
        builder.UseSetting("Jwt:Chave", "chave-exclusiva-dos-testes-com-mais-de-32-caracteres");
        // O token nasce na data do relógio fixo, que fica no passado; validade longa evita expiração.
        builder.UseSetting("Jwt:ExpiracaoMinutos", (60 * 24 * 365 * 10).ToString());
        builder.UseSetting("Seed:SenhaPadrao", SenhaSeed);

        builder.ConfigureTestServices(servicos =>
        {
            servicos.RemoveAll<IRelogio>();
            servicos.AddSingleton<IRelogio>(new RelogioFixo(Agora.UtcDateTime));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        try
        {
            File.Delete(_arquivoBanco);
        }
        catch (IOException)
        {
            // Arquivo temporário; se ainda estiver em uso, o sistema limpa depois.
        }
    }

    // Relógio "parado" numa data fixa: os testes não dependem do dia em que rodam.
    private class RelogioFixo : IRelogio
    {
        private readonly DateTime _agora;

        public RelogioFixo(DateTime agora)
        {
            _agora = agora;
        }

        public DateTime Agora()
        {
            return _agora;
        }
    }
}
