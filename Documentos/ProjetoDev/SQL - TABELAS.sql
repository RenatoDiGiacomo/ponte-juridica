CREATE DATABASE IF NOT EXISTS ponte_juridica;
USE ponte_juridica;

-- 1. Tabela de Planos
CREATE TABLE plano (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50),
    valor_mensal DECIMAL(10,2),
    valor_anual DECIMAL(10,2),
    soft_delete BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- 2. Tabela de Clientes / Solicitantes
CREATE TABLE cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255),
    email VARCHAR(255),
    documento VARCHAR(20),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- 3. Tabela de Advogados
CREATE TABLE adv (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255),
    email VARCHAR(255),
    especializacao VARCHAR(100),
    oab VARCHAR(20),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    plano_id INT,
    assinatura ENUM('ativo', 'pendente', 'cancelado') DEFAULT 'ativo',
    soft_delete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (plano_id) REFERENCES plano(id)
) ENGINE=InnoDB;

-- 4. Tabela de Conexão (Processos/Vínculos)
CREATE TABLE cliente_advogado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_advogado INT,
    data_vinculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_cliente) REFERENCES cliente(id),
    FOREIGN KEY (id_advogado) REFERENCES adv(id)
) ENGINE=InnoDB;