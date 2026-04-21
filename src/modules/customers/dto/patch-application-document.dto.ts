import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CustomerApplicationDocumentStatus } from '../../applications/entities/customer-application-document-status.enum';

export class PatchApplicationDocumentDto {
  @IsOptional()
  @IsEnum(CustomerApplicationDocumentStatus)
  status?: CustomerApplicationDocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
