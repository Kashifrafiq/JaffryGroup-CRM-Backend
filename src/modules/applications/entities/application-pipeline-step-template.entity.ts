import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApplicationType } from './application-type.entity';

@Entity('application_pipeline_step_templates')
@Unique(['applicationTypeId', 'stepIndex'])
export class ApplicationPipelineStepTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  applicationTypeId!: string;

  @ManyToOne(() => ApplicationType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationTypeId' })
  applicationType!: ApplicationType;

  @Column({ type: 'int' })
  stepIndex!: number;

  @Column({ type: 'varchar', length: 512 })
  title!: string;
}
