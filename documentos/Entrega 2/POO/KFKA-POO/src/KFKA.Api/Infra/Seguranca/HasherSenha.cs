namespace KFKA.Api.Infra.Seguranca
{
    // Interface para gerar e conferir o hash (criptografia de mão única) das senhas.
    public interface IHasherSenha
    {
        string Gerar(string senha);
        bool Verificar(string senha, string hash);
    }

    // Implementação com BCrypt: cada hash tem um "sal" aleatório embutido,
    // então a mesma senha gera hashes diferentes.
    public class BCryptHasherSenha : IHasherSenha
    {
        public string Gerar(string senha)
        {
            return BCrypt.Net.BCrypt.HashPassword(senha);
        }

        public bool Verificar(string senha, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(senha, hash);
        }
    }
}
