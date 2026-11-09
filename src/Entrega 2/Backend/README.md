# Collision — backend Fullstack

API REST em **Node.js + Express + MySQL**, independente da entrega C# de POO.
O banco guarda os cadastros, sessões, acompanhamentos e histórico mesmo após
reiniciar a API. O código contém comentários em português.

## O que já funciona

- Login com bcrypt e JWT, identidade atual, logout com revogação e recuperação de senha.
- Cadastro administrativo de contas: administrador, professor e responsável.
- Alunos, turmas, áreas, disciplinas, tags, matrículas e vínculos escolares.
- Quatro bimestres por ano, com data/hora de abertura e encerramento.
- Rascunho, envio, início de revisão, edição administrativa, devolução, correção,
  reenvio, publicação e cancelamento antes da publicação.
- Auditoria transacional e controle de versão para impedir sobrescrita concorrente.
- Consulta da família restrita aos alunos vinculados e aos registros publicados.
- Ciência independente por responsável, idempotente, e múltiplas observações.
- Retornos, indicadores, comunicados por turma e auditoria com paginação.
- Download real de PDF, CSV com BOM/separador `;` e planilha XLSX/OOXML.
- Contrato OpenAPI 3.1 em `GET /api/openapi.json`.

O frontend consulta a API para autenticar, carregar dados escolares e gravar as operações de cada perfil. Consulte o [guia de inicialização](../README.md).

## Modo local integrado

Dentro de `Backend`, execute `npm.cmd ci` na primeira instalação e `npm.cmd run dev:local` para iniciar. O MySQL integrado atende em `127.0.0.1:13307` e a API em `127.0.0.1:3334`. A primeira execução cria três contas e os dados escolares iniciais. As credenciais iniciais são geradas em `.local/acessos-fullstack.json`.

