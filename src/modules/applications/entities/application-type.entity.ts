import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('application_types')
export class ApplicationType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Stable machine value (e.g. loc, mortgage_refinance); never rename in DB. */
  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  /** String form avoids circular imports with `CustomerApplication`. */
  @OneToMany('CustomerApplication', 'applicationType')
  applications?: unknown[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
