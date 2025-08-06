import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api');
  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`🔄 Sync Service running on http://localhost:${port}/api`);
}
bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
