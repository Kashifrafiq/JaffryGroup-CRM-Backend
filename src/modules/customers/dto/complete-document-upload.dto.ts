import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CompleteDocumentUploadDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1024)
  storageKey!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  originalFilename!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  /** Stored as string for bigint compatibility; JSON may send a number — coerce for clients. */
  @Transform(({ value }) => (value === null || value === undefined ? value : String(value)))
  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  sizeBytes!: string;
}
