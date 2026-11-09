# Collision — frontend

O frontend React/Vite acessa a API Express por meio de `VITE_API_URL`. Veja o [passo a passo para iniciar o sistema](../README.md).

- `src/servicos/api.js` envia requisições, acrescenta o token Bearer e transforma erros HTTP em mensagens para as telas.
- `src/hooks/useSessao.jsx` mantém o login e valida a sessão ao atualizar a página.
- `src/hooks/useDadosEscolares.jsx` consulta e atualiza os cadastros, vínculos e bimestres.
- `src/hooks/useFluxoAdmin.jsx` consulta os acompanhamentos e usa a API para registrar revisão, publicação, ciência e observações.
- `src/paginas/Administracao.jsx` e `src/paginas/Jornadas.jsx` montam as áreas de cada perfil.

## Comandos

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev -- --host localhost --port 5173 --strictPort
npm.cmd run lint
npm.cmd run build
```

Copie o arquivo de ambiente somente na primeira configuração. No modo local integrado, `VITE_API_URL` aponta para `http://127.0.0.1:3334/api`.

As contas são cadastradas pela administração. O formulário público de contato está disponível para preenchimento e validação local. A recuperação de acesso usa a API, que grava a mensagem em `Backend/.local/emails` no modo local.
