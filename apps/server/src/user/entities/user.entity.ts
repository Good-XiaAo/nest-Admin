import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ unique: true })
  userName: string;
  @Column({ select: false })
  password: string;
  @Column({ default: 'admin' })
  role!: string;
  @Column({ default: true })
  isActive!: boolean;
}
