import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class BuscarAdvogadosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome do advogado (parcial)' })
  @IsOptional()
  @IsString()
  busca?: string;

  @ApiPropertyOptional({ description: 'Nome da área de atuação (único — legado)' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Áreas de atuação (múltiplas, separadas por vírgula)' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : value,
  )
  @IsArray()
  @IsString({ each: true })
  areas?: string[];

  @ApiPropertyOptional({ description: 'Nota mínima (0-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  notaMin?: number;

  @ApiPropertyOptional({ description: 'UF de atuação (2 letras)' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ enum: ['vinculado', 'nao'], description: 'Filtrar por vínculo com o cliente logado' })
  @IsOptional()
  @IsIn(['vinculado', 'nao'])
  vinculo?: 'vinculado' | 'nao';
}
