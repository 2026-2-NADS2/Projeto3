import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
async function visitar(pasta) {
  for (const entrada of await fs.readdir(pasta, { withFileTypes: true })) {
    const nome = path.join(pasta, entrada.name);
    if (entrada.isDirectory()) await visitar(nome);
    else if (nome.endsWith(".js")) {
      const r = spawnSync(process.execPath, ["--check", nome], {
        stdio: "inherit",
        windowsHide: true,
      });
      if (r.status !== 0) process.exit(r.status || 1);
    }
  }
}
for (const pasta of ["src", "scripts", "testes"]) await visitar(pasta);
console.log("Sintaxe JavaScript verificada.");
