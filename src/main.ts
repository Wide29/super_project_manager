import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:3001,http://127.0.0.1:3001'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: allowedOrigins
    }
  });

  app.setGlobalPrefix('');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Super Project Manager Backend')
    .setDescription('Backend MVP for the agent-powered data production platform')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
