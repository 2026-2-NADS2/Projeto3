using KFKA.Api.Domain.Acompanhamentos;
using KFKA.Api.Domain.Escola;
using KFKA.Api.Domain.Usuarios;
using KFKA.Api.Infra.Seguranca;
using Microsoft.EntityFrameworkCore;

namespace KFKA.Api.Data
{
    // Carga de dados fictícios para demonstração (só roda com o banco vazio).
    public static class DbSeeder
    {
        public static async Task PopularAsync(KfkaDbContext db, IHasherSenha hasher, string senhaPadrao)
        {
            if (await db.Usuarios.AnyAsync())
            {
                return;
            }

            DateTime criadoEm = Brasilia(2026, 1, 15);
            string hash = hasher.Gerar(senhaPadrao);

            Administrador admin = new Administrador("Administrador KFKA", "admin@kfka.com", hash, "Coordenação pedagógica", criadoEm);
            Professor ronaldo = new Professor("Ronaldo Souza", "ronaldo@kfka.com", hash, "P2026001", criadoEm);
            Professor fernanda = new Professor("Fernanda Lima", "fernanda@kfka.com", hash, "P2026002", criadoEm);
            Responsavel marcelo = new Responsavel("Marcelo Oliveira", "marcelo@kfka.com", hash, "529.982.247-25", "(11) 99292-6049", criadoEm);
            Responsavel juliana = new Responsavel("Juliana Santos", "juliana@kfka.com", hash, "111.444.777-35", "(11) 98888-1234", criadoEm);
            db.AddRange(admin, ronaldo, fernanda, marcelo, juliana);

            Area exatas = new Area("Exatas");
            Area linguagens = new Area("Linguagens");
            Area humanas = new Area("Ciências Humanas");
            Disciplina matematica = new Disciplina("Matemática", exatas);
            Disciplina portugues = new Disciplina("Língua Portuguesa", linguagens);
            Disciplina historia = new Disciplina("História", humanas);
            db.AddRange(matematica, portugues, historia);

            Turma quintoA = new Turma("5º A", "5º ano", 2026);
            Turma sextoB = new Turma("6º B", "6º ano", 2026);
            Aluno joao = new Aluno("João Oliveira", "A2026001", new DateOnly(2016, 4, 29), quintoA);
            Aluno pedro = new Aluno("Pedro Santos", "A2026002", new DateOnly(2016, 8, 12), quintoA);
            Aluno ana = new Aluno("Ana Oliveira", "A2026003", new DateOnly(2015, 2, 3), sextoB);
            db.AddRange(joao, pedro, ana);

            db.AddRange(
                new AlunoResponsavel(joao, marcelo, "Pai", true),
                new AlunoResponsavel(ana, marcelo, "Pai", true),
                new AlunoResponsavel(joao, juliana, "Mãe", false),
                new AlunoResponsavel(pedro, juliana, "Mãe", true));

            VinculoProfessor ronaldoMat5A = new VinculoProfessor(ronaldo, quintoA, matematica);
            VinculoProfessor ronaldoMat6B = new VinculoProfessor(ronaldo, sextoB, matematica);
            VinculoProfessor fernandaPort5A = new VinculoProfessor(fernanda, quintoA, portugues);
            VinculoProfessor fernandaHist6B = new VinculoProfessor(fernanda, sextoB, historia);
            db.AddRange(ronaldoMat5A, ronaldoMat6B, fernandaPort5A, fernandaHist6B);

            Tag participativo = new Tag("Participativo", "Participa ativamente das aulas");
            Tag destaque = new Tag("Destaque", "Desempenho acima do esperado");
            Tag reforco = new Tag("Precisa de reforço", "Recomenda-se acompanhamento extra");
            Tag atencao = new Tag("Dificuldade de atenção", null);
            Tag evolucao = new Tag("Evolução positiva", "Melhora em relação ao bimestre anterior");
            db.AddRange(participativo, destaque, reforco, atencao, evolucao);

            Bimestre b3 = new Bimestre(3, 2026, Brasilia(2026, 8, 3), Brasilia(2026, 9, 30, 23, 59));
            Bimestre b4 = new Bimestre(4, 2026, Brasilia(2026, 10, 5), Brasilia(2026, 12, 18, 23, 59));
            db.AddRange(
                new Bimestre(1, 2026, Brasilia(2026, 2, 2), Brasilia(2026, 4, 30, 23, 59)),
                new Bimestre(2, 2026, Brasilia(2026, 5, 4), Brasilia(2026, 7, 10, 23, 59)),
                b3,
                b4);

            // Salva antes dos acompanhamentos para que as regras de vínculo comparem Ids reais.
            await db.SaveChangesAsync();

            // 3º bimestre: dois relatórios já publicados, um deles alterado pela administração.
            Acompanhamento joaoMat = new Acompanhamento(joao, ronaldoMat5A, b3, ronaldo,
                "João demonstra ótimo raciocínio lógico e ajuda os colegas nas atividades em grupo.",
                9.0m, new List<Tag> { participativo, destaque }, Brasilia(2026, 9, 10));
            joaoMat.EnviarParaRevisao(ronaldo, Brasilia(2026, 9, 12));
            joaoMat.IniciarRevisao(admin, Brasilia(2026, 9, 14));
            joaoMat.Publicar(admin, Brasilia(2026, 9, 15));

            Acompanhamento joaoPort = new Acompanhamento(joao, fernandaPort5A, b3, fernanda,
                "João melhorou a leitura em voz alta, mas ainda precisa praticar a escrita.",
                7.0m, new List<Tag> { evolucao }, Brasilia(2026, 9, 11));
            joaoPort.EnviarParaRevisao(fernanda, Brasilia(2026, 9, 12));
            joaoPort.IniciarRevisao(admin, Brasilia(2026, 9, 14));
            joaoPort.AlterarNaRevisao(admin,
                "João melhorou bastante a leitura em voz alta e deve continuar praticando a produção de textos.",
                7.5m, new List<Tag> { evolucao, participativo }, Brasilia(2026, 9, 14, 10));
            joaoPort.Publicar(admin, Brasilia(2026, 9, 15));

            // 4º bimestre (aberto): um enviado, um devolvido para ajustes e um rascunho.
            Acompanhamento pedroMat = new Acompanhamento(pedro, ronaldoMat5A, b4, ronaldo,
                "Pedro tem se esforçado, porém apresenta dificuldade com frações.",
                6.0m, new List<Tag> { reforco }, Brasilia(2026, 10, 20));
            pedroMat.EnviarParaRevisao(ronaldo, Brasilia(2026, 10, 21));

            Acompanhamento pedroPort = new Acompanhamento(pedro, fernandaPort5A, b4, fernanda,
                "Pedro conversa muito.", 5.5m, new List<Tag> { atencao }, Brasilia(2026, 10, 20));
            pedroPort.EnviarParaRevisao(fernanda, Brasilia(2026, 10, 21));
            pedroPort.IniciarRevisao(admin, Brasilia(2026, 10, 22));
            pedroPort.Devolver(admin,
                "Detalhar melhor o comportamento observado e sugerir ações para a família.", Brasilia(2026, 10, 22, 11));

            Acompanhamento anaHist = new Acompanhamento(ana, fernandaHist6B, b4, fernanda,
                "Ana apresentou um excelente seminário sobre o Brasil Colônia.",
                9.5m, new List<Tag> { destaque }, Brasilia(2026, 10, 25));

            db.AddRange(joaoMat, joaoPort, pedroMat, pedroPort, anaHist);
            await db.SaveChangesAsync();

            db.Add(new RetornoResponsavel(joaoMat, marcelo,
                "Obrigado pelo retorno! Vamos continuar incentivando em casa.", Brasilia(2026, 9, 16, 20)));
            await db.SaveChangesAsync();
        }

        // Converte um horário de Brasília (UTC-3, sem horário de verão desde 2019) para UTC.
        private static DateTime Brasilia(int ano, int mes, int dia, int hora = 0, int minuto = 0)
        {
            DateTime dataUtc = new DateTime(ano, mes, dia, hora, minuto, 0, DateTimeKind.Utc);
            return dataUtc.AddHours(3);
        }
    }
}
