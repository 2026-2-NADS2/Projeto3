namespace KFKA.Api.Domain.Usuarios
{
    public class Responsavel : Usuario
    {
        // CPF guardado só com os 11 dígitos.
        public string Cpf { get; private set; } = null!;
        public string? Telefone { get; private set; }

        private Responsavel()
        {
        }

        public Responsavel(string nome, string email, string senhaHash, string cpf, string? telefone, DateTime criadoEm)
            : base(nome, email, senhaHash, Perfil.Responsavel, criadoEm)
        {
            this.Cpf = NormalizarCpf(cpf);
            AtualizarTelefone(telefone);
        }

        public void AtualizarTelefone(string? telefone)
        {
            this.Telefone = Validacao.TextoOpcional(telefone, "Telefone", 20);
        }

        // Tira pontos e traço e confere os dígitos verificadores.
        public static string NormalizarCpf(string? cpf)
        {
            string digitos = "";
            if (cpf != null)
            {
                foreach (char c in cpf)
                {
                    if (char.IsDigit(c))
                    {
                        digitos += c;
                    }
                }
            }

            if (digitos.Length != 11 || TodosIguais(digitos) || !DigitosVerificadoresValidos(digitos))
            {
                throw new RegraNegocioException("CPF inválido.");
            }

            return digitos;
        }

        private static bool TodosIguais(string digitos)
        {
            foreach (char c in digitos)
            {
                if (c != digitos[0])
                {
                    return false;
                }
            }

            return true;
        }

        // Cálculo oficial: 1º dígito usa pesos 10..2, o 2º usa pesos 11..2.
        private static bool DigitosVerificadoresValidos(string cpf)
        {
            for (int tamanho = 9; tamanho <= 10; tamanho++)
            {
                int soma = 0;
                for (int i = 0; i < tamanho; i++)
                {
                    int digito = cpf[i] - '0';
                    int peso = tamanho + 1 - i;
                    soma += digito * peso;
                }

                int verificador = soma * 10 % 11 % 10;
                if (verificador != cpf[tamanho] - '0')
                {
                    return false;
                }
            }

            return true;
        }
    }
}
