import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const fastifyAdapter = new FastifyAdapter({
    logger: false,
    trustProxy: true,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const rawCorsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  const allowedOrigins = rawCorsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const cookieSecret = configService.get<string>(
    'COOKIE_SECRET',
    'debitinfo-fastify-cookie-secure-secret-32-bytes',
  );

  // Register Security Headers
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
  });

  // Register Cookie Parser
  await app.register(fastifyCookie as any, {
    secret: cookieSecret,
  });

  // Register CORS
  await app.register(fastifyCors as any, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      // allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return cb(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('debitinfo.ge');
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Debitinfo Backend (NestJS + Fastify) is running on: http://localhost:${port}`);
  logger.log(`🔒 RS.GE Mode: ${configService.get('RSGE_SANDBOX_MODE') === 'true' ? 'SANDBOX / MOCK ADAPTER' : 'LIVE PRODUCTION'}`);
}

bootstrap();
