/**
 * @fileoverview 個別ユーザー情報API（/api/users/[id]）のユニットテスト - ヘッダーベース認証対応版
 */

import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { type UpdateUserInput, type User, UserRole } from '@/domain/entities/User';
import { DELETE, GET, PATCH } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

describe('/api/users/[id] API エンドポイント', () => {
  let mockContainer: {
    userUseCase: {
      getUserById: jest.MockedFunction<(id: string) => Promise<User | null>>;
      updateUser: jest.MockedFunction<
        (id: string, data: UpdateUserInput) => Promise<User>
      >;
      updateUserAsAdmin: jest.MockedFunction<
        (id: string, data: UpdateUserInput) => Promise<User>
      >;
      deleteUser: jest.MockedFunction<(id: string) => Promise<void>>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockContainer = {
      userUseCase: {
        getUserById: jest.fn(),
        updateUser: jest.fn(),
        updateUserAsAdmin: jest.fn(),
        deleteUser: jest.fn(),
      },
    };

    // Container のモック設定
    const { Container } = jest.requireMock('@/lib/container');
    Container.getInstance = jest.fn(() => mockContainer);

    // Response関数のモック設定
    const responseLib = jest.requireMock('@/lib/response');
    responseLib.success = jest.fn(() => new Response('success'));
    responseLib.error = jest.fn(() => new Response('error'));
    responseLib.unauthorized = jest.fn(() => new Response('unauthorized'));
    responseLib.forbidden = jest.fn(() => new Response('forbidden'));
    responseLib.notFound = jest.fn(() => new Response('not found'));
    responseLib.internalError = jest.fn(() => new Response('internal error'));
  });

  describe('GET /api/users/[id] - 個別ユーザー取得', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as unknown as NextRequest;
    };

    it('管理者として他のユーザー情報を取得できる', async () => {
      const request = createMockRequest({
        'x-user-id': 'admin-123',
        'x-user-role': String(UserRole.ADMIN),
      });

      const mockUser: User = {
        id: 'target-user-id',
        username: 'targetuser',
        passwordHash: 'hashedpassword',
        firstName: 'Target',
        lastName: 'User',
        firstNameRuby: undefined,
        lastNameRuby: undefined,
        role: UserRole.USER,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'admin-123',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        updatedBy: 'admin-123',
        deleted: false,
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue(mockUser);

      await GET(request, { params: Promise.resolve({ id: 'target-user-id' }) });

      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith(
        'target-user-id',
      );
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request, { params: Promise.resolve({ id: 'user-123' }) });

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('一般ユーザーが他のユーザー情報にアクセスしようとすると403エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': String(UserRole.USER),
      });

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request, { params: Promise.resolve({ id: 'other-user-id' }) });

      expect(responseLib.forbidden).toHaveBeenCalledWith(
        'このユーザー情報にアクセスする権限がありません',
      );
    });

    it('一般ユーザーが自分の情報を取得できる', async () => {
      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': String(UserRole.USER),
      });

      const mockUser: User = {
        id: 'user-123',
        username: 'selfuser',
        passwordHash: 'hashedpassword',
        firstName: 'Self',
        lastName: 'User',
        firstNameRuby: undefined,
        lastNameRuby: undefined,
        role: UserRole.USER,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'admin-123',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        updatedBy: 'admin-123',
        deleted: false,
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue(mockUser);

      await GET(request, { params: Promise.resolve({ id: 'user-123' }) });

      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-123');
    });

    it('ユーザーが見つからない場合は404エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'admin-123',
        'x-user-role': String(UserRole.ADMIN),
      });

      mockContainer.userUseCase.getUserById.mockResolvedValue(null);

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request, { params: Promise.resolve({ id: 'nonexistent-id' }) });

      expect(responseLib.notFound).toHaveBeenCalledWith('ユーザーが見つかりません');
    });

    it('予期しないエラーが発生した場合は500エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'admin-123',
        'x-user-role': String(UserRole.ADMIN),
      });

      mockContainer.userUseCase.getUserById.mockRejectedValue(
        new Error('Database connection error'),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request, { params: Promise.resolve({ id: 'user-123' }) });

      expect(responseLib.internalError).toHaveBeenCalledWith(
        'ユーザー情報の取得に失敗しました',
      );
    });
  });

  describe('PATCH /api/users/[id] - ユーザー情報更新', () => {
    const createMockRequest = (
      headers: Record<string, string> = {},
      body: Record<string, unknown> = {},
    ) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    it('管理者として他のユーザー情報を更新できる', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
        },
      );

      const mockUser: User = {
        id: 'target-user-id',
        username: 'targetuser',
        passwordHash: 'hashedpassword',
        firstName: 'Updated',
        lastName: 'Name',
        firstNameRuby: undefined,
        lastNameRuby: undefined,
        role: UserRole.USER,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'admin-123',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        updatedBy: 'admin-123',
        deleted: false,
      };

      mockContainer.userUseCase.updateUserAsAdmin.mockResolvedValue(mockUser);

      await PATCH(request, { params: Promise.resolve({ id: 'target-user-id' }) });

      expect(mockContainer.userUseCase.updateUserAsAdmin).toHaveBeenCalledWith(
        'target-user-id',
        {
          firstName: 'Updated',
          lastName: 'Name',
        },
      );
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest(
        {},
        {
          firstName: 'Updated',
          lastName: 'Name',
        },
      );

      const responseLib = jest.requireMock('@/lib/response');

      await PATCH(request, { params: Promise.resolve({ id: 'user-123' }) });

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('一般ユーザーが他のユーザー情報を更新しようとすると403エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': String(UserRole.USER),
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
        },
      );

      const responseLib = jest.requireMock('@/lib/response');

      await PATCH(request, { params: Promise.resolve({ id: 'other-user-id' }) });

      expect(responseLib.forbidden).toHaveBeenCalledWith(
        'このユーザー情報を更新する権限がありません',
      );
    });

    it('一般ユーザーが自分の情報を更新できる', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': String(UserRole.USER),
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
        },
      );

      const mockUser: User = {
        id: 'user-123',
        username: 'selfuser',
        passwordHash: 'hashedpassword',
        firstName: 'Updated',
        lastName: 'Name',
        firstNameRuby: undefined,
        lastNameRuby: undefined,
        role: UserRole.USER,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'admin-123',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        updatedBy: 'admin-123',
        deleted: false,
      };

      mockContainer.userUseCase.updateUser.mockResolvedValue(mockUser);

      await PATCH(request, { params: Promise.resolve({ id: 'user-123' }) });

      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith('user-123', {
        firstName: 'Updated',
        lastName: 'Name',
      });
    });

    it('バリデーションエラーが発生した場合は400エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        {
          firstName: '', // 無効なデータ
        },
      );

      mockContainer.userUseCase.updateUserAsAdmin.mockRejectedValue(
        new ZodError([
          {
            code: 'too_small',
            minimum: 1,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'First name is required',
            path: ['firstName'],
          },
        ]),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await PATCH(request, { params: Promise.resolve({ id: 'user-123' }) });

      expect(responseLib.error).toHaveBeenCalledWith(
        '入力データが正しくありません',
        400,
      );
    });

    it('ユーザーが見つからない場合は404エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        {
          firstName: 'Updated',
        },
      );

      mockContainer.userUseCase.updateUserAsAdmin.mockRejectedValue(
        new Error('ユーザーが見つかりません'),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await PATCH(request, { params: Promise.resolve({ id: 'nonexistent-id' }) });

      expect(responseLib.notFound).toHaveBeenCalledWith('ユーザーが見つかりません');
    });

    it('ユーザー名重複エラーが発生した場合は409エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        {
          username: 'duplicateuser',
        },
      );

      mockContainer.userUseCase.updateUserAsAdmin.mockRejectedValue(
        new Error('このユーザー名は既に使用されています'),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await PATCH(request, { params: Promise.resolve({ id: 'user-123' }) });

      expect(responseLib.error).toHaveBeenCalledWith(
        'このユーザー名は既に使用されています',
        409,
      );
    });

    it('予期しないエラーが発生した場合は500エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        {
          firstName: 'Updated',
        },
      );

      mockContainer.userUseCase.updateUserAsAdmin.mockRejectedValue(
        new Error('Database connection error'),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await PATCH(request, { params: Promise.resolve({ id: 'user-123' }) });

      expect(responseLib.internalError).toHaveBeenCalledWith(
        'ユーザー情報の更新に失敗しました',
      );
    });
  });

  describe('DELETE /api/users/[id] - ユーザー削除', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as unknown as NextRequest;
    };

    it('管理者として他のユーザーを削除できる', async () => {
      const request = createMockRequest({
        'x-user-id': 'admin-123',
        'x-user-role': String(UserRole.ADMIN),
      });

      mockContainer.userUseCase.deleteUser.mockResolvedValue();

      await DELETE(request, { params: Promise.resolve({ id: 'target-user-id' }) });

      expect(mockContainer.userUseCase.deleteUser).toHaveBeenCalledWith(
        'target-user-id',
      );
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      const responseLib = jest.requireMock('@/lib/response');

      await DELETE(request, { params: Promise.resolve({ id: 'user-123' }) });

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('一般ユーザーが削除しようとすると403エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': String(UserRole.USER),
      });

      const responseLib = jest.requireMock('@/lib/response');

      await DELETE(request, { params: Promise.resolve({ id: 'target-user-id' }) });

      expect(responseLib.forbidden).toHaveBeenCalledWith(
        '管理者またはマネージャー権限が必要です',
      );
    });

    it('管理者が自分自身を削除しようとすると403エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'admin-123',
        'x-user-role': String(UserRole.ADMIN),
      });

      const responseLib = jest.requireMock('@/lib/response');

      await DELETE(request, { params: Promise.resolve({ id: 'admin-123' }) });

      expect(responseLib.forbidden).toHaveBeenCalledWith(
        '自分自身を削除することはできません',
      );
    });

    it('マネージャーとして他のユーザーを削除できる', async () => {
      const request = createMockRequest({
        'x-user-id': 'manager-123',
        'x-user-role': String(UserRole.MANAGER),
      });

      mockContainer.userUseCase.deleteUser.mockResolvedValue();

      await DELETE(request, { params: Promise.resolve({ id: 'target-user-id' }) });

      expect(mockContainer.userUseCase.deleteUser).toHaveBeenCalledWith(
        'target-user-id',
      );
    });

    it('削除対象のユーザーが見つからない場合は404エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'admin-123',
        'x-user-role': String(UserRole.ADMIN),
      });

      mockContainer.userUseCase.deleteUser.mockRejectedValue(
        new Error('ユーザーが見つかりません'),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await DELETE(request, { params: Promise.resolve({ id: 'nonexistent-id' }) });

      expect(responseLib.notFound).toHaveBeenCalledWith(
        '削除対象のユーザーが見つかりません',
      );
    });

    it('予期しないエラーが発生した場合は500エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'admin-123',
        'x-user-role': String(UserRole.ADMIN),
      });

      mockContainer.userUseCase.deleteUser.mockRejectedValue(
        new Error('Database connection error'),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await DELETE(request, { params: Promise.resolve({ id: 'target-user-id' }) });

      expect(responseLib.internalError).toHaveBeenCalledWith(
        'ユーザーの削除に失敗しました',
      );
    });
  });
});
