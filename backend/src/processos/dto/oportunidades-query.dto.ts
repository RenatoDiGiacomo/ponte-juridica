import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class OportunidadesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Área específica (sobrepõe o default = áreas do advogado)' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Postado nos últimos N dias' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  postadoDias?: number;

  @ApiPropertyOptional({ description: 'UF do caso' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'Cidade do caso (parcial)' })
  @IsOptional()
  @IsString()
  cidade?: string;
}
