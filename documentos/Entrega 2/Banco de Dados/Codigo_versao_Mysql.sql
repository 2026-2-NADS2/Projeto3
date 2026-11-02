-- =====================================================================
-- PROJETO COLLISION - CRIAÇÃO DA ESTRUTURA (MYSQL)
-- Tabelas (Entrega 1), Índices (Entrega 1) e Views (Entrega 2)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS collision_db;
USE collision_db;

-- ==========================================
-- NÚCLEO A: USUÁRIOS E PERFIS
-- ==========================================

-- TABELA 1: USUARIO
CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    cargo VARCHAR(50) COMMENT 'Cargo (apenas para perfil ADMINISTRADOR)',
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuario_perfil CHECK (perfil IN ('ADMINISTRADOR', 'PROFESSOR', 'RESPONSAVEL')),
    CONSTRAINT chk_usuario_ativo CHECK (ativo IN (0, 1))
) COMMENT='Usuários do sistema (Administrador, Professor, Responsável)';

-- TABELA 2: PROFESSOR
CREATE TABLE PROFESSOR (
    id_professor INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prof_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_prof_ativo CHECK (ativo IN (0, 1))
) COMMENT='Dados específicos dos professores';

-- TABELA 3: RESPONSAVEL
CREATE TABLE RESPONSAVEL (
    id_responsavel INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_resp_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_resp_ativo CHECK (ativo IN (0, 1))
) COMMENT='Dados específicos dos responsáveis';

-- ==========================================
-- NÚCLEO B: ESTRUTURA ESCOLAR
-- ==========================================

-- TABELA 4: DISCIPLINA
CREATE TABLE DISCIPLINA (
    id_disciplina INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    area VARCHAR(50) COMMENT 'Área do conhecimento (Exatas, Humanas, etc.)',
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_disc_ativo CHECK (ativo IN (0, 1))
) COMMENT='Disciplinas acadêmicas';

-- TABELA 5: TURMA
CREATE TABLE TURMA (
    id_turma INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    ano_letivo INT NOT NULL,
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_turma UNIQUE (nome, ano_letivo),
    CONSTRAINT chk_turma_ativo CHECK (ativo IN (0, 1))
) COMMENT='Turmas da escola';

-- TABELA 6: ALUNO
CREATE TABLE ALUNO (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    id_turma INT NOT NULL COMMENT 'Turma atual do aluno',
    ano_letivo INT NOT NULL COMMENT 'Ano letivo atual do aluno',
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_aluno_turma FOREIGN KEY (id_turma) REFERENCES TURMA(id_turma),
    CONSTRAINT chk_aluno_ativo CHECK (ativo IN (0, 1))
) COMMENT='Dados dos alunos';

-- TABELA 7: ALUNO_RESPONSAVEL
CREATE TABLE ALUNO_RESPONSAVEL (
    id_aluno INT NOT NULL,
    id_responsavel INT NOT NULL,
    parentesco VARCHAR(30) NOT NULL,
    principal TINYINT(1) DEFAULT 0 NOT NULL,
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_aluno, id_responsavel),
    CONSTRAINT fk_aresp_aluno FOREIGN KEY (id_aluno) REFERENCES ALUNO(id_aluno),
    CONSTRAINT fk_aresp_responsavel FOREIGN KEY (id_responsavel) REFERENCES RESPONSAVEL(id_responsavel),
    CONSTRAINT chk_aresp_principal CHECK (principal IN (0, 1)),
    CONSTRAINT chk_aresp_ativo CHECK (ativo IN (0, 1)),
    CONSTRAINT chk_aresp_parentesco CHECK (parentesco IN ('PAI', 'MAE', 'AVO', 'AVOH', 'TIO', 'TIA', 'OUTRO'))
) COMMENT='Vínculo N:N entre alunos e responsáveis';

-- TABELA 8: VINCULO_PROFESSOR
CREATE TABLE VINCULO_PROFESSOR (
    id_vinculo INT AUTO_INCREMENT PRIMARY KEY,
    id_turma INT NOT NULL,
    id_disciplina INT NOT NULL,
    id_professor INT NOT NULL,
    ano_letivo INT NOT NULL,
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vprof_turma FOREIGN KEY (id_turma) REFERENCES TURMA(id_turma),
    CONSTRAINT fk_vprof_disciplina FOREIGN KEY (id_disciplina) REFERENCES DISCIPLINA(id_disciplina),
    CONSTRAINT fk_vprof_professor FOREIGN KEY (id_professor) REFERENCES PROFESSOR(id_professor),
    CONSTRAINT chk_vprof_ativo CHECK (ativo IN (0, 1)),
    CONSTRAINT uk_vinculo UNIQUE (id_turma, id_disciplina, id_professor, ano_letivo)
) COMMENT='Vínculo entre professor, turma e disciplina';

