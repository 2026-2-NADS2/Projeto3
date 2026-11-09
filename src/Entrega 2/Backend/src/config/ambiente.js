import "dotenv/config";

// A aplicacao falha na inicializacao se faltar uma configuracao essencial.
export function lerAmbiente(env = process.env) {
  const inteiro = (nome, padrao, min, max) => {
    const valor = Number(env[nome] ?? padrao);
    if (!Number.isInteger(valor) || valor < min || valor > max)
      throw new Error(`Configuracao invalida: ${nome}`);
    return valor;
  };
  const segredo = env.JWT_SECRET || "";
  if (segredo.length < 32 || segredo.includes("substitua_"))
    throw new Error(
      "Defina JWT_SECRET aleatorio com pelo menos 32 caracteres.",
    );
  for (const nome of ["DB_NAME", "DB_USER", "DB_PASSWORD"])
    if (!env[nome]) throw new Error(`Defina ${nome} no ambiente.`);
  if (!/^[a-zA-Z0-9_]+$/.test(env.DB_NAME))
    throw new Error("DB_NAME deve conter apenas letras, numeros e sublinhado.");
  const producao = env.NODE_ENV === "production";
  const origens = (env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (origens.some((x) => !/^https?:\/\//.test(x) || x.includes("*")))
    throw new Error("CORS_ORIGINS deve listar origens HTTP explicitas.");
  return {
    producao,
    port: inteiro("PORT", 3333, 1, 65535),
    host: env.HOST || "127.0.0.1",
    origens,
    jwtSecret: segredo,
    jwtTtl: inteiro("JWT_TTL_SECONDS", 1800, 60, 86400),
    frontendUrl: env.FRONTEND_URL || "http://localhost:5173",
    db: {
      host: env.DB_HOST || "127.0.0.1",
      port: inteiro("DB_PORT", 3306, 1, 65535),
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    },
    smtp: env.SMTP_HOST
      ? {
          host: env.SMTP_HOST,
          port: inteiro("SMTP_PORT", 587, 1, 65535),
          secure: env.SMTP_PORT === "465",
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
        }
      : null,
    smtpFrom: env.SMTP_FROM,
  };
}
