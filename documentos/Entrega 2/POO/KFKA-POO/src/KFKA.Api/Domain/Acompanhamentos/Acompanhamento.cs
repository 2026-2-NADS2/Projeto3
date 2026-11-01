using System.Globalization;
using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;

namespace KFKA.Api.Domain.Acompanhamentos
{
    // Registro bimestral de um aluno em uma disciplina.
    // Toda mudança passa por um método desta classe, que valida a regra
    // e grava uma linha no histórico de auditoria.
    public class Acompanhamento
    {
        public const decimal MediaMinima = 0m;
        public const decimal MediaMaxima = 10m;
        public const int TamanhoMaximoDescricao = 4000;

        // Listas privadas: quem está fora da classe só consegue ler (encapsulamento).
        private readonly List<Tag> _tags = new List<Tag>();
        private readonly List<HistoricoAuditoria> _historico = new List<HistoricoAuditoria>();

        public int Id { get; private set; }
        public int AlunoId { get; private set; }
        public Aluno Aluno { get; private set; } = null!;
        public int VinculoProfessorId { get; private set; }
        public VinculoProfessor VinculoProfessor { get; private set; } = null!;
        public int BimestreId { get; private set; }
        public Bimestre Bimestre { get; private set; } = null!;
        public string Descricao { get; private set; } = null!;
        public decimal Media { get; private set; }
        public StatusAcompanhamento Status { get; private set; }
        public string? MotivoDevolucao { get; private set; }
        public int? RevisorId { get; private set; }
        public DateTime CriadoEm { get; private set; }
        public DateTime AtualizadoEm { get; private set; }
        public DateTime? PublicadoEm { get; private set; }

        public IReadOnlyCollection<Tag> Tags
        {
            get { return _tags; }
        }

        public IReadOnlyCollection<HistoricoAuditoria> Historico
        {
            get { return _historico; }
        }

        public bool VisivelParaResponsavel
        {
            get { return this.Status == StatusAcompanhamento.Publicado; }
        }

        private Acompanhamento()
        {
        }

        public Acompanhamento(Aluno aluno, VinculoProfessor vinculo, Bimestre bimestre, Professor autor,
            string descricao, decimal media, List<Tag> tags, DateTime agora)
        {
            Validacao.NaoNulo(aluno, nameof(aluno));
            Validacao.NaoNulo(vinculo, nameof(vinculo));
            Validacao.NaoNulo(bimestre, nameof(bimestre));
            Validacao.NaoNulo(autor, nameof(autor));

            if (!vinculo.PertenceA(autor))
            {
                throw new AcessoNegadoException("O professor não está vinculado a esta turma e disciplina.");
            }

            Validacao.Ativo(autor.Ativo, "O professor");
            Validacao.Ativo(vinculo.Ativo, "O vínculo do professor");
            Validacao.Ativo(aluno.Ativo, "O aluno");

            if (aluno.TurmaId != vinculo.TurmaId)
            {
                throw new RegraNegocioException("O aluno não pertence à turma do vínculo.");
            }

            if (bimestre.AnoLetivo != vinculo.AnoLetivo)
            {
                throw new RegraNegocioException("O bimestre e o vínculo pertencem a anos letivos diferentes.");
            }

            GarantirPeriodoAberto(bimestre, agora);

            this.Aluno = aluno;
            this.AlunoId = aluno.Id;
            this.VinculoProfessor = vinculo;
            this.VinculoProfessorId = vinculo.Id;
            this.Bimestre = bimestre;
            this.BimestreId = bimestre.Id;
            DefinirConteudo(descricao, media, tags);
            this.Status = StatusAcompanhamento.Rascunho;
            this.CriadoEm = agora;
            this.AtualizadoEm = agora;

            RegistrarHistorico(autor, "Criação do rascunho", null, "Média: " + Formatar(this.Media), agora);
        }

        // ---------- Ações do professor ----------

        public void EditarRascunho(Professor professor, string descricao, decimal media, List<Tag> tags, DateTime agora)
        {
            GarantirAutor(professor);
            if (this.Status != StatusAcompanhamento.Rascunho && this.Status != StatusAcompanhamento.Devolvido)
            {
                throw StatusInvalido("editado pelo professor");
            }
            GarantirPeriodoAberto(this.Bimestre, agora);

            string detalhes = AplicarConteudo(descricao, media, tags);
            this.AtualizadoEm = agora;
            RegistrarHistorico(professor, "Edição pelo professor", this.Status, detalhes, agora);
        }

