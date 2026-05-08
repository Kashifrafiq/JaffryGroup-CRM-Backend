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
import { CustomerReminderStatus } from './customer-reminder.enums';

@Entity('customer_reminders')
export class CustomerReminder {
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

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'timestamp' })
  remindAt!: Date;

  @Column({
    type: 'enum',
    enum: CustomerReminderStatus,
    default: CustomerReminderStatus.PENDING,
  })
  status!: CustomerReminderStatus;

  @Column()
  createdByUserId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
