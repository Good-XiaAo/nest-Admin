import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { argon2id, hash } from 'argon2';
import * as svgCaptcha from 'svg-captcha';

export type PublicUser = Omit<User, 'password'>;

export interface CreateUserResponse {
  status: HttpStatus.OK;
  message: string;
  data: PublicUser;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async createUser(createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    const user = this.userRepository.create({
      userName: createUserDto.userName,
      password: await hash(createUserDto.password, {
        type: argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      }),
      nickname: createUserDto.nickname ?? null,
      email: createUserDto.email ?? null,
      phone: createUserDto.phone ?? null,
      avatar: createUserDto.avatar ?? null,
      role: UserRole.ADMIN,
      isActive: true,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      return {
        status: HttpStatus.OK,
        message: '创建成功',
        data: {
          id: savedUser.id,
          userName: savedUser.userName,
          nickname: savedUser.nickname,
          email: savedUser.email,
          phone: savedUser.phone,
          avatar: savedUser.avatar,
          role: savedUser.role,
          isActive: savedUser.isActive,
          lastLoginAt: savedUser.lastLoginAt,
          createdAt: savedUser.createdAt,
          updatedAt: savedUser.updatedAt,
          deletedAt: savedUser.deletedAt,
        },
      };
    } catch (error: unknown) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          code: 'USER_ALREADY_EXISTS',
          message: '用户名、邮箱或手机号已存在',
        });
      }
      throw error;
    }
  }

  private isDuplicateEntry(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;

    const driverError: unknown = error.driverError;
    if (driverError === null || typeof driverError !== 'object') return false;

    return (
      ('code' in driverError && driverError.code === 'ER_DUP_ENTRY') ||
      ('errno' in driverError && driverError.errno === 1062)
    );
  }

  createCode(session: Record<string, any>) {
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 120,
      height: 38,
      background: '#cc9966',
    });
    session.code = captcha.text;
    return captcha.data;
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(username: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ userName: username });
    if (!user) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    void updateUserDto;
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
