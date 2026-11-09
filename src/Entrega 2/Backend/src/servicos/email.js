import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";

export function transporteEmail(config) {
  if (config.smtp && config.smtpFrom) {
    const transporte = nodemailer.createTransport(config.smtp);
    return ({ para, assunto, texto }) =>
      transporte.sendMail({
        from: config.smtpFrom,
        to: para,
        subject: assunto,
        text: texto,
      });
  }
  if (config.producao) return null;
  // Desenvolvimento: arquivo local ignorado pelo Git. Nao anuncia envio externo.
  return async (mensagem) => {
    await fs.mkdir(".local/emails", { recursive: true });
    await fs.writeFile(
      `.local/emails/${randomUUID()}.json`,
      JSON.stringify(
        { ...mensagem, modo: "desenvolvimento-sem-envio" },
        null,
        2,
      ),
      { mode: 0o600 },
    );
  };
}
