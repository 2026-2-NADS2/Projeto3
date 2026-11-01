using System.Net;
using System.Net.Http.Json;
using KFKA.Api.Dtos;

namespace KFKA.Tests.Api;

/// <summary>Testes de regressão dos problemas encontrados na análise da Entrega 2.</summary>
public class CorrecoesTests(ApiFactory fabrica) : TesteApiBase(fabrica), IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Troca_de_professor_nao_permite_segundo_acompanhamento_do_mesmo_aluno_disciplina_e_bimestre()
    {
        HttpClient admin = await LogarAsync("admin@kfka.com", ApiFactory.SenhaSeed);

        AreaResponse area = await PostAsync<AreaResponse>(admin, "/api/areas", new { nome = "Artes" });
        DisciplinaResponse artes = await PostAsync<DisciplinaResponse>(admin, "/api/disciplinas",
            new { nome = "Arte", areaId = area.Id });
        TurmaResponse turma = await PostAsync<TurmaResponse>(admin, "/api/turmas",
            new { nome = "8º D", serie = "8º ano", anoLetivo = 2026 });
        AlunoResponse aluno = await PostAsync<AlunoResponse>(admin, "/api/alunos",
            new { nome = "Bia Rocha", matricula = "A2026200", dataNascimento = "2013-03-02", turmaId = turma.Id });
        UsuarioResponse antigo = await PostAsync<UsuarioResponse>(admin, "/api/usuarios/professores",
            new { nome = "Prof Antigo", email = "antigo@kfka.com", senha = "Professor@1", matricula = "P2026200" });
        UsuarioResponse novo = await PostAsync<UsuarioResponse>(admin, "/api/usuarios/professores",
            new { nome = "Prof Novo", email = "novo@kfka.com", senha = "Professor@1", matricula = "P2026201" });
        VinculoProfessorResponse vinculoAntigo = await PostAsync<VinculoProfessorResponse>(admin, "/api/vinculos/professores",
            new { professorId = antigo.Id, turmaId = turma.Id, disciplinaId = artes.Id });

        BimestreResponse quarto = await AbrirQuartoBimestreAsync(admin);

        HttpClient profAntigo = await LogarAsync("antigo@kfka.com", "Professor@1");
        await PostAsync<AcompanhamentoResponse>(profAntigo, "/api/professor/acompanhamentos", new
        {
            vinculoProfessorId = vinculoAntigo.Id, alunoId = aluno.Id, bimestreId = quarto.Id,
            descricao = "Registro do professor anterior.", media = 7m
        });

        // A administração troca o professor da disciplina na turma
        HttpResponseMessage desativar = await admin.PatchAsJsonAsync(
            $"/api/vinculos/professores/{vinculoAntigo.Id}/situacao", new { ativo = false });
        await GarantirSucessoAsync(desativar);
        VinculoProfessorResponse vinculoNovo = await PostAsync<VinculoProfessorResponse>(admin, "/api/vinculos/professores",
            new { professorId = novo.Id, turmaId = turma.Id, disciplinaId = artes.Id });

        // O novo professor não pode criar outro acompanhamento para o mesmo aluno, disciplina e bimestre
        HttpClient profNovo = await LogarAsync("novo@kfka.com", "Professor@1");
        HttpResponseMessage segundo = await profNovo.PostAsJsonAsync("/api/professor/acompanhamentos", new
        {
            vinculoProfessorId = vinculoNovo.Id, alunoId = aluno.Id, bimestreId = quarto.Id,
            descricao = "Registro duplicado.", media = 9m
        });

        Assert.Equal(HttpStatusCode.Conflict, segundo.StatusCode);
    }

    [Fact]
    public async Task Token_de_administrador_desativado_deixa_de_valer()
    {
        HttpClient admin = await LogarAsync("admin@kfka.com", ApiFactory.SenhaSeed);
        UsuarioResponse outro = await PostAsync<UsuarioResponse>(admin, "/api/usuarios/administradores",
            new { nome = "Admin Temporário", email = "temp@kfka.com", senha = "Administrador@1" });

        HttpClient adminTemporario = await LogarAsync("temp@kfka.com", "Administrador@1");
        Assert.Equal(HttpStatusCode.OK, (await adminTemporario.GetAsync("/api/usuarios")).StatusCode);

        HttpResponseMessage desativar = await admin.PatchAsJsonAsync($"/api/usuarios/{outro.Id}/situacao", new { ativo = false });
        await GarantirSucessoAsync(desativar);

        // O token ainda não expirou, mas o usuário foi desativado: o acesso é cortado na hora
        Assert.Equal(HttpStatusCode.Unauthorized, (await adminTemporario.GetAsync("/api/usuarios")).StatusCode);
        HttpResponseMessage criar = await adminTemporario.PostAsJsonAsync("/api/areas", new { nome = "Área indevida" });
        Assert.Equal(HttpStatusCode.Unauthorized, criar.StatusCode);
    }

    private static async Task<BimestreResponse> AbrirQuartoBimestreAsync(HttpClient admin)
    {
        List<BimestreResponse> bimestres = await GetAsync<List<BimestreResponse>>(admin, "/api/bimestres?anoLetivo=2026");
        BimestreResponse quarto = bimestres.Single(b => b.Numero == 4);
        HttpResponseMessage periodo = await admin.PutAsJsonAsync($"/api/bimestres/{quarto.Id}/periodo", new
        {
            aberturaDigitacao = ApiFactory.Agora.AddDays(-1),
            encerramentoDigitacao = ApiFactory.Agora.AddDays(30)
        });
        await GarantirSucessoAsync(periodo);
        return quarto;
    }
}
