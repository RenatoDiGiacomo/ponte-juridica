-- AlterTable
ALTER TABLE `adv` ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `endereco_bairro` VARCHAR(100) NULL,
    ADD COLUMN `endereco_cep` VARCHAR(10) NULL,
    ADD COLUMN `endereco_logradouro` VARCHAR(255) NULL,
    ADD COLUMN `endereco_numero` VARCHAR(20) NULL,
    ADD COLUMN `escritorio` VARCHAR(150) NULL;
