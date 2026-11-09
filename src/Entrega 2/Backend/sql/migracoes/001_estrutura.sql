-- Estrutura da API Fullstack para um banco NOVO. O SQL academico original e preservado.
-- Datas com horario sao UTC. InnoDB garante transacoes e chaves estrangeiras.

CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    cargo VARCHAR(50),
    telefone VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro DATETIME(3) NOT NULL,
    data_atualizacao DATETIME(3) NOT NULL,
    CHECK (perfil IN ('ADMINISTRADOR', 'PROFESSOR', 'RESPONSAVEL'))
) ENGINE = InnoDB;

CREATE TABLE PROFESSOR (
    id_professor INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario)
) ENGINE = InnoDB;

CREATE TABLE RESPONSAVEL (
    id_responsavel INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    cpf VARCHAR(11) UNIQUE,
    FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario)
) ENGINE = InnoDB;

CREATE TABLE AREA_DISCIPLINA (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao VARCHAR(1000),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;

CREATE TABLE DISCIPLINA (
    id_disciplina INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    id_area INT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (nome, id_area),
    FOREIGN KEY (id_area) REFERENCES AREA_DISCIPLINA (id_area)
) ENGINE = InnoDB;

CREATE TABLE TURMA (
    id_turma INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    ano_letivo INT NOT NULL,
    serie VARCHAR(50),
    turno VARCHAR(30),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (nome, ano_letivo),
    CHECK (ano_letivo BETWEEN 2000 AND 2100)
) ENGINE = InnoDB;

CREATE TABLE ALUNO (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;

CREATE TABLE MATRICULA_TURMA (
    id_matricula_turma INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    id_turma INT NOT NULL,
    inicio_em DATETIME(3) NOT NULL,
    fim_em DATETIME(3),
    FOREIGN KEY (id_aluno) REFERENCES ALUNO (id_aluno),
    FOREIGN KEY (id_turma) REFERENCES TURMA (id_turma),
    CHECK (fim_em IS NULL OR fim_em >= inicio_em),
    INDEX idx_matricula_aluno (id_aluno, fim_em)
) ENGINE = InnoDB;

CREATE TABLE ALUNO_RESPONSAVEL (
    id_aluno INT NOT NULL,
    id_responsavel INT NOT NULL,
    parentesco VARCHAR(30) NOT NULL,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro DATETIME(3) NOT NULL,
    PRIMARY KEY (id_aluno, id_responsavel),
    FOREIGN KEY (id_aluno) REFERENCES ALUNO (id_aluno),
    FOREIGN KEY (id_responsavel) REFERENCES RESPONSAVEL (id_responsavel),
    INDEX idx_responsavel_alunos (id_responsavel, ativo)
) ENGINE = InnoDB;

CREATE TABLE VINCULO_PROFESSOR (
    id_vinculo INT AUTO_INCREMENT PRIMARY KEY,
    id_professor INT NOT NULL,
    id_turma INT NOT NULL,
    id_disciplina INT NOT NULL,
    ano_letivo INT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_professor) REFERENCES PROFESSOR (id_professor),
    FOREIGN KEY (id_turma) REFERENCES TURMA (id_turma),
    FOREIGN KEY (id_disciplina) REFERENCES DISCIPLINA (id_disciplina),
    UNIQUE (id_professor, id_turma, id_disciplina, ano_letivo)
) ENGINE = InnoDB;

CREATE TABLE BIMESTRE (
    id_bimestre INT AUTO_INCREMENT PRIMARY KEY,
    numero TINYINT NOT NULL,
    ano_letivo INT NOT NULL,
    dt_abertura DATETIME(3) NOT NULL,
    dt_encerramento DATETIME(3) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (numero, ano_letivo),
    CHECK (numero BETWEEN 1 AND 4),
    CHECK (dt_encerramento > dt_abertura),
    CHECK (ano_letivo BETWEEN 2000 AND 2100)
) ENGINE = InnoDB;

CREATE TABLE TAG (
    id_tag INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    cor VARCHAR(7) NOT NULL DEFAULT '#246BC0',
    descricao VARCHAR(1000),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;

CREATE TABLE ACOMPANHAMENTO (
    id_acompanhamento INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    id_matricula_turma INT NOT NULL,
    id_vinculo INT NOT NULL,
    id_bimestre INT NOT NULL,
    descricao TEXT,
    estrategias TEXT,
    ajuda_familia TEXT,
    media DECIMAL(4, 2),
    status VARCHAR(25) NOT NULL DEFAULT 'RASCUNHO',
    motivo_devolucao VARCHAR(2000),
    id_revisor INT,
    publicado_em DATETIME(3),
    versao INT NOT NULL DEFAULT 1,
    data_criacao DATETIME(3) NOT NULL,
    data_atualizacao DATETIME(3) NOT NULL,
    FOREIGN KEY (id_aluno) REFERENCES ALUNO (id_aluno),
    FOREIGN KEY (id_matricula_turma) REFERENCES MATRICULA_TURMA (id_matricula_turma),
    FOREIGN KEY (id_vinculo) REFERENCES VINCULO_PROFESSOR (id_vinculo),
    FOREIGN KEY (id_bimestre) REFERENCES BIMESTRE (id_bimestre),
    FOREIGN KEY (id_revisor) REFERENCES USUARIO (id_usuario),
    UNIQUE (id_aluno, id_vinculo, id_bimestre),
    CHECK (media IS NULL OR media BETWEEN 0 AND 10),
    CHECK (status IN ('RASCUNHO', 'ENVIADO_PARA_REVISAO', 'EM_REVISAO', 'DEVOLVIDO', 'PUBLICADO', 'CANCELADO')),
    INDEX idx_acompanhamento_status (status, id_bimestre),
    INDEX idx_acompanhamento_aluno (id_aluno, id_bimestre)
) ENGINE = InnoDB;

CREATE TABLE ACOMPANHAMENTO_TAG (
    id_acompanhamento INT NOT NULL,
    id_tag INT NOT NULL,
    PRIMARY KEY (id_acompanhamento, id_tag),
    FOREIGN KEY (id_acompanhamento) REFERENCES ACOMPANHAMENTO (id_acompanhamento),
    FOREIGN KEY (id_tag) REFERENCES TAG (id_tag)
) ENGINE = InnoDB;

CREATE TABLE HISTORICO_AUDITORIA (
    id_historico BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_acompanhamento INT,
    id_usuario_acao INT NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    entidade_id VARCHAR(100) NOT NULL,
    acao VARCHAR(50) NOT NULL,
    antes_json JSON,
    depois_json JSON,
    observacao VARCHAR(2000),
    dt_alteracao DATETIME(3) NOT NULL,
    FOREIGN KEY (id_acompanhamento) REFERENCES ACOMPANHAMENTO (id_acompanhamento),
    FOREIGN KEY (id_usuario_acao) REFERENCES USUARIO (id_usuario),
    INDEX idx_auditoria_registro (id_acompanhamento, dt_alteracao),
    INDEX idx_auditoria_data (dt_alteracao)
) ENGINE = InnoDB;

CREATE TABLE RETORNO_RESPONSAVEL (
    id_retorno INT AUTO_INCREMENT PRIMARY KEY,
    id_acompanhamento INT NOT NULL,
    id_responsavel INT NOT NULL,
    dt_ciencia DATETIME(3) NOT NULL,
    UNIQUE (id_acompanhamento, id_responsavel),
    FOREIGN KEY (id_acompanhamento) REFERENCES ACOMPANHAMENTO (id_acompanhamento),
    FOREIGN KEY (id_responsavel) REFERENCES RESPONSAVEL (id_responsavel)
) ENGINE = InnoDB;

CREATE TABLE OBSERVACAO_RESPONSAVEL (
    id_observacao INT AUTO_INCREMENT PRIMARY KEY,
    id_retorno INT NOT NULL,
    texto VARCHAR(2000) NOT NULL,
    criado_em DATETIME(3) NOT NULL,
    FOREIGN KEY (id_retorno) REFERENCES RETORNO_RESPONSAVEL (id_retorno)
) ENGINE = InnoDB;

CREATE TABLE SESSAO (
    id_sessao CHAR(36) PRIMARY KEY,
    id_usuario INT NOT NULL,
    criada_em DATETIME(3) NOT NULL,
    expira_em DATETIME(3) NOT NULL,
    revogada_em DATETIME(3),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario),
    INDEX idx_sessao_usuario (id_usuario)
) ENGINE = InnoDB;

CREATE TABLE RECUPERACAO_SENHA (
    id_recuperacao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expira_em DATETIME(3) NOT NULL,
    usado_em DATETIME(3),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario)
) ENGINE = InnoDB;

