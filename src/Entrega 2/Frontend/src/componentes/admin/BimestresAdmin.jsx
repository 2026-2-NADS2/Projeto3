// Três telas da seção 10 compartilham campos, selos, dados e o layout administrativo.
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDadosEscolares } from "../../hooks/useDadosEscolares.jsx";
import {
  AcaoAdmin,
  CampoAdmin,
  DialogoAdmin,
  InformacoesAdmin,
  TituloAdmin,
} from "./ElementosAdmin.jsx";
import {
  dataPeriodo,
  situacaoPeriodo,
  validarPeriodos,
} from "../../data/bimestres.js";
import "../../css/bimestres.css";

const inicio = "/administrador/bimestres/visao_geral";
const editar = (numero) =>
  `/administrador/bimestres/editar_periodo?bimestre=${numero}`;

// A cor complementa o texto da situação, que continua legível sem depender dela.
function SeloPeriodo({ periodo }) {
  const situacao = situacaoPeriodo(periodo);
  return (
    <span className={`bimestre-selo bimestre-selo--${situacao.toLowerCase()}`}>
      {situacao}
    </span>
  );
}

// Datas e horários aparecem sempre com a identificação de Brasília.
function DatasPeriodo({ periodo }) {
  return (
    <div className="bimestre-datas">
      {["abertura", "encerramento"].map((extremo) => (
        <div key={extremo}>
          <span>{extremo === "abertura" ? "Abertura" : "Encerramento"}</span>
          <strong>{dataPeriodo(periodo[extremo + "Data"])}</strong>
          <small>{periodo[extremo + "Hora"]} · Horário de Brasília</small>
        </div>
      ))}
    </div>
  );
}

// O ano único corresponde ao conjunto de exemplos fornecido pelo Figma.
function AnoPeriodo({ nome }) {
  return (
    <CampoAdmin
      nome={nome}
      rotulo="Ano letivo"
      tipo="select"
      valor="2026"
      opcoes={["2026"]}
      onChange={() => {}}
    />
  );
}

// A caixa informativa mantém a mesma hierarquia visual dos avisos do protótipo.
function NotaPeriodo({ titulo, children }) {
  return (
    <div className="bimestre-nota">
      <strong>{titulo}</strong>
      <p>{children}</p>
    </div>
  );
}

// Reutiliza o painel lateral dos cadastros para explicar as regras dos períodos.
function OrientacoesPeriodo() {
  return (
    <InformacoesAdmin
      blocos={[
        {
          titulo: "Como os prazos funcionam",
          texto:
            "O professor poderá registrar ou editar acompanhamentos somente dentro do período autorizado, para as turmas e disciplinas às quais estiver vinculado.",
        },
        {
          titulo: "Situação automática",
          conteudo: (
            <>
              <p>
                <strong>Agendado:</strong> antes da abertura.
              </p>
              <p>
                <strong>Aberto:</strong> durante o período.
              </p>
              <p>
                <strong>Encerrado:</strong> depois do encerramento.
              </p>
            </>
          ),
        },
        {
          titulo: "Horários",
          texto: "As datas e os horários seguem o horário de Brasília (UTC−3).",
        },
        {
          titulo: "Histórico preservado",
          texto:
            "Alterações de prazo identificam o administrador, a data e hora e os valores anteriores e novos.",
        },
      ]}
    />
  );
}

// As quatro entradas usam IDs próprios para rótulos, validação e navegação por teclado.
function CamposPeriodo({ periodo, alterar, erros, conjunto }) {
  return (
    <div
      className={`bimestre-campos ${conjunto ? "bimestre-campos--conjunto" : ""}`}
    >
      {["abertura", "encerramento"].flatMap((extremo) =>
        ["Data", "Hora"].map((parte) => {
          const campo = extremo + parte;
          const nome = `${periodo.numero}-${campo}`;
          return (
            <CampoAdmin
              key={campo}
              nome={nome}
              rotulo={`${parte} de ${extremo}`}
              tipo={parte === "Data" ? "date" : "time"}
              valor={periodo[campo]}
              obrigatorio
              erro={erros[nome]}
              min={parte === "Data" ? "2026-01-01" : undefined}
              max={parte === "Data" ? "2026-12-31" : undefined}
              onChange={(evento) =>
                alterar(periodo.numero, campo, evento.target.value)
              }
            />
          );
        }),
      )}
    </div>
  );
}

