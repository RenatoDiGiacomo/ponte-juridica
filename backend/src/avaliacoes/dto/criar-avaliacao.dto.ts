import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CriarAvaliacaoDto {
  @ApiProperty({ example: 12, description: 'ID do processo (caso) encerrado' })
  @IsInt()
  processoId!: number;

  @ApiProperty({ example: 5, description: 'Nota de 1 a 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  nota!: number;

  @ApiPropertyOptional({ example: 'Excelente atendimento, resolveu meu caso rapidamente.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
