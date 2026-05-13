import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsIn } from 'class-validator';

export const ESPECIALIZACOES = [
  'Criminal',
  'Trabalhista',
  'Família',
  'Cível',
  'Tributário',
  'Previdenciário',
] as const;

export class CriarProcessoDto {
  @ApiProperty({ example: 'Rescisão indireta — atraso de salário' })
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  titulo!: string;

  @ApiProperty({ example: 'Trabalho há 3 anos numa empresa que está atrasando salários há 4 meses...' })
  @IsString()
  @MinLength(20)
  descricao!: string;

  @ApiProperty({ enum: ESPECIALIZACOES })
  @IsIn(ESPECIALIZACOES as unknown as string[])
  especializacao!: string;
}
