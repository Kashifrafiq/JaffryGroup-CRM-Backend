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
import { ApplicationPipelineStepTemplate } from './application-pipeline-step-template.entity';

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

  @Column({ type: 'uuid', nullable: true })
  pipelineStepTemplateId?: string | null;

  @ManyToOne(() => ApplicationPipelineStepTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pipelineStepTemplateId' })
  pipelineStepTemplate?: ApplicationPipelineStepTemplate | null;

  @Column({ type: 'int' })
  stepIndex!: number;

  @Column({ type: 'varchar', length: 512 })
  title!: string;

  @Column({ type: 'boolean', default: false })
  isCustom!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
