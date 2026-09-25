import { useState} from "react";
// isso e oque vai fazer as telas serem diferentes pra cada user
import { usuarioMock } from "./data/usuarioMock.js";
// isso e oque vai chamar o user
import Saudacao from "./components/Saudacao.jsx";


function App() {
    // essa constante serve pra chamar alguns dos user, setperfil e pra poder trocar
    const[perfil, setPerfil] = useState("professor");
    const usuario = usuarioMock[perfil];

    return(
        <main>
            <label htmlFor="perfil">perfil para teste:</label>

            <select
            id="perfil"
            value={perfil}
            onChange={(event) => setPerfil(event.target.value)}
            >
                <option value="admin">adm</option>
                <option value="professor">prof</option>
                <option value="responsavel">Responsavel</option>
            </select>

            <Saudacao usuario={usuario} />
        </main>
    );
}

export default App;