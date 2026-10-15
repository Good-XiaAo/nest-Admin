import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'nestAdmin-session-secret',
      rolling: true,
      name: 'nestAdmin-session-id',
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
