import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AssociateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('associates')
export class AssociateProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nullable for legacy rows; new associates must still provide email via API. */
  @Column({ unique: true, nullable: true })
  email?: string;

  /** Job title / CRM role label (e.g. associate, manager, accountant). */
  @Column({ type: 'varchar', length: 128, default: 'associate' })
  role!: string;

  @Column({ nullable: true, unique: true })
  userId?: string;

  @OneToOne(() => User, (user) => user.associateProfile, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  profilePhoto?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastActive?: Date;

  @Column({ nullable: true })
  department?: string;

  @Column({
    type: 'enum',
    enum: AssociateStatus,
    default: AssociateStatus.ACTIVE,
  })
  status!: AssociateStatus;

  @Column({ type: 'int', default: 0 })
  taskAssigned!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
