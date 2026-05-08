import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customer_invites')
export class CustomerInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  firstName?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  lastName?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  phoneNumber?: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  property?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  profilePhoto?: string | null;

  @Column({ type: 'varchar', length: 64, unique: true })
  tokenHash!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date | null;

  @Column({ type: 'uuid' })
  createdByUserId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
