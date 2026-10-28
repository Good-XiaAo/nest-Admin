import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { verify } from 'argon2';
import type { Server } from 'node:http';
import request from 'supertest';
import { createValidationPipe } from '../src/common/validation.pipe';
import { User, UserRole } from '../src/user/entities/user.entity';
import { UserModule } from '../src/user/user.module';
import {
  createDatabaseError,
  createUserRepositoryMock,
} from './support/user-repository.mock';

const input = { userName: 'reviewUser', password: 'Review1!' };

describe('POST /user (HTTP regression)', () => {
  let app: INestApplication<Server>;
  let repository: ReturnType<typeof createUserRepositoryMock>;

  beforeEach(async () => {
    repository = createUserRepositoryMock();
    const module = await Test.createTestingModule({ imports: [UserModule] })
      .overrideProvider(getRepositoryToken(User))
      .useValue(repository)
      .compile();
    app = module.createNestApplication<INestApplication<Server>>({
      logger: false,
    });
    app.useGlobalPipes(createValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('creates only a normal active account and stores a verifiable hash', async () => {
    const response = await request(app.getHttpServer())
      .post('/user')
      .send({ ...input, userName: '  reviewUser  ' })
      .expect(200);
    const saved = repository.save.mock.calls[0][0];

    expect(saved.userName).toBe(input.userName);
    expect(saved.role).toBe(UserRole.USER);
    expect(saved.isActive).toBe(true);
    expect(saved.password).toMatch(/^\$argon2id\$/);
    await expect(verify(saved.password, input.password)).resolves.toBe(true);
    expect(response.body).toMatchObject({
      status: 200,
      message: '创建成功',
      data: {
        id: 1,
        userName: input.userName,
        role: UserRole.USER,
        isActive: true,
      },
    });
    expect(response.body.data).not.toHaveProperty('password');
    expect(response.text).not.toContain(input.password);
    expect(response.text).not.toContain(saved.password);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['role', 'admin'],
    ['role', 'user'],
    ['isActive', true],
    ['isActive', false],
    ['id', 1],
    ['deletedAt', '2026-01-01T00:00:00Z'],
  ])(
    'rejects client-supplied %s before any database write',
    async (field, value) => {
      await request(app.getHttpServer())
        .post('/user')
        .send({ ...input, [field]: value })
        .expect(400);
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    },
  );

  it.each([
    { password: 'weak' },
    { userName: '   ' },
    { email: 'invalid-email' },
    { phone: '12345678901' },
  ])(
    'rejects invalid account data %j without writing',
    async (invalidFields) => {
      await request(app.getHttpServer())
        .post('/user')
        .send({ ...input, ...invalidFields })
        .expect(400);
      expect(repository.save).not.toHaveBeenCalled();
    },
  );

  it('accepts nullable profile fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/user')
      .send({
        ...input,
        nickname: null,
        email: null,
        phone: null,
        avatar: null,
      })
      .expect(200);
    expect(response.body).toMatchObject({
      status: 200,
      message: '创建成功',
      data: {
        nickname: null,
        email: null,
        phone: null,
        avatar: null,
      },
    });
  });

  it('returns a safe 409 for a duplicate unique field', async () => {
    repository.save.mockRejectedValueOnce(
      createDatabaseError(
        { code: 'ER_DUP_ENTRY', errno: 1062 },
        'Duplicate sensitive-value',
      ),
    );
    const response = await request(app.getHttpServer())
      .post('/user')
      .send(input)
      .expect(409);
    expect(response.body).toEqual({
      statusCode: 409,
      error: 'Conflict',
      code: 'USER_ALREADY_EXISTS',
      message: '用户名、邮箱或手机号已存在',
    });
    expect(response.text).not.toContain('sensitive-value');
    expect(response.text).not.toContain('INSERT');
    expect(response.text).not.toContain(input.password);
  });

  it('handles a duplicate raised during concurrent saves', async () => {
    repository.save.mockRejectedValueOnce(
      createDatabaseError({ code: 'ER_DUP_ENTRY', errno: 1062 }),
    );
    const responses = await Promise.all([
      request(app.getHttpServer()).post('/user').send(input),
      request(app.getHttpServer()).post('/user').send(input),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
    expect(repository.save).toHaveBeenCalledTimes(2);
  });

  it('keeps unrelated database failures as safe 500 responses', async () => {
    repository.save.mockRejectedValueOnce(
      createDatabaseError(
        { code: 'ER_BAD_NULL_ERROR', errno: 1048 },
        'sensitive-value',
      ),
    );
    const response = await request(app.getHttpServer())
      .post('/user')
      .send(input)
      .expect(500);
    expect(response.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    expect(response.text).not.toContain('sensitive-value');
    expect(response.text).not.toContain('INSERT');
    expect(response.text).not.toContain(input.password);
  });
});
