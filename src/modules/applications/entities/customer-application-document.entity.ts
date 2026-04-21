import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationDocumentRequirement } from './application-document-requirement.entity';
import { CustomerApplicationDocumentStatus } from './customer-application-document-status.enum';

@Entity('customer_application_documents')
@Unique(['customerApplicationId', 'documentRequirementId'])
export class CustomerApplicationDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerApplicationId!: string;

  @ManyToOne('CustomerApplication', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerApplicationId' })
  customerApplication!: unknown;

  @Column()
  documentRequirementId!: string;

  @ManyToOne(() => ApplicationDocumentRequirement, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'documentRequirementId' })
  requirement!: ApplicationDocumentRequirement;

  @Column({
    type: 'varchar',
    length: 24,
    default: CustomerApplicationDocumentStatus.PENDING,
  })
  status!: CustomerApplicationDocumentStatus;

  /** S3 object key (or compatible object store). Set when presign is issued or on complete. */
  @Column({ type: 'varchar', length: 1024, nullable: true })
  storageKey?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bucket?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  originalFilename?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mimeType?: string | null;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  uploadedAt?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  uploadedByUserId?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
