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

@Entity('associates')
export class AssociateProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nullable for legacy rows; new associates must still provide email via API. */
  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ASSOCIATE,
  })
  role!: UserRole;

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

  @Column({ type: 'int', default: 0 })
  taskAssigned!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
