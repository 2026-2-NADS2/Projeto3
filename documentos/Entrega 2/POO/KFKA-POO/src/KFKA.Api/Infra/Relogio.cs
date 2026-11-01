namespace KFKA.Api.Infra
{
    // Abstração do relógio. Os serviços pedem a hora para esta interface em vez de
    // usar DateTime.UtcNow direto; assim os testes conseguem usar um relógio "parado".
    public interface IRelogio
    {
        DateTime Agora();
    }

    // Implementação real, usada pela aplicação.
    public class RelogioSistema : IRelogio
    {
        public DateTime Agora()
        {
            return DateTime.UtcNow;
        }
    }
}
