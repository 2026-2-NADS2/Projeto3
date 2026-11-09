import { criarPool, transacao, um } from "../src/banco/pool.js";
import { lerAmbiente } from "../src/config/ambiente.js";
import { criarUsuario } from "../src/servicos/usuarios.js";

const pool = criarPool(lerAmbiente().db);
try {
  await transacao(pool, async (db) => {
    const trava = await um(
      db,
      "SELECT GET_LOCK(CONCAT(DATABASE(), ':bootstrap'),10) AS ok",
    );
    if (trava.ok !== 1) throw new Error("Outro bootstrap esta em andamento.");
    try {
      if (
        (
          await um(
            db,
            "SELECT COUNT(*) total FROM USUARIO WHERE perfil='ADMINISTRADOR'",
          )
        ).total
      )
        throw new Error(
          "Ja existe administrador. Crie novas contas pela API autenticada.",
        );
      const usuario = await criarUsuario(db, {
        nome: process.env.ADMIN_NOME || "Administrador Collision",
        email: process.env.ADMIN_EMAIL,
        senha: process.env.ADMIN_SENHA,
        perfil: "ADMINISTRADOR",
      });
      console.log(`Administrador criado: ${usuario.email}`);
    } finally {
      await db.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':bootstrap'))");
    }
  });
} finally {
  await pool.end();
}
