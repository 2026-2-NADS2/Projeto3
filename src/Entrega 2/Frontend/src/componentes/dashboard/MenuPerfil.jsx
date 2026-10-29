import { useState } from "react";
import { obterIniciais } from "../../utilitarios/nomes.js";
const perfis = [
  ["admin", "Administrador"],
  ["professor", "Professor"],
  ["responsavel", "Responsável"],
];
function MenuPerfil({ usuario, onTrocarPerfil }) {
  const [perfilAberto, setPerfilAberto] = useState(false);
  const iniciais = obterIniciais(usuario.nome);
  return (
    <div className="dash-perfil">
      <button
        className="dash-perfil-botao"
        type="button"
        onClick={() => setPerfilAberto((aberto) => !aberto)}
        aria-expanded={perfilAberto}
      >
        <span className="dash-avatar">{iniciais}</span>
        <span className="dash-perfil-nome">
          {usuario.perfil === "professor" ? `Prof. ${usuario.nome}` : usuario.nome}
        </span>
        <span aria-hidden="true">⌄</span>
      </button>

      {perfilAberto && (
        <div className="dash-popover dash-menu-perfis">
          <strong>Perfil de demonstração</strong>
          {perfis.map(([perfil, nome]) => (
            <button
              key={perfil}
              type="button"
              disabled={usuario.perfil === perfil}
              onClick={() => {
                onTrocarPerfil(perfil);
                setPerfilAberto(false);
              }}
            >
              {nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export default MenuPerfil;