        public void EnviarParaRevisao(Professor professor, DateTime agora)
        {
            GarantirAutor(professor);
            if (this.Status != StatusAcompanhamento.Rascunho && this.Status != StatusAcompanhamento.Devolvido)
            {
                throw StatusInvalido("enviado para revisão");
            }
            GarantirPeriodoAberto(this.Bimestre, agora);

            this.MotivoDevolucao = null;
            MudarStatus(StatusAcompanhamento.EnviadoParaRevisao, professor, "Envio para revisão", null, agora);
        }

        // ---------- Ações do administrador ----------

        public void IniciarRevisao(Administrador administrador, DateTime agora)
        {
            GarantirAdministradorAtivo(administrador);
            if (this.Status != StatusAcompanhamento.EnviadoParaRevisao)
            {
                throw StatusInvalido("colocado em revisão");
            }

            this.RevisorId = administrador.Id;
            MudarStatus(StatusAcompanhamento.EmRevisao, administrador, "Início da revisão", null, agora);
        }

        public void AlterarNaRevisao(Administrador administrador, string descricao, decimal media, List<Tag> tags, DateTime agora)
        {
            GarantirAdministradorAtivo(administrador);
            if (this.Status != StatusAcompanhamento.EmRevisao)
            {
                throw StatusInvalido("alterado pela administração");
            }

            string detalhes = AplicarConteudo(descricao, media, tags);
            this.AtualizadoEm = agora;
            RegistrarHistorico(administrador, "Alteração administrativa", this.Status, detalhes, agora);
        }

        public void Devolver(Administrador administrador, string motivo, DateTime agora)
        {
            GarantirAdministradorAtivo(administrador);
            if (this.Status != StatusAcompanhamento.EmRevisao)
            {
                throw StatusInvalido("devolvido para ajustes");
            }

            this.MotivoDevolucao = Validacao.Texto(motivo, "Motivo da devolução", 1000);
            MudarStatus(StatusAcompanhamento.Devolvido, administrador, "Devolução para ajustes", this.MotivoDevolucao, agora);
        }

        public void Publicar(Administrador administrador, DateTime agora)
        {
            GarantirAdministradorAtivo(administrador);
            if (this.Status != StatusAcompanhamento.EmRevisao)
            {
                throw StatusInvalido("publicado");
            }

            this.PublicadoEm = agora;
            MudarStatus(StatusAcompanhamento.Publicado, administrador, "Publicação", null, agora);
        }

        // ---------- Cancelamento (polimorfismo: a regra muda conforme o tipo do usuário) ----------

        public void Cancelar(Usuario usuario, string motivo, DateTime agora)
        {
            if (usuario is Professor)
            {
                // O professor só cancela o que ainda está com ele.
                GarantirAutor((Professor)usuario);
                if (this.Status != StatusAcompanhamento.Rascunho && this.Status != StatusAcompanhamento.Devolvido)
                {
                    throw StatusInvalido("cancelado pelo professor");
                }
            }
            else if (usuario is Administrador)
            {
                // O administrador cancela em qualquer etapa.
                GarantirAdministradorAtivo((Administrador)usuario);
                if (this.Status == StatusAcompanhamento.Cancelado)
                {
                    throw new RegraNegocioException("O acompanhamento já está cancelado.");
                }
            }
            else
            {
                throw new AcessoNegadoException("Este perfil não pode cancelar acompanhamentos.");
            }

            string motivoValidado = Validacao.Texto(motivo, "Motivo do cancelamento", 1000);
            MudarStatus(StatusAcompanhamento.Cancelado, usuario, "Cancelamento", motivoValidado, agora);
        }

        // ---------- Métodos auxiliares (privados) ----------

