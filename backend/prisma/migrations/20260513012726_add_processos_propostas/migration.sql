-- CreateTable
CREATE TABLE `processo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descricao` TEXT NOT NULL,
    `especializacao` VARCHAR(100) NOT NULL,
    `status` ENUM('aberto', 'em_atendimento', 'encerrado') NOT NULL DEFAULT 'aberto',
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `soft_delete` BOOLEAN NOT NULL DEFAULT false,

    INDEX `processo_especializacao_status_soft_delete_idx`(`especializacao`, `status`, `soft_delete`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_processo` INTEGER NOT NULL,
    `id_advogado` INTEGER NOT NULL,
    `mensagem` TEXT NOT NULL,
    `valor_estimado` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pendente', 'aceita', 'recusada') NOT NULL DEFAULT 'pendente',
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `soft_delete` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `proposta_id_processo_id_advogado_key`(`id_processo`, `id_advogado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `processo` ADD CONSTRAINT `processo_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposta` ADD CONSTRAINT `proposta_id_processo_fkey` FOREIGN KEY (`id_processo`) REFERENCES `processo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposta` ADD CONSTRAINT `proposta_id_advogado_fkey` FOREIGN KEY (`id_advogado`) REFERENCES `adv`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
