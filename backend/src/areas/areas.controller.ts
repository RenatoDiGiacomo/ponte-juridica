import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AreasService } from './areas.service';

@ApiTags('areas')
@Controller('api/v1/areas')
export class AreasController {
  constructor(private areas: AreasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar áreas de atuação disponíveis' })
  listar() {
    return this.areas.listar();
  }
}
