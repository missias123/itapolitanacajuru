
-- ================================================
-- BANCO: itapolitana_db
-- ================================================
CREATE DATABASE IF NOT EXISTS itapolitana_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE itapolitana_db;

-- ── TABELA: Administradores ──────────────────────
CREATE TABLE admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin','admin','editor') DEFAULT 'editor',
    ativo TINYINT(1) DEFAULT 1,
    ultimo_login DATETIME,
    token_reset VARCHAR(255),
    token_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB;

-- ── TABELA: Configurações do Site ────────────────
CREATE TABLE configuracoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    tipo ENUM('texto','numero','booleano','json','imagem','cor') DEFAULT 'texto',
    grupo VARCHAR(50) DEFAULT 'geral',
    label VARCHAR(150),
    descricao TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_chave (chave),
    INDEX idx_grupo (grupo)
) ENGINE=InnoDB;

-- ── TABELA: Categorias do Cardápio ───────────────
CREATE TABLE categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    icone VARCHAR(10) DEFAULT '🍦',
    imagem VARCHAR(255),
    ordem INT UNSIGNED DEFAULT 0,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_ativo_ordem (ativo, ordem)
) ENGINE=InnoDB;

-- ── TABELA: Sabores/Produtos ──────────────────────
CREATE TABLE produtos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    descricao TEXT,
    ingredientes TEXT,
    alergenos JSON,
    imagem VARCHAR(255),
    imagem_hover VARCHAR(255),
    preco_simples DECIMAL(8,2),
    preco_duplo DECIMAL(8,2),
    preco_triplo DECIMAL(8,2),
    preco_pote DECIMAL(8,2),
    destaque TINYINT(1) DEFAULT 0,
    disponivel TINYINT(1) DEFAULT 1,
    novidade TINYINT(1) DEFAULT 0,
    mais_vendido TINYINT(1) DEFAULT 0,
    sem_lactose TINYINT(1) DEFAULT 0,
    vegano TINYINT(1) DEFAULT 0,
    ordem INT UNSIGNED DEFAULT 0,
    views INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    INDEX idx_categoria (categoria_id),
    INDEX idx_disponivel (disponivel),
    INDEX idx_destaque (destaque),
    FULLTEXT idx_busca (nome, descricao)
) ENGINE=InnoDB;

-- ── TABELA: Promoções ─────────────────────────────
CREATE TABLE promocoes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    desconto_tipo ENUM('percentual','fixo','frete_gratis') DEFAULT 'percentual',
    desconto_valor DECIMAL(8,2),
    preco_especial DECIMAL(8,2),
    imagem VARCHAR(255),
    produto_id INT UNSIGNED,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    ativo TINYINT(1) DEFAULT 1,
    cor_fundo VARCHAR(7) DEFAULT '#e91e8c',
    cor_texto VARCHAR(7) DEFAULT '#ffffff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
    INDEX idx_ativo_datas (ativo, data_inicio, data_fim)
) ENGINE=InnoDB;

-- ── TABELA: Horários de Funcionamento ────────────
CREATE TABLE horarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dia_semana TINYINT NOT NULL COMMENT '0=Dom, 1=Seg… 6=Sab',
    dia_nome VARCHAR(20) NOT NULL,
    aberto TINYINT(1) DEFAULT 1,
    hora_abre TIME,
    hora_fecha TIME,
    mensagem VARCHAR(200) COMMENT 'Ex: Feriado - Fechado',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dia (dia_semana)
) ENGINE=InnoDB;

-- ── TABELA: Banner/Slider ─────────────────────────
CREATE TABLE banners (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200),
    subtitulo VARCHAR(300),
    imagem VARCHAR(255) NOT NULL,
    imagem_mobile VARCHAR(255),
    link VARCHAR(500),
    link_texto VARCHAR(100) DEFAULT 'Saiba mais',
    cor_overlay VARCHAR(7) DEFAULT '#000000',
    opacidade DECIMAL(3,2) DEFAULT 0.40,
    ordem INT UNSIGNED DEFAULT 0,
    ativo TINYINT(1) DEFAULT 1,
    data_inicio DATETIME,
    data_fim DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ativo_ordem (ativo, ordem)
) ENGINE=InnoDB;

