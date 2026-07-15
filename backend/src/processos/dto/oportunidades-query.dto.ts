import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class OportunidadesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Área específica (sobrepõe o default = áreas do advogado)' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Postado nos últimos N dias (atalho; use dataDe/dataAte p/ intervalo)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  postadoDias?: number;

  @ApiPropertyOptional({ description: 'Data inicial de postagem (ISO, inclusiva)' })
  @IsOptional()
  @IsISO8601()
  dataDe?: string;

  @ApiPropertyOptional({ description: 'Data final de postagem (ISO, inclusiva)' })
  @IsOptional()
  @IsISO8601()
  dataAte?: string;

  @ApiPropertyOptional({ description: 'UF do caso (filtro único — legado)' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'UFs do caso (múltiplas, separadas por vírgula)' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : value,
  )
  @IsArray()
  @IsString({ each: true })
  estados?: string[];

  @ApiPropertyOptional({ description: 'Cidade do caso (parcial)' })
  @IsOptional()
  @IsString()
  cidade?: string;
}
