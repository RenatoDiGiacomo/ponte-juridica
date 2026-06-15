import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MeusClientesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou CPF/CNPJ' })
  @IsOptional()
  @IsString()
  busca?: string;
}
