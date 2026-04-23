import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Ponte Jurídica API')
    .setDescription('API do marketplace jurídico — MBA Dev Full Stack Impacta')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3333);
  console.log(`API rodando em http://localhost:${process.env.PORT ?? 3333}`);
  console.log(`Swagger em http://localhost:${process.env.PORT ?? 3333}/api/docs`);
}
bootstrap();
