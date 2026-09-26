import{useState} from "react";
import Cabecalho from "../componentes/Cabecalho.jsx";
import logo from "../assets/img/collision.png"
import { useTituloPagina } from "../hooks/useTituloPagina.js";
import "../css/faleconosco.css";

function FaleConosco() {
    useTituloPagina("Fale Conosco")

    const [aviso, setAviso] = useState("");

    function enviarMensagem(event){
        event.preventDefault();
        setAviso("formulario Validado. A nossa equipe entra em contato")
    }


    return (
    <>
    <Cabecalho ocultarContato/>

    <main className="pagina-contato">
    <section className="cartao-contato" aria-labelledby="titulo-contato">
        <img className="logo-contato" src={logo} alt="Collision" />

            <h1 id="titulo-contato">Fale conosco</h1>
            <p className="descricao-contato">
                Surgiu a Duvida? Sem problema Envie aqui sua envia Mensagem
                <br /> QUe Nossa equipe entrara em contato
            </p>

            <form className="formulario-contato" onSubmit={enviarMensagem}>
                <div className="campo-contato">
                    <label htmlFor="nome-contato">Nome Completo</label>
                    <input
                    id="nome-contato"
                    name="nome"
                     type="text" 
                     placeholder="Seu nome completo"
                     autoComplete="nome"
                     minLength={3}
                     required
                     />
                </div>

                <div className="campo-contato">
                    <label htmlFor="whatssap-contato">Whatsaap</label>
                    <input 
                    type="tel"
                     name="whatsapp"
                      id="whatsapp-contato"
                       placeholder="(00) 00000-0000"
                       autoComplete="tel"
                       required/>
                </div>

                <div className="campo-contato">
                    <label htmlFor="email-contato">E-mail</label>
                    <input 
                    type="email"
                     name="email"
                      id="email-contato"
                       placeholder="seu@email.com"
                       autoComplete="email"
                       required/>
                </div>
                
                <div className="campo-contato">
                    <label htmlFor="mensagem-contato">Mensagem</label>
                    <textarea 
                    name="mensagem" 
                    id="mensagem-contato"
                    placeholder="Digite Sua mensagem aqui:"
                    minLength={10}
                    required
                    />
                </div>

                <button className="botao-enviar-contato" type="submit">
                    Enviar Mensagem 
                </button>

                {aviso && <p className="aviso-contato" role="status">{aviso}</p>}
            </form>
        </section>
    </main>

        </>
    );   
}
export default FaleConosco;