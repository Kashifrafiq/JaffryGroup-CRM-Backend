import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AssociateProfile } from './associate-profile.entity';
import { CustomerApplicationPipelineProgress } from '../../applications/entities/customer-application-pipeline-progress.entity';

@Entity('associate_pipeline_steps')
@Unique(['associateId', 'pipelineProgressId'])
export class AssociatePipelineStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  associateId!: string;

  @Column()
  pipelineProgressId!: string;

  @ManyToOne(() => AssociateProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'associateId' })
  associate!: AssociateProfile;

  @ManyToOne(() => CustomerApplicationPipelineProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipelineProgressId' })
  pipelineProgress!: CustomerApplicationPipelineProgress;
}