-- ── TABELA: Encomendas/Pedidos ────────────────────
CREATE TABLE encomendas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome_cliente VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    tipo_produto VARCHAR(100),
    descricao TEXT,
    quantidade INT UNSIGNED DEFAULT 1,
    data_entrega DATE NOT NULL,
    hora_entrega TIME,
    status ENUM('novo','confirmado','producao','pronto','entregue','cancelado') DEFAULT 'novo',
    valor_total DECIMAL(8,2),
    observacoes TEXT,
    resposta_admin TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_data_entrega (data_entrega),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ── TABELA: Mensagens/Contato ─────────────────────
CREATE TABLE mensagens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefone VARCHAR(20),
    assunto VARCHAR(200),
    mensagem TEXT NOT NULL,
    lida TINYINT(1) DEFAULT 0,
    respondida TINYINT(1) DEFAULT 0,
    ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lida (lida),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ── TABELA: Logs do Admin ─────────────────────────
CREATE TABLE logs_admin (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED,
    acao VARCHAR(100) NOT NULL,
    tabela VARCHAR(50),
    registro_id INT UNSIGNED,
    dados_antes JSON,
    dados_depois JSON,
    ip VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin (admin_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ── TABELA: Sessions JWT ──────────────────────────
CREATE TABLE sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip VARCHAR(45),
    user_agent VARCHAR(500),
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- ── DADOS INICIAIS ────────────────────────────────
-- Admin padrão (senha: Admin@2026 — TROCAR IMEDIATAMENTE)
-- Hash gerado com password_hash('Admin@2026', PASSWORD_BCRYPT)
INSERT INTO admins (nome, email, senha_hash, role) VALUES 
('Dono da Sorveteria', 'admin@itapolitanacajuru.com.br', '$2y$12$HASH_GERADO_PELO_PHP', 'super_admin');

-- Configurações iniciais
INSERT INTO configuracoes (chave, valor, tipo, grupo, label) VALUES 
('site_nome', 'Sorveteria Itapolitana', 'texto', 'geral', 'Nome do Site'),
('site_telefone', '(16) 99606-2046', 'texto', 'geral', 'Telefone'),
('site_whatsapp', '5516996062046', 'texto', 'geral', 'WhatsApp (sem formatação)'),
('site_email', 'contato@itapolitanacajuru.com.br', 'texto', 'geral', 'Email'),
('site_endereco', 'R. Cel. Manoel Caetano, 311 – Largo São Bento – Cajuru/SP', 'texto', 'geral', 'Endereço'),
('site_cor_primaria', '#e91e8c', 'cor', 'aparencia', 'Cor Primária'),
('site_cor_secundaria', '#ff6b35', 'cor', 'aparencia', 'Cor Secundária'),
('site_logo', '/img/logo.webp', 'imagem', 'aparencia', 'Logo'),
('chatbot_ativo', '1', 'booleano', 'funcionalidades', 'Chatbot Ativo'),
('clima_ativo', '1', 'booleano', 'funcionalidades', 'Widget de Clima'),
('relogio_ativo', '1', 'booleano', 'funcionalidades', 'Widget de Relógio'),
('aviso_site', '', 'texto', 'geral', 'Aviso no topo do site'),
('manutencao_modo', '0', 'booleano', 'geral', 'Modo Manutenção');

-- Horários
INSERT INTO horarios (dia_semana, dia_nome, aberto, hora_abre, hora_fecha) VALUES 
(0, 'Domingo', 1, '10:00:00', '23:00:00'),
(1, 'Segunda-feira', 1, '10:00:00', '22:00:00'),
(2, 'Terça-feira', 1, '10:00:00', '22:00:00'),
(3, 'Quarta-feira', 1, '10:00:00', '22:00:00'),
(4, 'Quinta-feira', 1, '10:00:00', '22:00:00'),
(5, 'Sexta-feira', 1, '10:00:00', '23:00:00'),
(6, 'Sábado', 1, '10:00:00', '23:00:00');