CREATE TABLE COMUNICADO (
    id_comunicado INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(160) NOT NULL,
    conteudo TEXT NOT NULL,
    id_autor INT NOT NULL,
    publicado_em DATETIME(3) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_autor) REFERENCES USUARIO (id_usuario)
) ENGINE = InnoDB;

CREATE TABLE COMUNICADO_TURMA (
    id_comunicado INT NOT NULL,
    id_turma INT NOT NULL,
    PRIMARY KEY (id_comunicado, id_turma),
    FOREIGN KEY (id_comunicado) REFERENCES COMUNICADO (id_comunicado),
    FOREIGN KEY (id_turma) REFERENCES TURMA (id_turma)
) ENGINE = InnoDB;

-- Uma linha por acompanhamento: relacoes N:N ficam fora desta view para nao inflar contagens.
CREATE VIEW VW_ACOMPANHAMENTO_DETALHADO AS
SELECT
    a.*,
    al.nome AS aluno_nome,
    al.matricula AS aluno_matricula,
    v.id_professor,
    p.id_usuario AS professor_usuario_id,
    u.nome AS professor_nome,
    v.id_turma,
    t.nome AS turma_nome,
    v.ano_letivo,
    v.id_disciplina,
    d.nome AS disciplina_nome,
    b.numero AS bimestre_numero
FROM ACOMPANHAMENTO a
JOIN ALUNO al ON al.id_aluno = a.id_aluno
JOIN VINCULO_PROFESSOR v ON v.id_vinculo = a.id_vinculo
JOIN PROFESSOR p ON p.id_professor = v.id_professor
JOIN USUARIO u ON u.id_usuario = p.id_usuario
JOIN TURMA t ON t.id_turma = v.id_turma
JOIN DISCIPLINA d ON d.id_disciplina = v.id_disciplina
JOIN BIMESTRE b ON b.id_bimestre = a.id_bimestre;

CREATE VIEW VW_RELATORIO_PUBLICADO AS
SELECT *
FROM VW_ACOMPANHAMENTO_DETALHADO
WHERE status = 'PUBLICADO';

