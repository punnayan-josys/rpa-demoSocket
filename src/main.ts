import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for web interface
  app.enableCors({
    origin: true,
    credentials: true
  });
  
  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });
  
  await app.listen(3000);
  console.log('🚀 RPA Socket.IO Server running on http://localhost:3000');
  console.log('📱 Web interface available at http://localhost:3000');
}
bootstrap();