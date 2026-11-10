# Entregas do PI - Projeto Collision

### **DECLARAÇÃO DE USO DE INTELIGÊNCIA ARTIFICIAL**

Este documento detalha o uso de Inteligência Artificial Generativa no desenvolvimento do Projeto Integrador Collision, em conformidade com o Guia da FECAP.

---

## Entrega 1

### Banco de Dados

| **Aluno(s) Responsável(veis)** | Felipe Rodrigues |
| :--- | :--- |
| **Ferramenta utilizada** | DeepSeek |
| **Versão/modelo** | DeepSeek Coder / DeepSeek Chat (V2/V3) |
| **Disciplina / Trabalho** | Banco de Dados - Entrega 1 (Modelagem, Tabelas e Índices) |
| **Finalidade de uso** | Estruturação do modelo relacional (14 tabelas), geração de scripts SQL base (Oracle e MySQL) e criação de índices com justificativas. |
| ***Prompts* principais utilizados** | 1. "Crie um modelo relacional completo para um sistema de acompanhamento escolar com 14 tabelas... Inclua chaves primárias, estrangeiras e cardinalidades."<br>2. "Converta este script SQL de Oracle para MySQL, mantendo todas as constraints, índices e comentários..."<br>3. "Crie 17 índices para otimizar as consultas do sistema, justificando cada um com base nos padrões de uso...""<br>4. "Gere um documento de justificativa de índices explicando cada índice criado e o ganho de performance esperado." |
| **Trechos ou entregas afetadas** | Scripts SQL (`schema.sql` e `indices.sql`), documento de justificativa de índices e estrutura das tabelas no banco de dados. |

### Desenvolvimento Web Full Stack

| **Aluno(s) Responsável(veis)** | Lucas Kazuo |
| :--- | :--- |
| **Ferramenta utilizada** | [A preencher pelo responsável] |
| **Versão/modelo** | [A preencher pelo responsável] |
| **Disciplina / Trabalho** | Desenvolvimento Web - Entrega 1 (API e Postman) |
| **Finalidade de uso** | Estruturação da API REST, criação de controllers, models e rotas, e configuração dos testes no Postman. |
| ***Prompts* principais utilizados** | [A preencher pelo responsável] |
| **Trechos ou entregas afetadas** | Arquivos da pasta `src/backend`, collection do Postman e documentação da API. |

### Programação Orientada a Objetos (POO)

