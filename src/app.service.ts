import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'crm-backend',
      status: 'ok',
      message: 'If you see this JSON, you are hitting the Nest CRM API.',
      auth: {
        health: '/auth/health',
        adminLoginGet: '/auth/admin-login',
        adminLoginPost: 'POST /auth/admin-login',
      },
    };
  }
}
