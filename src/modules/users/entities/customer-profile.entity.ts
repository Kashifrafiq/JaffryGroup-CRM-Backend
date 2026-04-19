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
import { UserRole } from './user-role.enum';

@Entity('customers')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nullable for legacy rows; new customers must still provide email via API. */
  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @Column({ nullable: true, unique: true })
  userId?: string;

  @OneToOne(() => User, (user) => user.customerProfile, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  /** Property address or description for the application. */
  @Column({ type: 'varchar', length: 1024, nullable: true })
  property?: string;

  /** e.g. purchase, refinance — stored as free text for flexibility. */
  @Column({ type: 'varchar', length: 128, nullable: true })
  applicationType?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  profilePhoto?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
