import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // TODO: put behind a dev environment flag
  await app.listen(3000);
}
bootstrap();
