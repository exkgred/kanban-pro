import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';
import { ResponseInterceptor } from './presentation/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swagger = new DocumentBuilder()
    .setTitle('Scrum Kanban API')
    .setDescription(
      'API REST do quadro Kanban (Clean Architecture). ' +
        'Auth JWT; boards, colunas, cards, labels, sprints e apontamento de horas (TimeLog). ' +
        'Envelope { success, data, meta }. Prefixo /api/v1.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swagger),
  );

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
