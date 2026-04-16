import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AssociateProfile } from '../../users/entities/associate-profile.entity';
import { TaskPriority, TaskStatus } from './task.enums';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  /** Maps to legacy DB column `information`. */
  @Column({ type: 'text', nullable: true, name: 'information' })
  description?: string | null;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  /** Maps to legacy DB column `dueDate`. */
  @Column({ type: 'timestamp', name: 'dueDate' })
  endDate!: Date;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @ManyToOne(() => AssociateProfile, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'associateAssignedId' })
  assignedTo?: AssociateProfile | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
