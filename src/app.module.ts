import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AssociatesModule } from './modules/associates/associates.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { CustomersModule } from './modules/customers/customers.module';

const isTruthy = (value: string | undefined, defaultValue = false): boolean => {
  if (value === undefined) return defaultValue;
  return ['true', '1', 'yes', 'on', 'require', 'required'].includes(value.trim().toLowerCase());
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const useSsl = isTruthy(configService.get<string>('DB_SSL'), false);
        const rejectUnauthorized = isTruthy(
          configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED'),
          false,
        );

        const host = configService.get<string>('DB_HOST', 'localhost').trim();
        const username = configService.get<string>('DB_USERNAME', 'postgres').trim();
        const database = configService.get<string>('DB_NAME', 'crm_backend').trim();
        const password = configService.get<string>('DB_PASSWORD', 'postgres');

        return {
          type: 'postgres',
          host,
          port: Number(configService.get<string>('DB_PORT', '5432')),
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize: isTruthy(configService.get<string>('DB_SYNCHRONIZE'), true),
          ssl: useSsl ? { rejectUnauthorized } : false,
        };
      },
    }),
    AuthModule,
    UsersModule,
    AssociatesModule,
    ApplicationsModule,
    CustomersModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
