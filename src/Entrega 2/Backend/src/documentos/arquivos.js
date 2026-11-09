import PDFDocument from "pdfkit";
import { deflateRawSync } from "node:zlib";

// Apenas colunas escolares explicitas: nenhum contato, hash ou dado de sessao.
export function montarLinhas(registros, descricoes = false) {
  return [
    [
      "Registro",
      "Aluno",
      "Turma",
      "Disciplina",
      "Professor",
      "Ano",
      "Bimestre",
      "Média",
      "Tags",
      "Situação",
      ...(descricoes ? ["Desenvolvimento", "Estratégias"] : []),
    ],
    ...registros.map((r) => [
      r.id,
      r.aluno,
      r.turma,
      r.disciplina,
      r.professor,
      r.anoLetivo,
      r.bimestre,
      r.media,
      r.tags.map((t) => t.nome).join(", "),
      r.status,
      ...(descricoes ? [r.descricao, r.estrategias] : []),
    ]),
  ];
}
export function criarCsv(linhas) {
  // Evita formulas de planilha, inclusive quando precedidas por espacos ou controles.
  const celula = (valor) => {
    let texto =
      valor == null
        ? ""
        : typeof valor === "number"
          ? String(valor).replace(".", ",")
          : String(valor);
    // Os controles fazem parte da protecao contra formulas disfarçadas.
    // eslint-disable-next-line no-control-regex
    if (typeof valor !== "number" && /^[\s\u0000-\u001f]*[=+@-]/.test(texto))
      texto = "'" + texto;
    return '"' + texto.replaceAll('"', '""') + '"';
  };
  return Buffer.from(
    "\ufeff" + linhas.map((l) => l.map(celula).join(";")).join("\r\n"),
    "utf8",
  );
}
const xml = (valor) =>
  String(valor ?? "")
    // XML 1.0 nao permite esses caracteres de controle.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(
      /[<>&"']/g,
      (c) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&apos;",
        })[c],
    );
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
// ZIP/OOXML pequeno e sem dependencia de biblioteca de planilhas no servidor.
export function criarXlsx(linhas) {
  const col = (n) => {
    let s = "";
    for (n++; n; n = Math.floor((n - 1) / 26))
      s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
  };
  const sheet =
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
    linhas
      .map(
        (l, i) =>
          `<row r="${i + 1}">` +
          l
            .map((valor, j) => {
              const ref = col(j) + (i + 1);
              return typeof valor === "number"
                ? `<c r="${ref}"><v>${valor}</v></c>`
                : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(valor)}</t></is></c>`;
            })
            .join("") +
          "</row>",
      )
      .join("") +
    "</sheetData></worksheet>";
  const arquivos = {
    "[Content_Types].xml":
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml":
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Acompanhamentos" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": sheet,
  };
  const partes = [],
    central = [];
  let offset = 0;
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const n = Buffer.from(nome),
      original = Buffer.from(conteudo),
      dados = deflateRawSync(original),
      crc = crc32(original);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50);
    h.writeUInt16LE(20, 4);
    h.writeUInt16LE(8, 8);
    h.writeUInt16LE(33, 12);
    h.writeUInt32LE(crc, 14);
    h.writeUInt32LE(dados.length, 18);
    h.writeUInt32LE(original.length, 22);
    h.writeUInt16LE(n.length, 26);
    partes.push(h, n, dados);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt16LE(8, 10);
    c.writeUInt16LE(33, 14);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(dados.length, 20);
    c.writeUInt32LE(original.length, 24);
    c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42);
    central.push(c, n);
    offset += h.length + n.length + dados.length;
  }
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50);
  fim.writeUInt16LE(Object.keys(arquivos).length, 8);
  fim.writeUInt16LE(Object.keys(arquivos).length, 10);
  fim.writeUInt32LE(
    central.reduce((n, b) => n + b.length, 0),
    12,
  );
  fim.writeUInt32LE(offset, 16);
  return Buffer.concat([...partes, ...central, fim]);
}

export function criarPdf(r) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
        size: "A4",
        margin: 48,
        bufferPages: true,
        info: {
          Title: "Relatório de acompanhamento escolar",
          Author: "Collision",
        },
      }),
      partes = [];
    doc.on("data", (b) => partes.push(b));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(partes)));
    const cabecalho = () => {
      doc
        .fillColor("#143453")
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("COLLISION", 48, 40);
      doc
        .font("Helvetica")
        .fontSize(11)
        .text("Relatório de acompanhamento escolar", 48, 68);
      doc.moveTo(48, 90).lineTo(547, 90).strokeColor("#D2DFEA").stroke();
      doc.y = 111;
    };
    doc.on("pageAdded", cabecalho);
    cabecalho();
    const bloco = (titulo, conteudo) => {
      if (doc.y > doc.page.height - 140) doc.addPage();
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#143453")
        .text(titulo, { width: 499 });
      doc.moveDown(0.6);
      doc
        .font("Helvetica")
        .fontSize(11)
        .text(conteudo || "Não informado.", { width: 499, lineGap: 4 });
      doc.moveDown(1.2);
    };
    bloco(
      "ALUNO E PERÍODO",
      `${r.aluno} · ${r.turma}\n${r.disciplina} · ${r.bimestre}º bimestre de ${r.anoLetivo}\nMédia: ${r.media == null ? "Não informada" : r.media.toLocaleString("pt-BR")}\nProfessor: ${r.professor}`,
    );
    bloco("DESENVOLVIMENTO DO ALUNO", r.descricao);
    bloco("ESTRATÉGIAS DE ACOMPANHAMENTO", r.estrategias);
    bloco("COMO A FAMÍLIA PODE AJUDAR", r.ajudaFamilia);
    bloco(
      "PUBLICAÇÃO",
      `Registro ${r.id} · Versão ${r.versao}\nPublicado em ${new Date(r.publicadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`,
    );
    const intervalo = doc.bufferedPageRange();
    for (let i = intervalo.start; i < intervalo.start + intervalo.count; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#60738B")
        .text(
          `Collision · Acompanhamento escolar · Página ${i + 1} de ${intervalo.count}`,
          48,
          doc.page.height - 30,
          { lineBreak: false },
        );
    }
    doc.end();
  });
}
