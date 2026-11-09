# Collision — como iniciar o sistema

A entrega Fullstack usa React no navegador, uma API Express e MySQL. Siga os passos no PowerShell ou nos terminais do VS Code.

## 1. Confira os programas

```powershell
node -v
npm.cmd -v
Test-Path "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysqld.exe"
```

Use Node.js 22.12 ou superior e MySQL Server 8.0 ou superior. O caminho acima é o instalado neste computador. Se o MySQL estiver em outro diretório, informe o caminho real de `mysqld.exe` na variável `MYSQL_BIN` antes de iniciar o backend. O modo local abre uma instância própria do MySQL.

## 2. Inicie a API no primeiro terminal

```powershell
cd "C:\Users\lucas\Downloads\KAFKA\Projeto3\src\Entrega 2\Backend"
npm.cmd ci
npm.cmd run dev:local
```

A primeira execução prepara o banco, cria três contas e grava os dados iniciais para percorrer o fluxo escolar. Aguarde a mensagem da API e abra [a verificação de saúde](http://127.0.0.1:3334/api/saude). A resposta deve informar que o banco está conectado.

O modo integrado usa a porta 3334 para a API e 13307 para o MySQL. Os dados ficam em `Backend/.local/mysql-integrado`. A instância anterior de demonstração usa outro diretório.

## 3. Inicie as telas no segundo terminal

```powershell
cd "C:\Users\lucas\Downloads\KAFKA\Projeto3\src\Entrega 2\Frontend"
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

Execute `Copy-Item` somente se ainda não tiver um `.env`. O valor padrão no exemplo é `VITE_API_URL=http://127.0.0.1:3334/api`. Reinicie o Vite após editar o arquivo.

Abra [o login do Collision](http://localhost:5173/login.html).

## 4. Entre com uma das três contas

O backend grava as senhas iniciais geradas em `Backend/.local/acessos-fullstack.json`. Abra esse arquivo no VS Code e copie a senha para o login. O arquivo fica fora do Git. Uma redefinição de senha passa a valer no banco, enquanto o arquivo continua registrando a senha inicial.

| Perfil | E-mail |
| --- | --- |
| Administrador | admin@example.com |
| Pai / responsável | carlos.almeida@example.com |
| Professora | ana.paula@example.com |

Cada conta abre sua própria área. Use **Sair** no menu da conta antes de entrar com outro perfil.

O banco começa sem acompanhamentos publicados. Para percorrer o fluxo, entre como professora, crie um acompanhamento para Pedro Almeida e envie para revisão. Depois, entre como administrador, abra a fila de revisão, inicie a revisão e publique. Por fim, entre como responsável para consultar o relatório e confirmar a leitura. Use um bimestre aberto para o envio.

## 5. Encerre ou retome

Pressione **Ctrl+C** em cada terminal para encerrar. Na próxima utilização, basta executar os dois comandos `npm.cmd run` nas respectivas pastas. A API reutiliza o banco local. Preserve a pasta `Backend/.local/mysql-integrado`.

Se aparecer erro de conexão, confira a página de saúde, o terminal do backend e a URL em `Frontend/.env`. Se o PowerShell bloquear `npm.ps1`, use `npm.cmd`.

Para detalhes de configuração e testes, consulte a [documentação do backend](Backend/README.md) e a [documentação do frontend](Frontend/README.md).