-- ==========================================
-- NÚCLEO C: ACOMPANHAMENTO E TAGS
-- ==========================================

-- TABELA 9: BIMESTRE
CREATE TABLE BIMESTRE (
    id_bimestre INT AUTO_INCREMENT PRIMARY KEY,
    numero TINYINT NOT NULL,
    ano_letivo INT NOT NULL,
    dt_abertura DATE,
    dt_encerramento DATE,
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_bimestre UNIQUE (numero, ano_letivo),
    CONSTRAINT chk_numero_bimestre CHECK (numero BETWEEN 1 AND 4),
    CONSTRAINT chk_bimestre_ativo CHECK (ativo IN (0, 1))
) COMMENT='Períodos de abertura e encerramento dos bimestres';

-- TABELA 10: TAG
CREATE TABLE TAG (
    id_tag INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cor VARCHAR(7) DEFAULT '#000000',
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tag_nome UNIQUE (nome),
    CONSTRAINT chk_tag_ativo CHECK (ativo IN (0, 1))
) COMMENT='Tags para classificação de acompanhamentos';

-- TABELA 11: ACOMPANHAMENTO
CREATE TABLE ACOMPANHAMENTO (
    id_acompanhamento INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    id_vinculo INT NOT NULL,
    id_bimestre INT NOT NULL,
    descricao LONGTEXT COMMENT 'Feedback qualitativo do professor',
    media DECIMAL(5,2) COMMENT 'Nota do aluno no bimestre (0 a 10)',
    status VARCHAR(25) DEFAULT 'RASCUNHO' NOT NULL,
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_acomp_aluno FOREIGN KEY (id_aluno) REFERENCES ALUNO(id_aluno),
    CONSTRAINT fk_acomp_vinculo FOREIGN KEY (id_vinculo) REFERENCES VINCULO_PROFESSOR(id_vinculo),
    CONSTRAINT fk_acomp_bimestre FOREIGN KEY (id_bimestre) REFERENCES BIMESTRE(id_bimestre),
    CONSTRAINT uk_acompanhamento UNIQUE (id_aluno, id_vinculo, id_bimestre),
    CONSTRAINT chk_acomp_media CHECK (media BETWEEN 0 AND 10),
    CONSTRAINT chk_acomp_status CHECK (status IN (
        'RASCUNHO', 'ENVIADO_PARA_REVISAO', 'EM_REVISAO', 
        'PUBLICADO', 'DEVOLVIDO', 'CANCELADO'
    )),
    CONSTRAINT chk_acomp_ativo CHECK (ativo IN (0, 1))
) COMMENT='Registro bimestral do desenvolvimento do aluno';

-- TABELA 12: ACOMPANHAMENTO_TAG
CREATE TABLE ACOMPANHAMENTO_TAG (
    id_acompanhamento INT NOT NULL,
    id_tag INT NOT NULL,
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_acompanhamento, id_tag),
    CONSTRAINT fk_atag_acompanhamento FOREIGN KEY (id_acompanhamento) REFERENCES ACOMPANHAMENTO(id_acompanhamento) ON DELETE CASCADE,
    CONSTRAINT fk_atag_tag FOREIGN KEY (id_tag) REFERENCES TAG(id_tag) ON DELETE CASCADE,
    CONSTRAINT chk_atag_ativo CHECK (ativo IN (0, 1))
) COMMENT='Vínculo N:N entre acompanhamentos e tags';

-- ==========================================
-- NÚCLEO D: AUDITORIA E RETORNO
-- ==========================================

-- TABELA 13: HISTORICO_AUDITORIA
CREATE TABLE HISTORICO_AUDITORIA (
    id_historico INT AUTO_INCREMENT PRIMARY KEY,
    id_acompanhamento INT NOT NULL,
    id_usuario_acao INT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_posterior VARCHAR(50),
    dt_alteracao DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacao VARCHAR(4000),
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    CONSTRAINT fk_hist_acompanhamento FOREIGN KEY (id_acompanhamento) REFERENCES ACOMPANHAMENTO(id_acompanhamento),
    CONSTRAINT fk_hist_usuario FOREIGN KEY (id_usuario_acao) REFERENCES USUARIO(id_usuario),
    CONSTRAINT chk_hist_ativo CHECK (ativo IN (0, 1))
) COMMENT='Histórico de ações para auditoria';

