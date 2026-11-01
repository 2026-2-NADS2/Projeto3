using KFKA.Api.Domain;
using KFKA.Api.Domain.Acompanhamentos;
using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;

namespace KFKA.Api.Dtos
{
    // DTOs de saída: o formato do JSON que a API devolve.
    // Cada classe recebe a entidade no construtor e copia só o que pode ser exibido
    // (por exemplo, o hash da senha nunca sai da API).

    public class UsuarioResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public string Email { get; set; } = "";
        public Perfil Perfil { get; set; }
        public bool Ativo { get; set; }
        public string? Matricula { get; set; }
        public string? Cpf { get; set; }
        public string? Telefone { get; set; }
        public string? Cargo { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public UsuarioResponse()
        {
        }

        public UsuarioResponse(Usuario usuario)
        {
            this.Id = usuario.Id;
            this.Nome = usuario.Nome;
            this.Email = usuario.Email;
            this.Perfil = usuario.Perfil;
            this.Ativo = usuario.Ativo;

            // Campos específicos de cada subclasse.
            if (usuario is Professor)
            {
                this.Matricula = ((Professor)usuario).Matricula;
            }
            else if (usuario is Responsavel)
            {
                this.Cpf = ((Responsavel)usuario).Cpf;
                this.Telefone = ((Responsavel)usuario).Telefone;
            }
            else if (usuario is Administrador)
            {
                this.Cargo = ((Administrador)usuario).Cargo;
            }
        }
    }

    public class LoginResponse
    {
        public string Token { get; set; } = "";
        public DateTime ExpiraEm { get; set; }
        public UsuarioResponse Usuario { get; set; } = null!;
    }

    public class AreaResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public bool Ativo { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public AreaResponse()
        {
        }

        public AreaResponse(Area area)
        {
            this.Id = area.Id;
            this.Nome = area.Nome;
            this.Ativo = area.Ativo;
        }
    }

    public class DisciplinaResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public int AreaId { get; set; }
        public string Area { get; set; } = "";
        public bool Ativo { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public DisciplinaResponse()
        {
        }

        public DisciplinaResponse(Disciplina disciplina)
        {
            this.Id = disciplina.Id;
            this.Nome = disciplina.Nome;
            this.AreaId = disciplina.AreaId;
            this.Area = disciplina.Area.Nome;
            this.Ativo = disciplina.Ativo;
        }
    }

    public class TurmaResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public string Serie { get; set; } = "";
        public int AnoLetivo { get; set; }
        public bool Ativo { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public TurmaResponse()
        {
        }

        public TurmaResponse(Turma turma)
        {
            this.Id = turma.Id;
            this.Nome = turma.Nome;
            this.Serie = turma.Serie;
            this.AnoLetivo = turma.AnoLetivo;
            this.Ativo = turma.Ativo;
        }
    }

    public class AlunoResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public string Matricula { get; set; } = "";
        public DateOnly DataNascimento { get; set; }
        public int TurmaId { get; set; }
        public string Turma { get; set; } = "";
        public bool Ativo { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public AlunoResponse()
        {
        }

        public AlunoResponse(Aluno aluno)
        {
            this.Id = aluno.Id;
            this.Nome = aluno.Nome;
            this.Matricula = aluno.Matricula;
            this.DataNascimento = aluno.DataNascimento;
            this.TurmaId = aluno.TurmaId;
            this.Turma = aluno.Turma.Nome;
            this.Ativo = aluno.Ativo;
        }
    }

    public class TagResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public string? Descricao { get; set; }
        public bool Ativo { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public TagResponse()
        {
        }

        public TagResponse(Tag tag)
        {
            this.Id = tag.Id;
            this.Nome = tag.Nome;
            this.Descricao = tag.Descricao;
            this.Ativo = tag.Ativo;
        }
    }

    public class BimestreResponse
    {
        public int Id { get; set; }
        public int Numero { get; set; }
        public int AnoLetivo { get; set; }
        public DateTime AberturaDigitacao { get; set; }
        public DateTime EncerramentoDigitacao { get; set; }
        public bool DigitacaoAberta { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public BimestreResponse()
        {
        }

        public BimestreResponse(Bimestre bimestre, DateTime agora)
        {
            this.Id = bimestre.Id;
            this.Numero = bimestre.Numero;
            this.AnoLetivo = bimestre.AnoLetivo;
            this.AberturaDigitacao = bimestre.AberturaDigitacao;
            this.EncerramentoDigitacao = bimestre.EncerramentoDigitacao;
            this.DigitacaoAberta = bimestre.EstaAberto(agora);
        }
    }

