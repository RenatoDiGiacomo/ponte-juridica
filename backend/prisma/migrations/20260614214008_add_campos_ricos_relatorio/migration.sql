-- AlterTable
ALTER TABLE `adv` ADD COLUMN `cidade_atuacao` VARCHAR(100) NULL,
    ADD COLUMN `estado_atuacao` VARCHAR(2) NULL,
    ADD COLUMN `foto_path` VARCHAR(255) NULL,
    ADD COLUMN `nota` DECIMAL(2, 1) NULL,
    ADD COLUMN `telefone` VARCHAR(20) NULL,
    ADD COLUMN `whatsapp` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `data_nascimento` DATE NULL,
    ADD COLUMN `documento_path` VARCHAR(255) NULL,
    ADD COLUMN `endereco_bairro` VARCHAR(100) NULL,
    ADD COLUMN `endereco_cep` VARCHAR(10) NULL,
    ADD COLUMN `endereco_cidade` VARCHAR(100) NULL,
    ADD COLUMN `endereco_estado` VARCHAR(2) NULL,
    ADD COLUMN `endereco_logradouro` VARCHAR(255) NULL,
    ADD COLUMN `endereco_numero` VARCHAR(20) NULL,
    ADD COLUMN `foto_path` VARCHAR(255) NULL,
    ADD COLUMN `telefone` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `processo` ADD COLUMN `cidade` VARCHAR(100) NULL,
    ADD COLUMN `estado` VARCHAR(2) NULL;

-- CreateTable
CREATE TABLE `relatorio_caso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_processo` INTEGER NOT NULL,
    `id_advogado` INTEGER NOT NULL,
    `texto` TEXT NOT NULL,
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `soft_delete` BOOLEAN NOT NULL DEFAULT false,

    INDEX `relatorio_caso_id_processo_soft_delete_idx`(`id_processo`, `soft_delete`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `relatorio_caso` ADD CONSTRAINT `relatorio_caso_id_processo_fkey` FOREIGN KEY (`id_processo`) REFERENCES `processo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relatorio_caso` ADD CONSTRAINT `relatorio_caso_id_advogado_fkey` FOREIGN KEY (`id_advogado`) REFERENCES `adv`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
