import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login — returns user info + role (no JWT)',
    description: `
**Predefined credentials:**

| Role     | Email                     | Password       |
|----------|---------------------------|----------------|
| CUSTOMER | rahul@gmail.com           | Rahul@123      |
| CUSTOMER | priya@gmail.com           | Priya@123      |
| ADMIN    | admin@click2book.com      | Admin@123      |
| PROVIDER | apsrtc@gmail.com          | Apsrtc@123     |
| SUPPORT  | support@click2book.com    | Support@123    |

Store the returned \`role\` in sessionStorage as \`c2b_role\`.
    `,
  })
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('test-users')
  @ApiOperation({ summary: 'List all test credentials (dev helper)' })
  testUsers() {
    return this.authService.listTestUsers();
  }
}
