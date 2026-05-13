import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdvogadosModule } from './advogados/advogados.module';
import { PlanosModule } from './planos/planos.module';
import { ConexoesModule } from './conexoes/conexoes.module';
import { ProcessosModule } from './processos/processos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AdvogadosModule,
    PlanosModule,
    ConexoesModule,
    ProcessosModule,
  ],
})
export class AppModule {}
