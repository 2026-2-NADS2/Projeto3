# FECAP - Fundação de Comércio Álvares Penteado

<p align="center">
<a href= "https://www.fecap.br/"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP - Fundação de Comércio Álvares Penteado" border="0"></a>
</p>

# Projeto Interdisciplinar: Website Responsivo

Para executar a entrega Fullstack no Windows, consulte o
[passo a passo para iniciar o sistema](<src/Entrega 2/README.md>).

## Nome do Grupo: Collision

## Integrantes: <a href="https://github.com/DMayumi">Débora Mayumi</a>, <a href="https://github.com/felipenono">Felipe Rodrigues</a>, <a href="www.linkedin.com/in/guiryuki">Guilherme Ryuki</a>, <a href="https://github.com/HenriqueNunes-2008">Henrique Nunes</a>, <a href="https://github.com/LucasKazuo-lol">Lucas Kazuo</a>

## Professores Orientadores: <a href="https://www.linkedin.com/in/adriano-valente/">Adriano Valente</a>, <a href="https://www.linkedin.com/in/eduardo-savino/">Eduardo Savino</a>, <a href="https://www.linkedin.com/in/francisco-escobar/">Francisco (Chico) Escobar</a>, <a href="https://www.linkedin.com/in/jbuesso/">José Buesso</a>, <a href="https://www.linkedin.com/in/ronaldo-araujo-pinto-3542811a/">Ronaldo Araújo</a>

## Descrição


<img width="1024" height="572" alt="image" src="https://github.com/user-attachments/assets/b3d0c30c-9f01-45b9-910c-dd1722797fc3" />



Desenvolvimento de uma plataforma web responsiva de acompanhamento escolar, voltada para escolas de Ensino Fundamental. O objetivo é facilitar a comunicação entre professores, administração escolar e pais ou responsáveis, reunindo em um único sistema as informações sobre o desempenho acadêmico dos alunos ao longo dos bimestres.
<br><br>
Na plataforma, os professores poderão registrar descrições de acompanhamento, médias e tags de cada aluno. Esses registros serão enviados para revisão da administração da escola antes de serem publicados. Depois da aprovação, os responsáveis poderão consultar os relatórios dos alunos vinculados a eles e também gerar o acompanhamento em PDF, tornando o processo mais organizado, seguro e acessível.
<br><br>

## 🛠 Estrutura de pastas
```
kfka-projeto
│
├── documentos
│   ├── Entrega 1
│   │   ├── Banco de Dados
│   │   ├── Desenvolvimento Web Fullstack
│   │   ├── Design de Interface Digital
│   │   ├── Estrutura de Dados
│   │   └── Programação Orientada a Objetos
│   │
│   └── Entrega 2
│       ├── Banco de Dados
│       ├── Desenvolvimento Web Fullstack
│       ├── Design de Interface Digital
│       ├── Estrutura de Dados
│       └── Programação Orientada a Objetos
│
├── imagens
│   └── Logo
│
└── src
    ├── Entrega 1
    │   ├── Backend
    │   └── Frontend
    │
    └── Entrega 2
        ├── Backend
        └── Frontend
```

---

## 🧰 Principais ferramentas

### Interface

| Logo | Ferramenta | Uso no projeto |
| :---: | :--- | :--- |
| <img src="https://cdn.simpleicons.org/react/61DAFB" width="40" height="40" alt="React"> | **React 19** | Telas e componentes escritos em JSX |
| <img src="https://cdn.simpleicons.org/reactrouter/CA4245" width="40" height="40" alt="React Router"> | **React Router 7** | Rotas e navegação entre as telas |
| <img src="https://cdn.simpleicons.org/javascript/F7DF1E" width="40" height="40" alt="JavaScript"> | **JavaScript** | Linguagem de toda a lógica (hooks, serviços, dados) |
| <img src="https://cdn.simpleicons.org/html5/E34F26" width="40" height="40" alt="HTML5"> | **HTML5** | Arquivos de entrada `index.html`, `login.html` e `dashboard.html` |
| <img width="40" height="40" alt="image" src="https://github.com/user-attachments/assets/742f1588-3dcf-4bc6-9953-9c64cc8b8362" /> | **CSS** | Estilos de cada tela, com variáveis de cor e container queries |

### Build, qualidade e testes

| Logo | Ferramenta | Uso no projeto |
| :---: | :--- | :--- |
| <img src="https://cdn.simpleicons.org/vite/646CFF" width="40" height="40" alt="Vite"> | **Vite 8** | Servidor local com recarga automática e build de produção |
| <img src="https://cdn.simpleicons.org/oxc/4A4A55" width="40" height="40" alt="Oxc"> | **Oxlint** | Lint do código em `src` (`npm run lint`) |
| <img src="https://cdn.simpleicons.org/prettier/F7B93E" width="40" height="40" alt="Prettier"> | **Prettier** | Padronização da formatação (`npm run format`) |
| <img src="https://cdn.simpleicons.org/nodedotjs/5FA04E" width="40" height="40" alt="Node.js"> | **Node.js** | Executa o Vite e a suíte de testes nativa (`npm test`) |
| <img src="https://cdn.simpleicons.org/npm/CB3837" width="40" height="40" alt="npm"> | **npm** | Instala as dependências e roda os scripts do `package.json` |

### Design e versionamento

