import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Click2Book API')
    .setDescription(
      `## Click2Book — Online Ticket Booking System
      
### RBAC via Request Header
Pass **x-role** header with one of:
- \`CUSTOMER\`
- \`ADMIN\`
- \`PROVIDER\`
- \`SUPPORT\`

### Response Format
All responses follow:
\`\`\`json
{ "success": true, "message": "...", "data": {} }
\`\`\`
      `,
    )
    .setVersion('1.0')
    .addTag('Auth / RBAC', 'Role-based access control info')
    .addTag('Customers', 'Customer management')
    .addTag('Admin', 'Admin operations')
    .addTag('Providers', 'Service provider management')
    .addTag('Support Staff', 'Customer support staff')
    .addTag('Vehicles', 'Vehicle management')
    .addTag('Seats', 'Seat management')
    .addTag('Routes', 'Route management')
    .addTag('Schedules', 'Schedule management')
    .addTag('Trips', 'Trip management')
    .addTag('Offers', 'Discount offers')
    .addTag('IRCTC', 'Train IRCTC verification')
    .addTag('Bookings', 'Ticket booking')
    .addTag('Payments', 'Payment processing')
    .addTag('Cancellations', 'Booking cancellations')
    .addTag('Refunds', 'Refund processing')
    .addTag('Reviews', 'Customer reviews')
    .addTag('Support Requests', 'Customer support requests')
    .addTag('Reports', 'Admin reports & analytics')
    .addApiKey({ type: 'apiKey', name: 'x-role', in: 'header' }, 'x-role')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`\n🚀 Click2Book API running at: http://localhost:${PORT}/api`);
  console.log(`📚 Swagger docs at:           http://localhost:${PORT}/docs\n`);
}
bootstrap();
