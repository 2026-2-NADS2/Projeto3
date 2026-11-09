// Artefato de QA: força a quebra de páginas com o mesmo gerador utilizado pela API.
import fs from "node:fs/promises";
import { criarPdf } from "../src/documentos/arquivos.js";
await fs.mkdir(".local/evidencias", { recursive: true });
const relatorio = {
  id: 999,
  aluno: "Aluno fictício de teste",
  turma: "8º A",
  disciplina: "Matemática",
  professor: "Professora de teste",
  anoLetivo: 2026,
  bimestre: 4,
  media: 8.7,
  versao: 1,
  publicadoEm: "2026-11-07T12:00:00Z",
  descricao: "Evolução, atenção e organização. ".repeat(250),
  estrategias: "Revisão com apoio visual e atividades em grupo.",
  ajudaFamilia: "Converse com a escola sobre as atividades.",
};
await fs.writeFile(
  ".local/evidencias/pdf-longo.pdf",
  await criarPdf(relatorio),
);
console.log(
  "PDF longo criado em .local/evidencias/pdf-longo.pdf para inspeção de acentos, margens e paginação.",
);
