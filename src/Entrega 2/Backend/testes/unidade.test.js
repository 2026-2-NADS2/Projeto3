import test from "node:test";
import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import * as v from "../src/validadores.js";
import { lerAmbiente } from "../src/config/ambiente.js";
import { criarCsv, criarXlsx } from "../src/documentos/arquivos.js";
import { validarEnvio } from "../src/servicos/acompanhamentos.js";

test("validadores recusam corpo inesperado e campos que poderiam trocar autoria", () => {
  for (const corpo of [null, [], 1])
    assert.throws(() => v.objeto(corpo, ["nome"]), { status: 400 });
  assert.throws(
    () => v.objeto({ nome: "A", perfil: "ADMINISTRADOR" }, ["nome"]),
    { status: 400 },
  );
});
test("IDs, notas e listas rejeitam conversoes perigosas", () => {
  for (const id of [true, null, "1 OR 1=1", "1.1", -1, "Infinity"])
    assert.throws(() => v.inteiro(id), { status: 400 });
  for (const nota of ["8,5", NaN, Infinity, -1, 11, 1.234])
    assert.throws(() => v.nota(nota), { status: 400 });
  assert.equal(v.nota(0), 0);
  assert.equal(v.nota(null), null);
  assert.throws(() => v.ids([1, 1]), { status: 400 });
  assert.throws(() => v.paginacao({ limite: "1000" }), { status: 400 });
});
test("datas inexistentes, ausencia de fuso e senha truncavel sao rejeitadas", () => {
  assert.throws(() => v.dataCivil("2026-02-30", "data"), { status: 400 });
  assert.throws(() => v.instante("2026-11-07T12:00:00", "abertura"), {
    status: 400,
  });
  assert.equal(
    v.instante("2026-11-07T09:00:00-03:00", "abertura").toISOString(),
    "2026-11-07T12:00:00.000Z",
  );
  assert.throws(() => v.senha("á".repeat(40)), { status: 400 });
  assert.throws(() => v.senha("123"), { status: 400 });
});
test("configuracao exige segredo real e banco configurado", () => {
  assert.throws(() => lerAmbiente({}), /JWT_SECRET/);
  assert.throws(
    () =>
      lerAmbiente({
        JWT_SECRET: "x".repeat(40),
        DB_NAME: "x;DROP",
        DB_USER: "x",
        DB_PASSWORD: "x",
      }),
    /DB_NAME/,
  );
});
test("envio requer conteudo e aceita media zero", () => {
  assert.throws(() => validarEnvio({ descricao: "", media: 5 }, [1]), {
    status: 400,
  });
  assert.throws(() => validarEnvio({ descricao: "Texto", media: 5 }, []), {
    status: 400,
  });
  assert.doesNotThrow(() =>
    validarEnvio({ descricao: "Texto", media: 0 }, [1]),
  );
});
test("CSV preserva acentos, separador brasileiro e neutraliza formulas", () => {
  const csv = criarCsv([
    ["Aluno", "Média"],
    ["João", 8.75],
    [' \t=HYPERLINK("x")', 0],
    ["@SUM(A1)", null],
  ]).toString("utf8");
  assert.ok(csv.startsWith("\ufeff"));
  assert.ok(csv.includes('"João";"8,75"'));
  assert.ok(csv.includes("\"' \t=HYPERLINK"));
  assert.ok(csv.includes("\"'@SUM"));
});
test("XLSX e ZIP valido, com numericos e textos sem formulas", () => {
  const arquivo = criarXlsx([
    ["Nome", "Nota"],
    ["=SUM(1,2)", 8.7],
    ["A&B <C>", null],
  ]);
  assert.equal(arquivo.readUInt32LE(0), 0x04034b50);
  let i = 0,
    sheet = "";
  while (arquivo.readUInt32LE(i) === 0x04034b50) {
    const tamanho = arquivo.readUInt32LE(i + 18),
      nomeTam = arquivo.readUInt16LE(i + 26),
      extra = arquivo.readUInt16LE(i + 28),
      inicio = i + 30 + nomeTam + extra;
    const nome = arquivo.subarray(i + 30, i + 30 + nomeTam).toString();
    const conteudo = inflateRawSync(
      arquivo.subarray(inicio, inicio + tamanho),
    ).toString();
    if (nome === "xl/worksheets/sheet1.xml") sheet = conteudo;
    i = inicio + tamanho;
  }
  assert.ok(sheet.includes('t="inlineStr"'));
  assert.ok(sheet.includes("=SUM(1,2)"));
  assert.ok(!sheet.includes("<f>"));
  assert.ok(sheet.includes("<v>8.7</v>"));
  assert.ok(sheet.includes("A&amp;B &lt;C&gt;"));
});
