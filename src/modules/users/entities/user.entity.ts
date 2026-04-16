import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { AdminProfile } from './admin-profile.entity';
import { AssociateProfile } from './associate-profile.entity';
import { CustomerProfile } from './customer-profile.entity';
import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  // Deprecated: kept temporarily for safe migration/backfill.
  @Column({ nullable: true })
  firstName?: string;

  // Deprecated: kept temporarily for safe migration/backfill.
  @Column({ nullable: true })
  lastName?: string;

  // Deprecated: kept temporarily for safe migration/backfill.
  @Column({ nullable: true })
  phoneNumber?: string;

  // Deprecated: kept temporarily for safe migration/backfill.
  @Column({ nullable: true })
  address?: string;

  // Deprecated: kept temporarily for safe migration/backfill.
  @Column({ nullable: true })
  dateOfBirth?: Date;

  // Deprecated: kept temporarily for safe migration/backfill.
  @Column({ nullable: true })
  profilePhoto?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @OneToOne(() => AdminProfile, (adminProfile) => adminProfile.user)
  adminProfile?: AdminProfile;

  @OneToOne(() => AssociateProfile, (associateProfile) => associateProfile.user)
  associateProfile?: AssociateProfile;

  @OneToOne(() => CustomerProfile, (customerProfile) => customerProfile.user)
  customerProfile?: CustomerProfile;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
