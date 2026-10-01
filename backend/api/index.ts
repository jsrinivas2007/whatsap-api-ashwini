// Vercel serverless entry for the NestJS backend.
// Mirrors src/main.ts (same middleware + CORS policy). Local dev and Docker
// still run `npm run start:prod` (dist/main); this file is only used when the
// backend is deployed to Vercel as a serverless function.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { json, urlencoded } from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cookieParser = require('cookie-parser');

let server: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const corsOrigins = (
    process.env.CORS_ORIGINS ||
    'http://localhost:3000,https://localhost:3000,http://localhost:3002,https://localhost:3002'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  if (!server) {
    server = await bootstrap();
  }
  return server(req, res);
}
