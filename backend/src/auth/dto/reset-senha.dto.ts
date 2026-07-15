import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class SolicitarResetDto {
  @ApiProperty({ example: 'cliente.demo@pontejuridica.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @ApiProperty({ example: 'cliente', enum: ['cliente', 'advogado'] })
  @IsIn(['cliente', 'advogado'])
  tipo!: 'cliente' | 'advogado';
}

export class RedefinirSenhaDto {
  @ApiProperty({ example: 'a1b2c3...' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha!: string;
}