// O histórico vem dos eventos registrados pelo backend.
function DetalhePeriodo({ periodo, aoFechar }) {
  const { historicoPeriodos } = useDadosEscolares();
  const historico = historicoPeriodos.filter(
    (item) => item.periodoId === periodo.id,
  );
  return (
    <DialogoAdmin
      titulo={`${periodo.numero}º bimestre`}
      categoria="PERÍODO DE DIGITAÇÃO"
      aoFechar={aoFechar}
    >
      <SeloPeriodo periodo={periodo} />
      <DatasPeriodo periodo={periodo} />
      <div className="bimestre-historico">
        <h3>Alterações registradas</h3>
        {historico.length ? (
          historico.map((item) => (
            <div key={item.id}>
              <p>
                <strong>{item.administrador}</strong> ·{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/Sao_Paulo",
                }).format(new Date(item.quando))}{" "}
                · Horário de Brasília
              </p>
              <p>
                Antes: {dataPeriodo(item.antes.aberturaData)}{" "}
                {item.antes.aberturaHora} —{" "}
                {dataPeriodo(item.antes.encerramentoData)}{" "}
                {item.antes.encerramentoHora}
              </p>
              <p>
                Depois: {dataPeriodo(item.depois.aberturaData)}{" "}
                {item.depois.aberturaHora} —{" "}
                {dataPeriodo(item.depois.encerramentoData)}{" "}
                {item.depois.encerramentoHora}
              </p>
            </div>
          ))
        ) : (
          <p>Nenhuma alteração registrada.</p>
        )}
      </div>
      <div className="admin-acoes">
        <AcaoAdmin onClick={aoFechar}>Fechar</AcaoAdmin>
        <AcaoAdmin to={editar(periodo.numero)} tipo="primario">
          Editar período
        </AcaoAdmin>
      </div>
    </DialogoAdmin>
  );
}

// A visão geral conserva os quatro cartões e abre o período selecionado sem perder dados.
function VisaoPeriodos() {
  const { periodos } = useDadosEscolares();
  const [selecionado, setSelecionado] = useState(null);
  return (
    <div className="bimestres bimestres--visao">
      <TituloAdmin
        caminho={["Bimestres"]}
        titulo="Bimestres e prazos"
        descricao="Configure os períodos em que os professores poderão registrar e editar os acompanhamentos."
        acoes={
          <AcaoAdmin
            tipo="primario"
            to="/administrador/bimestres/configurar_periodos"
          >
            Configurar os quatro períodos
          </AcaoAdmin>
        }
      />
      <section className="admin-painel bimestre-ano">
        <AnoPeriodo nome="ano-visao" />
        <div>
          <strong>4 bimestres no ano letivo</strong>
          <p>Situação atual dos períodos · Horário de Brasília</p>
        </div>
      </section>
      <div className="bimestre-grade">
        {periodos.map((periodo) => (
          <section
            className="admin-painel bimestre-cartao"
            key={periodo.numero}
            aria-label={`${periodo.numero}º bimestre`}
          >
            <div className="bimestre-linha">
              <h2>{periodo.numero}º bimestre</h2>
              <SeloPeriodo periodo={periodo} />
            </div>
            <p className="bimestre-subtitulo">
              Período de digitação dos acompanhamentos
            </p>
            <DatasPeriodo periodo={periodo} />
            <div className="bimestre-acoes-cartao">
              <AcaoAdmin tipo="pequeno" onClick={() => setSelecionado(periodo)}>
                Ver período
              </AcaoAdmin>
              <AcaoAdmin tipo="pequeno" to={editar(periodo.numero)}>
                Editar período
              </AcaoAdmin>
            </div>
          </section>
        ))}
      </div>
      <NotaPeriodo titulo="O prazo é para a digitação dos acompanhamentos">
        Estes prazos controlam o registro e a edição pelos professores. Alterar
        um período não apaga os acompanhamentos já registrados.
      </NotaPeriodo>
      {selecionado && (
        <DetalhePeriodo
          periodo={selecionado}
          aoFechar={() => setSelecionado(null)}
        />
      )}
    </div>
  );
}

