using KFKA.Api.Domain;
using KFKA.Api.Domain.Acompanhamentos;
using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;

namespace KFKA.Tests.Dominio;

public class AcompanhamentoTests
{
    private static readonly DateTime Agora = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);

    private readonly Professor _professor = new("Ronaldo", "ronaldo@teste.com", "hash", "P1", Agora);
    private readonly Administrador _admin = new("Admin", "admin@teste.com", "hash", null, Agora);
    private readonly Bimestre _bimestre = new(4, 2026, Agora.AddDays(-10), Agora.AddDays(30));
    private readonly Tag _participativo = new("Participativo", null);
    private readonly Tag _destaque = new("Destaque", null);

    private Acompanhamento NovoRascunho(decimal media = 8m)
    {
        var turma = new Turma("5º A", "5º ano", 2026);
        var aluno = new Aluno("João", "A1", new DateOnly(2016, 4, 29), turma);
        var vinculo = new VinculoProfessor(_professor, turma, new Disciplina("Matemática", new Area("Exatas")));
        return new Acompanhamento(aluno, vinculo, _bimestre, _professor, "Bom desempenho", media, new List<Tag> { _participativo }, Agora);
    }

    [Fact]
    public void Novo_acompanhamento_comeca_como_rascunho_e_registra_historico()
    {
        Acompanhamento a = NovoRascunho();

        Assert.Equal(StatusAcompanhamento.Rascunho, a.Status);
        Assert.False(a.VisivelParaResponsavel);
        HistoricoAuditoria criacao = Assert.Single(a.Historico);
        Assert.Null(criacao.StatusAnterior);
        Assert.Equal(StatusAcompanhamento.Rascunho, criacao.StatusPosterior);
    }

    [Fact]
    public void Fluxo_completo_rascunho_envio_revisao_publicacao()
    {
        Acompanhamento a = NovoRascunho();

        a.EnviarParaRevisao(_professor, Agora.AddHours(1));
        a.IniciarRevisao(_admin, Agora.AddHours(2));
        a.Publicar(_admin, Agora.AddHours(3));

        Assert.Equal(StatusAcompanhamento.Publicado, a.Status);
        Assert.True(a.VisivelParaResponsavel);
        Assert.Equal(Agora.AddHours(3), a.PublicadoEm);
        StatusAcompanhamento[] esperado =
        {
            StatusAcompanhamento.Rascunho, StatusAcompanhamento.EnviadoParaRevisao,
            StatusAcompanhamento.EmRevisao, StatusAcompanhamento.Publicado
        };
        Assert.Equal(esperado, a.Historico.Select(h => h.StatusPosterior));
    }

    [Fact]
    public void Nao_publica_sem_passar_pela_revisao()
    {
        Acompanhamento a = NovoRascunho();
        a.EnviarParaRevisao(_professor, Agora);

        Assert.Throws<RegraNegocioException>(() => a.Publicar(_admin, Agora));
    }

    [Theory]
    [InlineData(-0.5)]
    [InlineData(10.01)]
    [InlineData(7.555)]
    public void Rejeita_media_fora_da_escala(decimal media)
    {
        Assert.Throws<RegraNegocioException>(() => NovoRascunho(media));
    }

    [Fact]
    public void Nao_cria_fora_do_periodo_de_digitacao()
    {
        var turma = new Turma("5º A", "5º ano", 2026);
        var aluno = new Aluno("João", "A1", new DateOnly(2016, 4, 29), turma);
        var vinculo = new VinculoProfessor(_professor, turma, new Disciplina("Matemática", new Area("Exatas")));

        Assert.Throws<RegraNegocioException>(() =>
            new Acompanhamento(aluno, vinculo, _bimestre, _professor, "Texto", 7m, new List<Tag>(), Agora.AddDays(31)));
    }

    [Fact]
    public void Professor_nao_edita_depois_de_enviar()
    {
        Acompanhamento a = NovoRascunho();
        a.EnviarParaRevisao(_professor, Agora);

        Assert.Throws<RegraNegocioException>(() => a.EditarRascunho(_professor, "Novo texto", 9m, new List<Tag>(), Agora));
    }

    [Fact]
    public void Devolucao_permite_ajustar_e_reenviar()
    {
        Acompanhamento a = NovoRascunho();
        a.EnviarParaRevisao(_professor, Agora);
        a.IniciarRevisao(_admin, Agora);
        a.Devolver(_admin, "Detalhar melhor", Agora);

        Assert.Equal("Detalhar melhor", a.MotivoDevolucao);

        a.EditarRascunho(_professor, "Texto detalhado", 8.5m, new List<Tag> { _participativo }, Agora);
        a.EnviarParaRevisao(_professor, Agora);

        Assert.Equal(StatusAcompanhamento.EnviadoParaRevisao, a.Status);
        Assert.Null(a.MotivoDevolucao);
    }

    [Fact]
    public void Alteracao_administrativa_registra_valores_anteriores_no_historico()
    {
        Acompanhamento a = NovoRascunho(media: 7m);
        a.EnviarParaRevisao(_professor, Agora);
        a.IniciarRevisao(_admin, Agora);

        a.AlterarNaRevisao(_admin, "Texto revisado", 7.5m, new List<Tag> { _participativo, _destaque }, Agora);

        HistoricoAuditoria alteracao = a.Historico.Last();
        Assert.Equal("Alteração administrativa", alteracao.Acao);
        Assert.Same(_admin, alteracao.Usuario);
        Assert.Contains("7,00 → 7,50", alteracao.Detalhes);
        Assert.Contains("Bom desempenho", alteracao.Detalhes);
        Assert.Equal(2, a.Tags.Count);
    }

    [Fact]
    public void Professor_so_cancela_rascunho_mas_administrador_cancela_publicado()
    {
        Acompanhamento a = NovoRascunho();
        a.EnviarParaRevisao(_professor, Agora);

        Assert.Throws<RegraNegocioException>(() => a.Cancelar(_professor, "Erro", Agora));

        a.IniciarRevisao(_admin, Agora);
        a.Publicar(_admin, Agora);
        a.Cancelar(_admin, "Publicado por engano", Agora);

        Assert.Equal(StatusAcompanhamento.Cancelado, a.Status);
        Assert.False(a.VisivelParaResponsavel);
    }

    [Fact]
    public void Rejeita_tag_inativa()
    {
        Acompanhamento a = NovoRascunho();
        _destaque.Desativar();

        Assert.Throws<RegraNegocioException>(() => a.EditarRascunho(_professor, "Texto", 8m, new List<Tag> { _destaque }, Agora));
    }

    [Fact]
    public void Retorno_do_responsavel_exige_relatorio_publicado()
    {
        Acompanhamento a = NovoRascunho();
        var responsavel = new Responsavel("Marcelo", "marcelo@teste.com", "hash", "52998224725", null, Agora);

        Assert.Throws<RegraNegocioException>(() => new RetornoResponsavel(a, responsavel, "Ciente", Agora));
    }
}
