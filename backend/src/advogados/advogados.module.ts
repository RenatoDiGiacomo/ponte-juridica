import { Module } from '@nestjs/common';
import { AdvogadosService } from './advogados.service';
import { AdvogadosController } from './advogados.controller';

@Module({
  providers: [AdvogadosService],
  controllers: [AdvogadosController],
})
export class AdvogadosModule {}
