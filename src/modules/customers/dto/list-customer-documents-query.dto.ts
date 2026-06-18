import { IsOptional, IsUUID } from 'class-validator';

export class ListCustomerDocumentsQueryDto {
  /** Associate profile id — returns only documents assigned to this associate. */
  @IsUUID()
  associateId!: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;
}
