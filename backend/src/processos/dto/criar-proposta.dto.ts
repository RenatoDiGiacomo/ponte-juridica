import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, MinLength, Min } from 'class-validator';

export class CriarPropostaDto {
  @ApiProperty({ example: 'Posso te atender. Tenho experiência em rescisão indireta com tutela de urgência.' })
  @IsString()
  @MinLength(20)
  mensagem!: string;

  @ApiProperty({ example: 1500.0 })
  @IsNumber()
  @Min(0)
  valorEstimado!: number;
}
