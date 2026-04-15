import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  ASSOCIATE = 'associate',
  CUSTOMER = 'customer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ nullable: true })
  phoneNumber!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  dateOfBirth!: Date;

  @Column({ nullable: true })
  profilePhoto!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToMany(() => User, (user) => user.customers)
  @JoinTable({
    name: 'associate_customers',
    joinColumn: { name: 'associateId' },
    inverseJoinColumn: { name: 'customerId' },
  })
  customers!: User[];

  @ManyToMany(() => User, (user) => user.associates)
  associates!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
