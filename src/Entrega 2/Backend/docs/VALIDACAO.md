# Validação do backend — 07/11/2026

O backend foi validado com Node.js 24 e MySQL 8.4.7 local. O banco de testes é
isolado dos bancos existentes no computador e do banco de demonstração.

## Resultado

- `npm.cmd run test:mysql`: 36 testes aprovados, sem falhas ou testes ignorados.
- `npm.cmd run check`: verificação de sintaxe aprovada.
- Oxlint executado sobre `src`, `scripts` e `testes`: sem problemas reportados.
- Auditoria das dependências após as atualizações: nenhuma vulnerabilidade reportada.
- API local: `GET /api/saude` respondeu com `status: ok` e `banco: conectado`.
- Reinício do modo local: banco e seis contas demonstrativas preservados; login
  conferido novamente e sessão de verificação encerrada.

Os 36 testes incluem testes de unidade, integração e os agrupamentos contabilizados
pelo executor nativo do Node. Executar somente `npm.cmd test` sem banco configurado
ignora os grupos de integração; esse comando sozinho não reproduz a validação completa.

## Comportamentos exercitados

- Login, proteção de senha, logout, recuperação de uso único e revogação de sessões.
- Permissões por perfil, manutenção de pelo menos um administrador ativo e
  restrição dos responsáveis aos próprios alunos.
- Cadastros, matrículas, transferência de turma e preservação do histórico escolar.
- Rascunho, envio, revisão, devolução, correção, publicação e controle dos prazos.
- Concorrência: duas publicações simultâneas produzem um sucesso e um conflito.
- Transações: uma falha deliberada na auditoria desfaz a alteração correspondente.
- Ciência independente de dois responsáveis e isolamento das suas observações.
- Indicadores sem duplicação por múltiplas tags ou responsáveis.
- Consultas e exportações autorizadas de acompanhamentos publicados.
- Datas na virada do ano e limites de abertura e encerramento dos bimestres.

## Documentos gerados

O PDF foi extraído e inspecionado visualmente, incluindo um relatório longo de três
páginas. Foram conferidos acentos, texto completo, margens e paginação. O XLSX foi
aberto como arquivo ZIP e seus XMLs foram analisados para conferir estrutura e dados.
Essas verificações não equivalem a um teste manual no aplicativo Microsoft Excel.

## Integração com React

A suíte de MySQL foi executada novamente após a integração e aprovou 36 testes.
O navegador confirmou as três contas iniciais, o redirecionamento por perfil,
a restauração da sessão após atualizar e o retorno ao login após revogação.

Um acompanhamento fictício identificado como registro de validação foi criado
pela professora, revisado e publicado pela administração. O responsável só
conseguiu consultar depois da publicação. Foram verificados a confirmação de
leitura após atualizar, o envio de observação, o retorno para a professora e o
arquivo PDF retornado pela API.

## Limites da validação

- O envio externo por SMTP não foi validado. O modo local grava as mensagens de
  recuperação em arquivos privados dentro de `.local/emails`.
- Não houve publicação em servidor remoto nem migração dos bancos acadêmicos existentes.
- Os dados e credenciais em `.local` são privados, ignorados pelo Git e destinados
  ao desenvolvimento. As verificações não substituem configuração de produção,
  backups e verificação no ambiente de produção.

Consulte [o README](../README.md) para iniciar o servidor e repetir os testes,
e [requisicoes.http](./requisicoes.http) para exercitar as rotas.
