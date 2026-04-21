import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import type { CustomerApplication } from '../../customers/entities/customer-application.entity';

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

  /**
   * @deprecated Use `customer_applications` + `application_types`. Kept for legacy rows only.
   */
  @Column({ type: 'varchar', length: 128, nullable: true })
  applicationType?: string;

  /** Resolved at runtime via entity name to avoid circular imports. */
  @OneToMany('CustomerApplication', 'customer')
  applications?: CustomerApplication[];

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
