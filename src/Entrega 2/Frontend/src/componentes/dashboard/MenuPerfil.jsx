// O estado abre o menu; o efeito permite fechá-lo com Escape.
import { useEffect, useState } from "react";
import { obterIniciais } from "../../utilitarios/nomes.js";

// Rótulos usados para identificar a conta.
const perfis = [
  ["admin", "Administrador"],
  ["professor", "Professor"],
  ["responsavel", "Responsável"],
];

function MenuPerfil({ usuario, iconeSeta, acoes }) {
  const [perfilAberto, setPerfilAberto] = useState(false);
  const iniciais = obterIniciais(usuario.nome);
  const nomePerfil = perfis.find(([perfil]) => perfil === usuario.perfil)?.[1];

  // Registra o evento enquanto o menu estiver aberto e o remove ao fechar.
  useEffect(() => {
    if (!perfilAberto) return;
    function fecharComEscape(evento) {
      if (evento.key === "Escape") setPerfilAberto(false);
    }
    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [perfilAberto]);

  return (
    <div className="dash-perfil">
      {/* O botão mostra as iniciais calculadas e informa se as opções estão abertas. */}
      <button
        className="dash-perfil-botao"
        type="button"
        onClick={() => setPerfilAberto((atual) => !atual)}
        aria-expanded={perfilAberto}
      >
        <span className="dash-avatar">{iniciais}</span>
        <span className="dash-perfil-nome">
          {usuario.perfil === "professor"
            ? `Prof. ${usuario.nome}`
            : usuario.nome}
          {/* Um rótulo recebido permite mostrar Administradora, como no Figma. */}
          {acoes && <small>{usuario.papel || nomePerfil}</small>}
        </span>
        {/* A seção 03 usa a seta SVG; os demais usos conservam a seta de texto. */}
        {iconeSeta ? (
          <span className="estado-icone" aria-hidden="true">
            <img src={iconeSeta} alt="" />
          </span>
        ) : (
          <span aria-hidden="true">⌄</span>
        )}
      </button>
      {perfilAberto && acoes && (
        <div
          className="dash-popover dash-menu-perfis"
          onClick={() => setPerfilAberto(false)}
        >
          {acoes}
        </div>
      )}
    </div>
  );
}
export default MenuPerfil;
