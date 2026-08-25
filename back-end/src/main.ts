import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Security headers — Helmet (must be first middleware)
  // contentSecurityPolicy: false preserves Swagger UI (uses inline scripts)
  // crossOriginEmbedderPolicy: false preserves Swagger loading external assets
  app.use(
    (helmet as any).default
      ? (helmet as any).default({
          contentSecurityPolicy: false,
          crossOriginEmbedderPolicy: false,
        })
      : (helmet as any)({
          contentSecurityPolicy: false,
          crossOriginEmbedderPolicy: false,
        }),
  );

  // CORS — origin kept as '*' to support frontend pages served from file://
  // (api-connector.js dynamically resolves to localhost:3000 from any origin).
  // Explicit methods and headers prevent method/header injection attacks.
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'x-role',        // Click2Book RBAC header (required by RolesGuard)
      'x-request-id',  // request correlation header (Phase 3B)
    ],
    exposedHeaders: ['x-request-id'],  // allow client to read correlation ID
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter — retrieve LoggerService from DI so the filter
  // can write to error.log. Using app.get() gives us the same singleton
  // instance that is already registered globally via LoggerModule.
  const loggerService = app.get(LoggerService);
  app.useGlobalFilters(new GlobalExceptionFilter(loggerService));

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
    .addTag('Tracking', 'Live bus/train tracking for in-progress trips')
    .addTag('Emergency', 'Customer SOS alerts')
    .addTag('Lost & Found', 'Lost item reports on trips')
    .addApiKey({ type: 'apiKey', name: 'x-role', in: 'header' }, 'x-role')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  SwaggerModule.setup('api', app, document);  // also serve at /api

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`\n🚀 Click2Book API running at: http://localhost:${PORT}/api`);
  console.log(`📚 Swagger docs at:           http://localhost:${PORT}/docs\n`);
}
bootstrap();
