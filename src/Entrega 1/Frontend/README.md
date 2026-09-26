# KFKA — Frontend

Interface em React/JSX e Vite para acompanhamento escolar. A organização segue
a referência da Aula08: `componentes`, `paginas`, `servicos`, `utilitarios` e `data`.
A pasta `css` foi mantida conforme a organização adotada neste projeto.

## Executar e verificar

- `npm install`: instala as dependências.
- `npm run dev`: inicia o servidor local.
- `npm run build`: gera o site na pasta `dist`.
- `npm run lint`: procura problemas no código, com o Oxlint usado na Aula08.
- `npm run format`: formata o projeto com dois espaços e aspas duplas.
- `npm run format:check`: verifica a formatação sem alterar arquivos.

Acesse `/`, `/login.html` ou `/dashboard.html`. Os três HTMLs são entradas
pequenas do Vite e apontam para `src/main.jsx`.

## Responsabilidades

- `main.jsx`: conecta o React ao elemento `root` e importa o CSS global.
- `App.jsx`: disponibiliza o BrowserRouter para a aplicação.
- `Rotas.jsx`: associa os endereços às páginas e trata endereços inexistentes.
- `paginas`: reúne os componentes que formam cada tela.
- `componentes`: contém partes visuais reutilizáveis; `dashboard` e `home`
  agrupam componentes específicos dessas áreas.
- `hooks`: guarda lógica de estado e efeitos reutilizáveis. `useDashboard`
  controla a seção, o menu móvel e a troca de perfil; `useTituloPagina`
  atualiza o título da aba.
- `servicos`: concentra acesso a dados. `servicoUsuario` ainda lê os usuários
  locais de demonstração. As chamadas HTTP futuras devem ficar nesta camada.
- `data`: configurações e dados de exemplo, sem JSX.
- `utilitarios`: funções sem estado ou efeitos, como obter iniciais de nomes.
- `css`: `style.css` contém estilos globais/Home/Login, `dashboard.css`
  estiliza a dashboard e `erro404.css` estiliza a tela de página não encontrada.
- `assets/img`: imagens importadas pelos componentes e processadas pelo Vite.
- `public/img/dashboard`: imagens acessadas por URLs como
  `/img/dashboard/professor/imgSidebarInicio.png`.

## Convenções

Componentes e páginas usam PascalCase e `.jsx` (`MenuPerfil.jsx`, `Home.jsx`).
Funções, hooks e arquivos sem JSX usam camelCase e `.js` (`useDashboard.js`,
`servicoUsuario.js`). Use imports com a extensão do arquivo. Classes CSS
continuam em kebab-case e as da dashboard mantêm o prefixo `dash-`.
Comentários devem explicar decisões que o código não deixa claras.

A dashboard é única. O hook seleciona o usuário; a página escolhe os dados
e o conteúdo do perfil e reaproveita cabeçalho, menu e indicadores.

## O que já está implementado

- Home em React com cabeçalho, apresentação do sistema, recursos, notícias,
  acompanhamento escolar e contato.
- Login com campos obrigatórios e navegação para a dashboard; ainda é uma
  demonstração, sem autenticação real.
- Rotas para Home, Login e Dashboard, além de uma rota curinga para endereços
  inexistentes.
- Dashboard única com seleção local dos perfis Administrador, Professor e
  Responsável, dados de demonstração e conteúdo específico de cada perfil.
- Navegação de seções, menu responsivo, notificações de exemplo e atualização
  do título da aba.
- Tela 404 em JSX, reutilizada também nas seções da dashboard que ainda não
  foram construídas.
- Estilos separados em CSS global, dashboard e erro 404; imagens mantidas em
  `src/assets/img` e `public/img/dashboard`.
- Scripts de desenvolvimento, build, lint e formatação configurados no
  `package.json`.

## Limitações atuais

O login e a troca de perfil são demonstrações locais: não validam credenciais
nem concedem permissões reais. Ao atualizar a página, o perfil volta para
professor. As áreas do menu ainda não implementadas mostram a tela 404
provisória. A autorização real deverá ser validada pelo backend.

Versione o código, as configurações, as imagens e `package-lock.json`.
`node_modules` e `dist` são gerados e estão no `.gitignore`.

## Árvore de pastas

```text
frontend/
├── .gitignore
├── index.html
├── login.html
├── dashboard.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
├── erro404.html                 (arquivo anterior preservado)
├── teste-react.html             (arquivo anterior preservado)
├── css/                         (CSS anterior preservado)
├── img/                         (13 imagens anteriores preservadas)
├── public/
│   └── img/
│       └── dashboard/
│           ├── admin/             (21 imagens)
│           ├── professor/         (17 imagens)
│           └── responsavel/       (20 imagens)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── Rotas.jsx
    ├── assets/
    │   └── img/                  (12 PNGs e erro404.svg)
    ├── components/
    │   └── Saudacao.jsx          (componente anterior preservado)
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
    │   ├── dashboard.css
    │   ├── erro404.css
    │   └── style.css
    ├── data/
    │   ├── dadosAdmin.js
    │   ├── dadosDashboard.js
    │   ├── dadosProfessor.js
    │   ├── dadosResponsavel.js
    │   ├── usuariosMock.js
    │   └── usuarioMock.js        (dados anteriores preservados)
    ├── hooks/
    │   ├── useDashboard.js
    │   └── useTituloPagina.js
    ├── paginas/
    │   ├── Dashboard.jsx
    │   ├── Home.jsx
    │   ├── login.jsx
    │   └── NaoEncontrada.jsx
    ├── servicos/
    │   └── servicoUsuario.js
    └── utilitarios/
        └── nomes.js
```

`node_modules/` é gerada pelo `npm install`. `dist/` é gerada pelo `npm run build`
e não está presente agora; as duas ficam fora da árvore principal.

O arquivo `src/paginas/login.jsx` é importado com a mesma grafia em `Rotas.jsx`.




