import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdvogadosModule } from './advogados/advogados.module';
import { PlanosModule } from './planos/planos.module';
import { ConexoesModule } from './conexoes/conexoes.module';
import { ProcessosModule } from './processos/processos.module';
import { MidiaModule } from './midia/midia.module';
import { AreasModule } from './areas/areas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Serve APENAS as fotos publicamente. Documentos (uploads/documentos) NÃO são
    // servidos como estático — só via endpoint autenticado do dono (privacidade).
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'fotos'),
      serveRoot: '/uploads/fotos',
    }),
    PrismaModule,
    AuthModule,
    AdvogadosModule,
    PlanosModule,
    ConexoesModule,
    ProcessosModule,
    MidiaModule,
    AreasModule,
  ],
})
export class AppModule {}
