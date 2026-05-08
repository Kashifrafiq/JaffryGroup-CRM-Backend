import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AcceptAssociateInviteDto } from './dto/accept-associate-invite.dto';
import { AcceptCustomerInviteDto } from './dto/accept-customer-invite.dto';

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
      customerLogin: 'POST /auth/customer-login',
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

  @Get('customer-login')
  customerLoginHelp() {
    return {
      ok: false,
      reason: 'Login must be POST with JSON body (not a browser tab GET).',
      method: 'POST',
      path: '/auth/customer-login',
      bodyExample: {
        email: 'customer@example.com',
        password: 'your-password',
      },
      headers: { 'Content-Type': 'application/json' },
    };
  }

  @Post('customer-login')
  customerLogin(@Body() customerLoginDto: AdminLoginDto) {
    return this.authService.customerLogin(customerLoginDto);
  }

  @Get('associate-invites/:token')
  validateAssociateInvite(@Param('token') token: string) {
    return this.authService.validateAssociateInviteToken(token);
  }

  @Post('associate-invites/accept')
  acceptAssociateInvite(@Body() dto: AcceptAssociateInviteDto) {
    return this.authService.acceptAssociateInvite(dto);
  }

  @Get('customer-invites/:token')
  validateCustomerInvite(@Param('token') token: string) {
    return this.authService.validateCustomerInviteToken(token);
  }

  @Post('customer-invites/accept')
  acceptCustomerInvite(@Body() dto: AcceptCustomerInviteDto) {
    return this.authService.acceptCustomerInvite(dto);
  }
}
