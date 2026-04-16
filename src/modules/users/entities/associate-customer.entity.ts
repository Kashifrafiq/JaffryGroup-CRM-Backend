import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AssociateProfile } from './associate-profile.entity';
import { CustomerProfile } from './customer-profile.entity';

@Entity('associate_customers')
@Unique(['associateId', 'customerId'])
export class AssociateCustomer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  associateId!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => AssociateProfile, { onDelete: 'CASCADE' })
  associate!: AssociateProfile;

  @ManyToOne(() => CustomerProfile, { onDelete: 'CASCADE' })
  customer!: CustomerProfile;
}
