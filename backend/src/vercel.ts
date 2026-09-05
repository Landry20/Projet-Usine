import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module';
import { configurerApp } from './bootstrap';

let cached: express.Express | undefined;

async function getServer(): Promise<express.Express> {
  if (cached) return cached;

  const expressApp = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });
  configurerApp(nestApp);
  await nestApp.init();
  cached = expressApp;
  return expressApp;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const server = await getServer();
  server(req, res);
}
