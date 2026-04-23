import { Module } from '@nestjs/common';
import { ConexoesService } from './conexoes.service';
import { ConexoesController } from './conexoes.controller';

@Module({
  providers: [ConexoesService],
  controllers: [ConexoesController],
})
export class ConexoesModule {}