// O formulário mantém um rascunho separado: cancelar ou fechar a revisão não salva nada.
function FormularioPeriodos({ conjunto, numero }) {
  const { periodos, salvarPeriodos } = useDadosEscolares();
  const navegar = useNavigate();
  const [rascunhos, setRascunhos] = useState(() =>
    structuredClone(
      conjunto ? periodos : periodos.filter((item) => item.numero === numero),
    ),
  );
  const [erros, setErros] = useState({});
  const [revisando, setRevisando] = useState(false);
  const titulo = conjunto
    ? "Configurar períodos de digitação"
    : `Editar período do ${numero}º bimestre`;

  // Cada edição muda apenas o campo e o bimestre correspondente.
  function alterar(numeroPeriodo, campo, valor) {
    setRascunhos((atuais) =>
      atuais.map((item) =>
        item.numero === numeroPeriodo ? { ...item, [campo]: valor } : item,
      ),
    );
    setErros({});
  }

  // A configuração conjunta salva após validar; a edição individual pede revisão explícita.
  function enviar(evento) {
    evento.preventDefault();
    const encontrados = validarPeriodos(rascunhos);
    setErros(encontrados);
    if (Object.keys(encontrados).length) {
      document.getElementById("admin-" + Object.keys(encontrados)[0])?.focus();
      return;
    }
    if (!conjunto) setRevisando(true);
    else confirmar();
  }

  // Somente esta ação confirma o rascunho e devolve a navegação à visão geral.
  async function confirmar() {
    if (await salvarPeriodos(rascunhos)) navegar(inicio);
  }

  return (
    <div className="bimestres bimestres--formulario">
      <TituloAdmin
        caminho={[
          "Bimestres",
          conjunto
            ? "Configurar períodos"
            : `${numero}º bimestre › Editar período`,
        ]}
        titulo={titulo}
        descricao={
          conjunto
            ? "Defina data e hora de abertura e encerramento dos quatro bimestres."
            : "Ajuste o prazo de digitação dos acompanhamentos deste bimestre."
        }
      />
      <div className="bimestre-layout">
        <form className="admin-painel" noValidate onSubmit={enviar}>
          <div className="bimestre-linha bimestre-titulo-form">
            <h2>
              {conjunto ? "Períodos do ano letivo" : "Período de digitação"}
            </h2>
            <small>
              Campos com <span className="admin-obrigatorio">*</span> são
              obrigatórios
            </small>
          </div>
          {conjunto ? (
            <div className="bimestre-ano-form">
              <AnoPeriodo nome="ano-configuracao" />
            </div>
          ) : (
            <div className="bimestre-resumo">
              <div>
                <span>Ano letivo</span>
                <strong>2026</strong>
              </div>
              <div>
                <span>Bimestre</span>
                <strong>{numero}º bimestre</strong>
              </div>
              <div>
                <span>Situação atual</span>
                <SeloPeriodo
                  periodo={periodos.find((item) => item.numero === numero)}
                />
              </div>
            </div>
          )}
          {rascunhos.map((periodo) => (
            <section
              className={conjunto ? "bimestre-grupo" : "bimestre-edicao"}
              key={periodo.numero}
              aria-label={`${periodo.numero}º bimestre`}
            >
              {conjunto && (
                <div className="bimestre-linha">
                  <h3>{periodo.numero}º bimestre</h3>
                  <SeloPeriodo periodo={periodo} />
                </div>
              )}
              <CamposPeriodo
                periodo={periodo}
                alterar={alterar}
                erros={erros}
                conjunto={conjunto}
              />
            </section>
          ))}
          <NotaPeriodo
            titulo={
              conjunto
                ? "Confira os horários antes de salvar"
                : "Situação calculada automaticamente"
            }
          >
            {conjunto
              ? "Cada encerramento deve ser posterior à respectiva abertura. Os períodos serão usados para autorizar a digitação pelos professores."
              : "O período ficará aberto entre a data e hora de abertura e a data e hora de encerramento. A situação não é alterada manualmente."}
          </NotaPeriodo>
          <div className="bimestre-acoes-form">
            <AcaoAdmin to={inicio}>Cancelar</AcaoAdmin>
            <button type="submit" className="admin-botao admin-botao--primario">
              {conjunto ? "Salvar períodos" : "Revisar alteração"}
            </button>
          </div>
        </form>
        <OrientacoesPeriodo />
      </div>
      {revisando && (
        <DialogoAdmin
          titulo="Revisar alteração do período"
          categoria={`${numero}º BIMESTRE`}
          aoFechar={() => setRevisando(false)}
        >
          <p>Confira as datas e os horários antes de confirmar.</p>
          <h3>Período atual</h3>
          <DatasPeriodo
            periodo={periodos.find((item) => item.numero === numero)}
          />
          <h3>Novo período</h3>
          <DatasPeriodo periodo={rascunhos[0]} />
          <p>
            A alteração preserva os acompanhamentos existentes e fica registrada
            no banco de dados.
          </p>
          <div className="admin-acoes">
            <AcaoAdmin onClick={() => setRevisando(false)}>
              Voltar à edição
            </AcaoAdmin>
            <AcaoAdmin tipo="primario" onClick={confirmar}>
              Confirmar alteração
            </AcaoAdmin>
          </div>
        </DialogoAdmin>
      )}
    </div>
  );
}

// Sem parâmetro, a rota de edição mostra o terceiro bimestre apresentado no Figma.
export default function BimestresAdmin({ tela }) {
  const [parametros] = useSearchParams();
  const solicitado = parametros.get("bimestre");
  const numero = solicitado === null ? 3 : Number(solicitado);
  if (tela === "visao_geral") return <VisaoPeriodos />;
  if (tela === "editar_periodo" && ![1, 2, 3, 4].includes(numero))
    return (
      <div className="bimestres">
        <TituloAdmin
          caminho={["Bimestres"]}
          titulo="Bimestre não encontrado"
          descricao="Selecione um dos quatro períodos do ano letivo."
        />
        <AcaoAdmin to={inicio}>Voltar aos bimestres</AcaoAdmin>
      </div>
    );
  return (
    <FormularioPeriodos
      key={tela + numero}
      conjunto={tela === "configurar_periodos"}
      numero={numero}
    />
  );
}
