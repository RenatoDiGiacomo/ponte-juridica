import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class AtualizarPerfilAdvogadoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  oab?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  @Length(2, 2, { message: 'Estado deve ter 2 letras (UF)' })
  estadoAtuacao?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cidadeAtuacao?: string;
}

export class AdicionarAreaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  areaId!: number;
}
