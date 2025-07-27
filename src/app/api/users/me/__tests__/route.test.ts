/**
 * @fileoverview 現在ユーザー情報API（/api/users/me）のユニットテスト
 *
 * このファイルは、認証されたユーザー自身の情報取得・更新エンドポイントの
 * 包括的なテストスイートを提供します。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@/domain/entities/User';
import { GET, PATCH } from '../route';

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
    getUserById: jest.fn(),
    updateUser: jest.fn(),
  },
};

const mockResponse = {
  success: jest.fn(),
  error: jest.fn(),
  unauthorized: jest.fn(),
  internalError: jest.fn(),
};

describe('/api/users/me API エンドポイント', () => {
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
    mockResponse.internalError.mockReturnValue(new Response('internal error'));
  });

  describe('GET /api/users/me - 現在ユーザー情報取得', () => {
    const createMockRequest = (authHeader?: string): NextRequest => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      return {
        method: 'GET',
        url: 'http://localhost:3000/api/users/me',
        headers,
        json: jest.fn(),
      } as unknown as NextRequest;
    };

    test('認証済みユーザーが自分の情報を正常に取得できる', async () => {
      // Arrange
      const request = createMockRequest('Bearer user-token');
      const userData = {
        userId: 'user-id',
        username: 'user',
        firstName: 'ユーザー',
        lastName: 'テスト',
        firstNameRuby: 'ゆーざー',
        lastNameRuby: 'てすと',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      mockContainer.userUseCase.getUserById.mockResolvedValue(userData);

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-id');
      expect(mockResponse.success).toHaveBeenCalledWith(
        userData,
        'ユーザー情報を取得しました',
      );
    });

    test('管理者が自分の情報を正常に取得できる', async () => {
      // Arrange
      const request = createMockRequest('Bearer admin-token');
      const adminData = {
        userId: 'admin-id',
        username: 'admin',
        firstName: '管理者',
        lastName: 'テスト',
        firstNameRuby: 'かんりしゃ',
        lastNameRuby: 'てすと',
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

      mockContainer.userUseCase.getUserById.mockResolvedValue(adminData);

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('admin-id');
      expect(mockResponse.success).toHaveBeenCalledWith(
        adminData,
        'ユーザー情報を取得しました',
      );
    });

    test('マネージャーが自分の情報を正常に取得できる', async () => {
      // Arrange
      const request = createMockRequest('Bearer manager-token');
      const managerData = {
        userId: 'manager-id',
        username: 'manager',
        firstName: 'マネージャー',
        lastName: 'テスト',
        firstNameRuby: 'まねーじゃー',
        lastNameRuby: 'てすと',
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

      mockContainer.userUseCase.getUserById.mockResolvedValue(managerData);

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('manager-id');
      expect(mockResponse.success).toHaveBeenCalledWith(
        managerData,
        'ユーザー情報を取得しました',
      );
    });

    test('認証が失敗した場合、401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest();

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: '認証トークンが無効です',
      });

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).not.toHaveBeenCalled();
      expect(mockResponse.unauthorized).toHaveBeenCalledWith('認証トークンが無効です');
    });

    test('ユーザーが見つからない場合、401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('Bearer user-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      mockContainer.userUseCase.getUserById.mockResolvedValue(null);

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-id');
      expect(mockResponse.unauthorized).toHaveBeenCalledWith(
        'ユーザー情報が見つかりません',
      );
    });

    test('UseCase でエラーが発生した場合、500エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('Bearer user-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      mockContainer.userUseCase.getUserById.mockRejectedValue(
        new Error('データベース接続エラー'),
      );

      // Act
      await GET(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-id');
      expect(mockResponse.internalError).toHaveBeenCalledWith(
        'ユーザー情報の取得に失敗しました',
      );
    });
  });

  describe('PATCH /api/users/me - 現在ユーザー情報更新', () => {
    const createMockRequest = (
      requestBody: unknown,
      authHeader?: string,
    ): NextRequest => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      return {
        method: 'PATCH',
        url: 'http://localhost:3000/api/users/me',
        headers,
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest;
    };

    const validUpdateData = {
      firstName: '更新した名前',
      lastName: '更新した姓',
      firstNameRuby: 'こうしんしたなまえ',
      lastNameRuby: 'こうしんしたせい',
    };

    test('一般ユーザーが自分のプロフィールを正常に更新できる', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData, 'Bearer user-token');
      const updatedUser = {
        userId: 'user-id',
        username: 'user',
        firstName: '更新した名前',
        lastName: '更新した姓',
        firstNameRuby: 'こうしんしたなまえ',
        lastNameRuby: 'こうしんしたせい',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      mockContainer.userUseCase.updateUser.mockResolvedValue(updatedUser);

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith(
        'user-id',
        validUpdateData,
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        updatedUser,
        'プロフィールを更新しました',
      );
    });

    test('管理者が自分のプロフィールを更新でき、roleフィールドも変更可能', async () => {
      // Arrange
      const updateDataWithRole = {
        ...validUpdateData,
        role: UserRole.MANAGER,
      };
      const request = createMockRequest(updateDataWithRole, 'Bearer admin-token');
      const updatedUser = {
        userId: 'admin-id',
        username: 'admin',
        firstName: '更新した名前',
        lastName: '更新した姓',
        role: UserRole.MANAGER,
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

      mockContainer.userUseCase.updateUser.mockResolvedValue(updatedUser);

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith(
        'admin-id',
        updateDataWithRole,
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        updatedUser,
        'プロフィールを更新しました',
      );
    });

    test('マネージャーが自分のプロフィールを更新でき、roleフィールドも変更可能', async () => {
      // Arrange
      const updateDataWithRole = {
        ...validUpdateData,
        role: UserRole.USER,
      };
      const request = createMockRequest(updateDataWithRole, 'Bearer manager-token');
      const updatedUser = {
        userId: 'manager-id',
        username: 'manager',
        firstName: '更新した名前',
        lastName: '更新した姓',
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

      mockContainer.userUseCase.updateUser.mockResolvedValue(updatedUser);

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith(
        'manager-id',
        updateDataWithRole,
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        updatedUser,
        'プロフィールを更新しました',
      );
    });

    test('一般ユーザーがroleフィールドを更新しようとした場合、roleは除外される', async () => {
      // Arrange
      const updateDataWithRole = {
        ...validUpdateData,
        role: UserRole.ADMIN, // 一般ユーザーがADMINに変更しようとする
      };
      const request = createMockRequest(updateDataWithRole, 'Bearer user-token');
      const updatedUser = {
        userId: 'user-id',
        username: 'user',
        firstName: '更新した名前',
        lastName: '更新した姓',
        role: UserRole.USER, // roleは変更されない
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      mockContainer.userUseCase.updateUser.mockResolvedValue(updatedUser);

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith(
        'user-id',
        validUpdateData, // roleが除外されたデータ
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        updatedUser,
        'プロフィールを更新しました',
      );
    });

    test('認証が失敗した場合、401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData);

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: '認証トークンが無効です',
      });

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).not.toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).not.toHaveBeenCalled();
      expect(mockResponse.unauthorized).toHaveBeenCalledWith('認証トークンが無効です');
    });

    test('バリデーションエラーの場合、400エラーを返す', async () => {
      // Arrange
      const invalidUpdateData = {
        firstName: '', // 空の文字列
        lastName: '',
      };
      const request = createMockRequest(invalidUpdateData, 'Bearer user-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
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
          path: ['firstName'],
        },
      ]);

      mockContainer.userUseCase.updateUser.mockRejectedValue(zodError);

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockResponse.error).toHaveBeenCalledWith(
        '入力データが正しくありません',
        400,
      );
    });

    test('ユーザーが見つからない場合、401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData, 'Bearer user-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      mockContainer.userUseCase.updateUser.mockRejectedValue(
        new Error('ユーザーが見つかりません'),
      );

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith(
        'user-id',
        validUpdateData,
      );
      expect(mockResponse.unauthorized).toHaveBeenCalledWith(
        'ユーザー情報が見つかりません',
      );
    });

    test('JSON解析エラーの場合、500エラーを返す', async () => {
      // Arrange
      const request = {
        method: 'PATCH',
        url: 'http://localhost:3000/api/users/me',
        headers: new Headers([['authorization', 'Bearer user-token']]),
        json: jest.fn().mockRejectedValue(new Error('JSON解析エラー')),
      } as unknown as NextRequest;

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).not.toHaveBeenCalled();
      expect(mockResponse.internalError).toHaveBeenCalledWith(
        'プロフィールの更新に失敗しました',
      );
    });

    test('UseCase で予期しないエラーが発生した場合、500エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData, 'Bearer user-token');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      mockContainer.userUseCase.updateUser.mockRejectedValue(
        new Error('データベース接続エラー'),
      );

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith(
        'user-id',
        validUpdateData,
      );
      expect(mockResponse.internalError).toHaveBeenCalledWith(
        'プロフィールの更新に失敗しました',
      );
    });

    test('部分的な更新データでも正常に処理される', async () => {
      // Arrange
      const partialUpdateData = {
        firstName: '新しい名前', // lastNameは含まない
      };
      const request = createMockRequest(partialUpdateData, 'Bearer user-token');
      const updatedUser = {
        userId: 'user-id',
        username: 'user',
        firstName: '新しい名前',
        lastName: '元の姓', // 変更されない
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      mockContainer.userUseCase.updateUser.mockResolvedValue(updatedUser);

      // Act
      await PATCH(request);

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith(
        'user-id',
        partialUpdateData,
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        updatedUser,
        'プロフィールを更新しました',
      );
    });
  });
});