| **Aluno(s) Responsável(veis)** | Guilherme Ryuki |
| :--- | :--- |
| **Ferramenta utilizada** | Codex - OpenAI |
| **Versão/modelo** | GPT 6.1 SOL  |
| **Disciplina / Trabalho** | POO - Entrega 1 (Classes em C#) |
| **Finalidade de uso** | Apoio na compreensão e aplicação de conceitos de POO, estruturação das classes conforme o modelo relacional do projeto, sugestão e revisão de trechos de código, implementação de validações e organização do fluxo de acompanhamento escolar. |
| ***Prompts* principais utilizados** | **Resumos dos principais pedidos, sem transcrição literal:**<br>1. Auxiliar na reconstrução das classes do sistema conforme o modelo relacional e os requisitos do PI.<br>2. Explicar e orientar a aplicação de herança entre `Usuario`, `Administrador`, `Professor` e `Responsavel`.<br>3. Explicar o encapsulamento e o uso de propriedades com `private set` para controlar alterações nos objetos.<br>4. Orientar a implementação dos cadastros e vínculos escolares, incluindo validações para evitar duplicidades e relações incompatíveis.<br>5. Auxiliar na implementação dos estados do acompanhamento: rascunho, enviado, em revisão e publicado.<br>6. Orientar a organização da classe `SistemaKFKA` para integrar cadastros, vínculos, registros, revisão, publicação e consulta.<br>7. Auxiliar na restrição da consulta dos responsáveis aos acompanhamentos publicados dos alunos vinculados.<br> |
| **Trechos ou entregas afetadas** | Classes de usuários e entidades escolares; classes AlunoResponsavel, VinculoProfessor e Acompanhamento; classe principal SistemaKFKA; validações de cadastros, vínculos e transições de estado. Código localizado em documentos/Entrega 1/POO/KFKASolution. |

### Estrutura de Dados

| **Aluno(s) Responsável(veis)** | Henrique Nunes |
| :--- | :--- |
| **Ferramenta utilizada** | Claude |
| **Versão/modelo** | Sonnet 5.5 |
| **Disciplina / Trabalho** | Estrutura de Dados - Entrega 1 (Paginação em C#) |
| **Finalidade de uso** | Auxílio na lógica de paginação e análise de complexidade. |
| ***Prompts* principais utilizados** | 1. Enviei um código C# próprio (classe `Aluno`, `List<Aluno>` e busca sequencial) e perguntei se ele já atendia à Entrega 1, mesmo com os dados inseridos direto no código, sem SQLite. <br> 3. Enviei as mensagens de erro de compilação (CS0234 e CS0246) e o erro de `project.assets.json` não encontrado, pedindo a causa e como corrigir. |
| **Trechos ou entregas afetadas** | `Aluno.cs`, `AlunoDB.cs`, `Program.cs` (paginação manual, menu e carga de dados fictícios). |

### Design de Interface Digital

| **Aluno(s) Responsável(veis)** | Débora Mayumi |
| :--- | :--- |
| **Ferramenta utilizada** | ChatGPT |
| **Versão/modelo** | GPT-6.1 Sol Médio |
| **Disciplina / Trabalho** | Design de Interface Digital - Entrega 1 (Layout e Guia de Estilo) |
| **Finalidade de uso** | Foi utilizado para analisar os requisitos da PI e os esboços das telas, gerar propostas visuais em imagem e padronizar a identidade visual do sistema. A ferramenta também foi usada para criar, ajustar telas iniciais no Figma e no Guia de Estilo. |
| ***Prompts* principais utilizados** | - Analise o pdf e as fotos enviadas de esboço para o meu projeto e faça 3 exemplos em imagens de como você faria as telas de ˜home, login, erro 404, fale conosco, página inicial de administrador, página inicial de responsável e página inicial de professor”, "⁠padronize todo o design do projeto e crie uma identidade visual para ser usada em cada perfil","⁠faça em cores claras e fáceis de visualizar" |
| **Trechos ou entregas afetadas** | Propostas para as telas de início, login, erro 404 e Fale Conosco, além das telas básicas de fluxos dos perfis de administrador, professor e responsável. Também afetou elementos da interface, como cores, ícones, botões, formulários e menus, Guia de Estilo e documentação de design. |

---

## Entrega 2

### Banco de Dados

| **Aluno(s) Responsável(veis)** | Felipe Rodrigues |
| :--- | :--- |
| **Ferramenta utilizada** | DeepSeek |
| **Versão/modelo** | DeepSeek Coder / DeepSeek Chat (V2/V3) |
| **Disciplina / Trabalho** | Banco de Dados - Entrega 2 (Views e Consultas) |
| **Finalidade de uso** | Criação de 5 Views SQL para relatórios, aplicação de regras de negócio (apenas registros publicados) e conversão de scripts Oracle para MySQL. |
| ***Prompts* principais utilizados** | 1. "Crie 5 Views SQL para relatórios: 1) relatório completo de acompanhamento, 2) apenas registros publicados, 3) relatório do responsável com status de ciência, 4) indicadores gerenciais por turma, 5) distribuição de tags..."<br>2. "Como aplicar a regra de negócio do responsável apenas ver registros publicados na View? Crie a View usando NVL/IFNULL para tratar o status de ciência."<br>3. "Escreva o script SQL completo com a criação das 5 Views para o banco de dados Collision, incluindo os comentários explicativos."<br>4. "Crie consultas de teste para validar as Views (relatório do pai, fila de revisão, indicadores do 1º bimestre) e mostre os resultados esperados."<br>5. "Converta o script das Views de Oracle para MySQL, ajustando as funções (LISTAGG para GROUP_CONCAT, NVL para IFNULL)." |
| **Trechos ou entregas afetadas** | Script `views.sql`, documento de justificativa das Views e queries de teste. |

### Desenvolvimento Web Full Stack

| **Aluno(s) Responsável(veis)** | Lucas Kazuo |
| :--- | :--- |
| **Ferramenta utilizada** | [A preencher pelo responsável] |
| **Versão/modelo** | [A preencher pelo responsável] |
| **Disciplina / Trabalho** | Desenvolvimento Web - Entrega 2 (Frontend integrado) |
| **Finalidade de uso** | Integração do frontend com a API e criação dos estados de UI. |
| ***Prompts* principais utilizados** | [A preencher pelo responsável] |
| **Trechos ou entregas afetadas** | Código do frontend e README com instruções de execução. |

### Programação Orientada a Objetos (POO)

| **Aluno(s) Responsável(veis)** | Guilherme Ryuki |
| :--- | :--- |
| **Ferramenta utilizada** | Claude Code(Anthropic) |
| **Versão/modelo** | Claude Opus 5.5 |
| **Disciplina / Trabalho** | POO - Entrega 2 (API em C# com banco de dados, Deploy e Documentação) |
| **Finalidade de uso** | Apoio na evolução das classes da Entrega 1 para uma API em C# com banco de dados, simplificação e revisão do código, correção de bugs e documentação das instruções de execução e deploy. |
| ***Prompts* principais utilizados** | **Resumos dos principais pedidos, sem transcrição literal:**<br>1. Analisar o enunciado da Entrega 2 e recomendar como fazê-la em C#, reaproveitando as classes da Entrega 1.<br>2. Simplificar o código para o meu nível de C#.<br>3. Analisar o projeto e corrigir os bugs encontrados.<br>4. Ajustar o README com as instruções de execução e deploy. |
| **Trechos ou entregas afetadas** | Projeto `KFKA-POO`: classes de domínio adaptadas da Entrega 1, serviços, controllers, banco de dados (`KfkaDbContext` e `DbSeeder`), autenticação JWT, `Dockerfile`, testes automatizados e `README.md` com instruções de execução e deploy. Código localizado em documentos/Entrega 2/POO/KFKA-POO. |

### Design de Interface Digital

| **Aluno(s) Responsável(veis)** | Débora Mayumi |
| :--- | :--- |
| **Ferramenta utilizada** | ChatGPT |
| **Versão/modelo** | GPT-6.1 Sol Médio |
| **Disciplina / Trabalho** | Design de Interface Digital - Entrega 2 (Protótipo Navegável) |
| **Finalidade de uso** | Estruturação do protótipo navegável e Design System. Também foi usada para criar e ajustar telas no Figma e conectar e revisar os fluxos de navegação do protótipo. |
| ***Prompts* principais utilizados** | “agora confira novamente o pdf e veja se não ficou faltando nenhuma tela ou caminho de navegação”, “corrija as pendências e conecte os fluxos no figma, mantendo o visual e os ícones aprovados, e se necessario faça alterações”, “agora preciso que vc verifique se o prototipo da home esta certinho, faça alterações se necessario mas não crie nenhuma tela adicional sem aprovação” |
| **Trechos ou entregas afetadas** | A criação e a correção de acompanhamentos pelo professor, a revisão e a publicação pela administração e a consulta de relatórios e pendências pelo responsável e as conexões entre essas telas. |

### Estrutura de Dados

| **Aluno(s) Responsável(veis)** | Henrique Nunes |
| :--- | :--- |
| **Ferramenta utilizada** | Claude |
| **Versão/modelo** | Claude 3.5 Sonnet |
| **Disciplina / Trabalho** | Estrutura de Dados - Entrega 2 (Mini-relatório) |
| **Finalidade de uso** | Auxílio na análise de complexidade, mapeamento de estruturas de dados (vetores, listas, tabelas hash), documentação de boas práticas e geração do mini-relatório técnico. |
| ***Prompts* principais utilizados** | 1. "Percorra todo o código e identifique os arquivos e pastas que contêm: vetores, listas, percorrimento de listas, Notação Big-O (O(1), O(log n), O(n), O(n log n), O(n²)), Pilhas e Tabela Hash."<br>2. "Explique detalhadamente o que tem em cada pasta e mostre os trechos dos códigos encontrados."<br>3. "Antes de fazer o documento, faça a estruturação da árvore de pastas de onde cada código foi tirado, mostre o trecho do código, explique o que ele faz no sistema, a Big-O utilizada, e deixe o código comentado com boas práticas."<br>4. "Agora faça o documento detalhando as explicações com base em boas práticas de estrutura de dados."
| **Trechos ou entregas afetadas** | Mini-relatório de complexidade (arquivo PDF) e documentação técnica das estruturas de dados do Backend e Frontend. |

***Declaro que o uso acima descrito está em conformidade com o GUIA PARA O USO RESPONSÁVEL DE INTELIGÊNCIA ARTIFICIAL NA FECAP e que o conteúdo final é de minha plena responsabilidade autoral.***

**Integrantes do grupo:**
- Débora Mayumi
- Felipe Rodrigues
- Guilherme Ryuki
- Henrique Nunes
- Lucas Kazuo

