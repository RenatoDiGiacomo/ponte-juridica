import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlanosService } from './planos.service';

@ApiTags('planos')
@Controller('api/v1/planos')
export class PlanosController {
  constructor(private planos: PlanosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar planos disponíveis para advogados' })
  findAll() {
    return this.planos.findAll();
  }
}
