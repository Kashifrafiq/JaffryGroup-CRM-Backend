import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AcceptAssociateInviteDto } from './dto/accept-associate-invite.dto';
import { AcceptCustomerInviteDto } from './dto/accept-customer-invite.dto';

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
      customerLogin: 'POST /api/auth/customer-login',
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

  @Get('customer-login')
  customerLoginHelp() {
    return {
      ok: false,
      reason: 'Login must be POST with JSON body (not a browser tab GET).',
      method: 'POST',
      path: '/api/auth/customer-login',
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
