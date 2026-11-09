// PDF gerado no navegador, sem enviar dados para um serviço externo.
// Os objetos, offsets e comprimentos usam apenas ASCII; os acentos são escapes WinAnsi.
function literal(valor) {
  return (
    "(" +
    String(valor)
      .replace(/[–—]/g, "-")
      .replace(/[“”]/g, '"')
      .replace(/’/g, "'")
      .split("")
      .map((c) => {
        const n = c.charCodeAt(0);
        if (c === "(" || c === ")" || c === "\\") return "\\" + c;
        if (n >= 32 && n <= 126) return c;
        if (n >= 160 && n <= 255) return "\\" + n.toString(8).padStart(3, "0");
        return " ";
      })
      .join("") +
    ")"
  );
}
// Avanços da fonte Helvetica em milésimos de em, do espaço ao til ASCII.
// Medir a linha evita cortes em palavras largas, como uma sequência de letras W.
const avancos = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278,
  278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
  584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556,
  833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
  278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222,
  500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
  500, 334, 260, 334, 584,
];
function largura(texto) {
  return [...texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")].reduce(
    (total, c) => total + (avancos[c.charCodeAt(0) - 32] ?? 1000) * 0.011,
    0,
  );
}
function quebrar(texto, limite = 499) {
  const linhas = [];
  for (const paragrafo of String(texto || "Não informado.").split(/\r?\n/)) {
    let linha = "";
    for (let palavra of paragrafo.split(/\s+/)) {
      while (largura(palavra) > limite) {
        if (linha) linhas.push(linha);
        let corte = 1;
        while (largura(palavra.slice(0, corte + 1)) <= limite) corte++;
        linhas.push(palavra.slice(0, corte));
        palavra = palavra.slice(corte);
        linha = "";
      }
      if (largura((linha + " " + palavra).trim()) > limite) {
        linhas.push(linha);
        linha = palavra;
      } else linha = (linha + " " + palavra).trim();
    }
    linhas.push(linha);
  }
  return linhas;
}
export function criarPdfAcompanhamento(r) {
  if (!r || r.status !== "Publicado")
    throw new Error("Somente acompanhamentos publicados podem gerar PDF.");
  const blocos = [
    [
      "ALUNO E PERÍODO",
      `${r.aluno} - ${r.turma}\n${r.disciplina} - ${r.bimestre}º bimestre de ${r.ano}\nMédia: ${r.media == null ? "Não informada" : Number(r.media).toLocaleString("pt-BR")}\nProfessor autor: ${r.professor}`,
    ],
    ["DESENVOLVIMENTO DO ALUNO", r.desenvolvimento],
    ["ESTRATÉGIAS DE ACOMPANHAMENTO", r.estrategias],
    [
      "COMO A FAMÍLIA PODE AJUDAR",
      r.ajudaFamilia ||
        "Acompanhe as orientações da escola e converse sobre as atividades.",
    ],
    [
      "AUTORIA E PUBLICAÇÃO",
      `Registro: ${r.id}\nVersão: ${r.versao}\nRevisado e publicado pela administração${r.publicadoEm ? " em " + new Date(r.publicadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : ""}.`,
    ],
  ];
  const paginas = [];
  let comandos = [],
    y = 720;
  const texto = (valor, x, pos, tamanho = 11, negrito = false) =>
    `BT /${negrito ? "F2" : "F1"} ${tamanho} Tf 0.08 0.18 0.30 rg 1 0 0 1 ${x} ${pos} Tm ${literal(valor)} Tj ET\n`;
  function novaPagina() {
    comandos = [
      texto("COLLISION", 48, 794, 20, true),
      texto("Relatório de acompanhamento escolar", 48, 768, 13),
      "0.83 0.89 0.92 RG 48 751 m 547 751 l S\n",
    ];
    y = 720;
  }
  function concluir() {
    comandos.push(
      texto(
        "Documento escolar de demonstração - compartilhe somente com pessoas autorizadas.",
        48,
        40,
        9,
      ),
      texto("Página " + (paginas.length + 1), 487, 24, 9),
    );
    paginas.push(comandos.join(""));
  }
  novaPagina();
  for (const [titulo, conteudo] of blocos) {
    if (y < 115) {
      concluir();
      novaPagina();
    }
    comandos.push(texto(titulo, 48, y, 11, true));
    y -= 25;
    for (const linha of quebrar(conteudo)) {
      if (y < 76) {
        concluir();
        novaPagina();
      }
      comandos.push(texto(linha, 48, y));
      y -= 16;
    }
    y -= 23;
  }
  concluir();
  const objetos = [
    "",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];
  const kids = [];
  for (const conteudo of paginas) {
    const id = objetos.length;
    kids.push(id + " 0 R");
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id + 1} 0 R >>`,
      `<< /Length ${conteudo.length} >>\nstream\n${conteudo}endstream`,
    );
  }
  objetos[2] = `<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(" ")}] >>`;
  let pdf = "%PDF-1.4\n",
    offsets = [0];
  for (let i = 1; i < objetos.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i} 0 obj\n${objetos[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1))
    pdf += String(offset).padStart(10, "0") + " 00000 n \n";
  pdf += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: "application/pdf" });
}
export function nomePdf(r) {
  return (
    (
      "Relatorio_" +
      r.aluno +
      "_" +
      r.disciplina +
      "_" +
      r.bimestre +
      "B_" +
      r.ano
    )
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf"
  );
}
