import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, MaxLength, ValidateIf } from 'class-validator';

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
  @ValidateIf((o) => o.estadoAtuacao !== '') // UF vazia = "não informado"; só valida 2 letras quando preenchida
  @IsString()
  @Length(2, 2, { message: 'Estado deve ter 2 letras (UF)' })
  estadoAtuacao?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cidadeAtuacao?: string;

  @ApiPropertyOptional({ example: '(11) 3000-0000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @ApiPropertyOptional({ example: '(11) 99000-0000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'Ferreira & Associados Advocacia' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  escritorio?: string;

  @ApiPropertyOptional({ example: 'Atuo há 12 anos em Direito do Trabalho...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ example: 'Av. Paulista' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  enderecoLogradouro?: string;

  @ApiPropertyOptional({ example: '1000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  enderecoNumero?: string;

  @ApiPropertyOptional({ example: 'Bela Vista' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  enderecoBairro?: string;

  @ApiPropertyOptional({ example: '01310-100' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  enderecoCep?: string;
}

export class AdicionarAreaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  areaId!: number;
}

export class TrocarPlanoDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  planoId!: number;
}
