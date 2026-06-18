import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CustomerApplicationDocument } from './customer-application-document.entity';

@Entity('customer_application_document_files')
export class CustomerApplicationDocumentFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerApplicationDocumentId!: string;

  @ManyToOne(() => CustomerApplicationDocument, (doc) => doc.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerApplicationDocumentId' })
  customerApplicationDocument!: CustomerApplicationDocument;

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

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedByUser?: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}
