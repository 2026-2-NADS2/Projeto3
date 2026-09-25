namespace KFKASolution
{
    internal class Program
    {
        static void Main(string[] args)
        {
            SistemaKFKA sistema = new SistemaKFKA();

            Administrador administrador = new Administrador(
                1,
                "admin",
                "admin123@escola.com");

            Turma turma = new Turma(
                1,
                "Turma A",
                2026);

            Disciplina disciplina = new Disciplina(
                1,
                "Matemática",
                "Exatas");

            Professor professor = new Professor(
                1,
                "112026",
                11,
                "Ronaldo",
                "Ronaldo123@professor.com");

            VinculoProfessor vinculoProfessor = new VinculoProfessor(
                1,
                professor,
                turma,
                disciplina,
                2026);

            Aluno aluno = new Aluno(
                1,
                "João",
                "2026001",
                new DateOnly(2004, 4, 29),
                turma);

            Responsavel responsavel = new Responsavel(
                1,
                12,
                "Marcelo",
                "marcelo123@responsavel.com",
                "119929260495",
                "12345678910");

            AlunoResponsavel vinculoFamiliar = new AlunoResponsavel(
                aluno,
                responsavel,
                "Pai",
                true);

            Bimestre bimestre = new Bimestre(
                1,
                1,
                2026,
                DateTime.Now.AddDays(-1),
                DateTime.Now.AddDays(1));

            Acompanhamento acompanhamento = new Acompanhamento(
                1,
                aluno,
                vinculoProfessor,
                bimestre,
                "aluno bom",
                10.0m);




            sistema.CadastrarTurma(administrador,turma);
            sistema.CadastrarAluno(administrador, aluno);
            sistema.CadastrarResponsavel(administrador, responsavel);
            sistema.VincularAlunoResponsavel(administrador, vinculoFamiliar);
            sistema.CadastrarDisciplina(administrador, disciplina);
            sistema.CadastrarProfessor(administrador, professor);
            sistema.VincularProfessor(administrador, vinculoProfessor);
            sistema.CadastrarBimestre(administrador, bimestre);

            sistema.RegistrarAcompanhamento(professor, acompanhamento);
            sistema.EnviarAcompanhamentoParaRevisao(professor, acompanhamento);
            sistema.IniciarRevisaoAcompanhamento(administrador, acompanhamento);
            sistema.PublicarAcompanhamento(administrador, acompanhamento);

            List<Acompanhamento> publicados = sistema.ConsultarAcompanhamentos(responsavel);

            foreach(Acompanhamento item in publicados)
            {
                Console.WriteLine(
                    $"Aluno: {item.Aluno.Nome} |" +
                    $"Professor: {item.VinculoProfessor.Professor.Nome} |" +
                    $"Média: {item.Media} |" +
                    $"Status: {item.Status}"
                    );
            }


        }
    }
}
