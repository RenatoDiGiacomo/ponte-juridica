import { Module } from '@nestjs/common';
import { PlanosService } from './planos.service';
import { PlanosController } from './planos.controller';

@Module({
  providers: [PlanosService],
  controllers: [PlanosController],
})
export class PlanosModule {}
