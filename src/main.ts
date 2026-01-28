import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable global validation for all endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      // Security: Strip any properties from the request body that aren't defined in the DTO
      whitelist: true,

      // UX: Automatically convert input payloads to DTO class instances
      transform: true,

      // Convenience: Automatically convert primitive types (e.g., "123" string to 123 number)
      // This is critical for DTO validation to work correctly with JSON payloads
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.listen(3000);
}
bootstrap();
