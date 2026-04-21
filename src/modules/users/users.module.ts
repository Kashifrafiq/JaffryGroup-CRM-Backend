import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AdminProfile } from './entities/admin-profile.entity';
import { AssociateProfile } from './entities/associate-profile.entity';
import { CustomerProfile } from './entities/customer-profile.entity';
import { AssociateCustomer } from './entities/associate-customer.entity';
import { UsersService } from './users.service';
import { UsersSeedService } from './users.seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AdminProfile, AssociateProfile, CustomerProfile, AssociateCustomer]),
    CustomersModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersSeedService],
  exports: [UsersService],
})
export class UsersModule {}
