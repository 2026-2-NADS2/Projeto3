# KFKA — Frontend

Plataforma de acompanhamento escolar desenvolvida com React/JSX e Vite.
A organização usa a aula do professor como referência, com separação entre
páginas, componentes, hooks, serviços, dados, utilitários e CSS.

## Como executar

```sh
npm install
npm run dev
```

Outros comandos: `npm run build`, `npm run preview`, `npm run lint`,
`npm run format:check` e `npm run format`.
O build gera a pasta `dist`. Dependências e arquivos gerados não são versionados.

## Telas e navegação

| Endereço | Tela |
| --- | --- |
| `/` ou `/index.html` | Home |
| `/login.html` | Login |
| `/dashboard.html` | Dashboard |
| `/fale-conosco` | Fale conosco |
| Endereço inexistente | Página 404 |

Os arquivos HTML da raiz são entradas pequenas que carregam `src/main.jsx`.
O React monta as telas; `App.jsx` disponibiliza o BrowserRouter e `Rotas.jsx`
define qual página aparece em cada endereço.

## O que foi adicionado e atualizado

- Home componentizada, com apresentação, recursos, notícias e navegação.
- Dashboard única para Administrador, Professor e Responsável, reaproveitando
  cabeçalho, menu, indicadores e painéis, com conteúdo conforme o perfil.
- Menu para celular, troca de perfil de demonstração e notificações de exemplo.
- Consulta assíncrona mockada, com estados de carregamento, sucesso e erro,
  além de botão para tentar novamente.
- Validação do login, com mensagens para campos vazios e senha curta.
- Ajustes de responsividade na Home, no Login e na dashboard.
- Página Fale conosco com formulário e confirmação local de validação.
- Links do cabeçalho retornam às seções da Home, inclusive na tela de contato.
- Página 404 reutilizada em rotas inexistentes e áreas ainda não implementadas.
- CSS organizado na pasta `src/css`, imagens separadas e scripts de lint,
  build e formatação.

## Testar a consulta assíncrona

Abra `/dashboard.html`: o carregamento aparece antes dos dados de demonstração.
Para simular uma falha, abra `/dashboard.html?simularErro=1`.
Enquanto esse parâmetro estiver no endereço, a tentativa continuará falhando.
Remova o parâmetro para voltar ao cenário de sucesso.
A consulta usa Promise e dados locais, sem conexão com uma API HTTP.

## Organização das pastas

```text
frontend/
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── vite.config.js
├── index.html
├── login.html
├── dashboard.html
├── public/
│   └── img/dashboard/
│       ├── admin/
│       ├── professor/
│       └── responsavel/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── Rotas.jsx
    ├── assets/img/
    ├── componentes/
    │   ├── Cabecalho.jsx
    │   ├── Rodape.jsx
    │   ├── home/
    │   │   ├── Noticias.jsx
    │   │   └── Recursos.jsx
    │   └── dashboard/
    │       ├── CabecalhoDashboard.jsx
    │       ├── CartaoIndicador.jsx
    │       ├── ConteudoAdmin.jsx
    │       ├── ConteudoProfessor.jsx
    │       ├── ConteudoResponsavel.jsx
    │       ├── MenuLateral.jsx
    │       ├── MenuPerfil.jsx
    │       ├── NotificacoesDashboard.jsx
    │       ├── PainelDashboard.jsx
    │       └── Saudacao.jsx
    ├── css/
    │   ├── style.css
    │   ├── dashboard.css
    │   ├── erro404.css
    │   └── faleconosco.css
    ├── data/
    │   ├── dadosAdmin.js
    │   ├── dadosDashboard.js
    │   ├── dadosProfessor.js
    │   ├── dadosResponsavel.js
    │   └── usuariosMock.js
    ├── hooks/
    │   ├── useDashboard.js
    │   └── useTituloPagina.js
    ├── paginas/
    │   ├── Dashboard.jsx
    │   ├── Home.jsx
    │   ├── login.jsx
    │   ├── FaleConosco.jsx
    │   └── NaoEncontrada.jsx
    ├── servicos/
    │   └── servicoUsuario.js
    └── utilitarios/
        └── nomes.js
```

`paginas` reúne as telas; `componentes` guarda partes visuais reutilizáveis.
`hooks` concentra estados e efeitos; `servicos` concentra o acesso aos dados.
`data` contém os exemplos e `utilitarios` contém funções compartilhadas.
`style.css` atende aos estilos globais, Home e Login; os outros CSS atendem
às respectivas telas. Imagens importadas ficam em `src/assets/img` e imagens
acessadas por URL ficam em `public/img/dashboard`.

## Limitações atuais

O login não autentica credenciais reais. A troca de perfil é local e retorna
para professor ao recarregar a página. Algumas ações e seções ainda estão
pendentes. O formulário de contato apenas valida e mostra uma mensagem;
não envia nem salva os dados. A integração com backend será feita depois.

## Versionamento

Versionar código, imagens, configurações, README e `package-lock.json`.
`node_modules/`, `dist/`, arquivos de ambiente e logs ficam fora do Git,
conforme o `.gitignore`. O arquivo `login.jsx` mantém a grafia usada no import.

