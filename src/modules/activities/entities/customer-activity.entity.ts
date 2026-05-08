import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerProfile } from '../../users/entities/customer-profile.entity';
import { AssociateProfile } from '../../users/entities/associate-profile.entity';

@Entity('customer_activities')
export class CustomerActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => CustomerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerProfile;

  @Column({ nullable: true })
  associateId?: string | null;

  @ManyToOne(() => AssociateProfile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'associateId' })
  associate?: AssociateProfile | null;

  @Column({ type: 'varchar', length: 100 })
  activityType!: string;

  @Column({ type: 'text' })
  details!: string;

  @Column()
  createdByUserId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
