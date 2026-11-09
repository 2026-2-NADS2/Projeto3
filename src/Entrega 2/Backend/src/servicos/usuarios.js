import bcrypt from "bcryptjs";
import * as v from "../validadores.js";
import { linhas, um, transacao, dataSql } from "../banco/pool.js";
import { exigir, naoEncontrado } from "../erros.js";
import { auditar } from "./auditoria.js";

export async function criarUsuario(db, corpo, ator = null, agora = new Date()) {
  v.objeto(corpo, [
    "nome",
    "email",
    "senha",
    "perfil",
    "cargo",
    "telefone",
    "matricula",
    "cpf",
  ]);
  const nome = v.texto(corpo.nome, "nome"),
    email = v.email(corpo.email),
    hash = await bcrypt.hash(v.senha(corpo.senha), 12);
  const perfil = v.opcao(corpo.perfil, "perfil", [
    "ADMINISTRADOR",
    "PROFESSOR",
    "RESPONSAVEL",
  ]);
  const cargo = v.texto(corpo.cargo, "cargo", 50, false),
    telefone = v.texto(corpo.telefone, "telefone", 20, false);
  const matricula =
    perfil === "PROFESSOR" ? v.texto(corpo.matricula, "matricula", 20) : null;
  const cpf =
    perfil === "RESPONSAVEL" ? v.texto(corpo.cpf, "cpf", 11, false) : null;
  exigir(
    !cpf || /^\d{11}$/.test(cpf),
    400,
    "VALIDACAO",
    "CPF deve conter 11 dígitos.",
  );
  const r = await linhas(
    db,
    "INSERT INTO USUARIO(nome,email,senha_hash,perfil,cargo,telefone,ativo,data_cadastro,data_atualizacao) VALUES (?,?,?,?,?,?,1,?,?)",
    [
      nome,
      email,
      hash,
      perfil,
      cargo,
      telefone,
      dataSql(agora),
      dataSql(agora),
    ],
  );
  if (perfil === "PROFESSOR")
    await linhas(
      db,
      "INSERT INTO PROFESSOR(id_usuario,matricula) VALUES (?,?)",
      [r.insertId, matricula],
    );
  if (perfil === "RESPONSAVEL")
    await linhas(db, "INSERT INTO RESPONSAVEL(id_usuario,cpf) VALUES (?,?)", [
      r.insertId,
      cpf,
    ]);
  const dados = { id: r.insertId, nome, email, perfil, ativo: true };
  await auditar(
    db,
    ator || dados,
    "USUARIO",
    r.insertId,
    "CRIACAO",
    null,
    dados,
    null,
    agora,
  );
  return dados;
}

export function servicoUsuarios(pool, relogio) {
  const selecionar = `SELECT u.id_usuario AS id,u.nome,u.email,u.perfil,u.cargo,u.telefone,u.ativo,
    p.id_professor AS professorId,p.matricula,r.id_responsavel AS responsavelId
    FROM USUARIO u LEFT JOIN PROFESSOR p ON p.id_usuario=u.id_usuario LEFT JOIN RESPONSAVEL r ON r.id_usuario=u.id_usuario`;
  return {
    criar: (corpo, ator) =>
      transacao(pool, (db) => criarUsuario(db, corpo, ator, relogio())),
    async listar(query) {
      const pg = v.paginacao(query),
        where = [],
        args = [];
      if (query.perfil) {
        where.push("u.perfil=?");
        args.push(
          v.opcao(query.perfil, "perfil", [
            "ADMINISTRADOR",
            "PROFESSOR",
            "RESPONSAVEL",
          ]),
        );
      }
      if (query.busca) {
        where.push("(u.nome LIKE ? OR u.email LIKE ?)");
        const busca = "%" + v.texto(query.busca, "busca") + "%";
        args.push(busca, busca);
      }
      const filtro = where.length ? " WHERE " + where.join(" AND ") : "";
      const dados = await linhas(
        pool,
        selecionar +
          filtro +
          ` ORDER BY u.nome,u.id_usuario LIMIT ${pg.limite} OFFSET ${pg.offset}`,
        args,
      );
      const total = (
        await um(pool, "SELECT COUNT(*) AS total FROM USUARIO u" + filtro, args)
      ).total;
      return {
        dados: dados.map((r) => ({ ...r, ativo: !!r.ativo })),
        paginacao: { pagina: pg.pagina, limite: pg.limite, total },
      };
    },
    async detalhar(id) {
      const r = await um(pool, selecionar + " WHERE u.id_usuario=?", [id]);
      if (!r) throw naoEncontrado();
      return { ...r, ativo: !!r.ativo };
    },
    async editar(id, corpo, ator) {
      v.objeto(corpo, ["nome", "email", "cargo", "telefone", "ativo"]);
      return transacao(pool, async (db) => {
        // Trava os administradores primeiro para impedir inativacao concorrente do ultimo.
        const admins = await linhas(
          db,
          "SELECT id_usuario FROM USUARIO WHERE perfil='ADMINISTRADOR' AND ativo=1 ORDER BY id_usuario FOR UPDATE",
        );
        const antes = await um(
          db,
          "SELECT id_usuario AS id,nome,email,perfil,cargo,telefone,ativo FROM USUARIO WHERE id_usuario=? FOR UPDATE",
          [id],
        );
        if (!antes) throw naoEncontrado();
        const depois = { ...antes };
        for (const chave of ["nome", "cargo", "telefone"])
          if (chave in corpo)
            depois[chave] = v.texto(
              corpo[chave],
              chave,
              chave === "nome" ? 100 : chave === "cargo" ? 50 : 20,
              chave === "nome",
            );
        if ("email" in corpo) depois.email = v.email(corpo.email);
        if ("ativo" in corpo) depois.ativo = v.booleano(corpo.ativo);
        exigir(
          !(
            antes.perfil === "ADMINISTRADOR" &&
            antes.ativo &&
            !depois.ativo &&
            admins.length <= 1
          ),
          409,
          "ULTIMO_ADMIN",
          "Mantenha pelo menos um administrador ativo.",
        );
        await linhas(
          db,
          "UPDATE USUARIO SET nome=?,email=?,cargo=?,telefone=?,ativo=?,data_atualizacao=? WHERE id_usuario=?",
          [
            depois.nome,
            depois.email,
            depois.cargo,
            depois.telefone,
            depois.ativo,
            dataSql(relogio()),
            id,
          ],
        );
        if (!depois.ativo)
          await linhas(
            db,
            "UPDATE SESSAO SET revogada_em=? WHERE id_usuario=? AND revogada_em IS NULL",
            [dataSql(relogio()), id],
          );
        await auditar(
          db,
          ator,
          "USUARIO",
          id,
          "ALTERACAO",
          antes,
          depois,
          null,
          relogio(),
        );
        return { ...depois, ativo: !!depois.ativo };
      });
    },
  };
}
