import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { FiltreExceptionsHttp } from './common/filters/http-exception.filter';

/** Middleware, CORS, pipes, Swagger — partagé entre local et Vercel. */
export function configurerApp(app: INestApplication): void {
  const expressApp = app as NestExpressApplication;

  expressApp.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  expressApp.use(cookieParser());

  const origines = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  expressApp.enableCors({
    origin: origines,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  expressApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  expressApp.useGlobalFilters(new FiltreExceptionsHttp());

  expressApp.setGlobalPrefix('v1');
  expressApp.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/v1/fichiers/' });

  const swagger = new DocumentBuilder()
    .setTitle('API GMAO')
    .setDescription('API REST versionnée /v1 — Gestion de Maintenance Assistée par Ordinateur')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('v1/docs', expressApp, SwaggerModule.createDocument(expressApp, swagger));
}
