/**
 * @fileoverview ユーザー管理API（/api/users）のユニットテスト - ヘッダーベース認証対応版
 */

import type { NextRequest } from 'next/server';
import { type CreateUserInput, type User, UserRole } from '@/domain/entities/User';
import type { GetUsersQuery } from '@/types/validation';
import { GET, POST } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');
jest.mock('@/types/validation', () => ({
  createUserSchema: {
    parse: jest.fn(),
  },
  getUsersQuerySchema: {
    parse: jest.fn(),
  },
}));
jest.mock('zod', () => ({
  z: {
    ZodError: class ZodError extends Error {
      constructor() {
        super('Validation error');
        this.name = 'ZodError';
      }
    },
  },
}));

describe('/api/users API エンドポイント', () => {
  let mockContainer: {
    userUseCase: {
      getAllUsers: jest.MockedFunction<() => Promise<User[]>>;
      getUsersWithFilters: jest.MockedFunction<
        (filters: unknown, sortOptions: unknown) => Promise<User[]>
      >;
      createUser: jest.MockedFunction<(userData: CreateUserInput) => Promise<User>>;
    };
  };
  let mockCreateUserSchema: {
    parse: jest.MockedFunction<(data: unknown) => CreateUserInput>;
  };
  let mockGetUsersQuerySchema: {
    parse: jest.MockedFunction<(data: Record<string, string | null>) => GetUsersQuery>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockContainer = {
      userUseCase: {
        getAllUsers: jest.fn(),
        getUsersWithFilters: jest.fn(),
        createUser: jest.fn(),
      },
    };

    mockCreateUserSchema = {
      parse: jest.fn(),
    };

    mockGetUsersQuerySchema = {
      parse: jest.fn((data: Record<string, string | null>) => {
        // クエリパラメータから値を取得し、適切な型に変換
        const page = data.page ? Number.parseInt(data.page, 10) : 1;
        const perPage = data.perPage ? Number.parseInt(data.perPage, 10) : 20;
        const sortBy = (data.sortBy || 'createdAt') as
          | 'id'
          | 'username'
          | 'role'
          | 'firstName'
          | 'firstNameRuby'
          | 'lastName'
          | 'lastNameRuby'
          | 'createdAt';
        const sortOrder = (data.sortOrder || 'asc') as 'asc' | 'desc';

        return {
          page,
          perPage,
          sortBy,
          sortOrder,
          id: data.id || undefined,
          username: data.username || undefined,
          firstName: data.firstName || undefined,
          firstNameRuby: data.firstNameRuby || undefined,
          lastName: data.lastName || undefined,
          lastNameRuby: data.lastNameRuby || undefined,
          role: data.role ? Number.parseInt(data.role, 10) : undefined,
        };
      }),
    };

    // Container のモック設定
    const { Container } = jest.requireMock('@/lib/container');
    Container.getInstance = jest.fn(() => mockContainer);

    // createUserSchema のモック設定
    const { createUserSchema, getUsersQuerySchema } =
      jest.requireMock('@/types/validation');
    Object.assign(createUserSchema, mockCreateUserSchema);
    Object.assign(getUsersQuerySchema, mockGetUsersQuerySchema);

    // Response関数のモック設定
    const responseLib = jest.requireMock('@/lib/response');
    responseLib.success = jest.fn(() => new Response('success'));
    responseLib.error = jest.fn(() => new Response('error'));
    responseLib.unauthorized = jest.fn(() => new Response('unauthorized'));
    responseLib.forbidden = jest.fn(() => new Response('forbidden'));
    responseLib.internalError = jest.fn(() => new Response('internal error'));
  });

  describe('GET /api/users - ユーザー一覧取得', () => {
    const createMockRequest = (
      headers: Record<string, string> = {},
      url = 'http://localhost:3000/api/users',
    ) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
        url,
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

      mockContainer.userUseCase.getUsersWithFilters.mockResolvedValue(mockUsers);

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request);

      expect(mockContainer.userUseCase.getUsersWithFilters).toHaveBeenCalledTimes(1);
      expect(responseLib.success).toHaveBeenCalledWith(
        {
          data: mockUsers,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalUsers: 1,
            perPage: 20,
          },
        },
        'ユーザー一覧を取得しました',
      );
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

    it('ページネーションパラメータが正常に処理される', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        'http://localhost:3000/api/users?page=2&perPage=10',
      );

      const mockUsers: User[] = Array.from({ length: 25 }, (_, i) => ({
        id: `user-${i + 1}`,
        username: `user${i + 1}`,
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
      }));

      mockContainer.userUseCase.getUsersWithFilters.mockResolvedValue(mockUsers);

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request);

      expect(responseLib.success).toHaveBeenCalledWith(
        {
          data: mockUsers.slice(10, 20), // 2ページ目の10件
          pagination: {
            currentPage: 2,
            totalPages: 3,
            totalUsers: 25,
            perPage: 10,
          },
        },
        'ユーザー一覧を取得しました',
      );
    });

    it('MANAGERユーザーとして正常にユーザー一覧を取得できる', async () => {
      const request = createMockRequest({
        'x-user-id': 'manager-123',
        'x-user-role': String(UserRole.MANAGER),
      });

      const mockUsers: User[] = [];
      mockContainer.userUseCase.getUsersWithFilters.mockResolvedValue(mockUsers);

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request);

      expect(mockContainer.userUseCase.getUsersWithFilters).toHaveBeenCalledTimes(1);
      expect(responseLib.success).toHaveBeenCalledWith(
        {
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalUsers: 0,
            perPage: 20,
          },
        },
        'ユーザー一覧を取得しました',
      );
    });

    it('内部エラーが発生した場合は500エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'admin-123',
        'x-user-role': String(UserRole.ADMIN),
      });

      mockContainer.userUseCase.getUsersWithFilters.mockRejectedValue(
        new Error('Database error'),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await GET(request);

      expect(responseLib.internalError).toHaveBeenCalledWith(
        'ユーザー一覧の取得に失敗しました',
      );
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
      const userData = {
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        userData,
      );

      mockCreateUserSchema.parse.mockReturnValue(userData);

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

      const responseLib = jest.requireMock('@/lib/response');

      await POST(request);

      expect(mockCreateUserSchema.parse).toHaveBeenCalledWith(userData);
      expect(mockContainer.userUseCase.createUser).toHaveBeenCalledWith(userData);
      expect(responseLib.success).toHaveBeenCalledWith(
        mockUser,
        '新規ユーザーを作成しました',
      );
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
      const invalidData = {
        username: '', // 無効なusername
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        invalidData,
      );

      const { z } = jest.requireMock('zod');
      mockCreateUserSchema.parse.mockImplementation(() => {
        throw new z.ZodError();
      });

      const responseLib = jest.requireMock('@/lib/response');

      await POST(request);

      expect(responseLib.error).toHaveBeenCalledWith(
        '入力データが正しくありません',
        400,
      );
    });

    it('ユーザー名が重複している場合は409エラーを返す', async () => {
      const userData = {
        username: 'existinguser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        userData,
      );

      mockCreateUserSchema.parse.mockReturnValue(userData);
      mockContainer.userUseCase.createUser.mockRejectedValue(
        new Error('このユーザー名は既に使用されています'),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await POST(request);

      expect(responseLib.error).toHaveBeenCalledWith(
        'このユーザー名は既に使用されています',
        409,
      );
    });

    it('MANAGERユーザーとして正常にユーザーを作成できる', async () => {
      const userData = {
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const request = createMockRequest(
        {
          'x-user-id': 'manager-123',
          'x-user-role': String(UserRole.MANAGER),
        },
        userData,
      );

      mockCreateUserSchema.parse.mockReturnValue(userData);

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
        createdBy: 'manager-123',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        updatedBy: 'manager-123',
        deleted: false,
      };

      mockContainer.userUseCase.createUser.mockResolvedValue(mockUser);

      const responseLib = jest.requireMock('@/lib/response');

      await POST(request);

      expect(responseLib.success).toHaveBeenCalledWith(
        mockUser,
        '新規ユーザーを作成しました',
      );
    });

    it('内部エラーが発生した場合は500エラーを返す', async () => {
      const userData = {
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const request = createMockRequest(
        {
          'x-user-id': 'admin-123',
          'x-user-role': String(UserRole.ADMIN),
        },
        userData,
      );

      mockCreateUserSchema.parse.mockReturnValue(userData);
      mockContainer.userUseCase.createUser.mockRejectedValue(
        new Error('Database error'),
      );

      const responseLib = jest.requireMock('@/lib/response');

      await POST(request);

      expect(responseLib.internalError).toHaveBeenCalledWith(
        'ユーザー作成に失敗しました',
      );
    });
  });
});
