import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';
import { ActivitiesService } from './activities.service';
import { CreateCustomerActivityDto } from './dto/create-customer-activity.dto';

type JwtRequestUser = {
  id: string;
  email: string;
  role: UserRole;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers/:customerId/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  create(
    @Param('customerId') customerId: string,
    @Body() dto: CreateCustomerActivityDto,
    @Request() req: { user: JwtRequestUser },
  ) {
    return this.activitiesService.create(customerId, dto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  findByCustomer(@Param('customerId') customerId: string, @Request() req: { user: JwtRequestUser }) {
    return this.activitiesService.findByCustomer(customerId, req.user);
  }

  @Delete(':activityId')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  remove(
    @Param('customerId') customerId: string,
    @Param('activityId') activityId: string,
    @Request() req: { user: JwtRequestUser },
  ) {
    return this.activitiesService.remove(customerId, activityId, req.user);
  }
}
