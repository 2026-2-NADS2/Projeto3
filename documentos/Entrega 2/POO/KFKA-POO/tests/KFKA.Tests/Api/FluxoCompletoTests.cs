using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using KFKA.Api.Domain;
using KFKA.Api.Dtos;

namespace KFKA.Tests.Api;

/// <summary>
/// Cenário de aceite do enunciado: o Administrador cadastra a estrutura e abre o bimestre; o Professor
/// registra e envia; o Administrador revisa e publica; o Responsável consulta e registra ciência.
/// </summary>
public class FluxoCompletoTests(ApiFactory fabrica) : IClassFixture<ApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    [Fact]
    public async Task Cenario_de_ponta_a_ponta()
    {
        // Administrador cadastra a estrutura escolar
        HttpClient admin = await LogarAsync("admin@kfka.com", ApiFactory.SenhaSeed);

        AreaResponse area = await PostAsync<AreaResponse>(admin, "/api/areas", new { nome = "Ciências da Natureza" });
        DisciplinaResponse ciencias = await PostAsync<DisciplinaResponse>(admin, "/api/disciplinas",
            new { nome = "Ciências", areaId = area.Id });
        TurmaResponse turma = await PostAsync<TurmaResponse>(admin, "/api/turmas",
            new { nome = "7º C", serie = "7º ano", anoLetivo = 2026 });
        AlunoResponse aluno = await PostAsync<AlunoResponse>(admin, "/api/alunos",
            new { nome = "Lucas Pereira", matricula = "A2026100", dataNascimento = "2014-06-10", turmaId = turma.Id });
        UsuarioResponse professor = await PostAsync<UsuarioResponse>(admin, "/api/usuarios/professores",
            new { nome = "Carla Mendes", email = "carla@kfka.com", senha = "Professora@1", matricula = "P2026100" });
        UsuarioResponse responsavel = await PostAsync<UsuarioResponse>(admin, "/api/usuarios/responsaveis",
            new { nome = "Paula Pereira", email = "paula@kfka.com", senha = "Responsavel@1", cpf = "390.533.447-05" });
        VinculoProfessorResponse vinculo = await PostAsync<VinculoProfessorResponse>(admin, "/api/vinculos/professores",
            new { professorId = professor.Id, turmaId = turma.Id, disciplinaId = ciencias.Id });
        await PostAsync<VinculoResponsavelResponse>(admin, "/api/vinculos/responsaveis",
            new { alunoId = aluno.Id, responsavelId = responsavel.Id, parentesco = "Mãe", principal = true });

        // Vínculo duplicado é bloqueado
        HttpResponseMessage duplicado = await admin.PostAsJsonAsync("/api/vinculos/professores",
            new { professorId = professor.Id, turmaId = turma.Id, disciplinaId = ciencias.Id });
        Assert.Equal(HttpStatusCode.Conflict, duplicado.StatusCode);

        // Administrador (re)abre o 4º bimestre
        List<BimestreResponse> bimestres = await GetAsync<List<BimestreResponse>>(admin, "/api/bimestres?anoLetivo=2026");
        BimestreResponse quarto = bimestres.Single(b => b.Numero == 4);
        HttpResponseMessage periodo = await admin.PutAsJsonAsync($"/api/bimestres/{quarto.Id}/periodo", new
        {
            aberturaDigitacao = ApiFactory.Agora.AddDays(-1),
            encerramentoDigitacao = ApiFactory.Agora.AddDays(30)
        });
        await GarantirSucessoAsync(periodo);

        // Professor registra e envia
        HttpClient prof = await LogarAsync("carla@kfka.com", "Professora@1");
        List<TagResponse> tags = await GetAsync<List<TagResponse>>(prof, "/api/tags");
        int[] tagIds = tags.Where(t => t.Nome is "Participativo" or "Destaque").Select(t => t.Id).ToArray();

        AcompanhamentoResponse rascunho = await PostAsync<AcompanhamentoResponse>(prof, "/api/professor/acompanhamentos", new
        {
            vinculoProfessorId = vinculo.Id,
            alunoId = aluno.Id,
            bimestreId = quarto.Id,
            descricao = "Lucas fez ótimas perguntas no experimento sobre fotossíntese.",
            media = 8.75m,
            tagIds
        });
        Assert.Equal(StatusAcompanhamento.Rascunho, rascunho.Status);

        // Responsável ainda não enxerga o rascunho
        HttpClient resp = await LogarAsync("paula@kfka.com", "Responsavel@1");
        Assert.Equal(HttpStatusCode.NotFound, (await resp.GetAsync($"/api/responsavel/relatorios/{rascunho.Id}")).StatusCode);

        await PostAsync<AcompanhamentoResponse>(prof, $"/api/professor/acompanhamentos/{rascunho.Id}/enviar", new { });

        // Administrador revisa e publica
        await PostAsync<AcompanhamentoResponse>(admin, $"/api/admin/acompanhamentos/{rascunho.Id}/iniciar-revisao", new { });
        AcompanhamentoResponse publicado =
            await PostAsync<AcompanhamentoResponse>(admin, $"/api/admin/acompanhamentos/{rascunho.Id}/publicar", new { });
        Assert.Equal(StatusAcompanhamento.Publicado, publicado.Status);

        // Responsável consulta o relatório e registra ciência
        List<AlunoResponse> filhos = await GetAsync<List<AlunoResponse>>(resp, "/api/responsavel/alunos");
        Assert.Equal(aluno.Id, Assert.Single(filhos).Id);

        List<RelatorioPublicadoResponse> relatorios =
            await GetAsync<List<RelatorioPublicadoResponse>>(resp, "/api/responsavel/relatorios?anoLetivo=2026&bimestre=4");
        RelatorioPublicadoResponse relatorio = Assert.Single(relatorios);
        Assert.Equal(8.75m, relatorio.Media);
        Assert.Equal(new List<string> { "Destaque", "Participativo" }, relatorio.Tags);

        await PostAsync<RetornoResponse>(resp, $"/api/responsavel/relatorios/{rascunho.Id}/ciencia",
            new { observacao = "Ciente. Obrigada!" });

        // Professor vê o retorno; o histórico registra cada etapa
        List<RetornoResponse> retornos = await GetAsync<List<RetornoResponse>>(prof, "/api/professor/retornos");
        Assert.Equal("Ciente. Obrigada!", Assert.Single(retornos).Observacao);

        List<HistoricoResponse> historico =
            await GetAsync<List<HistoricoResponse>>(admin, $"/api/admin/acompanhamentos/{rascunho.Id}/historico");
        StatusAcompanhamento[] esperado =
        {
            StatusAcompanhamento.Rascunho, StatusAcompanhamento.EnviadoParaRevisao,
            StatusAcompanhamento.EmRevisao, StatusAcompanhamento.Publicado
        };
        Assert.Equal(esperado, historico.Select(h => h.StatusPosterior));
        Assert.Equal("Administrador KFKA", historico.Last().Usuario);
    }

    [Fact]
    public async Task Rotas_protegidas_exigem_token_e_perfil()
    {
        HttpClient anonimo = fabrica.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync("/api/admin/acompanhamentos")).StatusCode);

        HttpClient responsavel = await LogarAsync("marcelo@kfka.com", ApiFactory.SenhaSeed);
        Assert.Equal(HttpStatusCode.Forbidden, (await responsavel.GetAsync("/api/admin/acompanhamentos")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await responsavel.GetAsync("/api/professor/vinculos")).StatusCode);
    }

    [Fact]
    public async Task Login_com_senha_errada_retorna_401()
    {
        HttpResponseMessage resposta = await fabrica.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { email = "admin@kfka.com", senha = "errada" });

        Assert.Equal(HttpStatusCode.Unauthorized, resposta.StatusCode);
    }

    [Fact]
    public async Task Professor_nao_acessa_acompanhamento_de_outro_professor()
    {
        HttpClient admin = await LogarAsync("admin@kfka.com", ApiFactory.SenhaSeed);
        PaginaAcompanhamentos daFernanda = await GetAsync<PaginaAcompanhamentos>(admin,
            "/api/admin/acompanhamentos?tamanhoPagina=100");
        int idDaFernanda = daFernanda.Itens.First(a => a.Professor == "Fernanda Lima").Id;

        HttpClient ronaldo = await LogarAsync("ronaldo@kfka.com", ApiFactory.SenhaSeed);

        Assert.Equal(HttpStatusCode.NotFound,
            (await ronaldo.GetAsync($"/api/professor/acompanhamentos/{idDaFernanda}")).StatusCode);
    }

    [Fact]
    public async Task Regra_de_negocio_violada_retorna_422_padronizado()
    {
        HttpClient ronaldo = await LogarAsync("ronaldo@kfka.com", ApiFactory.SenhaSeed);

        // Bimestre 3 de 2026 (seed) já está encerrado na data do relógio fixo
        HttpResponseMessage resposta = await ronaldo.PostAsJsonAsync("/api/professor/acompanhamentos",
            new { vinculoProfessorId = 1, alunoId = 2, bimestreId = 3, descricao = "Texto", media = 7 });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, resposta.StatusCode);
        Assert.Equal("application/problem+json", resposta.Content.Headers.ContentType?.MediaType);
    }

    private async Task<HttpClient> LogarAsync(string email, string senha)
    {
        HttpClient cliente = fabrica.CreateClient();
        LoginResponse login = await PostAsync<LoginResponse>(cliente, "/api/auth/login", new { email, senha });
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        return cliente;
    }

    private static async Task<T> PostAsync<T>(HttpClient cliente, string url, object corpo)
    {
        HttpResponseMessage resposta = await cliente.PostAsJsonAsync(url, corpo);
        await GarantirSucessoAsync(resposta);
        return (await resposta.Content.ReadFromJsonAsync<T>(Json))!;
    }

    private static async Task<T> GetAsync<T>(HttpClient cliente, string url)
    {
        HttpResponseMessage resposta = await cliente.GetAsync(url);
        await GarantirSucessoAsync(resposta);
        return (await resposta.Content.ReadFromJsonAsync<T>(Json))!;
    }

    private static async Task GarantirSucessoAsync(HttpResponseMessage resposta)
    {
        if (!resposta.IsSuccessStatusCode)
        {
            string corpo = await resposta.Content.ReadAsStringAsync();
            Assert.Fail($"{(int)resposta.StatusCode} em {resposta.RequestMessage?.RequestUri}: {corpo}");
        }
    }
}
