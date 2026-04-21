import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerProfile } from '../../users/entities/customer-profile.entity';
import { ApplicationType } from '../../applications/entities/application-type.entity';
import { CustomerApplicationStatus } from './customer-application-status.enum';

@Entity('customer_applications')
export class CustomerApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CustomerProfile, (c) => c.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerProfile;

  @Column()
  customerId!: string;

  @ManyToOne(() => ApplicationType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'applicationTypeId' })
  applicationType!: ApplicationType;

  @Column()
  applicationTypeId!: string;

  @Column({ type: 'varchar', length: 32, default: CustomerApplicationStatus.DRAFT })
  status!: CustomerApplicationStatus;

  @Column({ type: 'jsonb', nullable: true })
  pipeline?: Record<string, unknown> | null;

  @OneToMany('CustomerApplicationPipelineProgress', 'customerApplication')
  pipelineProgress?: import('../../applications/entities/customer-application-pipeline-progress.entity').CustomerApplicationPipelineProgress[];

  @OneToMany('CustomerApplicationDocument', 'customerApplication')
  applicationDocuments?: import('../../applications/entities/customer-application-document.entity').CustomerApplicationDocument[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
