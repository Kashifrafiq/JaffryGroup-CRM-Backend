import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { BulkAssignAssociatesDto, BulkAssignCustomersDto } from './dto/bulk-assign.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type JwtRequestUser = {
  id: string;
  email: string;
  role: UserRole;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  create(@Body() createUserDto: CreateUserDto, @Request() req: { user: JwtRequestUser }) {
    return this.usersService.create(createUserDto, req.user);
  }

  @Post('associates')
  @Roles(UserRole.ADMIN)
  createAssociate(
    @Body() createAssociateDto: CreateAssociateDto,
    @Request() req: { user: JwtRequestUser },
  ) {
    return this.usersService.createAssociate(createAssociateDto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('my-customers')
  @Roles(UserRole.ASSOCIATE)
  getMyCustomers(@Request() req: { user: JwtRequestUser }) {
    return this.usersService.findAssignedCustomers(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':customerId/assign/:associateId')
  @Roles(UserRole.ADMIN)
  assign(
    @Param('customerId') customerId: string,
    @Param('associateId') associateId: string,
  ) {
    return this.usersService.assignCustomerToAssociate(customerId, associateId);
  }

  @Patch(':customerId/assign-associates')
  @Roles(UserRole.ADMIN)
  assignCustomerToMultipleAssociates(
    @Param('customerId') customerId: string,
    @Body() body: BulkAssignAssociatesDto,
  ) {
    return this.usersService.assignCustomerToAssociates(customerId, body.associateIds);
  }

  @Patch(':associateId/assign-customers')
  @Roles(UserRole.ADMIN)
  assignMultipleCustomersToAssociate(
    @Param('associateId') associateId: string,
    @Body() body: BulkAssignCustomersDto,
  ) {
    return this.usersService.assignCustomersToAssociate(associateId, body.customerIds);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