        private void GarantirAutor(Professor professor)
        {
            Validacao.NaoNulo(professor, nameof(professor));
            if (!this.VinculoProfessor.PertenceA(professor))
            {
                throw new AcessoNegadoException("Somente o professor autor pode alterar este acompanhamento.");
            }

            Validacao.Ativo(professor.Ativo, "O professor");
            // Se o vínculo foi desativado (ex.: troca de professor), o registro sai das mãos dele;
            // só a administração pode cancelá-lo ou conduzi-lo daqui em diante.
            Validacao.Ativo(this.VinculoProfessor.Ativo, "O vínculo do professor");
        }

        private static void GarantirAdministradorAtivo(Administrador administrador)
        {
            Validacao.NaoNulo(administrador, nameof(administrador));
            Validacao.Ativo(administrador.Ativo, "O administrador");
        }

        private RegraNegocioException StatusInvalido(string acao)
        {
            return new RegraNegocioException("Um acompanhamento com status " + this.Status + " não pode ser " + acao + ".");
        }

        private static void GarantirPeriodoAberto(Bimestre bimestre, DateTime agora)
        {
            if (!bimestre.EstaAberto(agora))
            {
                throw new RegraNegocioException("O período de digitação do " + bimestre.Numero + "º bimestre de "
                    + bimestre.AnoLetivo + " não está aberto.");
            }
        }

        // Troca o conteúdo e devolve um texto com o que mudou (vai para o histórico).
        private string AplicarConteudo(string descricao, decimal media, List<Tag> tags)
        {
            string mediaAnterior = Formatar(this.Media);
            string descricaoAnterior = this.Descricao;
            string tagsAnteriores = NomesDasTags();

            DefinirConteudo(descricao, media, tags);

            List<string> alteracoes = new List<string>();
            if (mediaAnterior != Formatar(this.Media))
            {
                alteracoes.Add("Média: " + mediaAnterior + " → " + Formatar(this.Media));
            }
            if (descricaoAnterior != this.Descricao)
            {
                alteracoes.Add("Descrição anterior: \"" + descricaoAnterior + "\"");
            }
            if (tagsAnteriores != NomesDasTags())
            {
                alteracoes.Add("Tags: [" + tagsAnteriores + "] → [" + NomesDasTags() + "]");
            }

            if (alteracoes.Count == 0)
            {
                return "Sem alterações de conteúdo.";
            }
            return string.Join("; ", alteracoes);
        }

        // Valida tudo antes de alterar qualquer campo.
        private void DefinirConteudo(string descricao, decimal media, List<Tag> tags)
        {
            Validacao.NaoNulo(tags, nameof(tags));

            if (media < MediaMinima || media > MediaMaxima)
            {
                throw new RegraNegocioException("A média deve estar entre " + MediaMinima + " e " + MediaMaxima + ".");
            }

            if (decimal.Round(media, 2) != media)
            {
                throw new RegraNegocioException("A média deve ter no máximo duas casas decimais.");
            }

            List<Tag> novasTags = new List<Tag>();
            foreach (Tag tag in tags)
            {
                if (!tag.Ativo)
                {
                    throw new RegraNegocioException("A tag '" + tag.Nome + "' está inativa.");
                }
                if (!novasTags.Contains(tag))
                {
                    novasTags.Add(tag);
                }
            }

            this.Descricao = Validacao.Texto(descricao, "Descrição", TamanhoMaximoDescricao);
            this.Media = media;
            _tags.Clear();
            _tags.AddRange(novasTags);
        }

        private void MudarStatus(StatusAcompanhamento novoStatus, Usuario usuario, string acao, string? detalhes, DateTime agora)
        {
            StatusAcompanhamento anterior = this.Status;
            this.Status = novoStatus;
            this.AtualizadoEm = agora;
            RegistrarHistorico(usuario, acao, anterior, detalhes, agora);
        }

        private void RegistrarHistorico(Usuario usuario, string acao, StatusAcompanhamento? anterior, string? detalhes, DateTime agora)
        {
            _historico.Add(new HistoricoAuditoria(usuario, acao, anterior, this.Status, detalhes, agora));
        }

        private string NomesDasTags()
        {
            List<string> nomes = new List<string>();
            foreach (Tag tag in _tags)
            {
                nomes.Add(tag.Nome);
            }
            nomes.Sort();
            return string.Join(", ", nomes);
        }

        private static string Formatar(decimal valor)
        {
            return valor.ToString("0.00", new CultureInfo("pt-BR"));
        }
    }
}
