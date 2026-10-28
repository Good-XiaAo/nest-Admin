import { jest } from '@jest/globals';
import { QueryFailedError } from 'typeorm';
import type { DeepPartial } from 'typeorm';
import { User } from '../../src/user/entities/user.entity';

export interface UserRepositoryMock {
  create: jest.Mock<(data: DeepPartial<User>) => User>;
  save: jest.Mock<(user: User) => Promise<User>>;
}

export function createUserRepositoryMock(): UserRepositoryMock {
  let nextId = 1;
  return {
    create: jest
      .fn<(data: DeepPartial<User>) => User>()
      .mockImplementation((data) => Object.assign(new User(), data)),
    save: jest.fn<(user: User) => Promise<User>>().mockImplementation((user) =>
      Promise.resolve(
        Object.assign(new User(), user, {
          id: nextId++,
          lastLoginAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          deletedAt: null,
        }),
      ),
    ),
  };
}

export function createDatabaseError(
  details: { code?: string; errno?: number },
  message = 'Database query failed',
) {
  return new QueryFailedError(
    'INSERT INTO users (...) VALUES (...)',
    ['sensitive-value'],
    Object.assign(new Error(message), details),
  );
}
