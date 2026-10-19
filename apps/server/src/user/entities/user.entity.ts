import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** 用户角色 */
export enum UserRole {
  /** 管理员 */
  ADMIN = 'admin',
  /** 普通用户 */
  USER = 'user',
}

@Entity({ name: 'users', comment: '用户表' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true, comment: '主键ID' })
  id!: number;

  @Column({ type: 'varchar', length: 32, unique: true, comment: '用户名' })
  userName!: string;

  @Column({ type: 'varchar', length: 255, select: false, comment: '密码' })
  password!: string;

  @Column({ type: 'varchar', length: 32, nullable: true, comment: '昵称' })
  nickname!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
    comment: '邮箱',
  })
  email!: string | null;

  @Column({
    type: 'varchar',
    length: 11,
    unique: true,
    nullable: true,
    comment: '手机号',
  })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '头像' })
  avatar!: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: '角色:admin=管理员,user=普通用户',
  })
  role!: UserRole;

  @Column({ default: true, comment: '是否激活' })
  isActive!: boolean;

  @Column({ type: 'datetime', nullable: true, comment: '最后登录时间' })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true, comment: '删除时间' })
  deletedAt!: Date | null;
}
