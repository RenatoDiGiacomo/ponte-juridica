-- CreateTable
CREATE TABLE `plano` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(50) NOT NULL,
    `valor_mensal` DECIMAL(10, 2) NOT NULL,
    `valor_anual` DECIMAL(10, 2) NOT NULL,
    `soft_delete` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `documento` VARCHAR(20) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `data_cadastro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `soft_delete` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `cliente_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `adv` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `especializacao` VARCHAR(100) NOT NULL,
    `oab` VARCHAR(20) NOT NULL,
    `data_cadastro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `plano_id` INTEGER NOT NULL,
    `assinatura` ENUM('ativo', 'pendente', 'cancelado') NOT NULL DEFAULT 'ativo',
    `soft_delete` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `adv_email_key`(`email`),
    UNIQUE INDEX `adv_oab_key`(`oab`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cliente_advogado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER NOT NULL,
    `id_advogado` INTEGER NOT NULL,
    `data_vinculo` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `soft_delete` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `adv` ADD CONSTRAINT `adv_plano_id_fkey` FOREIGN KEY (`plano_id`) REFERENCES `plano`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cliente_advogado` ADD CONSTRAINT `cliente_advogado_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cliente_advogado` ADD CONSTRAINT `cliente_advogado_id_advogado_fkey` FOREIGN KEY (`id_advogado`) REFERENCES `adv`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
