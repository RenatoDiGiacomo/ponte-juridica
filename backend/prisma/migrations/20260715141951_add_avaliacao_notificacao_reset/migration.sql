-- CreateTable
CREATE TABLE `avaliacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_processo` INTEGER NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `id_advogado` INTEGER NOT NULL,
    `nota` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `soft_delete` BOOLEAN NOT NULL DEFAULT false,

    INDEX `avaliacao_id_advogado_soft_delete_idx`(`id_advogado`, `soft_delete`),
    UNIQUE INDEX `avaliacao_id_processo_id_cliente_key`(`id_processo`, `id_cliente`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_destinatario` INTEGER NOT NULL,
    `destinatario_tipo` VARCHAR(10) NOT NULL,
    `tipo` VARCHAR(30) NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notificacao_id_destinatario_destinatario_tipo_lida_idx`(`id_destinatario`, `destinatario_tipo`, `lida`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `tipo` VARCHAR(10) NOT NULL,
    `token` VARCHAR(100) NOT NULL,
    `expira_em` DATETIME(3) NOT NULL,
    `usado` BOOLEAN NOT NULL DEFAULT false,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `avaliacao_id_processo_fkey` FOREIGN KEY (`id_processo`) REFERENCES `processo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `avaliacao_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `avaliacao_id_advogado_fkey` FOREIGN KEY (`id_advogado`) REFERENCES `adv`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
