import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  const host = process.env.HOST ?? '0.0.0.0';
  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port, host);

  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  Logger.log(`Server running on http://${displayHost}:${port}`, 'Bootstrap');
}
bootstrap();
