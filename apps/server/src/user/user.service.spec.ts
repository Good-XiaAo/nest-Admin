import { beforeEach, describe, expect, it } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { needsRehash, verify } from 'argon2';
import {
  createDatabaseError,
  createUserRepositoryMock,
} from '../../test/support/user-repository.mock';
import { User, UserRole } from './entities/user.entity';
import { UserService } from './user.service';

const input = { userName: 'reviewUser', password: 'Review1!' };

describe('UserService', () => {
  let service: UserService;
  let repository: ReturnType<typeof createUserRepositoryMock>;

  beforeEach(async () => {
    repository = createUserRepositoryMock();
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repository },
      ],
    }).compile();
    service = module.get(UserService);
  });

  it('hashes the password before persisting and never returns the password/hash', async () => {
    const result = await service.createUser(input);
    const saved = repository.save.mock.calls[0][0];

    expect(saved.password).toMatch(/^\$argon2id\$/);
    expect(saved.password).not.toBe(input.password);
    expect(
      needsRehash(saved.password, {
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      }),
    ).toBe(false);
    await expect(verify(saved.password, input.password)).resolves.toBe(true);
    await expect(verify(saved.password, 'Incorrect1!')).resolves.toBe(false);
    expect(result).toMatchObject({
      status: HttpStatus.OK,
      message: '创建成功',
      data: {
      id: 1,
      userName: input.userName,
      role: UserRole.USER,
      isActive: true,
      },
    });
    expect(result.data).not.toHaveProperty('password');
    expect(JSON.stringify(result)).not.toContain(saved.password);
    expect(JSON.stringify(result)).not.toContain(input.password);
  });

  it('generates distinct salts for accounts using the same password', async () => {
    await service.createUser(input);
    await service.createUser({ ...input, userName: 'anotherUser' });
    const first = repository.save.mock.calls[0][0].password;
    const second = repository.save.mock.calls[1][0].password;

    expect(first).not.toBe(second);
    await expect(verify(first, input.password)).resolves.toBe(true);
    await expect(verify(second, input.password)).resolves.toBe(true);
  });

  it('ignores administrative and generated fields even when called directly', async () => {
    const untrustedInput = {
      ...input,
      role: UserRole.ADMIN,
      isActive: false,
      id: 999,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(),
      internalToken: 'not-bindable',
    };

    await service.createUser(untrustedInput);

    expect(repository.create).toHaveBeenCalledWith({
      userName: input.userName,
      password: expect.any(String),
      nickname: null,
      email: null,
      phone: null,
      avatar: null,
      role: UserRole.USER,
      isActive: true,
    });
    expect(untrustedInput.password).toBe(input.password);
    expect(untrustedInput.role).toBe(UserRole.ADMIN);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.role).toBe(UserRole.USER);
    expect(saved.isActive).toBe(true);
    expect(saved.id).toBeUndefined();
    expect(saved.deletedAt).toBeUndefined();
    expect(saved).not.toHaveProperty('internalToken');
  });

  it('preserves valid profile fields without mutating the input DTO', async () => {
    const profile = Object.freeze({
      ...input,
      nickname: 'Example',
      email: 'user@example.com',
      phone: '13800138000',
      avatar: '/avatars/user.png',
    });
    const result = await service.createUser(profile);

    expect(result.data).toMatchObject({
      nickname: profile.nickname,
      email: profile.email,
      phone: profile.phone,
      avatar: profile.avatar,
    });
    expect(profile.password).toBe(input.password);
  });

  it('accepts null for optional profile fields', async () => {
    const result = await service.createUser({
      ...input,
      nickname: null,
      email: null,
      phone: null,
      avatar: null,
    });
    expect(result.data).toMatchObject({
      nickname: null,
      email: null,
      phone: null,
      avatar: null,
    });
  });

  it('does not expose extra properties from the saved entity', async () => {
    repository.save.mockResolvedValueOnce(
      Object.assign(new User(), {
        id: 1,
        userName: input.userName,
        password: 'private-hash',
        internalToken: 'private-token',
      }),
    );
    const result = await service.createUser(input);

    expect(result.data).not.toHaveProperty('password');
    expect(result.data).not.toHaveProperty('internalToken');
    expect(JSON.stringify(result)).not.toContain('private-');
  });

  it.each([{ code: 'ER_DUP_ENTRY' }, { errno: 1062 }])(
    'maps a MySQL duplicate error %j to a safe 409 conflict',
    async (details) => {
      repository.save.mockRejectedValueOnce(
        createDatabaseError(details, 'Duplicate sensitive-value'),
      );
      await expect(service.createUser(input)).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
        response: {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          code: 'USER_ALREADY_EXISTS',
          message: '用户名、邮箱或手机号已存在',
        },
      });
    },
  );

  it('preserves unrelated database errors instead of reporting a conflict', async () => {
    const error = createDatabaseError({
      code: 'ER_BAD_NULL_ERROR',
      errno: 1048,
    });
    repository.save.mockRejectedValueOnce(error);
    await expect(service.createUser(input)).rejects.toBe(error);
  });

  it('preserves unexpected errors', async () => {
    const error = new Error('Connection unavailable');
    repository.save.mockRejectedValueOnce(error);
    await expect(service.createUser(input)).rejects.toBe(error);
  });
});
