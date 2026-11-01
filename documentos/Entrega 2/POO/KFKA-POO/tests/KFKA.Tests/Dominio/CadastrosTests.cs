using KFKA.Api.Domain;
using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;

namespace KFKA.Tests.Dominio;

public class CadastrosTests
{
    private static readonly DateTime Agora = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData("529.982.247-25", "52998224725")]
    [InlineData("11144477735", "11144477735")]
    public void Aceita_cpf_valido_e_guarda_so_digitos(string cpf, string esperado)
    {
        var responsavel = new Responsavel("Marcelo", "marcelo@teste.com", "hash", cpf, null, Agora);

        Assert.Equal(esperado, responsavel.Cpf);
    }

    [Theory]
    [InlineData("529.982.247-26")]
    [InlineData("111.111.111-11")]
    [InlineData("123")]
    public void Rejeita_cpf_invalido(string cpf)
    {
        Assert.Throws<RegraNegocioException>(() => new Responsavel("Marcelo", "m@teste.com", "hash", cpf, null, Agora));
    }

    [Fact]
    public void Rejeita_email_invalido()
    {
        Assert.Throws<RegraNegocioException>(() => new Professor("Ana", "email-invalido", "hash", "P1", Agora));
    }

    [Fact]
    public void Bimestre_so_aceita_numeros_de_1_a_4()
    {
        Assert.Throws<RegraNegocioException>(() => new Bimestre(5, 2026, Agora, Agora.AddDays(1)));
    }

    [Fact]
    public void Bimestre_exige_encerramento_depois_da_abertura()
    {
        Assert.Throws<RegraNegocioException>(() => new Bimestre(1, 2026, Agora, Agora.AddMinutes(-1)));
    }

    [Fact]
    public void Bimestre_aberto_somente_dentro_do_periodo()
    {
        var bimestre = new Bimestre(1, 2026, Agora, Agora.AddDays(10));

        Assert.True(bimestre.EstaAberto(Agora.AddDays(5)));
        Assert.False(bimestre.EstaAberto(Agora.AddDays(11)));
    }

    [Fact]
    public void Nao_matricula_aluno_em_turma_inativa()
    {
        var turma = new Turma("5º A", "5º ano", 2026);
        turma.Desativar();

        Assert.Throws<RegraNegocioException>(() => new Aluno("João", "A1", new DateOnly(2016, 1, 1), turma));
    }
}
