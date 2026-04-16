import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { AssociatesService } from './associates.service';

type JwtRequestUser = {
  id: string;
  email: string;
  role: UserRole;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('associates')
export class AssociatesController {
  constructor(private readonly associatesService: AssociatesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createAssociateDto: CreateAssociateDto, @Request() req: { user: JwtRequestUser }) {
    return this.associatesService.createAssociate(createAssociateDto, req.user);
  }
}