    public class VinculoProfessorResponse
    {
        public int Id { get; set; }
        public int ProfessorId { get; set; }
        public string Professor { get; set; } = "";
        public int TurmaId { get; set; }
        public string Turma { get; set; } = "";
        public int DisciplinaId { get; set; }
        public string Disciplina { get; set; } = "";
        public int AnoLetivo { get; set; }
        public bool Ativo { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public VinculoProfessorResponse()
        {
        }

        public VinculoProfessorResponse(VinculoProfessor vinculo)
        {
            this.Id = vinculo.Id;
            this.ProfessorId = vinculo.ProfessorId;
            this.Professor = vinculo.Professor.Nome;
            this.TurmaId = vinculo.TurmaId;
            this.Turma = vinculo.Turma.Nome;
            this.DisciplinaId = vinculo.DisciplinaId;
            this.Disciplina = vinculo.Disciplina.Nome;
            this.AnoLetivo = vinculo.AnoLetivo;
            this.Ativo = vinculo.Ativo;
        }
    }

    public class VinculoResponsavelResponse
    {
        public int AlunoId { get; set; }
        public string Aluno { get; set; } = "";
        public int ResponsavelId { get; set; }
        public string Responsavel { get; set; } = "";
        public string Parentesco { get; set; } = "";
        public bool Principal { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public VinculoResponsavelResponse()
        {
        }

        public VinculoResponsavelResponse(AlunoResponsavel vinculo)
        {
            this.AlunoId = vinculo.AlunoId;
            this.Aluno = vinculo.Aluno.Nome;
            this.ResponsavelId = vinculo.ResponsavelId;
            this.Responsavel = vinculo.Responsavel.Nome;
            this.Parentesco = vinculo.Parentesco;
            this.Principal = vinculo.Principal;
        }
    }

    // Visão completa, usada por Professor e Administrador.
    public class AcompanhamentoResponse
    {
        public int Id { get; set; }
        public int AlunoId { get; set; }
        public string Aluno { get; set; } = "";
        public int TurmaId { get; set; }
        public string Turma { get; set; } = "";
        public int DisciplinaId { get; set; }
        public string Disciplina { get; set; } = "";
        public int ProfessorId { get; set; }
        public string Professor { get; set; } = "";
        public int VinculoProfessorId { get; set; }
        public int BimestreId { get; set; }
        public int Bimestre { get; set; }
        public int AnoLetivo { get; set; }
        public string Descricao { get; set; } = "";
        public decimal Media { get; set; }
        public StatusAcompanhamento Status { get; set; }
        public List<TagResponse> Tags { get; set; } = new List<TagResponse>();
        public string? MotivoDevolucao { get; set; }
        public DateTime CriadoEm { get; set; }
        public DateTime AtualizadoEm { get; set; }
        public DateTime? PublicadoEm { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public AcompanhamentoResponse()
        {
        }

        public AcompanhamentoResponse(Acompanhamento a)
        {
            this.Id = a.Id;
            this.AlunoId = a.AlunoId;
            this.Aluno = a.Aluno.Nome;
            this.TurmaId = a.VinculoProfessor.TurmaId;
            this.Turma = a.VinculoProfessor.Turma.Nome;
            this.DisciplinaId = a.VinculoProfessor.DisciplinaId;
            this.Disciplina = a.VinculoProfessor.Disciplina.Nome;
            this.ProfessorId = a.VinculoProfessor.ProfessorId;
            this.Professor = a.VinculoProfessor.Professor.Nome;
            this.VinculoProfessorId = a.VinculoProfessorId;
            this.BimestreId = a.BimestreId;
            this.Bimestre = a.Bimestre.Numero;
            this.AnoLetivo = a.Bimestre.AnoLetivo;
            this.Descricao = a.Descricao;
            this.Media = a.Media;
            this.Status = a.Status;
            this.MotivoDevolucao = a.MotivoDevolucao;
            this.CriadoEm = a.CriadoEm;
            this.AtualizadoEm = a.AtualizadoEm;
            this.PublicadoEm = a.PublicadoEm;

            foreach (Tag tag in a.Tags.OrderBy(t => t.Nome))
            {
                this.Tags.Add(new TagResponse(tag));
            }
        }
    }

