import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class BuscarAdvogadosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Nome da área de atuação' })
  @IsOptional()
  @IsString()
  area?: string;

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