- [Saúde](http://127.0.0.1:3334/api/saude)
- [Contrato OpenAPI](http://127.0.0.1:3334/api/openapi.json)
- Dados persistentes em `.local/mysql-integrado/data`.
- Ctrl+C encerra a API e a instância isolada do MySQL.
- Use `MYSQL_BIN` se o executável estiver em outro caminho. `MYSQL_LOCAL_PORT` define a porta do MySQL na primeira inicialização e `PORT` define a porta da API.

## Configurar um servidor MySQL próprio

Requisitos: Node.js 22 ou superior e MySQL 8.0.16+ (testado com MySQL 8.4.7).
Para ambiente novo, prefira a linha MySQL 8.4. Crie um banco vazio próprio para esta
API, por exemplo `collision_api`, com `utf8mb4`.

1. Copie `.env.example` para `.env`.
2. Configure DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASSWORD.
3. Defina JWT_SECRET aleatório, com pelo menos 32 caracteres.
4. Configure as origens permitidas em CORS_ORIGINS e a URL do frontend.
5. Instale o esquema com `npm.cmd run db:migrar`.
6. Escolha **um** dos métodos iniciais: `db:admin` para criar somente o primeiro
   administrador, ou `db:demo` para a carga fictícia completa em banco vazio.
7. Execute `npm.cmd run dev` para desenvolvimento ou `npm.cmd start` para execução normal.

```powershell
Copy-Item .env.example .env
# Edite .env antes dos comandos seguintes.
npm.cmd run db:migrar
# Configure ADMIN_EMAIL e ADMIN_SENHA no ambiente para este comando.
npm.cmd run db:admin
npm.cmd run dev
```

`db:admin` exige senha com pelo menos 10 caracteres e no máximo 72 bytes UTF-8.
Depois do bootstrap, as contas são criadas por um administrador autenticado via
`POST /api/usuarios`. Não existe cadastro público que permita escolher um papel.

Para `db:demo`, defina DEMO_PASSWORD e use um banco vazio. A carga é recusada em
NODE_ENV=production e nunca apaga cadastros existentes. Remova ADMIN_SENHA e
DEMO_PASSWORD do ambiente de execução depois do bootstrap.

O usuário de instalação precisa de permissão para DDL. Em produção, execute as
migrações separadamente e dê ao usuário da aplicação apenas SELECT, INSERT, UPDATE
e DELETE no banco da API; não precisa de CREATE USER, GRANT ou privilégios globais.

### Compatibilidade com o SQL acadêmico

`sql/migracoes/001_estrutura.sql` cria **21 tabelas de domínio/infraestrutura e 2
views**, além da tabela técnica SCHEMA_MIGRATION criada pelo migrador. O SQL original
em `documentos/Entrega 2/Banco de Dados` foi preservado.

Este instalador é para **banco novo**. Ele recusa um banco com tabelas não gerenciadas.
Não converte automaticamente `collision_db` nem o SQLite da entrega de POO. Essa
migração exigirá análise e transporte dos dados existentes.

As migrações aplicadas são identificadas por nome e SHA-256. Alterar uma migração já
aplicada produz erro; mudanças futuras entram em um novo arquivo. DDL MySQL faz commit
implícito: em falha durante instalação, inspecione o estado antes de tentar novamente.
Nenhum script remove automaticamente tabelas para “corrigir” uma falha.

## Como testar a API

O arquivo `docs/requisicoes.http` contém chamadas para a extensão REST Client do VS
Code; também é possível usar Postman/Insomnia. Importe `/api/openapi.json` como contrato.

Exemplo PowerShell, usando uma credencial fictícia local sem escrever a senha no histórico:

```powershell
$contasCollision = Get-Content .local/acessos-fullstack.json -Raw | ConvertFrom-Json
$credencialCollision = $contasCollision.contas | Where-Object email -eq 'admin@example.com'
$loginCollision = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3334/api/auth/login -ContentType 'application/json' -Body ($credencialCollision | ConvertTo-Json)
$cabecalhoCollision = @{ Authorization = "Bearer $($loginCollision.token)" }
Invoke-RestMethod -Uri http://127.0.0.1:3334/api/alunos -Headers $cabecalhoCollision
```

### Fluxo de demonstração

1. Faça login com a administradora; consulte alunos, vínculos, tags e bimestres.
2. Faça login com Ana Paula e crie um rascunho em `POST /api/acompanhamentos`.
3. Complete descrição, média e tagIds em `PATCH /api/acompanhamentos/:id`.
4. Envie em `POST /api/acompanhamentos/:id/enviar` com a versão retornada.
5. Com a administradora, inicie revisão e publique ou devolva com motivo.
6. Com Carlos, consulte o registro publicado, confirme ciência e envie observação.
7. Baixe o PDF e consulte os retornos na área da administração.

Não reutilize versões antigas após salvar. Todos os comandos de edição/transição
exigem `versao`; o servidor responde 409 se outro usuário já alterou o registro.

## Principais rotas

Todas começam em `/api`. As rotas públicas são saúde, contrato, login e recuperação.
As demais exigem `Authorization: Bearer <token>`.

| Grupo           | Rotas                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Autenticação    | POST /auth/login, GET /auth/me, POST /auth/logout, POST /auth/recuperacao, POST /auth/redefinicao                                                      |
| Usuários        | GET/POST /usuarios, GET/PATCH /usuarios/:id                                                                                                            |
| Cadastros       | GET/POST /alunos, /turmas, /areas, /disciplinas, /tags; GET/PATCH de cada /:id                                                                         |
| Vínculos        | GET/POST /vinculos/professores; PATCH /vinculos/professores/:id; GET/POST /vinculos/responsaveis; PATCH /vinculos/responsaveis/:alunoId/:responsavelId |
| Matrículas      | GET/POST /matriculas; consulta autorizada do histórico, matrícula e transferência                                                                      |
| Bimestres       | GET /bimestres, POST /bimestres/ano, PATCH /bimestres/:id                                                                                              |
| Acompanhamentos | GET/POST /acompanhamentos, GET/PATCH /acompanhamentos/:id                                                                                              |
| Ações           | POST /acompanhamentos/:id/enviar, /iniciar-revisao, /devolver, /publicar, /cancelar                                                                    |
| Família         | GET /meus-alunos, PUT /acompanhamentos/:id/ciencia, GET/POST /acompanhamentos/:id/observacoes                                                          |
| Documentos      | GET /acompanhamentos/:id/pdf, GET /relatorios/exportacao?formato=csv ou xlsx                                                                           |
| Gestão          | GET /retornos, GET /relatorios/indicadores, GET /auditoria, GET /acompanhamentos/:id/historico                                                         |
| Comunicados     | GET/POST /comunicados, GET/PATCH /comunicados/:id                                                                                                      |

Listas paginadas retornam `{ dados, paginacao: { pagina, limite, total } }`, com limite
máximo de 100. Bimestres retornam o conjunto de períodos, sem paginação.

Filtros de acompanhamento: alunoId, turmaId, disciplinaId, professorId, bimestreId,
anoLetivo, bimestre, tagId, status e busca. Para a família, `pendente=true` filtra a
própria ciência. Exportação usa os mesmos filtros, ignora a página visual e recusa
mais de 10.000 registros, pedindo refinamento. `descricoes=true` inclui os textos.

Situações técnicas: RASCUNHO, ENVIADO_PARA_REVISAO, EM_REVISAO, DEVOLVIDO, PUBLICADO
e CANCELADO. O React deve traduzir os rótulos. Média é número JSON (ex.: `8.7`),
datas/horas usam ISO 8601 com fuso; o banco persiste UTC.

Erros têm `erro.codigo`, `erro.mensagem`, `erro.campos` e, normalmente,
`erro.requisicaoId`. Códigos HTTP: 400 validação, 401 autenticação, 403 permissão,
404 fora do recorte/inexistente, 409 conflito de versão/estado/vínculo, 413 corpo
muito grande, 429 tentativas excessivas, 500 falha interna e 503 recuperação indisponível.

## Regras implementadas

- Professor cria/edita/envia somente na atribuição ativa, com aluno matriculado e
  período aberto. Os instantes exatos de abertura/encerramento são inclusivos.
- Rascunho pode estar incompleto; envio exige desenvolvimento, média e uma tag.
- Professor edita apenas RASCUNHO ou DEVOLVIDO. Salvar correção não reenvia.
- Administrador edita apenas EM_REVISAO e informa motivo. Devolução também exige motivo.
- Publicado fica imutável; a API não implementa retificação de conteúdo publicado.
- Cancelamento preserva o registro e exige motivo; publicado/cancelado não é cancelado de novo.
- Professor conserva a consulta de seus registros históricos após uma transferência,
  mas não pode continuar editando quando a matrícula deixou de ser atual.
- Responsável precisa de vínculo ativo e aluno ativo; somente PUBLICADO é visível.
- Cada responsável tem sua ciência. Repetir PUT preserva a primeira confirmação.
- Observações são limitadas a 2.000 caracteres e exigem ciência. A escola autorizada
  vê os retornos; um responsável não recebe as observações de outro responsável.
- Alterações em dados escolares e auditoria são gravadas na mesma transação.
- O cadastro impede inativar o último administrador e duplicar matrícula/atribuição.
- Senhas não são retornadas. O perfil vem do usuário autenticado, não do formulário.

## Recuperação de senha

Em desenvolvimento sem SMTP, a mensagem fica em `.local/emails/*.json`. Isso não
envia email real. Os testes injetam um transporte local e verificam o token sem
chamar serviços externos.

Em produção, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD e SMTP_FROM.
Sem transporte, a rota retorna 503. O banco guarda o hash do token, com validade
de 30 minutos e uso único. Redefinir a senha revoga todas as sessões da conta.

JWT expira em 30 minutos por padrão. Sessões revogadas e usuários inativos deixam
de autenticar imediatamente nas próximas requisições. Não há refresh token nesta versão.

## Testes e evidências

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run test:mysql
```

- `check`: sintaxe de todos os arquivos JavaScript.
- `test`: testes de validação/arquivos; os testes MySQL ficam explicitamente marcados como pulados.
- `test:mysql`: inicia outro MySQL em porta livre, com credenciais aleatórias e um
  banco vazio por arquivo de teste; executa HTTP real e encerra a instância ao final.
- Os serviços MySQL/Wamp existentes não são utilizados por esse teste.
- Evidências dos downloads: `.local/evidencias/`. Não são arquivos para versionamento.

Os cenários verificam criação/edição, permissões entre professores/famílias,
recuperação, revogação, duplicidade, prazos, auditoria, rollback por falha injetada,
duas publicações simultâneas, persistência entre instâncias e downloads binários.
O log `ER_SIGNAL_EXCEPTION` durante o teste de rollback é proposital: a alteração
deve ser desfeita e a API não expõe a mensagem SQL ao cliente.

## Estrutura

```text
src/
  app.js                  Rotas, middlewares e autorização por perfil
  servidor.js             Inicialização e encerramento HTTP
  openapi.js              Contrato da API
  config/ambiente.js       Leitura e validação de configuração
  banco/pool.js           Pool, consultas parametrizadas e transações
  repositorios/           Consultas compartilhadas e recorte de acesso
  servicos/               Regras de negócio e operações persistentes
  documentos/arquivos.js   PDF, CSV e XLSX
  validadores.js          Validação de entradas
  erros.js                Respostas padronizadas
sql/migracoes/            Esquema versionado para banco novo
scripts/                 Migrações, bootstrap, demonstração e testes locais
testes/                  Validação, integração HTTP e banco real
docs/requisicoes.http     Exemplos de chamadas
```

## Implantação e continuidade

Em produção, configure HOST=0.0.0.0, NODE_ENV=production, origens CORS explícitas,
segredo JWT e credenciais do banco. Use HTTPS no proxy/plataforma. A API não confia
automaticamente em X-Forwarded-For; a política de proxy deve ser configurada para
a topologia real antes de publicar atrás de um proxy.

Faça backup do banco com `mysqldump --single-transaction` e teste a restauração em
outro banco. Credenciais devem ser fornecidas por prompt/arquivo protegido, não no
histórico do terminal. O backup e a restauração de um servidor de produção não
foram executados nesta implementação.

O React usa `VITE_API_URL`, um serviço central de fetch e o token Bearer. Na publicação,
ajuste a URL para apontar para a API publicada. As credenciais do servidor ficam no backend.

Frequência e quantidade de atividades ainda não possuem fonte no escopo do PI.
Não apresentar os valores ilustrativos dessas telas como indicadores reais da API.

A implantação pública e o envio SMTP externo são etapas separadas da execução local.
