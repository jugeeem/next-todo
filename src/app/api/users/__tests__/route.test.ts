/**
 * @fileoverview ユーザー管理API（/api/users）のユニットテスト
 *
 * このファイルは、ユーザー一覧取得およびユーザー作成エンドポイントの
 * 包括的なテストスイートを提供します。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@/domain/entities/User';
import { GET, POST } from '../route';

// モック設定
jest.mock('@/lib/auth-middleware');
jest.mock('@/lib/container');
jest.mock('@/lib/response');

// モック設定
jest.mock('@/lib/auth-middleware');
jest.mock('@/lib/container');
jest.mock('@/lib/response');

// モック実装
const mockAuthMiddleware = {
  authenticate: jest.fn(),
};

const mockContainer = {
  userUseCase: {
    getAllUsers: jest.fn(),
    createUser: jest.fn(),
  },
};

const mockResponse = {
  success: jest.fn(),
  error: jest.fn(),
  unauthorized: jest.fn(),
  forbidden: jest.fn(),
  internalError: jest.fn(),
};

describe('/api/users API エンドポイント', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // モックの設定
    const { AuthMiddleware } = jest.requireMock('@/lib/auth-middleware');
    const { Container } = jest.requireMock('@/lib/container');
    const responseLib = jest.requireMock('@/lib/response');

    AuthMiddleware.mockImplementation(() => mockAuthMiddleware);
    Container.getInstance = jest.fn(() => mockContainer);
    Object.assign(responseLib, mockResponse);

    // デフォルトのモック戻り値を設定
    mockResponse.success.mockReturnValue(new Response('success'));
    mockResponse.error.mockReturnValue(new Response('error'));
    mockResponse.unauthorized.mockReturnValue(new Response('unauthorized'));
    mockResponse.forbidden.mockReturnValue(new Response('forbidden'));
    mockResponse.internalError.mockReturnValue(new Response('internal error'));
  });

  describe('GET /api/users - ユーザー一覧取得', () => {
    const createMockRequest = (method = 'GET', authHeader?: string): NextRequest => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      const request = {
        method,
        url: 'http://localhost:3000/api/users',
        headers,
        json: jest.fn(),
      } as unknown as NextRequest;

      return request;
    };

    test('管理者として正常にユーザー一覧を取得できる', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer admin-token');
      const mockUsers = [
        {
          userId: 'user-1',
          username: 'admin',
          firstName: '管理者',
          lastName: 'テスト',
          role: UserRole.ADMIN,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 'user-2',
          username: 'user1',
          firstName: '一般',
          lastName: 'ユーザー',
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.getAllUsers.mockResolvedValue(mockUsers);

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getAllUsers).toHaveBeenCalled();
      expect(mockResponse.success).toHaveBeenCalledWith(
        mockUsers,
        'ユーザー一覧を取得しました',
      );
    });

    test('マネージャーとして正常にユーザー一覧を取得できる', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer manager-token');
      const mockUsers = [
        {
          userId: 'user-1',
          username: 'manager',
          firstName: 'マネージャー',
          lastName: 'テスト',
          role: UserRole.MANAGER,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'manager-id',
          username: 'manager',
          role: UserRole.MANAGER,
        },
      });

      mockContainer.userUseCase.getAllUsers.mockResolvedValue(mockUsers);

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getAllUsers).toHaveBeenCalled();
      expect(mockResponse.success).toHaveBeenCalledWith(
        mockUsers,
        'ユーザー一覧を取得しました',
      );
    });

    test('認証が失敗した場合、401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('GET');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: '認証トークンが無効です',
      });

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getAllUsers).not.toHaveBeenCalled();
      expect(mockResponse.unauthorized).toHaveBeenCalledWith('認証トークンが無効です');
    });

    test('一般ユーザーがアクセスした場合、403エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer user-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getAllUsers).not.toHaveBeenCalled();
      expect(mockResponse.forbidden).toHaveBeenCalledWith('管理者権限が必要です');
    });

    test('UseCase でエラーが発生した場合、500エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer admin-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.getAllUsers.mockRejectedValue(
        new Error('データベース接続エラー'),
      );

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getAllUsers).toHaveBeenCalled();
      expect(mockResponse.internalError).toHaveBeenCalledWith(
        'ユーザー一覧の取得に失敗しました',
      );
    });

    test('空のユーザー一覧でも正常に処理される', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer admin-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.getAllUsers.mockResolvedValue([]);

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getAllUsers).toHaveBeenCalled();
      expect(mockResponse.success).toHaveBeenCalledWith(
        [],
        'ユーザー一覧を取得しました',
      );
    });
  });

  describe('POST /api/users - ユーザー作成', () => {
    const createMockRequest = (
      requestBody: unknown,
      authHeader?: string,
    ): NextRequest => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      const request = {
        method: 'POST',
        url: 'http://localhost:3000/api/users',
        headers,
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest;

      return request;
    };

    const validUserData = {
      username: 'newuser',
      password: 'SecurePass123',
      firstName: '新規',
      lastName: 'ユーザー',
      firstNameRuby: 'しんき',
      lastNameRuby: 'ゆーざー',
      role: UserRole.USER,
    };

    test('管理者として正常にユーザーを作成できる', async () => {
      // Arrange
      const request = createMockRequest(validUserData, 'Bearer admin-token');
      const createdUser = {
        userId: 'new-user-id',
        username: 'newuser',
        firstName: '新規',
        lastName: 'ユーザー',
        firstNameRuby: 'しんき',
        lastNameRuby: 'ゆーざー',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.createUser.mockResolvedValue(createdUser);

      // Act
      await POST(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.createUser).toHaveBeenCalledWith(validUserData);
      expect(mockResponse.success).toHaveBeenCalledWith(
        createdUser,
        '新規ユーザーを作成しました',
      );
    });

    test('マネージャーとして正常にユーザーを作成できる', async () => {
      // Arrange
      const request = createMockRequest(validUserData, 'Bearer manager-token');
      const createdUser = {
        userId: 'new-user-id',
        username: 'newuser',
        firstName: '新規',
        lastName: 'ユーザー',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'manager-id',
          username: 'manager',
          role: UserRole.MANAGER,
        },
      });

      mockContainer.userUseCase.createUser.mockResolvedValue(createdUser);

      // Act
      await POST(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.createUser).toHaveBeenCalledWith(validUserData);
      expect(mockResponse.success).toHaveBeenCalledWith(
        createdUser,
        '新規ユーザーを作成しました',
      );
    });

    test('認証が失敗した場合、401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUserData);

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: '認証トークンが無効です',
      });

      // Act
      await POST(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).not.toHaveBeenCalled();
      expect(mockContainer.userUseCase.createUser).not.toHaveBeenCalled();
      expect(mockResponse.unauthorized).toHaveBeenCalledWith('認証トークンが無効です');
    });

    test('一般ユーザーがアクセスした場合、403エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUserData, 'Bearer user-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      // Act
      await POST(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).not.toHaveBeenCalled();
      expect(mockContainer.userUseCase.createUser).not.toHaveBeenCalled();
      expect(mockResponse.forbidden).toHaveBeenCalledWith('管理者権限が必要です');
    });

    test('バリデーションエラーの場合、400エラーを返す', async () => {
      // Arrange
      const invalidUserData = {
        username: '', // 空の文字列
        password: '123', // 短すぎるパスワード
        firstName: '',
        lastName: '',
      };
      const request = createMockRequest(invalidUserData, 'Bearer admin-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      // Zodエラーをモック
      const zodError = new z.ZodError([
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: '必須項目です',
          path: ['username'],
        },
      ]);

      mockContainer.userUseCase.createUser.mockRejectedValue(zodError);

      // Act
      await POST(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockResponse.error).toHaveBeenCalledWith(
        '入力データが正しくありません',
        400,
      );
    });

    test('ユーザー名重複エラーの場合、409エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUserData, 'Bearer admin-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.createUser.mockRejectedValue(
        new Error('このユーザー名は既に使用されています'),
      );

      // Act
      await POST(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.createUser).toHaveBeenCalledWith(validUserData);
      expect(mockResponse.error).toHaveBeenCalledWith(
        'このユーザー名は既に使用されています',
        409,
      );
    });

    test('JSON解析エラーの場合、500エラーを返す', async () => {
      // Arrange
      const request = {
        method: 'POST',
        url: 'http://localhost:3000/api/users',
        headers: new Headers([['authorization', 'Bearer admin-token']]),
        json: jest.fn().mockRejectedValue(new Error('JSON解析エラー')),
      } as unknown as NextRequest;

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      // Act
      await POST(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.createUser).not.toHaveBeenCalled();
      expect(mockResponse.internalError).toHaveBeenCalledWith(
        'ユーザー作成に失敗しました',
      );
    });

    test('UseCase で予期しないエラーが発生した場合、500エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUserData, 'Bearer admin-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.createUser.mockRejectedValue(
        new Error('データベース接続エラー'),
      );

      // Act
      await POST(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.createUser).toHaveBeenCalledWith(validUserData);
      expect(mockResponse.internalError).toHaveBeenCalledWith(
        'ユーザー作成に失敗しました',
      );
    });

    test('管理者権限でADMINユーザーを作成できる', async () => {
      // Arrange
      const adminUserData = {
        ...validUserData,
        role: UserRole.ADMIN,
      };
      const request = createMockRequest(adminUserData, 'Bearer admin-token');
      const createdUser = {
        userId: 'new-admin-id',
        username: 'newadmin',
        firstName: '新規',
        lastName: '管理者',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.createUser.mockResolvedValue(createdUser);

      // Act
      await POST(request);

      // Assert
      expect(mockContainer.userUseCase.createUser).toHaveBeenCalledWith(adminUserData);
      expect(mockResponse.success).toHaveBeenCalledWith(
        createdUser,
        '新規ユーザーを作成しました',
      );
    });

    test('マネージャー権限でMANAGERユーザーを作成できる', async () => {
      // Arrange
      const managerUserData = {
        ...validUserData,
        role: UserRole.MANAGER,
      };
      const request = createMockRequest(managerUserData, 'Bearer manager-token');
      const createdUser = {
        userId: 'new-manager-id',
        username: 'newmanager',
        firstName: '新規',
        lastName: 'マネージャー',
        role: UserRole.MANAGER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'manager-id',
          username: 'manager',
          role: UserRole.MANAGER,
        },
      });

      mockContainer.userUseCase.createUser.mockResolvedValue(createdUser);

      // Act
      await POST(request);

      // Assert
      expect(mockContainer.userUseCase.createUser).toHaveBeenCalledWith(
        managerUserData,
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        createdUser,
        '新規ユーザーを作成しました',
      );
    });
  });
});
