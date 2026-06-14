import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import type { Request } from 'express';

/** Tamanho máximo de upload: 5MB (NFR5). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const MIMES_IMAGEM = ['image/jpeg', 'image/png'];
export const MIMES_DOCUMENTO = ['image/jpeg', 'image/png', 'application/pdf'];

/**
 * Opções de upload por subdiretório. Salva no filesystem do backend.
 * - `fotos/` → mídia pública (servida via ServeStatic).
 * - `documentos/` → privada (servida só por endpoint autenticado do dono).
 * Valida tipo (allowedMimes) e tamanho (5MB); rejeição → BadRequestException PT-BR.
 */
export function uploadOptions(subdir: 'fotos' | 'documentos', allowedMimes: string[]) {
  const dest = join(process.cwd(), 'uploads', subdir);
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

  return {
    storage: diskStorage({
      destination: dest,
      filename: (req: Request, file: Express.Multer.File, cb: (e: Error | null, name: string) => void) => {
        const u = (req as unknown as { user?: { id: number; tipo: string } }).user;
        const tipo = u?.tipo ?? 'anon';
        const id = u?.id ?? '0';
        // 1 arquivo por usuário/tipo (sobrescreve o anterior).
        cb(null, `${tipo}-${id}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      cb: (e: Error | null, accept: boolean) => void,
    ) => {
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(
          new BadRequestException('Tipo de arquivo não permitido. Envie jpg, png ou pdf.'),
          false,
        );
      }
      cb(null, true);
    },
    limits: { fileSize: MAX_FILE_SIZE },
  };
}
