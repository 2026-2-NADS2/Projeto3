# Como executar o Collision

O Collision usa um front-end React, uma API Express e um banco MySQL. Durante o uso, deixe **dois terminais abertos**, um para a API e outro para o front-end.

- [Instalação no macOS](#macos)
- [Instalação no Windows](#windows)
- [Contas de teste](#contas-de-teste)
- [Como resolver erros](#como-resolver-erros)

## Antes de começar

Instale o [Node.js](https://nodejs.org/en/download) 22.12 ou superior e o [MySQL Server](https://dev.mysql.com/downloads/mysql/) 8.0.16 ou superior. Para uma instalação nova, use MySQL 8.4 LTS. O MySQL Workbench é opcional e serve para acessar o banco. O MySQL Server é o programa que a API precisa ter disponível.

```sh
node -v
npm -v
```

No PowerShell, use `npm.cmd -v` se o Windows bloquear `npm.ps1`.

Se estiver baixando o projeto pela primeira vez, execute os comandos abaixo. Se já tiver o projeto, abra a pasta `Projeto3` no VS Code e comece pela seção do seu sistema. Os caminhos com espaço, como `"src/Entrega 2/Backend"`, precisam das aspas.

```sh
git clone https://github.com/2026-2-NADS2/Projeto3.git
cd Projeto3
```

## macOS

### 1. Inicie o MySQL Server

Se já tiver MySQL Server instalado e rodando, use essa instalação. Se usar o [Homebrew](https://brew.sh/), a instalação e a inicialização são estas. [MySQL 8.4 no Homebrew](https://formulae.brew.sh/formula/mysql%408.4)

```sh
brew install mysql@8.4
brew services start mysql@8.4
"$(brew --prefix mysql@8.4)/bin/mysql" -u root -p
```

O comando pede a senha do usuário `root` do MySQL. Se você acabou de instalar pelo Homebrew e ainda não definiu uma senha para `root`, pressione **Enter** quando solicitado. Também é possível usar o [instalador oficial para macOS](https://dev.mysql.com/doc/refman/8.4/en/macos-installation-pkg.html). Nesse caso, use o MySQL Workbench para se conectar como `root` ou execute `/usr/local/mysql/bin/mysql -u root -p` com o serviço ligado.

### 2. Crie o banco e o usuário da API

No prompt `mysql>` ou no editor SQL do Workbench, execute o bloco abaixo. Substitua `SUA_SENHA_DO_MYSQL` por uma senha local que você escolher e guarde o valor para a etapa seguinte. Use um banco novo para o Fullstack.

```sql
CREATE DATABASE IF NOT EXISTS collision_api CHARACTER SET utf8mb4;
CREATE USER 'collision'@'127.0.0.1' IDENTIFIED BY 'SUA_SENHA_DO_MYSQL';
GRANT ALL PRIVILEGES ON collision_api.* TO 'collision'@'127.0.0.1';
```

Se estiver no prompt `mysql>`, digite `exit` para voltar ao terminal. Se o banco e o usuário já foram preparados para este projeto, use os dados existentes e siga para o próximo passo.

### 3. Configure e inicie a API no primeiro terminal

Na pasta `Projeto3`, execute:

```sh
cd "src/Entrega 2/Backend"
npm ci
test -e .env || cp .env.example .env
node -e 'console.log(require("node:crypto").randomBytes(48).toString("hex"))'
```

O último comando gera o valor de `JWT_SECRET`. Abra o arquivo `.env` **da pasta Backend** no VS Code ou com `nano .env`. Ajuste estas linhas no arquivo, substituindo os três valores de exemplo pelos seus. As demais linhas podem ficar com os valores de `.env.example`.

```dotenv
PORT=3334
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=collision_api
DB_USER=collision
DB_PASSWORD=SUA_SENHA_DO_MYSQL
JWT_SECRET=COLE_O_VALOR_GERADO_AQUI
DEMO_PASSWORD=ESCOLHA_UMA_SENHA_DE_TESTE
```

- `DB_PASSWORD` é a mesma senha escolhida no `CREATE USER`. Se o seu MySQL usa outra porta, ajuste `DB_PORT`.
- `DEMO_PASSWORD` é a senha das contas de teste do **site**. Escolha uma com pelo menos 10 caracteres e até 72 bytes.
- Mantenha `NODE_ENV=development` para carregar os dados fictícios e `http://localhost:5173` em `CORS_ORIGINS`. Mantenha o `.env` no seu computador.

Ainda na pasta `Backend`, execute um comando por vez. Se uma etapa falhar, corrija a mensagem antes de seguir.

```sh
npm run db:migrar
npm run db:demo
npm run dev
```

`db:migrar` cria as tabelas e `db:demo` cria as contas e dados escolares. Use `db:demo` uma única vez em um banco vazio. Nas próximas vezes, com o MySQL rodando, basta executar `npm run dev` para retomar a API.

Abra [a página de saúde da API](http://127.0.0.1:3334/api/saude). O resultado esperado é `{"status":"ok","banco":"conectado"}`.

### 4. Inicie o front-end no segundo terminal

Abra outro terminal na pasta `Projeto3` e deixe o primeiro rodando.

```sh
cd "src/Entrega 2/Frontend"
npm ci
test -e .env || cp .env.example .env
npm run dev -- --host localhost --port 5173 --strictPort
```

Abra [a tela de login](http://localhost:5173/login.html). Se já tinha um `.env` no front-end, confirme que `VITE_API_URL=http://127.0.0.1:3334/api`. Se preferiu outra porta para a API, use essa mesma porta em `VITE_API_URL` e reinicie o Vite.

## Windows

### 1. Inicie a API no primeiro PowerShell

Na pasta `Projeto3`, execute:

```powershell
cd "src/Entrega 2/Backend"
npm.cmd ci
npm.cmd run dev:local
```

Esse modo inicia um MySQL local próprio na porta `13307` e a API na `3334`. Na primeira execução, ele também cria as contas de teste. Se o script pedir `MYSQL_BIN`, informe o caminho real de `mysqld.exe` antes de repetir o comando. Este é um exemplo de caminho de instalação:

```powershell
$env:MYSQL_BIN = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe'
Test-Path $env:MYSQL_BIN
npm.cmd run dev:local
```

Prossiga quando `Test-Path` retornar `True` e [a página de saúde da API](http://127.0.0.1:3334/api/saude) informar que o banco está conectado.

### 2. Inicie o front-end no segundo PowerShell

Abra outro terminal na pasta `Projeto3` e deixe o primeiro rodando.

```powershell
cd "src/Entrega 2/Frontend"
npm.cmd ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

Abra [a tela de login](http://localhost:5173/login.html). Se já tinha um `.env` no front-end, confira se `VITE_API_URL=http://127.0.0.1:3334/api`. Após mudar o arquivo, reinicie o Vite.

## Contas de teste

| Perfil | E-mail |
| --- | --- |
| Administrador | admin@example.com |
| Professora | ana.paula@example.com |
| Pai ou responsável | carlos.almeida@example.com |

No macOS, use a senha que estava em `DEMO_PASSWORD` quando rodou `db:demo`. No modo integrado do Windows, abra `Backend/.local/acessos-fullstack.json` e use a senha inicial da conta desejada. Editar esses arquivos depois da carga inicial não troca as senhas no banco. Use **Sair** para trocar de perfil.

Para testar o fluxo, entre como professora, crie um acompanhamento para Pedro Almeida em um bimestre aberto e envie para revisão. Entre como administrador, revise e publique. Por fim, entre como responsável para consultar o relatório.

## Como resolver erros

| Mensagem ou sintoma | O que fazer |
| --- | --- |
| `Failed running 'src/servidor.js'` | É a mensagem final do Node. Suba no terminal e leia a primeira linha do erro. Para vê-la sem a reinicialização automática, pare com **Ctrl+C** e execute `npm run start` na pasta `Backend` no macOS ou `npm.cmd run start` no Windows se estiver usando o modo manual. |
| `Defina JWT_SECRET` ou `Defina DB_...` | No modo manual, confira se criou o `.env` na pasta `Backend` e se preencheu as variáveis da etapa de configuração. Em seguida, inicie a API a partir dessa pasta. |
| `ECONNREFUSED` ou aviso para iniciar o MySQL | Ligue o MySQL Server e confira o endereço e a porta do banco no `.env` do backend. |
| `ER_ACCESS_DENIED_ERROR` ou aviso de credenciais do MySQL | Confira `DB_USER` e `DB_PASSWORD` no `.env` do backend e a permissão do usuário no banco. Esses valores são do MySQL. |
| `ER_BAD_DB_ERROR` ou aviso para criar o banco | Confirme se o banco existe e se o nome é igual ao de `DB_NAME`. |
| `ER_NO_SUCH_TABLE` ou aviso para preparar o banco | Rode `npm run db:migrar` na pasta `Backend` após criar o banco e preencher o `.env`. |
| `EADDRINUSE` ou porta ocupada | Feche a execução anterior do projeto ou use uma porta livre. Se mudar a porta da API, atualize `VITE_API_URL` no front-end. Se mudar a porta do front-end, atualize também a origem permitida na API. |
| `Não foi possível conectar ao Collision` | Abra a página de saúde. Se ela não abrir, confira o terminal da API. Se ela responder, confira o endereço da API em `Frontend/.env` e acesse o front-end por `http://localhost:5173`. |
| `E-mail ou senha incorretos` | A API respondeu ao pedido de login. Use um dos e-mails de teste acima e a senha escolhida para aquela instalação, ou peça a um administrador uma conta. |
| `npm.ps1` bloqueado no Windows | Use `npm.cmd` no PowerShell, conforme os comandos do guia. |

Em desenvolvimento, o Vite usa `http://127.0.0.1:3334/api` se `VITE_API_URL` estiver vazia ou ausente. Para `npm run build`, configure `VITE_API_URL` antes de gerar os arquivos.

Use **Ctrl+C** em cada terminal para encerrar a API e o front-end. O MySQL iniciado pelo Homebrew roda como serviço. No Windows, `dev:local` encerra também o MySQL integrado e conserva os dados em `Backend/.local/mysql-integrado`.

Para detalhes de configuração e testes, consulte a [documentação do backend](Backend/README.md) e a [documentação do frontend](Frontend/README.md).
