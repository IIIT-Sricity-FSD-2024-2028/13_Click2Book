"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/exceptions/global-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Click2Book API')
        .setDescription(`## Click2Book — Online Ticket Booking System
      
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
      `)
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const PORT = process.env.PORT || 3000;
    await app.listen(PORT);
    console.log(`\n🚀 Click2Book API running at: http://localhost:${PORT}/api`);
    console.log(`📚 Swagger docs at:           http://localhost:${PORT}/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map