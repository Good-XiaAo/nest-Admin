import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
  IsIn,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32, { message: '用户名最大为32位' })
  @MinLength(2, { message: '用户名最少为2位' })
  userName!: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: '密码最大为20位' })
  @MinLength(6, { message: '密码最少为6位' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,20}$/,
    {
      message:
        '密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符',
    },
  )
  password!: string;
  @IsOptional()
  @IsString({ message: 'role必须是字符串' })
  @IsIn(Object.values(UserRole), { message: 'role必须是admin或user' })
  role?: UserRole;
  @IsOptional()
  @IsBoolean({ message: 'isActive必须是布尔值' })
  isActive?: boolean;
}
