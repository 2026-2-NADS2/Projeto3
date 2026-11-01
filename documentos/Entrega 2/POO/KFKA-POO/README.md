# KFKA – Entrega 2 de POO (API em C#)

Backend da **KFKA – Plataforma de Acompanhamento Escolar** em ASP.NET Core (.NET 10), com banco de dados próprio.
É a evolução do protótipo de console da Entrega 1: as mesmas classes de domínio (`Usuario`, `Professor`,
`Responsavel`, `Aluno`, `Turma`, `Disciplina`, `Bimestre`, `VinculoProfessor`, `AlunoResponsavel`, `Acompanhamento`)
agora são persistidas com Entity Framework Core e expostas por uma API REST com autenticação JWT.

## O que a API cobre

| Requisito | Onde |
|---|---|
| RF01 Autenticação e perfis | `POST /api/auth/login` (JWT), `[Authorize(Roles = ...)]` por módulo |
| RF02 Cadastros escolares | `/api/usuarios`, `/api/areas`, `/api/disciplinas`, `/api/turmas`, `/api/alunos`, `/api/tags` |
| RF03 Vínculos da turma | `/api/vinculos/professores`, `/api/vinculos/responsaveis` (bloqueia duplicados e incompatíveis) |
| RF04 Períodos bimestrais | `/api/bimestres`, `PUT /api/bimestres/{id}/periodo` |
| RF05/RF06 Acompanhamento e fluxo editorial | `/api/professor/acompanhamentos` e `/api/admin/acompanhamentos` |
| RF07 Histórico e auditoria | `GET .../acompanhamentos/{id}/historico` (usuário, data/hora, status anterior/posterior, detalhes) |
| RF08 Consulta do responsável | `/api/responsavel/relatorios` (só publicados e só de alunos vinculados) |
| RF10 Relatórios gerenciais | `GET /api/admin/acompanhamentos` com filtros por status, turma, disciplina, professor, bimestre, aluno e tag |
| RF12 Comunicação e retorno | `POST /api/responsavel/relatorios/{id}/ciencia`; retornos visíveis em `/api/professor/retornos` e `/api/admin/retornos` |

PDF (RF09) e exportação para Excel (RF11) ficam no backend Node do projeto integrado.

### Fluxo do acompanhamento

```
Rascunho ──enviar──► EnviadoParaRevisao ──iniciar-revisao──► EmRevisao ──publicar──► Publicado
   ▲                                                            │
   └──────── professor edita e reenvia ◄──── Devolvido ◄─devolver┘
Cancelado: professor (só rascunho/devolvido) ou administrador (qualquer etapa)
```

As transições ficam **dentro da entidade `Acompanhamento`**: cada método valida a regra (status, autor e período de
digitação aberto) e grava um `HistoricoAuditoria`. Os serviços só carregam os dados, chamam o método e salvam.

## Arquitetura

```
src/KFKA.Api
├── Domain/           Entidades e regras de negócio (sem dependência de banco ou HTTP)
│   ├── Usuarios/     Usuario (abstrata) → Administrador, Professor, Responsavel
│   ├── Escola/       Area, Disciplina, Turma, Aluno, Bimestre, Tag
│   └── Acompanhamentos/  VinculoProfessor, AlunoResponsavel, Acompanhamento, HistoricoAuditoria, RetornoResponsavel
├── Data/             KfkaDbContext (EF Core) e DbSeeder (dados fictícios)
├── Services/         Um serviço por módulo (o SistemaKFKA da Entrega 1 foi dividido aqui)
├── Dtos/             Contratos de entrada/saída da API
├── Controllers/      Endpoints REST
└── Infra/            Relógio (IRelogio), JWT, hash de senha (BCrypt) e tratamento de erros
tests/KFKA.Tests      Testes unitários do domínio e de integração da API
```

**Conceitos de POO aplicados**
- **Encapsulamento:** todas as propriedades têm `private set`. O estado só muda por métodos com regra (`Publicar()`, `Devolver()`, `TransferirPara()`...).
- **Herança:** `Usuario` é abstrata; o banco usa uma tabela única com discriminador `Perfil` (TPH).
- **Polimorfismo:** `Acompanhamento.Cancelar(Usuario)` muda a regra conforme o tipo real do objeto (`Professor` ou `Administrador`). O construtor de `UsuarioResponse` também preenche campos diferentes para cada subtipo.
- **Abstração (interfaces):** os serviços dependem de `IRelogio` e `IHasherSenha`, não das classes concretas. Na aplicação é usado `RelogioSistema`; nos testes, um relógio parado numa data fixa.
- **Exceções de domínio:** `RegraNegocioException`, `ConflitoException`, `NaoEncontradoException` etc. são convertidas em respostas `application/problem+json` (422, 409, 404...).

