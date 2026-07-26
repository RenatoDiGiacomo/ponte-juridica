-- AlterTable
ALTER TABLE `processo` ADD COLUMN `motivo_encerramento` TEXT NULL;

-- AlterTable
ALTER TABLE `proposta` ADD COLUMN `justificativa` TEXT NULL,
    MODIFY `status` ENUM('pendente', 'aceita', 'recusada', 'cancelada') NOT NULL DEFAULT 'pendente';
