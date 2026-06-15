import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CriarRelatorioDto {
  @ApiProperty({ example: 'Protocolo da ação distribuído; aguardando citação.' })
  @IsString()
  @MinLength(3, { message: 'Relatório muito curto' })
  @MaxLength(2000)
  texto!: string;
}
