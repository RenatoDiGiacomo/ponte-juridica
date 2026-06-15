import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** Atualização do próprio perfil do cliente (campos públicos e privados). */
export class AtualizarPerfilClienteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documento?: string;

  @ApiPropertyOptional({ example: '1986-03-15' })
  @IsOptional()
  @IsString()
  dataNascimento?: string;

  // Dados privados (nunca expostos a terceiros)
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  enderecoLogradouro?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  enderecoNumero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  enderecoBairro?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  enderecoCidade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 2)
  enderecoEstado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  enderecoCep?: string;
}
