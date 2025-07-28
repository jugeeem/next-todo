/**
 * @fileoverview ユーザー管理API（/api/users）のユニットテスト - ヘッダーベース認証対応版
 */

import type { NextRequest } from 'next/server';
import { type CreateUserInput, type User, UserRole } from '@/domain/entities/User';
import { GET, POST } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

describe('/api/users API エンドポイント', () => {
  let mockContainer: {
    userUseCase: {
      getAllUsers: jest.MockedFunction<() => Promise<User[]>>;
      createUser: jest.MockedFunction<(userData: CreateUserInput) => Promise<User>>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockContainer = {
      userUseCase: {
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
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
    responseLib.internalError = jest.fn(() => new Response('internal error'));
  });

  describe('GET /api/users - ユーザー一覧取得', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as unknown as NextRequest;
    };

    it('管理者として正常にユーザー一覧を取得できる', async () => {
      const request = createMockRequest({
        'x-user-id': 'admin-123',
        'x-user-role': String(UserRole.ADMIN),
      });

      const mockUsers: User[] = [
        {
          id: 'user-1',
          username: 'user1',
          passwordHash: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          firstNameRuby: undefined,
          lastNameRuby: undefined,
          role: UserRole.USER,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          createdBy: 'admin-123',
          updatedAt: new Date('2024-01-01T00:00:00Z'),
          updatedBy: 'admin-123',
          deleted: false,
        },
      ];

      mockContainer.userUseCase.getAllUsers.mockResolvedValue(mockUsers);

      await GET(request);

      expect(mockContainer.userUseCase.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('一般ユーザーの場合は403エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': String(UserRole.USER),
      });

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request);

      expect(responseLib.forbidden).toHaveBeenCalledWith('管理者権限が必要です');
    });
  });

  describe('POST /api/users - ユーザー作成', () => {
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

    it('管理者として正常にユーザーを作成できる', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        {
          username: 'newuser',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.USER,
        },
      );

      const mockUser: User = {
        id: 'new-user-id',
        username: 'newuser',
        passwordHash: 'hashedpassword',
        firstName: 'New',
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

      mockContainer.userUseCase.createUser.mockResolvedValue(mockUser);

      await POST(request);

      expect(mockContainer.userUseCase.createUser).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      });
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest(
        {},
        {
          username: 'newuser',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.USER,
        },
      );

      const responseLib = jest.requireMock('@/lib/response');

      await POST(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('一般ユーザーの場合は403エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': String(UserRole.USER),
        },
        {
          username: 'newuser',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.USER,
        },
      );

      const responseLib = jest.requireMock('@/lib/response');

      await POST(request);

      expect(responseLib.forbidden).toHaveBeenCalledWith('管理者権限が必要です');
    });

    it('無効なデータの場合はエラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        {
          username: '', // 無効なusername
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.USER,
        },
      );

      const responseLib = jest.requireMock('@/lib/response');

      await POST(request);

      expect(responseLib.error).toHaveBeenCalled();
    });
  });
});
