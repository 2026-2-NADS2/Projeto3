import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { linhas, um, transacao, dataSql } from "../banco/pool.js";
import { ErroApi, exigir } from "../erros.js";
import * as v from "../validadores.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const publico = (r) => ({
  id: r.id_usuario,
  nome: r.nome,
  email: r.email,
  perfil: r.perfil,
  ativo: !!r.ativo,
  professorId: r.id_professor ?? null,
  responsavelId: r.id_responsavel ?? null,
});
const consultarUsuario = `SELECT u.*,p.id_professor,r.id_responsavel FROM USUARIO u
 LEFT JOIN PROFESSOR p ON p.id_usuario=u.id_usuario LEFT JOIN RESPONSAVEL r ON r.id_usuario=u.id_usuario`;

export function criarAuth({
  pool,
  config,
  relogio = () => new Date(),
  enviarEmail,
}) {
  // Mesmo trabalho de hash para email desconhecido, evitando retorno instantaneo.
  const hashFalso = bcrypt.hashSync(randomBytes(32).toString("hex"), 12);
  async function login(corpo) {
    v.objeto(corpo, ["email", "senha"]);
    const email = v.email(corpo.email);
    exigir(
      typeof corpo.senha === "string" && corpo.senha.length <= 256,
      400,
      "VALIDACAO",
      "Informe a senha.",
    );
    const usuario = await um(pool, consultarUsuario + " WHERE u.email=?", [
      email,
    ]);
    const senhaValida = await bcrypt.compare(
      corpo.senha,
      usuario?.senha_hash || hashFalso,
    );
    exigir(
      usuario?.ativo && senhaValida,
      401,
      "CREDENCIAIS_INVALIDAS",
      "Email ou senha inválidos.",
    );
    const agora = relogio(),
      expira = new Date(agora.getTime() + config.jwtTtl * 1000),
      sessaoId = randomUUID();
    // Serializa com inativacao/reset de senha; senha antiga nao abre sessao apos reset concorrente.
    await transacao(pool, async (db) => {
      const atual = await um(
        db,
        "SELECT ativo,senha_hash FROM USUARIO WHERE id_usuario=? FOR UPDATE",
        [usuario.id_usuario],
      );
      exigir(
        atual.ativo && atual.senha_hash === usuario.senha_hash,
        401,
        "CREDENCIAIS_INVALIDAS",
        "Email ou senha inválidos.",
      );
      await linhas(
        db,
        "INSERT INTO SESSAO(id_sessao,id_usuario,criada_em,expira_em) VALUES (?,?,?,?)",
        [sessaoId, usuario.id_usuario, dataSql(agora), dataSql(expira)],
      );
    });
    const token = jwt.sign(
      {
        sid: sessaoId,
        iat: Math.floor(agora.getTime() / 1000),
        exp: Math.floor(expira.getTime() / 1000),
      },
      config.jwtSecret,
      {
        algorithm: "HS256",
        subject: String(usuario.id_usuario),
        issuer: "collision-api",
        audience: "collision-web",
      },
    );
    return { token, expiraEm: expira.toISOString(), usuario: publico(usuario) };
  }
  async function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization;
    if (!cabecalho || !/^Bearer [^ ]+$/.test(cabecalho))
      throw new ErroApi(401, "NAO_AUTENTICADO", "Faça login para continuar.");
    let conteudo;
    try {
      conteudo = jwt.verify(cabecalho.slice(7), config.jwtSecret, {
        algorithms: ["HS256"],
        issuer: "collision-api",
        audience: "collision-web",
        clockTimestamp: Math.floor(relogio().getTime() / 1000),
      });
    } catch {
      throw new ErroApi(
        401,
        "SESSAO_INVALIDA",
        "Sua sessão expirou ou não é válida.",
      );
    }
    if (!/^\d+$/.test(conteudo.sub || "") || typeof conteudo.sid !== "string")
      throw new ErroApi(401, "SESSAO_INVALIDA", "Sessão inválida.");
    const usuario = await um(
      pool,
      consultarUsuario +
        ` JOIN SESSAO s ON s.id_usuario=u.id_usuario
      WHERE u.id_usuario=? AND u.ativo=1 AND s.id_sessao=? AND s.revogada_em IS NULL AND s.expira_em>?`,
      [conteudo.sub, conteudo.sid, dataSql(relogio())],
    );
    exigir(
      usuario,
      401,
      "SESSAO_INVALIDA",
      "Sua sessão expirou ou foi encerrada.",
    );
    req.usuario = publico(usuario);
    req.sessaoId = conteudo.sid;
    next();
  }
  async function logout(id) {
    await linhas(
      pool,
      "UPDATE SESSAO SET revogada_em=? WHERE id_sessao=? AND revogada_em IS NULL",
      [dataSql(relogio()), id],
    );
  }
  async function recuperar(corpo) {
    v.objeto(corpo, ["email"]);
    const email = v.email(corpo.email);
    exigir(
      enviarEmail,
      503,
      "RECUPERACAO_INDISPONIVEL",
      "A recuperação de senha está temporariamente indisponível.",
    );
    const usuario = await um(
      pool,
      "SELECT id_usuario,nome FROM USUARIO WHERE email=? AND ativo=1",
      [email],
    );
    if (usuario) {
      const token = randomBytes(32).toString("hex"),
        agora = relogio();
      await transacao(pool, async (db) => {
        await um(
          db,
          "SELECT id_usuario FROM USUARIO WHERE id_usuario=? FOR UPDATE",
          [usuario.id_usuario],
        );
        await linhas(
          db,
          "UPDATE RECUPERACAO_SENHA SET usado_em=? WHERE id_usuario=? AND usado_em IS NULL",
          [dataSql(agora), usuario.id_usuario],
        );
        await linhas(
          db,
          "INSERT INTO RECUPERACAO_SENHA(id_usuario,token_hash,expira_em) VALUES (?,?,?)",
          [
            usuario.id_usuario,
            hashToken(token),
            dataSql(new Date(agora.getTime() + 30 * 60 * 1000)),
          ],
        );
      });
      // Nunca devolve o token na API. O transporte entrega apenas ao endereco cadastrado.
      try {
        await enviarEmail({
          para: email,
          assunto: "Redefinição de senha Collision",
          texto: `Redefina sua senha em ${config.frontendUrl}/recuperacao_senha/03_nova_senha?token=${token}\nO link expira em 30 minutos.`,
        });
      } catch {
        console.error(JSON.stringify({ evento: "falha_recuperacao_email" }));
      }
    }
    return {
      mensagem:
        "Se houver uma conta ativa para esse email, você receberá as instruções de recuperação.",
    };
  }
  async function redefinir(corpo) {
    v.objeto(corpo, ["token", "senha"]);
    exigir(
      typeof corpo.token === "string" && /^[a-f0-9]{64}$/.test(corpo.token),
      400,
      "TOKEN_INVALIDO",
      "Link de recuperação inválido ou expirado.",
    );
    const hash = await bcrypt.hash(v.senha(corpo.senha), 12),
      agora = dataSql(relogio());
    await transacao(pool, async (db) => {
      const candidato = await um(
        db,
        "SELECT id_usuario FROM RECUPERACAO_SENHA WHERE token_hash=?",
        [hashToken(corpo.token)],
      );
      exigir(
        candidato,
        400,
        "TOKEN_INVALIDO",
        "Link de recuperação inválido ou expirado.",
      );
      const usuario = await um(
        db,
        "SELECT ativo FROM USUARIO WHERE id_usuario=? FOR UPDATE",
        [candidato.id_usuario],
      );
      const registro = await um(
        db,
        "SELECT * FROM RECUPERACAO_SENHA WHERE token_hash=? AND usado_em IS NULL AND expira_em>? FOR UPDATE",
        [hashToken(corpo.token), agora],
      );
      exigir(
        registro && usuario.ativo,
        400,
        "TOKEN_INVALIDO",
        "Link de recuperação inválido ou expirado.",
      );
      await linhas(
        db,
        "UPDATE USUARIO SET senha_hash=?,data_atualizacao=? WHERE id_usuario=?",
        [hash, agora, candidato.id_usuario],
      );
      await linhas(
        db,
        "UPDATE RECUPERACAO_SENHA SET usado_em=? WHERE id_usuario=? AND usado_em IS NULL",
        [agora, candidato.id_usuario],
      );
      await linhas(
        db,
        "UPDATE SESSAO SET revogada_em=? WHERE id_usuario=? AND revogada_em IS NULL",
        [agora, candidato.id_usuario],
      );
    });
  }
  return { login, autenticar, logout, recuperar, redefinir };
}

export const permitir =
  (...perfis) =>
  (req, res, next) => {
    exigir(
      perfis.includes(req.usuario.perfil),
      403,
      "SEM_PERMISSAO",
      "Seu perfil não pode realizar esta ação.",
    );
    next();
  };
export { publico as usuarioPublico };
