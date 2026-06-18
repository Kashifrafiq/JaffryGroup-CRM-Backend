import { IsArray, IsUUID } from 'class-validator';

export class DocumentAssignmentDto {
  @IsUUID()
  documentId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  associateIds!: string[];
}
