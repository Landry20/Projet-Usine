import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { FiltreExceptionsHttp } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // En-têtes de sécurité HTTP (XSS, sniffing, clickjacking, HSTS en prod).
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(cookieParser());

  // CORS restreint au frontend déclaré — pas de wildcard en production.
  const origines = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({
    origin: origines,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation stricte : refuse tout champ non déclaré (anti-mass-assignment).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new FiltreExceptionsHttp());

  app.setGlobalPrefix('v1');
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/v1/fichiers/' });

  const swagger = new DocumentBuilder()
    .setTitle('API GMAO')
    .setDescription('API REST versionnée /v1 — Gestion de Maintenance Assistée par Ordinateur')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('v1/docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`GMAO API prête sur http://localhost:${port}/v1  — docs : /v1/docs`);
}

void bootstrap();
