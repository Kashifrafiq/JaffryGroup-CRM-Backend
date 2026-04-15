import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BulkAssignAssociatesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  associateIds!: string[];
}

export class BulkAssignCustomersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  customerIds!: string[];
}
