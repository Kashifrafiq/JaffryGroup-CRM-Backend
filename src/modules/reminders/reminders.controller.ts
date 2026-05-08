import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';
import { RemindersService } from './reminders.service';
import { CreateCustomerReminderDto } from './dto/create-customer-reminder.dto';
import { UpdateCustomerReminderDto } from './dto/update-customer-reminder.dto';

type JwtRequestUser = {
  id: string;
  email: string;
  role: UserRole;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers/:customerId/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  create(
    @Param('customerId') customerId: string,
    @Body() dto: CreateCustomerReminderDto,
    @Request() req: { user: JwtRequestUser },
  ) {
    return this.remindersService.create(customerId, dto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  findByCustomer(@Param('customerId') customerId: string, @Request() req: { user: JwtRequestUser }) {
    return this.remindersService.findByCustomer(customerId, req.user);
  }

  @Get(':reminderId')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  findOne(
    @Param('customerId') customerId: string,
    @Param('reminderId') reminderId: string,
    @Request() req: { user: JwtRequestUser },
  ) {
    return this.remindersService.findOne(customerId, reminderId, req.user);
  }

  @Patch(':reminderId')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  update(
    @Param('customerId') customerId: string,
    @Param('reminderId') reminderId: string,
    @Body() dto: UpdateCustomerReminderDto,
    @Request() req: { user: JwtRequestUser },
  ) {
    return this.remindersService.update(customerId, reminderId, dto, req.user);
  }

  @Delete(':reminderId')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  remove(
    @Param('customerId') customerId: string,
    @Param('reminderId') reminderId: string,
    @Request() req: { user: JwtRequestUser },
  ) {
    return this.remindersService.remove(customerId, reminderId, req.user);
  }
}