-- TABELA 14: RETORNO_RESPONSAVEL
CREATE TABLE RETORNO_RESPONSAVEL (
    id_retorno INT AUTO_INCREMENT PRIMARY KEY,
    id_acompanhamento INT NOT NULL,
    id_responsavel INT NOT NULL,
    ciencia TINYINT(1) DEFAULT 0 NOT NULL,
    dt_ciencia DATETIME,
    observacao VARCHAR(4000),
    ativo TINYINT(1) DEFAULT 1 NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ret_acompanhamento FOREIGN KEY (id_acompanhamento) REFERENCES ACOMPANHAMENTO(id_acompanhamento),
    CONSTRAINT fk_ret_responsavel FOREIGN KEY (id_responsavel) REFERENCES RESPONSAVEL(id_responsavel),
    CONSTRAINT chk_ret_ciencia CHECK (ciencia IN (0, 1)),
    CONSTRAINT chk_ret_ativo CHECK (ativo IN (0, 1))
) COMMENT='Ciência e observação do responsável';

-- ==========================================
-- CRIAÇÃO DOS ÍNDICES
-- ==========================================

CREATE INDEX idx_usuario_perfil ON USUARIO(perfil);
CREATE INDEX idx_aluno_nome ON ALUNO(nome);
CREATE INDEX idx_aluno_turma ON ALUNO(id_turma, ano_letivo);
CREATE INDEX idx_aluno_responsavel_resp ON ALUNO_RESPONSAVEL(id_responsavel);
CREATE INDEX idx_vinculo_professor ON VINCULO_PROFESSOR(id_professor);
CREATE INDEX idx_vinculo_turma ON VINCULO_PROFESSOR(id_turma);
CREATE INDEX idx_vinculo_disciplina ON VINCULO_PROFESSOR(id_disciplina);
CREATE INDEX idx_acompanhamento_aluno ON ACOMPANHAMENTO(id_aluno);
CREATE INDEX idx_acompanhamento_bimestre ON ACOMPANHAMENTO(id_bimestre);
CREATE INDEX idx_acompanhamento_vinculo ON ACOMPANHAMENTO(id_vinculo);
CREATE INDEX idx_acompanhamento_status ON ACOMPANHAMENTO(status);
CREATE INDEX idx_acompanhamento_alu_bim ON ACOMPANHAMENTO(id_aluno, id_bimestre);
CREATE INDEX idx_historico_acomp ON HISTORICO_AUDITORIA(id_acompanhamento);
CREATE INDEX idx_historico_usuario ON HISTORICO_AUDITORIA(id_usuario_acao);
CREATE INDEX idx_retorno_acomp ON RETORNO_RESPONSAVEL(id_acompanhamento);
CREATE INDEX idx_retorno_responsavel ON RETORNO_RESPONSAVEL(id_responsavel);
CREATE INDEX idx_bimestre_ano ON BIMESTRE(ano_letivo);

-- ==========================================
-- CRIAÇÃO DAS VIEWS (ENTREGA 2)
-- ==========================================


-- 1. VIEW BASE: Junta os dados principais para relatórios
CREATE OR REPLACE VIEW VW_ACOMPANHAMENTO_DETALHADO AS
SELECT
    a.id_acompanhamento, al.id_aluno, al.nome AS nome_aluno, al.matricula AS matricula_aluno,
    t.id_turma, t.nome AS nome_turma, v.ano_letivo, b.id_bimestre, b.numero AS numero_bimestre,
    d.id_disciplina, d.nome AS nome_disciplina, d.area AS area_disciplina,
    p.id_professor, up.id_usuario AS id_usuario_professor, up.nome AS nome_professor,
    a.media, a.descricao, a.status,
    (SELECT GROUP_CONCAT(tg.nome SEPARATOR ', ')
       FROM ACOMPANHAMENTO_TAG atg
       JOIN TAG tg ON tg.id_tag = atg.id_tag
      WHERE atg.id_acompanhamento = a.id_acompanhamento AND atg.ativo = 1 AND tg.ativo = 1) AS tags,
    a.data_criacao, a.data_atualizacao
FROM ACOMPANHAMENTO a
JOIN ALUNO al ON al.id_aluno = a.id_aluno
JOIN VINCULO_PROFESSOR v ON v.id_vinculo = a.id_vinculo
JOIN TURMA t ON t.id_turma = v.id_turma
JOIN DISCIPLINA d ON d.id_disciplina = v.id_disciplina
JOIN PROFESSOR p ON p.id_professor = v.id_professor
JOIN USUARIO up ON up.id_usuario = p.id_usuario
JOIN BIMESTRE b ON b.id_bimestre = a.id_bimestre
WHERE a.ativo = 1;

