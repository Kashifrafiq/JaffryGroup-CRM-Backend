import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApplicationType } from './application-type.entity';

@Entity('application_document_requirements')
@Unique(['applicationTypeId', 'requirementKey'])
export class ApplicationDocumentRequirement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  applicationTypeId!: string;

  @ManyToOne(() => ApplicationType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationTypeId' })
  applicationType!: ApplicationType;

  /** Stable slug, e.g. `loc_s0_i0`, used in storage keys. */
  @Column({ type: 'varchar', length: 160 })
  requirementKey!: string;

  @Column({ type: 'varchar', length: 512 })
  sectionTitle!: string;

  @Column({ type: 'text' })
  itemLabel!: string;

  @Column({ type: 'int' })
  sortOrder!: number;
}
