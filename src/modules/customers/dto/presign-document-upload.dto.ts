import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PresignDocumentUploadDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  contentType!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  filename!: string;
}
