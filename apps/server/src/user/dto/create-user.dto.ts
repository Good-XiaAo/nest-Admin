import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @Transform(
    ({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    { toClassOnly: true },
  )
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(2, 32, { message: '用户名长度必须为2～32个字符' })
  userName!: string;

  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 20, { message: '密码长度必须为6～20个字符' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        '密码只能包含字母、数字和 @$!%*?&，且必须包含大写字母、小写字母、数字和特殊字符',
    },
  )
  password!: string;

  // 可空资料字段允许省略，也允许传入 null。
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(32, { message: '昵称最多为32个字符' })
  nickname?: string | null;

  @IsOptional()
  @IsString({ message: '邮箱必须是字符串' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(255, { message: '邮箱最多为255个字符' })
  email?: string | null;

  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string | null;

  @IsOptional()
  @IsString({ message: '头像必须是字符串' })
  @MaxLength(255, { message: '头像最多为255个字符' })
  avatar?: string | null;

  // 非空字段仅在省略时跳过校验，显式传入 null 必须拒绝。
  @ValidateIf((_object: CreateUserDto, value: unknown) => value !== undefined)
  @IsEnum(UserRole, { message: 'role必须是admin或user' })
  role?: UserRole;

  @ValidateIf((_object: CreateUserDto, value: unknown) => value !== undefined)
  @IsBoolean({ message: 'isActive必须是布尔值' })
  isActive?: boolean;
}