-- 2. VIEW: Apenas registros PUBLICADOS (Base para o PDF do Pai)
CREATE OR REPLACE VIEW VW_RELATORIO_PUBLICADO AS
SELECT id_acompanhamento, id_aluno, nome_aluno, matricula_aluno, id_turma, nome_turma, ano_letivo, 
       id_bimestre, numero_bimestre, id_disciplina, nome_disciplina, area_disciplina, nome_professor, 
       media, descricao, tags, data_atualizacao AS data_publicacao
FROM VW_ACOMPANHAMENTO_DETALHADO
WHERE status = 'PUBLICADO';

-- 3. VIEW: Relatório do Responsável (Com status de ciência)
CREATE OR REPLACE VIEW VW_RELATORIO_RESPONSAVEL AS
SELECT resp.id_usuario AS id_usuario_responsavel, ar.id_responsavel, ar.parentesco,
       r.id_acompanhamento, r.id_aluno, r.nome_aluno, r.nome_turma, r.ano_letivo, 
       r.numero_bimestre, r.nome_disciplina, r.nome_professor, r.media, r.descricao, r.tags, r.data_publicacao,
       IFNULL(ret.ciencia, 0) AS ciencia, ret.dt_ciencia
FROM VW_RELATORIO_PUBLICADO r
JOIN ALUNO_RESPONSAVEL ar ON ar.id_aluno = r.id_aluno AND ar.ativo = 1
JOIN RESPONSAVEL resp ON resp.id_responsavel = ar.id_responsavel AND resp.ativo = 1
LEFT JOIN (SELECT id_acompanhamento, id_responsavel, MAX(ciencia) AS ciencia, MAX(dt_ciencia) AS dt_ciencia
           FROM RETORNO_RESPONSAVEL WHERE ativo = 1 GROUP BY id_acompanhamento, id_responsavel) ret
       ON ret.id_acompanhamento = r.id_acompanhamento AND ret.id_responsavel = ar.id_responsavel;

-- 4. VIEW: Indicadores Gerenciais (Dashboard Admin)
CREATE OR REPLACE VIEW VW_INDICADORES_TURMA AS
SELECT id_turma, nome_turma, ano_letivo, numero_bimestre, id_disciplina, nome_disciplina, id_professor, nome_professor,
    COUNT(*) AS total_registros,
    COUNT(CASE WHEN status = 'RASCUNHO' THEN 1 END) AS qtd_rascunho,
    COUNT(CASE WHEN status IN ('ENVIADO_PARA_REVISAO','EM_REVISAO') THEN 1 END) AS qtd_em_analise,
    COUNT(CASE WHEN status = 'DEVOLVIDO' THEN 1 END) AS qtd_devolvidos,
    COUNT(CASE WHEN status = 'PUBLICADO' THEN 1 END) AS qtd_publicados,
    COUNT(CASE WHEN status = 'CANCELADO' THEN 1 END) AS qtd_cancelados,
    ROUND(AVG(CASE WHEN status = 'PUBLICADO' THEN media END), 2) AS media_publicada,
    MIN(CASE WHEN status = 'PUBLICADO' THEN media END) AS menor_media,
    MAX(CASE WHEN status = 'PUBLICADO' THEN media END) AS maior_media,
    COUNT(CASE WHEN status = 'PUBLICADO' AND media < 6 THEN 1 END) AS qtd_abaixo_de_6
FROM VW_ACOMPANHAMENTO_DETALHADO
GROUP BY id_turma, nome_turma, ano_letivo, numero_bimestre, id_disciplina, nome_disciplina, id_professor, nome_professor;

-- 5. VIEW: Distribuição de Tags
CREATE OR REPLACE VIEW VW_DISTRIBUICAO_TAGS AS
SELECT t.id_turma, t.nome AS nome_turma, v.ano_letivo, b.numero AS numero_bimestre,
       tg.id_tag, tg.nome AS nome_tag, tg.cor AS cor_tag, COUNT(*) AS qtd_usos, ROUND(AVG(a.media), 2) AS media_dos_alunos
FROM ACOMPANHAMENTO a
JOIN ACOMPANHAMENTO_TAG atg ON atg.id_acompanhamento = a.id_acompanhamento AND atg.ativo = 1
JOIN TAG tg ON tg.id_tag = atg.id_tag AND tg.ativo = 1
JOIN VINCULO_PROFESSOR v ON v.id_vinculo = a.id_vinculo
JOIN TURMA t ON t.id_turma = v.id_turma
JOIN BIMESTRE b ON b.id_bimestre = a.id_bimestre
WHERE a.ativo = 1 AND a.status = 'PUBLICADO'
GROUP BY t.id_turma, t.nome, v.ano_letivo, b.numero, tg.id_tag, tg.nome, tg.cor;
