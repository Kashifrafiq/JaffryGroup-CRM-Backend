import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

/** Same routes as `AuthController`, under `/api/auth` for clients that expect an `/api` prefix. */
@Controller('api/auth')
export class AuthApiController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return {
      ok: true,
      login: 'POST /api/auth/admin-login',
      associateLogin: 'POST /api/auth/associate-login',
    };
  }

  @Get('admin-login')
  adminLoginHelp() {
    return {
      ok: false,
      reason: 'Login must be POST with JSON body (not a browser tab GET).',
      method: 'POST',
      path: '/api/auth/admin-login',
      bodyExample: {
        email: 'kashif@vanestone.tech',
        password: 'your-password',
      },
      headers: { 'Content-Type': 'application/json' },
    };
  }

  @Post('admin-login')
  adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return this.authService.adminLogin(adminLoginDto);
  }

  @Get('associate-login')
  associateLoginHelp() {
    return {
      ok: false,
      reason: 'Login must be POST with JSON body (not a browser tab GET).',
      method: 'POST',
      path: '/api/auth/associate-login',
      bodyExample: {
        email: 'associate@example.com',
        password: 'your-password',
      },
      headers: { 'Content-Type': 'application/json' },
    };
  }

  @Post('associate-login')
  associateLogin(@Body() associateLoginDto: AdminLoginDto) {
    return this.authService.associateLogin(associateLoginDto);
  }
}
