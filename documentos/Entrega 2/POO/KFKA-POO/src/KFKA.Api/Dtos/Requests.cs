using System.ComponentModel.DataAnnotations;
using KFKA.Api.Domain;

namespace KFKA.Api.Dtos
{
    // DTOs de entrada: o formato do JSON que a API recebe.
    // Os atributos [Required], [Range] etc. são validados automaticamente
    // antes de chegar no controller (se falhar, a API devolve 400).

    // ---------- Autenticação ----------
    public class LoginRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required]
        public string Senha { get; set; } = "";
    }

    // ---------- Usuários ----------
    public class CriarAdministradorRequest
    {
        [Required, StringLength(150)]
        public string Nome { get; set; } = "";

        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required, MinLength(8)]
        public string Senha { get; set; } = "";

        [StringLength(60)]
        public string? Cargo { get; set; }
    }

    public class CriarProfessorRequest
    {
        [Required, StringLength(150)]
        public string Nome { get; set; } = "";

        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required, MinLength(8)]
        public string Senha { get; set; } = "";

        [Required, StringLength(20)]
        public string Matricula { get; set; } = "";
    }

    public class CriarResponsavelRequest
    {
        [Required, StringLength(150)]
        public string Nome { get; set; } = "";

        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required, MinLength(8)]
        public string Senha { get; set; } = "";

        [Required]
        public string Cpf { get; set; } = "";

        [StringLength(20)]
        public string? Telefone { get; set; }
    }

    public class AtualizarUsuarioRequest
    {
        [Required, StringLength(150)]
        public string Nome { get; set; } = "";

        [Required, EmailAddress]
        public string Email { get; set; } = "";
    }

    // Usado para ativar/desativar qualquer cadastro.
    public class SituacaoRequest
    {
        public bool Ativo { get; set; }
    }

    // ---------- Estrutura escolar ----------
    public class AreaRequest
    {
        [Required, StringLength(80)]
        public string Nome { get; set; } = "";
    }

    public class DisciplinaRequest
    {
        [Required, StringLength(100)]
        public string Nome { get; set; } = "";

        [Range(1, int.MaxValue)]
        public int AreaId { get; set; }
    }

    public class TurmaRequest
    {
        [Required, StringLength(50)]
        public string Nome { get; set; } = "";

        [Required, StringLength(30)]
        public string Serie { get; set; } = "";

        [Range(2000, 2100)]
        public int AnoLetivo { get; set; }
    }

    public class AlunoRequest
    {
        [Required, StringLength(150)]
        public string Nome { get; set; } = "";

        [Required, StringLength(20)]
        public string Matricula { get; set; } = "";

        public DateOnly DataNascimento { get; set; }

        [Range(1, int.MaxValue)]
        public int TurmaId { get; set; }
    }

    public class AtualizarAlunoRequest
    {
        [Required, StringLength(150)]
        public string Nome { get; set; } = "";

        public DateOnly DataNascimento { get; set; }

        [Range(1, int.MaxValue)]
        public int TurmaId { get; set; }
    }

    public class TagRequest
    {
        [Required, StringLength(50)]
        public string Nome { get; set; } = "";

        [StringLength(200)]
        public string? Descricao { get; set; }
    }

    // As datas vêm com fuso (ex.: 2026-10-05T00:00:00-03:00) e são gravadas em UTC.
    public class BimestreRequest
    {
        [Range(1, 4)]
        public int Numero { get; set; }

        [Range(2000, 2100)]
        public int AnoLetivo { get; set; }

        public DateTimeOffset AberturaDigitacao { get; set; }
        public DateTimeOffset EncerramentoDigitacao { get; set; }
    }

    public class PeriodoDigitacaoRequest
    {
        public DateTimeOffset AberturaDigitacao { get; set; }
        public DateTimeOffset EncerramentoDigitacao { get; set; }
    }

    // ---------- Vínculos ----------
    public class VinculoProfessorRequest
    {
        [Range(1, int.MaxValue)]
        public int ProfessorId { get; set; }

        [Range(1, int.MaxValue)]
        public int TurmaId { get; set; }

        [Range(1, int.MaxValue)]
        public int DisciplinaId { get; set; }
    }

    public class VinculoResponsavelRequest
    {
        [Range(1, int.MaxValue)]
        public int AlunoId { get; set; }

        [Range(1, int.MaxValue)]
        public int ResponsavelId { get; set; }

        [Required, StringLength(30)]
        public string Parentesco { get; set; } = "";

        public bool Principal { get; set; }
    }

    // ---------- Acompanhamentos ----------
    public class CriarAcompanhamentoRequest
    {
        [Range(1, int.MaxValue)]
        public int VinculoProfessorId { get; set; }

        [Range(1, int.MaxValue)]
        public int AlunoId { get; set; }

        [Range(1, int.MaxValue)]
        public int BimestreId { get; set; }

        [Required, StringLength(4000)]
        public string Descricao { get; set; } = "";

        [Range(0, 10)]
        public decimal Media { get; set; }

        public List<int> TagIds { get; set; } = new List<int>();
    }

    public class ConteudoAcompanhamentoRequest
    {
        [Required, StringLength(4000)]
        public string Descricao { get; set; } = "";

        [Range(0, 10)]
        public decimal Media { get; set; }

        public List<int> TagIds { get; set; } = new List<int>();
    }

    public class MotivoRequest
    {
        [Required, StringLength(1000)]
        public string Motivo { get; set; } = "";
    }

    public class RetornoRequest
    {
        [StringLength(1000)]
        public string? Observacao { get; set; }
    }

    // Filtros da listagem de acompanhamentos (todos opcionais, vêm pela URL).
    public class FiltroAcompanhamentos
    {
        public StatusAcompanhamento? Status { get; set; }
        public int? AnoLetivo { get; set; }
        public int? BimestreId { get; set; }
        public int? TurmaId { get; set; }
        public int? DisciplinaId { get; set; }
        public int? ProfessorId { get; set; }
        public int? AlunoId { get; set; }
        public int? TagId { get; set; }
        public int Pagina { get; set; } = 1;
        public int TamanhoPagina { get; set; } = 20;
    }
}