### Principais mudanças em relação à Entrega 1
- Dados em banco (EF Core + SQLite) em vez de listas em memória.
- `Status` e `Perfil` viraram `enum`, gravados como texto no banco.
- Novas entidades: `Area`, `Tag`, `HistoricoAuditoria`, `RetornoResponsavel`.
- Novos estados: `Devolvido` e `Cancelado`. Professor e administrador podem editar o conteúdo, sempre com rastreabilidade.
- Senha com hash BCrypt e login com JWT. O usuário vem do token, não de um objeto passado por parâmetro.
- Datas em UTC, para o período de digitação funcionar em servidores na nuvem.

## Como executar localmente

Pré-requisito: [.NET SDK 10](https://dotnet.microsoft.com/download).

```bash
dotnet run --project src/KFKA.Api
```

Abra <http://localhost:5104/swagger>. Na primeira execução o banco `kfka.db` é criado e populado com dados fictícios.
Para recomeçar do zero, apague o arquivo `src/KFKA.Api/kfka.db`.

### Usuários de demonstração (senha `Kfka@2026`)

| Perfil | E-mail |
|---|---|
| Administrador | `admin@kfka.com` |
| Professor | `ronaldo@kfka.com` (Matemática 5º A e 6º B), `fernanda@kfka.com` (Português 5º A, História 6º B) |
| Responsável | `marcelo@kfka.com` (João e Ana), `juliana@kfka.com` (João e Pedro) |

No Swagger: execute `POST /api/auth/login`, copie o `token`, clique em **Authorize** e cole o token.

### Testes

```bash
dotnet test
```

São 28 testes. Os unitários cobrem as regras do domínio. O de integração executa o cenário de aceite do enunciado
(o administrador cadastra e abre o bimestre, o professor registra e envia, o administrador revisa e publica, o responsável consulta
e registra ciência) e também verifica autorização (401/403/404) e o formato padronizado dos erros.

## Configuração (variáveis de ambiente)

| Variável | Obrigatória | Exemplo |
|---|---|---|
| `Jwt__Chave` | **sim** em produção (mín. 32 caracteres) | gerar com `openssl rand -base64 48` |
| `ConnectionStrings__Kfka` | não (padrão `Data Source=kfka.db`) | `Data Source=/app/data/kfka.db` |
| `Seed__Habilitado` | não (padrão `true`) | `false` |
| `Seed__SenhaPadrao` | não (padrão `Kfka@2026`) | senha dos usuários de demonstração |

Nenhum segredo fica no código. O `appsettings.Development.json` tem apenas uma chave JWT de desenvolvimento local.

## Deploy na nuvem (Render, com Docker)

> **Situação atual:** a API foi validada apenas localmente (build, 28 testes automatizados e execução manual).
> A imagem Docker ainda não foi construída. Confirme no primeiro deploy.

A API fica dentro do repositório do projeto integrado, na pasta `documentos/Entrega 2/POO/KFKA-POO`.

1. No [Render](https://render.com): **New → Web Service**, escolha o repositório `Projeto3` e o runtime **Docker**.
2. Em **Root Directory**, informe `documentos/Entrega 2/POO/KFKA-POO`. Assim o Render encontra o `Dockerfile` desta pasta.
3. Em **Environment**, defina `Jwt__Chave` (obrigatória).
4. Banco de dados: não precisa configurar nada. O SQLite fica dentro do container. No plano gratuito, os dados
   voltam aos dados de demonstração a cada novo deploy ou reinício, o que é suficiente para a apresentação.
5. Depois do deploy, acesse `https://<seu-servico>.onrender.com/swagger`. O health check fica em `/health`.

O `Dockerfile` não depende do Render e lê a porta da variável `$PORT`. Em princípio também deve servir para Railway,
Fly.io e Azure Container Apps, mas isso não foi testado.

## Uso de IA

Este projeto foi desenvolvido com auxílio do Claude (Anthropic), usado como apoio para tirar dúvidas, revisar
código e estruturar a API. Todo o código foi revisado, simplificado e compreendido por mim.