| Logo | Ferramenta | Uso no projeto |
| :---: | :--- | :--- |
| <img src="https://cdn.simpleicons.org/figma/F24E1E" width="40" height="40" alt="Figma"> | **Figma** | Protótipo e referência visual das telas (projeto Collision-PI) |
| <img src="https://cdn.simpleicons.org/git/F05032" width="40" height="40" alt="Git"> | **Git** | Controle de versão do código |
| <img width="40" height="40" alt="image" src="https://github.com/user-attachments/assets/5bf23f4a-11a3-4bac-ad84-da8416440339" /> | **VS Code** | Editor de código utilizado para o desenvolvimento |

> *Os logos pertencem aos respectivos proprietários. Os desenhos usados aqui vêm do [Simple Icons](https://simpleicons.org/) (domínio público, CC0) e são carregados via CDN para garantir a visualização em qualquer tema.*

---

## 🚀 Como executar o projeto

O projeto está dividido em duas pastas dentro de `src/Entrega 2/`. Para que o sistema funcione completamente, **você precisa rodar o Backend e o Frontend em terminais separados**.

### Pré-requisitos

| Ferramenta | Versão | Para quê |
| :--- | :--- | :--- |
| **Node.js** | `^20.19.0` ou `>=22.12.0` (LTS atual) | Exigência do Vite 8 e do oxlint |
| **npm** | Vem junto com o Node.js | Instalar dependências e rodar os scripts |
| **Git** | Qualquer versão recente | Clonar o repositório (opcional se recebeu `.zip`) |
| **Navegador** | Chrome/Edge 105+, Firefox 110+ ou Safari 16+ | O CSS usa container queries (`@container`) |

---

## 🛠 Instalação e Configuração (Windows)

Siga os passos abaixo para baixar o projeto e preparar o ambiente no Windows.

### 1. Instalar pré-requisitos
Abra o **PowerShell** e instale o Node.js (versão LTS) e o Git:
```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
````
Feche e abra o terminal novamente após a instalação.

Verifique se as ferramentas foram instaladas corretamente:

````
node -v
npm -v
git --version
````
###  Clonar o repositório

````
git clone https://github.com/2026-2-NADS2/Projeto3.git
````
Entre na pasta que foi criada:
```
cd Projeto3
````

###  Executando o Backend

Abra o terminal e navegue até a pasta do Backend:

```sh
cd "src/Entrega 2/Backend"
npm install
npm run dev
```
###  Executando o Frontend
Abra outro terminal (deixe o do Backend rodando) e navegue até a pasta do Frontend:
````sh
cd "src/Entrega 2/Frontend"
npm install
npm run dev
O Vite iniciará o servidor local do Frontend (geralmente na porta 5173). Abra o link exibido no terminal no seu navegador.
`````

## 📋 Licença/License
<a href="https://github.com/2026-2-NADS2/Projeto3"><font dir="auto" style="vertical-align: inherit;"><font dir="auto" style="vertical-align: inherit;">Colisão</font></font></a><font dir="auto" style="vertical-align: inherit;"><font dir="auto" style="vertical-align: inherit;"> © 2026 por </font></font><a href="https://github.com/2026-2-NADS2/Projeto3"><font dir="auto" style="vertical-align: inherit;"><font dir="auto" style="vertical-align: inherit;">Débora, Felipe, Guilherme, Henrique, Lucas</font></font></a><font dir="auto" style="vertical-align: inherit;"><font dir="auto" style="vertical-align: inherit;"> está licenciado sob </font></font><a href="https://creativecommons.org/licenses/by/4.0/"><font dir="auto" style="vertical-align: inherit;"><font dir="auto" style="vertical-align: inherit;">CC BY 4.0</font></font></a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">

---

## 📚 Referências e Documentação de Apoio

Abaixo estão listadas as principais fontes de consulta, documentações oficiais e normativas utilizadas para o desenvolvimento e fundamentação deste projeto.

### 📜 Documentos Institucionais e Normativos
*   **FECAP.** *Guia para o Uso Responsável de Inteligência Artificial na FECAP*. Versão 2.0, 2026. [Acessar PDF](https://www.fecap.br/wp-content/uploads/2026/08/Guia-para-o-Uso-Responsavel-de-IA-na-FECAP.pdf)
*   **BRASIL.** *Lei Geral de Proteção de Dados Pessoais (LGPD)*. Lei nº 13.709, de 14 de agosto de 2018. [Acessar Lei](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
*   **ORGANIZAÇÃO DAS NAÇÕES UNIDAS (ONU).** *Objetivos de Desenvolvimento Sustentável (ODS)*. [Acessar ODS 4](https://brasil.un.org/pt-br/sdgs/4)

### 💻 Documentações Oficiais das Tecnologias
*   **React:** [Documentação Oficial](https://react.dev/)
*   **Vite:** [Documentação Oficial](https://vitejs.dev/)
*   **React Router:** [Documentação Oficial](https://reactrouter.com/)
*   **Node.js:** [Documentação Oficial](https://nodejs.org/en/docs)
*   **Express:** [Documentação Oficial](https://expressjs.com/)
*   **Oracle Database:** [Documentação Oficial](https://docs.oracle.com/en/database/)
*   **MySQL:** [Documentação Oficial](https://dev.mysql.com/doc/)

### 🎨 Ferramentas de Design e Apoio
*   **Figma:** [Central de Ajuda](https://help.figma.com/)
*   **Simple Icons:** [Biblioteca de ícones utilizada neste README](https://simpleicons.org/)
*   **Prettier:** [Documentação Oficial](https://prettier.io/docs/en/)
*   **Oxlint:** [Documentação Oficial](https://oxc-project.github.io/)
