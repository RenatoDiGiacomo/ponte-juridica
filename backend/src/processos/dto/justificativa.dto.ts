import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Justificativa opcional ao encerrar um caso (obrigatória na UI do advogado). */
export class EncerrarCasoDto {
  @ApiPropertyOptional({ example: 'Acordo cumprido; nada mais a tratar.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  justificativa?: string;
}

/** Justificativa obrigatória ao cancelar a própria proposta (exibida ao cliente). */
export class CancelarPropostaDto {
  @ApiProperty({ example: 'Agenda lotada no período; não conseguirei atender.' })
  @IsString()
  @MinLength(5, { message: 'Informe uma justificativa (mín. 5 caracteres)' })
  @MaxLength(1000)
  justificativa!: string;
}
