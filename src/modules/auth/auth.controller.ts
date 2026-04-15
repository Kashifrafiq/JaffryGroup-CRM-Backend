import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** GET — use this in the browser to confirm the auth routes are mounted (login itself is POST only). */
  @Get('health')
  health() {
    return {
      ok: true,
      login: 'POST /auth/admin-login',
      associateLogin: 'POST /auth/associate-login',
      alt: 'POST /api/auth/admin-login',
    };
  }

  /**
   * Browser address bar only sends GET. Opening this URL in a tab shows instructions
   * instead of an empty page or confusing errors.
   */
  @Get('admin-login')
  adminLoginHelp() {
    return {
      ok: false,
      reason: 'Login must be POST with JSON body (not a browser tab GET).',
      method: 'POST',
      path: '/auth/admin-login',
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
      path: '/auth/associate-login',
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
