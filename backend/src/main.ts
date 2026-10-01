import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { json, urlencoded } from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:3002',
      'https://localhost:3002',
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 8000);
}
await bootstrap();
