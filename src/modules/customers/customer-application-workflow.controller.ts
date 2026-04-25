import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { JwtActor } from './jwt-actor.type';
import { CustomerApplicationWorkflowService } from './customer-application-workflow.service';
import { PatchPipelineStepDto } from './dto/patch-pipeline-step.dto';
import { PresignDocumentUploadDto } from './dto/presign-document-upload.dto';
import { CompleteDocumentUploadDto } from './dto/complete-document-upload.dto';
import { PatchApplicationDocumentDto } from './dto/patch-application-document.dto';

type RequestWithJwtUser = {
  user: Pick<User, 'id' | 'email' | 'role'>;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomerApplicationWorkflowController {
  constructor(private readonly workflowService: CustomerApplicationWorkflowService) {}

  private actor(req: RequestWithJwtUser): JwtActor {
    return { id: req.user.id, role: req.user.role };
  }

  @Get(':customerId/applications/:applicationId/workflow')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  getWorkflow(
    @Param('customerId') customerId: string,
    @Param('applicationId') applicationId: string,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.workflowService.getWorkflow(customerId, applicationId, this.actor(req));
  }

  @Patch(':customerId/applications/:applicationId/pipeline-steps/:stepIndex')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  patchPipelineStep(
    @Param('customerId') customerId: string,
    @Param('applicationId') applicationId: string,
    @Param('stepIndex', ParseIntPipe) stepIndex: number,
    @Body() dto: PatchPipelineStepDto,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.workflowService.patchPipelineStep(
      customerId,
      applicationId,
      stepIndex,
      dto.completed,
      this.actor(req),
    );
  }

  @Post(':customerId/applications/:applicationId/documents/:documentId/presign')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  presignUpload(
    @Param('customerId') customerId: string,
    @Param('applicationId') applicationId: string,
    @Param('documentId') documentId: string,
    @Body() dto: PresignDocumentUploadDto,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.workflowService.presignDocumentUpload(
      customerId,
      applicationId,
      documentId,
      dto,
      this.actor(req),
    );
  }

  @Post(':customerId/applications/:applicationId/documents/:documentId/complete')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  completeUpload(
    @Param('customerId') customerId: string,
    @Param('applicationId') applicationId: string,
    @Param('documentId') documentId: string,
    @Body() dto: CompleteDocumentUploadDto,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.workflowService.completeDocumentUpload(
      customerId,
      applicationId,
      documentId,
      dto,
      this.actor(req),
    );
  }

  @Patch(':customerId/applications/:applicationId/documents/:documentId')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  patchDocument(
    @Param('customerId') customerId: string,
    @Param('applicationId') applicationId: string,
    @Param('documentId') documentId: string,
    @Body() dto: PatchApplicationDocumentDto,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.workflowService.patchDocument(
      customerId,
      applicationId,
      documentId,
      dto,
      this.actor(req),
    );
  }

  @Get(':customerId/applications/:applicationId/documents/:documentId/read-url')
  @Roles(UserRole.ADMIN, UserRole.ASSOCIATE)
  getDocumentReadUrl(
    @Param('customerId') customerId: string,
    @Param('applicationId') applicationId: string,
    @Param('documentId') documentId: string,
    @Request() req: RequestWithJwtUser,
  ) {
    return this.workflowService.getDocumentReadUrl(
      customerId,
      applicationId,
      documentId,
      this.actor(req),
    );
  }
}
