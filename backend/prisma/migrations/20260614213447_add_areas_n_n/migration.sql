-- CreateTable
CREATE TABLE `area` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `area_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `advogado_area` (
    `id_advogado` INTEGER NOT NULL,
    `id_area` INTEGER NOT NULL,

    PRIMARY KEY (`id_advogado`, `id_area`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `advogado_area` ADD CONSTRAINT `advogado_area_id_advogado_fkey` FOREIGN KEY (`id_advogado`) REFERENCES `adv`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advogado_area` ADD CONSTRAINT `advogado_area_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `area`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
