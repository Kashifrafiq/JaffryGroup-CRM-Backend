import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';
import { ApplicationTypesService } from './application-types.service';

/**
 * Canonical list for dropdowns. Clients should call this at runtime and send
 * `applicationTypeId` or `applicationTypeCode` from the response on `POST /customers`
 * (and related APIs) so they stay in sync with the database.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('application-types')
export class ApplicationTypesController {
  constructor(private readonly applicationTypesService: ApplicationTypesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  findActive() {
    return this.applicationTypesService.findActive().then((rows) =>
      rows.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        sortOrder: t.sortOrder,
      })),
    );
  }
}
