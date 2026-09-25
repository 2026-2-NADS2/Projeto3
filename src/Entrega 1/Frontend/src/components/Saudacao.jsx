function Saudacao({usuario}) {
    return(
        <section>
            <h1>IAE {usuario.nome}</h1>
            <p>seu perfil e  {usuario.perfil}</p>
        </section>
    );
}

export default Saudacao;