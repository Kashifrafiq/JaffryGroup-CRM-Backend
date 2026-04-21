import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customer_application_pipeline_progress')
@Unique(['customerApplicationId', 'stepIndex'])
export class CustomerApplicationPipelineProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerApplicationId!: string;

  @ManyToOne('CustomerApplication', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerApplicationId' })
  customerApplication!: unknown;

  @Column({ type: 'int' })
  stepIndex!: number;

  @Column({ type: 'varchar', length: 512 })
  title!: string;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