    // Visão do Pai/Responsável: só dados publicados, sem informações internas do fluxo.
    public class RelatorioPublicadoResponse
    {
        public int Id { get; set; }
        public int AlunoId { get; set; }
        public string Aluno { get; set; } = "";
        public string Turma { get; set; } = "";
        public string Disciplina { get; set; } = "";
        public string Professor { get; set; } = "";
        public int Bimestre { get; set; }
        public int AnoLetivo { get; set; }
        public string Descricao { get; set; } = "";
        public decimal Media { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
        public DateTime? PublicadoEm { get; set; }
        public DateTime? CienciaRegistradaEm { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public RelatorioPublicadoResponse()
        {
        }

        public RelatorioPublicadoResponse(Acompanhamento a, DateTime? cienciaRegistradaEm)
        {
            this.Id = a.Id;
            this.AlunoId = a.AlunoId;
            this.Aluno = a.Aluno.Nome;
            this.Turma = a.VinculoProfessor.Turma.Nome;
            this.Disciplina = a.VinculoProfessor.Disciplina.Nome;
            this.Professor = a.VinculoProfessor.Professor.Nome;
            this.Bimestre = a.Bimestre.Numero;
            this.AnoLetivo = a.Bimestre.AnoLetivo;
            this.Descricao = a.Descricao;
            this.Media = a.Media;
            this.PublicadoEm = a.PublicadoEm;
            this.CienciaRegistradaEm = cienciaRegistradaEm;

            foreach (Tag tag in a.Tags)
            {
                this.Tags.Add(tag.Nome);
            }
            this.Tags.Sort();
        }
    }

    public class HistoricoResponse
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string Usuario { get; set; } = "";
        public Perfil Perfil { get; set; }
        public string Acao { get; set; } = "";
        public StatusAcompanhamento? StatusAnterior { get; set; }
        public StatusAcompanhamento StatusPosterior { get; set; }
        public string? Detalhes { get; set; }
        public DateTime DataHora { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public HistoricoResponse()
        {
        }

        public HistoricoResponse(HistoricoAuditoria h)
        {
            this.Id = h.Id;
            this.UsuarioId = h.UsuarioId;
            this.Usuario = h.Usuario.Nome;
            this.Perfil = h.Usuario.Perfil;
            this.Acao = h.Acao;
            this.StatusAnterior = h.StatusAnterior;
            this.StatusPosterior = h.StatusPosterior;
            this.Detalhes = h.Detalhes;
            this.DataHora = h.DataHora;
        }
    }

    public class RetornoResponse
    {
        public int Id { get; set; }
        public int AcompanhamentoId { get; set; }
        public string Aluno { get; set; } = "";
        public string Disciplina { get; set; } = "";
        public int Bimestre { get; set; }
        public int ResponsavelId { get; set; }
        public string Responsavel { get; set; } = "";
        public string? Observacao { get; set; }
        public DateTime CienteEm { get; set; }

        // Construtor vazio usado para ler o JSON (ex.: nos testes).
        public RetornoResponse()
        {
        }

        public RetornoResponse(RetornoResponsavel r)
        {
            this.Id = r.Id;
            this.AcompanhamentoId = r.AcompanhamentoId;
            this.Aluno = r.Acompanhamento.Aluno.Nome;
            this.Disciplina = r.Acompanhamento.VinculoProfessor.Disciplina.Nome;
            this.Bimestre = r.Acompanhamento.Bimestre.Numero;
            this.ResponsavelId = r.ResponsavelId;
            this.Responsavel = r.Responsavel.Nome;
            this.Observacao = r.Observacao;
            this.CienteEm = r.CienteEm;
        }
    }

    // Uma página de resultados (paginação da listagem de acompanhamentos).
    public class PaginaAcompanhamentos
    {
        public List<AcompanhamentoResponse> Itens { get; set; } = new List<AcompanhamentoResponse>();
        public int NumeroPagina { get; set; }
        public int TamanhoPagina { get; set; }
        public int TotalItens { get; set; }
        public int TotalPaginas { get; set; }
    }
}
