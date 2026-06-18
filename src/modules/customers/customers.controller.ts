import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { CustomersService } from './customers.service';
import { JwtActor } from './jwt-actor.type';
import { CreateCustomerApiDto } from './dto/create-customer-api.dto';
import { InviteCustomerDto } from './dto/invite-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { ListCustomerDocumentsQueryDto } from './dto/list-customer-documents-query.dto';
import { ListCustomerPipelineStepsQueryDto } from './dto/list-customer-pipeline-steps-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerApplicationDto } from './dto/create-customer-application.dto';
import { UpdateCustomerApplicationDto } from './dto/update-customer-application.dto';

type RequestWithJwtUser = {
  user: Pick<User, 'id' | 'email' | 'role'>;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  private actor(req: RequestWithJwtUser): JwtActor {
    return { id: req.user.id, role: req.user.role };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  create(@Body() dto: CreateCustomerApiDto, @Request() req: RequestWithJwtUser) {
    return this.customersService.create(dto, this.actor(req));
  }

  @Post('invite')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  invite(@Body() dto: InviteCustomerDto, @Request() req: RequestWithJwtUser) {
    return this.customersService.inviteCustomer(dto, this.actor(req));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  findAll(@Query() query: ListCustomersQueryDto, @Request() req: RequestWithJwtUser) {
    return this.customersService.findAll(this.actor(req), query);
  }

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  me(@Request() req: RequestWithJwtUser) {
    return this.customersService.findMyInfo(req.user.id);
  }

  @Get('me/pipeline')
  @Roles(UserRole.CUSTOMER)
  myPipeline(@Request() req: RequestWithJwtUser) {
    return this.customersService.findMyPipelineProgress(req.user.id);
  }

  @Get('me/documents')
  @Roles(UserRole.CUSTOMER)
  myDocuments(@Request() req: RequestWithJwtUser) {
    return this.customersService.findMyDocuments(req.user.id);
  }

  @Get(':customerId/pipeline-steps')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  findPipelineSteps(
    @Param('customerId') customerId: string,
    @Query() query: ListCustomerPipelineStepsQueryDto,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.customersService.findCustomerPipelineSteps(customerId, this.actor(req), query);
  }

  @Get(':customerId/documents')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  findDocuments(
    @Param('customerId') customerId: string,
    @Query() query: ListCustomerDocumentsQueryDto,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.customersService.findCustomerDocuments(customerId, this.actor(req), query);
  }

  @Get(':customerId')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  findOne(@Param('customerId') customerId: string, @Request() req: RequestWithJwtUser) {
    return this.customersService.findOneDetail(customerId, this.actor(req));
  }

  @Patch(':customerId')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  update(
    @Param('customerId') customerId: string,
    @Body() dto: UpdateCustomerDto,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.customersService.updateCustomer(customerId, dto, this.actor(req));
  }

  @Delete(':customerId')
  @Roles(UserRole.ADMIN)
  remove(@Param('customerId') customerId: string, @Request() req: RequestWithJwtUser) {
    return this.customersService.removeCustomer(customerId, this.actor(req));
  }

  @Post(':customerId/applications')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  addApplication(
    @Param('customerId') customerId: string,
    @Body() dto: CreateCustomerApplicationDto,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.customersService.addApplication(customerId, dto, this.actor(req));
  }

  @Patch(':customerId/applications/:applicationId')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  updateApplication(
    @Param('customerId') customerId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateCustomerApplicationDto,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.customersService.updateApplication(customerId, applicationId, dto, this.actor(req));
  }

  @Delete(':customerId/applications/:applicationId')
  @Roles(UserRole.ADMIN)
  removeApplication(
    @Param('customerId') customerId: string,
    @Param('applicationId') applicationId: string,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.customersService.removeApplication(customerId, applicationId, this.actor(req));
  }
}
