using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using KFKA.Api.Dtos;

namespace KFKA.Tests.Api;

/// <summary>Funções comuns dos testes de integração: login e chamadas HTTP com verificação de sucesso.</summary>
public abstract class TesteApiBase(ApiFactory fabrica)
{
    protected static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    protected ApiFactory Fabrica => fabrica;

    protected async Task<HttpClient> LogarAsync(string email, string senha)
    {
        HttpClient cliente = fabrica.CreateClient();
        LoginResponse login = await PostAsync<LoginResponse>(cliente, "/api/auth/login", new { email, senha });
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        return cliente;
    }

    protected static async Task<T> PostAsync<T>(HttpClient cliente, string url, object corpo)
    {
        HttpResponseMessage resposta = await cliente.PostAsJsonAsync(url, corpo);
        await GarantirSucessoAsync(resposta);
        return (await resposta.Content.ReadFromJsonAsync<T>(Json))!;
    }

    protected static async Task<T> GetAsync<T>(HttpClient cliente, string url)
    {
        HttpResponseMessage resposta = await cliente.GetAsync(url);
        await GarantirSucessoAsync(resposta);
        return (await resposta.Content.ReadFromJsonAsync<T>(Json))!;
    }

    protected static async Task GarantirSucessoAsync(HttpResponseMessage resposta)
    {
        if (!resposta.IsSuccessStatusCode)
        {
            string corpo = await resposta.Content.ReadAsStringAsync();
            Assert.Fail($"{(int)resposta.StatusCode} em {resposta.RequestMessage?.RequestUri}: {corpo}");
        }
    }
}
