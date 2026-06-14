import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query de paginação compartilhada por todas as listagens (AR8/D5).
 * page default 1, pageSize default 20 (máx 100 — cobre 20/30/50/100 do A4).
 * Filtro/ordenação SEMPRE no Prisma (skip/take), nunca em memória (NFR7).
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  get take(): number {
    return this.pageSize;
  }
}

/** Envelope de resposta paginada — formato ÚNICO de toda listagem. */
export interface PaginatedDTO<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Monta o envelope a partir dos dados + total + a query usada. */
export function paginated<T>(
  data: T[],
  total: number,
  query: { page: number; pageSize: number },
): PaginatedDTO<T> {
  return { data, total, page: query.page, pageSize: query.pageSize };
}
