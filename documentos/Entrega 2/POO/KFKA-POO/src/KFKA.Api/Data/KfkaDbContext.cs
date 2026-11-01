using KFKA.Api.Domain;
using KFKA.Api.Domain.Acompanhamentos;
using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace KFKA.Api.Data
{
    // Representa o banco de dados. Cada DbSet vira uma tabela.
    public class KfkaDbContext : DbContext
    {
        public KfkaDbContext(DbContextOptions<KfkaDbContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<Administrador> Administradores { get; set; } = null!;
        public DbSet<Professor> Professores { get; set; } = null!;
        public DbSet<Responsavel> Responsaveis { get; set; } = null!;
        public DbSet<Area> Areas { get; set; } = null!;
        public DbSet<Disciplina> Disciplinas { get; set; } = null!;
        public DbSet<Turma> Turmas { get; set; } = null!;
        public DbSet<Aluno> Alunos { get; set; } = null!;
        public DbSet<Tag> Tags { get; set; } = null!;
        public DbSet<Bimestre> Bimestres { get; set; } = null!;
        public DbSet<VinculoProfessor> VinculosProfessores { get; set; } = null!;
        public DbSet<AlunoResponsavel> AlunosResponsaveis { get; set; } = null!;
        public DbSet<Acompanhamento> Acompanhamentos { get; set; } = null!;
        public DbSet<HistoricoAuditoria> Historicos { get; set; } = null!;
        public DbSet<RetornoResponsavel> Retornos { get; set; } = null!;

        // Regras que valem para todas as tabelas.
        protected override void ConfigureConventions(ModelConfigurationBuilder configuracao)
        {
            // Enums são gravados como texto ("Publicado") em vez de número (3).
            configuracao.Properties<Perfil>().HaveConversion<string>().HaveMaxLength(20);
            configuracao.Properties<StatusAcompanhamento>().HaveConversion<string>().HaveMaxLength(30);
            // Datas sempre em UTC.
            configuracao.Properties<DateTime>().HaveConversion<DataHoraUtcConverter>();
            configuracao.Properties<decimal>().HavePrecision(5, 2);
        }

        // Tamanhos de colunas, chaves, índices e relacionamentos.
        protected override void OnModelCreating(ModelBuilder modelo)
        {
            // Herança: os três perfis ficam na mesma tabela "Usuarios",
            // e a coluna Perfil indica de qual classe é cada linha.
            modelo.Entity<Usuario>().ToTable("Usuarios");
            modelo.Entity<Usuario>().HasDiscriminator(u => u.Perfil)
                .HasValue<Administrador>(Perfil.Administrador)
                .HasValue<Professor>(Perfil.Professor)
                .HasValue<Responsavel>(Perfil.Responsavel);
            modelo.Entity<Usuario>().Property(u => u.Nome).HasMaxLength(150);
            modelo.Entity<Usuario>().Property(u => u.Email).HasMaxLength(150);
            modelo.Entity<Usuario>().Property(u => u.SenhaHash).HasMaxLength(100);
            modelo.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();

            modelo.Entity<Administrador>().Property(a => a.Cargo).HasMaxLength(60);
            modelo.Entity<Professor>().Property(p => p.Matricula).HasMaxLength(20);
            modelo.Entity<Professor>().HasIndex(p => p.Matricula).IsUnique();
            modelo.Entity<Responsavel>().Property(r => r.Cpf).HasMaxLength(11);
            modelo.Entity<Responsavel>().Property(r => r.Telefone).HasMaxLength(20);
            modelo.Entity<Responsavel>().HasIndex(r => r.Cpf).IsUnique();

            // Estrutura escolar
            modelo.Entity<Area>().Property(a => a.Nome).HasMaxLength(80);
            modelo.Entity<Area>().HasIndex(a => a.Nome).IsUnique();

            modelo.Entity<Disciplina>().Property(d => d.Nome).HasMaxLength(100);
            modelo.Entity<Disciplina>().HasIndex(d => d.Nome).IsUnique();
            modelo.Entity<Disciplina>().HasOne(d => d.Area).WithMany()
                .HasForeignKey(d => d.AreaId).OnDelete(DeleteBehavior.Restrict);

            modelo.Entity<Turma>().Property(t => t.Nome).HasMaxLength(50);
            modelo.Entity<Turma>().Property(t => t.Serie).HasMaxLength(30);
            modelo.Entity<Turma>().HasIndex(t => new { t.Nome, t.AnoLetivo }).IsUnique();

            modelo.Entity<Aluno>().Property(a => a.Nome).HasMaxLength(150);
            modelo.Entity<Aluno>().Property(a => a.Matricula).HasMaxLength(20);
            modelo.Entity<Aluno>().HasIndex(a => a.Matricula).IsUnique();
            modelo.Entity<Aluno>().HasIndex(a => a.Nome);
            modelo.Entity<Aluno>().HasOne(a => a.Turma).WithMany()
                .HasForeignKey(a => a.TurmaId).OnDelete(DeleteBehavior.Restrict);

            modelo.Entity<Tag>().Property(t => t.Nome).HasMaxLength(50);
            modelo.Entity<Tag>().Property(t => t.Descricao).HasMaxLength(200);
            modelo.Entity<Tag>().HasIndex(t => t.Nome).IsUnique();

            modelo.Entity<Bimestre>().HasIndex(b => new { b.AnoLetivo, b.Numero }).IsUnique();

            // Vínculos
            modelo.Entity<VinculoProfessor>().ToTable("VinculosProfessores");
            modelo.Entity<VinculoProfessor>().HasOne(v => v.Professor).WithMany()
                .HasForeignKey(v => v.ProfessorId).OnDelete(DeleteBehavior.Restrict);
            modelo.Entity<VinculoProfessor>().HasOne(v => v.Turma).WithMany()
                .HasForeignKey(v => v.TurmaId).OnDelete(DeleteBehavior.Restrict);
            modelo.Entity<VinculoProfessor>().HasOne(v => v.Disciplina).WithMany()
                .HasForeignKey(v => v.DisciplinaId).OnDelete(DeleteBehavior.Restrict);
            modelo.Entity<VinculoProfessor>()
                .HasIndex(v => new { v.ProfessorId, v.TurmaId, v.DisciplinaId, v.AnoLetivo }).IsUnique();

            modelo.Entity<AlunoResponsavel>().ToTable("AlunosResponsaveis");
            modelo.Entity<AlunoResponsavel>().HasKey(v => new { v.AlunoId, v.ResponsavelId });
            modelo.Entity<AlunoResponsavel>().Property(v => v.Parentesco).HasMaxLength(30);
            modelo.Entity<AlunoResponsavel>().HasOne(v => v.Aluno).WithMany()
                .HasForeignKey(v => v.AlunoId).OnDelete(DeleteBehavior.Cascade);
            modelo.Entity<AlunoResponsavel>().HasOne(v => v.Responsavel).WithMany()
                .HasForeignKey(v => v.ResponsavelId).OnDelete(DeleteBehavior.Cascade);

            // Acompanhamentos
            modelo.Entity<Acompanhamento>().Property(a => a.Descricao).HasMaxLength(Acompanhamento.TamanhoMaximoDescricao);
            modelo.Entity<Acompanhamento>().Property(a => a.MotivoDevolucao).HasMaxLength(1000);
            modelo.Entity<Acompanhamento>().HasOne(a => a.Aluno).WithMany()
                .HasForeignKey(a => a.AlunoId).OnDelete(DeleteBehavior.Restrict);
            modelo.Entity<Acompanhamento>().HasOne(a => a.VinculoProfessor).WithMany()
                .HasForeignKey(a => a.VinculoProfessorId).OnDelete(DeleteBehavior.Restrict);
            modelo.Entity<Acompanhamento>().HasOne(a => a.Bimestre).WithMany()
                .HasForeignKey(a => a.BimestreId).OnDelete(DeleteBehavior.Restrict);
            modelo.Entity<Acompanhamento>().HasOne<Administrador>().WithMany()
                .HasForeignKey(a => a.RevisorId).OnDelete(DeleteBehavior.Restrict);
            // Relação N:N com Tag: o EF cria a tabela intermediária AcompanhamentosTags.
            modelo.Entity<Acompanhamento>().HasMany(a => a.Tags).WithMany().UsingEntity("AcompanhamentosTags");
            modelo.Entity<Acompanhamento>().HasMany(a => a.Historico).WithOne()
                .HasForeignKey(h => h.AcompanhamentoId).OnDelete(DeleteBehavior.Cascade);
            modelo.Entity<Acompanhamento>().HasIndex(a => a.Status);
            modelo.Entity<Acompanhamento>().HasIndex(a => new { a.AlunoId, a.BimestreId });

            modelo.Entity<HistoricoAuditoria>().ToTable("HistoricoAuditoria");
            modelo.Entity<HistoricoAuditoria>().Property(h => h.Acao).HasMaxLength(60);
            modelo.Entity<HistoricoAuditoria>().Property(h => h.Detalhes).HasMaxLength(HistoricoAuditoria.TamanhoMaximoDetalhes);
            modelo.Entity<HistoricoAuditoria>().HasOne(h => h.Usuario).WithMany()
                .HasForeignKey(h => h.UsuarioId).OnDelete(DeleteBehavior.Restrict);

            modelo.Entity<RetornoResponsavel>().ToTable("RetornosResponsaveis");
            modelo.Entity<RetornoResponsavel>().Property(r => r.Observacao).HasMaxLength(1000);
            modelo.Entity<RetornoResponsavel>().HasOne(r => r.Acompanhamento).WithMany()
                .HasForeignKey(r => r.AcompanhamentoId).OnDelete(DeleteBehavior.Cascade);
            modelo.Entity<RetornoResponsavel>().HasOne(r => r.Responsavel).WithMany()
                .HasForeignKey(r => r.ResponsavelId).OnDelete(DeleteBehavior.Restrict);
            modelo.Entity<RetornoResponsavel>().HasIndex(r => new { r.AcompanhamentoId, r.ResponsavelId }).IsUnique();
        }
    }

    // O SQLite não guarda se a data é UTC; este conversor marca as datas lidas como UTC.
    public class DataHoraUtcConverter : ValueConverter<DateTime, DateTime>
    {
        public DataHoraUtcConverter()
            : base(
                valor => valor.Kind == DateTimeKind.Local ? valor.ToUniversalTime() : DateTime.SpecifyKind(valor, DateTimeKind.Utc),
                valor => DateTime.SpecifyKind(valor, DateTimeKind.Utc))
        {
        }
    }
}
