import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AssociateProfile } from './associate-profile.entity';
import { CustomerApplicationDocument } from '../../applications/entities/customer-application-document.entity';

@Entity('associate_customer_application_documents')
@Unique(['associateId', 'customerApplicationDocumentId'])
export class AssociateCustomerApplicationDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  associateId!: string;

  @Column()
  customerApplicationDocumentId!: string;

  @ManyToOne(() => AssociateProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'associateId' })
  associate!: AssociateProfile;

  @ManyToOne(() => CustomerApplicationDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerApplicationDocumentId' })
  customerApplicationDocument!: CustomerApplicationDocument;
}
