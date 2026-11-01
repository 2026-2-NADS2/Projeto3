namespace KFKA.Api.Domain
{
    public enum Perfil
    {
        Administrador,
        Professor,
        Responsavel
    }

    // Fluxo: Rascunho -> EnviadoParaRevisao -> EmRevisao -> Publicado
    // Alternativas: Devolvido (volta para o professor) e Cancelado.
    public enum StatusAcompanhamento
    {
        Rascunho,
        EnviadoParaRevisao,
        EmRevisao,
        Publicado,
        Devolvido,
        Cancelado
    }
}
