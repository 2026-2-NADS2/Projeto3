// Exportação local: somente colunas escolares explícitas, sem contatos nem credenciais.
export function linhasRelatorio(registros, tags, descricao) {
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
      "Status",
      ...(descricao ? ["Desenvolvimento", "Estratégias"] : []),
    ],
    ...registros.map((r) => [
      r.id,
      r.aluno,
      r.turma,
      r.disciplina,
      r.professor,
      r.ano,
      r.bimestre,
      r.media,
      r.tags.map((id) => tags.find((t) => t.id === id)?.nome || id).join(", "),
      r.status,
      ...(descricao ? [r.desenvolvimento, r.estrategias] : []),
    ]),
  ];
}
const xml = (s) =>
  String(s).replace(
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
// ZIP sem compressão é suficiente para esta planilha pequena e não exige dependências.
function zip(arquivos) {
  const encoder = new TextEncoder(),
    partes = [],
    diretorio = [];
  let offset = 0;
  const bytes = (n) => new Uint8Array(n);
  const u16 = (a, p, v) => new DataView(a.buffer).setUint16(p, v, true);
  const u32 = (a, p, v) => new DataView(a.buffer).setUint32(p, v, true);
  for (const [nome, texto] of Object.entries(arquivos)) {
    const nomeBytes = encoder.encode(nome),
      dados = encoder.encode(texto);
    let crc = 0xffffffff;
    for (const b of dados) {
      crc ^= b;
      for (let k = 0; k < 8; k++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    const h = bytes(30);
    u32(h, 0, 0x04034b50);
    u16(h, 4, 20);
    u32(h, 14, crc);
    u32(h, 18, dados.length);
    u32(h, 22, dados.length);
    u16(h, 26, nomeBytes.length);
    partes.push(h, nomeBytes, dados);
    const c = bytes(46);
    u32(c, 0, 0x02014b50);
    u16(c, 4, 20);
    u16(c, 6, 20);
    u32(c, 16, crc);
    u32(c, 20, dados.length);
    u32(c, 24, dados.length);
    u16(c, 28, nomeBytes.length);
    u32(c, 42, offset);
    diretorio.push(c, nomeBytes);
    offset += h.length + nomeBytes.length + dados.length;
  }
  const fim = bytes(22);
  u32(fim, 0, 0x06054b50);
  u16(fim, 8, Object.keys(arquivos).length);
  u16(fim, 10, Object.keys(arquivos).length);
  u32(
    fim,
    12,
    diretorio.reduce((n, b) => n + b.length, 0),
  );
  u32(fim, 16, offset);
  return new Blob([...partes, ...diretorio, fim], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
export function criarArquivo(linhas, formato) {
  if (formato === "csv")
    return new Blob(
      [
        "\ufeff" +
          linhas
            .map((row) =>
              row
                .map(
                  (v) =>
                    '"' +
                    String(
                      typeof v === "number"
                        ? v
                        : String(v).replace(/^[=+@-]/, "'$&"),
                    ).replaceAll('"', '""') +
                    '"',
                )
                .join(";"),
            )
            .join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
  // Células de texto são inline strings: valores começando com = não viram fórmulas.
  const sheet =
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
    linhas
      .map(
        (row, i) =>
          '<row r="' +
          (i + 1) +
          '">' +
          row
            .map((v) =>
              typeof v === "number"
                ? "<c><v>" + v + "</v></c>"
                : '<c t="inlineStr"><is><t xml:space="preserve">' +
                  xml(v) +
                  "</t></is></c>",
            )
            .join("") +
          "</row>",
      )
      .join("") +
    "</sheetData></worksheet>";
  return zip({
    "[Content_Types].xml":
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml":
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Acompanhamentos" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": sheet,
  });
}
export function baixarArquivo(blob, nome) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
