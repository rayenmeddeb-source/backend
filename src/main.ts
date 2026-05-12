import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const configuredOrigins = configService.get<string>('FRONTEND_ORIGIN');
  const fallbackOrigins = ['http://localhost:5173', 'http://localhost:5174'];
  const parsedConfiguredOrigins = configuredOrigins
    ? configuredOrigins.split(',').map((origin) => origin.trim())
    : [];
  const allowedOrigins = Array.from(
    new Set([...parsedConfiguredOrigins, ...fallbackOrigins]),
  );

  app.enableCors({
    origin: allowedOrigins,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(3000);
  
}

bootstrap();