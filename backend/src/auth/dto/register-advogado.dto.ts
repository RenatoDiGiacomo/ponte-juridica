import { IsEmail, IsString, MinLength, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAdvogadoDto {
  @ApiProperty({ example: 'Dra. Maria Santos' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 'maria@escritorio.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6)
  senha: string;

  @ApiProperty({ example: 'Trabalhista', enum: ['Criminal','Trabalhista','Família','Cível','Tributário','Previdenciário'] })
  @IsString()
  area: string;

  @ApiProperty({ example: '12345/SP' })
  @IsString()
  oab: string;

  @ApiProperty({ example: 1, description: '1=Básico, 2=Profissional, 3=Elite' })
  @IsInt()
  planoId: number;
}
