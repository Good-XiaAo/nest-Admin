import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService, type CreateUserResponse } from './user.service';

const input = { userName: 'reviewUser', password: 'Review1!' };

describe('UserController', () => {
  let controller: UserController;
  const userService = { createUser: jest.fn<UserService['createUser']>() };

  beforeEach(async () => {
    userService.createUser.mockReset();
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();
    controller = module.get(UserController);
  });

  it('delegates creation to the service and returns the safe response', async () => {
    const result: CreateUserResponse = {
      status: 200,
      message: '创建成功',
      data: {
        id: 1,
        userName: input.userName,
        nickname: null,
        email: null,
        phone: null,
        avatar: null,
        role: UserRole.USER,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    };
    userService.createUser.mockResolvedValueOnce(result);

    await expect(controller.createUser(input)).resolves.toBe(result);
    expect(userService.createUser).toHaveBeenCalledTimes(1);
    expect(userService.createUser).toHaveBeenCalledWith(input);
  });

  it('propagates conflicts for the HTTP exception layer', async () => {
    const error = new ConflictException('Account already exists');
    userService.createUser.mockRejectedValueOnce(error);
    await expect(controller.createUser(input)).rejects.toBe(error);
  });
});
