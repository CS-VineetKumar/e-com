import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation pipes globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable response interceptor globally
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS
  app.enableCors();

  const port = process.env.PORT || 6060;
  console.log(`Application is running on port ${port}`);
  await app.listen(port);
}
bootstrap();
