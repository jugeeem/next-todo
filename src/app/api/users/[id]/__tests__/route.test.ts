/**
 * @fileoverview 個別ユーザー管理API（/api/users/[id]）のユニットテスト
 *
 * このファイルは、特定ユーザーの取得、更新、削除エンドポイントの
 * 包括的なテストスイートを提供します。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@/domain/entities/User';
import { DELETE, GET, PATCH } from '../route';

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
    updateUserAsAdmin: jest.fn(),
    deleteUser: jest.fn(),
  },
};

const mockResponse = {
  success: jest.fn(),
  error: jest.fn(),
  unauthorized: jest.fn(),
  forbidden: jest.fn(),
  notFound: jest.fn(),
  internalError: jest.fn(),
};

describe('/api/users/[id] API エンドポイント', () => {
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
    mockResponse.notFound.mockReturnValue(new Response('not found'));
    mockResponse.internalError.mockReturnValue(new Response('internal error'));
  });

  describe('GET /api/users/[id] - 個別ユーザー取得', () => {
    const createMockRequest = (authHeader?: string): NextRequest => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      return {
        method: 'GET',
        url: 'http://localhost:3000/api/users/user-123',
        headers,
        json: jest.fn(),
      } as unknown as NextRequest;
    };

    const createMockParams = (id: string) => Promise.resolve({ id });

    test('管理者として他のユーザー情報を取得できる', async () => {
      // Arrange
      const request = createMockRequest('Bearer admin-token');
      const params = createMockParams('target-user-id');
      const targetUser = {
        userId: 'target-user-id',
        username: 'targetuser',
        firstName: 'ターゲット',
        lastName: 'ユーザー',
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

      mockContainer.userUseCase.getUserById.mockResolvedValue(targetUser);

      // Act
      await GET(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith(
        'target-user-id',
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        targetUser,
        'ユーザー情報を取得しました',
      );
    });

    test('マネージャーとして他のユーザー情報を取得できる', async () => {
      // Arrange
      const request = createMockRequest('Bearer manager-token');
      const params = createMockParams('target-user-id');
      const targetUser = {
        userId: 'target-user-id',
        username: 'targetuser',
        firstName: 'ターゲット',
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

      mockContainer.userUseCase.getUserById.mockResolvedValue(targetUser);

      // Act
      await GET(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith(
        'target-user-id',
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        targetUser,
        'ユーザー情報を取得しました',
      );
    });

    test('ユーザーが自分の情報を取得できる', async () => {
      // Arrange
      const request = createMockRequest('Bearer user-token');
      const params = createMockParams('user-id');
      const userData = {
        userId: 'user-id',
        username: 'user',
        firstName: 'ユーザー',
        lastName: 'テスト',
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
      await GET(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-id');
      expect(mockResponse.success).toHaveBeenCalledWith(
        userData,
        'ユーザー情報を取得しました',
      );
    });

    test('一般ユーザーが他人の情報にアクセスしようとした場合、403エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('Bearer user-token');
      const params = createMockParams('other-user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      // Act
      await GET(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).not.toHaveBeenCalled();
      expect(mockResponse.forbidden).toHaveBeenCalledWith(
        'このユーザー情報にアクセスする権限がありません',
      );
    });

    test('認証が失敗した場合、401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest();
      const params = createMockParams('user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: '認証トークンが無効です',
      });

      // Act
      await GET(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).not.toHaveBeenCalled();
      expect(mockResponse.unauthorized).toHaveBeenCalledWith('認証トークンが無効です');
    });

    test('存在しないユーザーIDの場合、404エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('Bearer admin-token');
      const params = createMockParams('non-existent-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.getUserById.mockResolvedValue(null);

      // Act
      await GET(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith(
        'non-existent-id',
      );
      expect(mockResponse.notFound).toHaveBeenCalledWith('ユーザーが見つかりません');
    });

    test('UseCase でエラーが発生した場合、500エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('Bearer admin-token');
      const params = createMockParams('user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.getUserById.mockRejectedValue(
        new Error('データベース接続エラー'),
      );

      // Act
      await GET(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-id');
      expect(mockResponse.internalError).toHaveBeenCalledWith(
        'ユーザー情報の取得に失敗しました',
      );
    });
  });

  describe('PATCH /api/users/[id] - ユーザー情報更新', () => {
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
        url: 'http://localhost:3000/api/users/user-123',
        headers,
        json: jest.fn().mockResolvedValue(requestBody),
      } as unknown as NextRequest;
    };

    const createMockParams = (id: string) => Promise.resolve({ id });

    const validUpdateData = {
      firstName: '更新した名前',
      lastName: '更新した姓',
      firstNameRuby: 'こうしんしたなまえ',
      lastNameRuby: 'こうしんしたせい',
    };

    test('管理者として他のユーザー情報を更新できる', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData, 'Bearer admin-token');
      const params = createMockParams('target-user-id');
      const updatedUser = {
        userId: 'target-user-id',
        username: 'targetuser',
        firstName: '更新した名前',
        lastName: '更新した姓',
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

      mockContainer.userUseCase.updateUserAsAdmin.mockResolvedValue(updatedUser);

      // Act
      await PATCH(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUserAsAdmin).toHaveBeenCalledWith(
        'target-user-id',
        validUpdateData,
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        updatedUser,
        'ユーザー情報を更新しました',
      );
    });

    test('マネージャーとして他のユーザー情報を更新できる', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData, 'Bearer manager-token');
      const params = createMockParams('target-user-id');
      const updatedUser = {
        userId: 'target-user-id',
        username: 'targetuser',
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

      mockContainer.userUseCase.updateUserAsAdmin.mockResolvedValue(updatedUser);

      // Act
      await PATCH(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.updateUserAsAdmin).toHaveBeenCalledWith(
        'target-user-id',
        validUpdateData,
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        updatedUser,
        'ユーザー情報を更新しました',
      );
    });

    test('ユーザーが自分の情報を更新できる', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData, 'Bearer user-token');
      const params = createMockParams('user-id');
      const updatedUser = {
        userId: 'user-id',
        username: 'user',
        firstName: '更新した名前',
        lastName: '更新した姓',
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
      await PATCH(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith(
        'user-id',
        validUpdateData,
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        updatedUser,
        'ユーザー情報を更新しました',
      );
    });

    test('一般ユーザーが他人の情報を更新しようとした場合、403エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData, 'Bearer user-token');
      const params = createMockParams('other-user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      // Act
      await PATCH(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).not.toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).not.toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUserAsAdmin).not.toHaveBeenCalled();
      expect(mockResponse.forbidden).toHaveBeenCalledWith(
        'このユーザー情報を更新する権限がありません',
      );
    });

    test('認証が失敗した場合、401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData);
      const params = createMockParams('user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: '認証トークンが無効です',
      });

      // Act
      await PATCH(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).not.toHaveBeenCalled();
      expect(mockResponse.unauthorized).toHaveBeenCalledWith('認証トークンが無効です');
    });

    test('バリデーションエラーの場合、400エラーを返す', async () => {
      // Arrange
      const invalidUpdateData = {
        firstName: '', // 空の文字列
        lastName: '',
      };
      const request = createMockRequest(invalidUpdateData, 'Bearer user-token');
      const params = createMockParams('user-id');

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
      await PATCH(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockResponse.error).toHaveBeenCalledWith(
        '入力データが正しくありません',
        400,
      );
    });

    test('存在しないユーザーの場合、404エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData, 'Bearer admin-token');
      const params = createMockParams('non-existent-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.updateUserAsAdmin.mockRejectedValue(
        new Error('ユーザーが見つかりません'),
      );

      // Act
      await PATCH(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUserAsAdmin).toHaveBeenCalledWith(
        'non-existent-id',
        validUpdateData,
      );
      expect(mockResponse.notFound).toHaveBeenCalledWith('ユーザーが見つかりません');
    });

    test('ユーザー名重複エラーの場合、409エラーを返す', async () => {
      // Arrange
      const updateDataWithUsername = {
        ...validUpdateData,
        username: 'duplicated-username',
      };
      const request = createMockRequest(updateDataWithUsername, 'Bearer admin-token');
      const params = createMockParams('user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.updateUserAsAdmin.mockRejectedValue(
        new Error('このユーザー名は既に使用されています'),
      );

      // Act
      await PATCH(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUserAsAdmin).toHaveBeenCalledWith(
        'user-id',
        updateDataWithUsername,
      );
      expect(mockResponse.error).toHaveBeenCalledWith(
        'このユーザー名は既に使用されています',
        409,
      );
    });

    test('UseCase で予期しないエラーが発生した場合、500エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(validUpdateData, 'Bearer user-token');
      const params = createMockParams('user-id');

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
      await PATCH(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(request.json).toHaveBeenCalled();
      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith(
        'user-id',
        validUpdateData,
      );
      expect(mockResponse.internalError).toHaveBeenCalledWith(
        'ユーザー情報の更新に失敗しました',
      );
    });
  });

  describe('DELETE /api/users/[id] - ユーザー削除', () => {
    const createMockRequest = (authHeader?: string): NextRequest => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      return {
        method: 'DELETE',
        url: 'http://localhost:3000/api/users/user-123',
        headers,
        json: jest.fn(),
      } as unknown as NextRequest;
    };

    const createMockParams = (id: string) => Promise.resolve({ id });

    test('管理者として他のユーザーを削除できる', async () => {
      // Arrange
      const request = createMockRequest('Bearer admin-token');
      const params = createMockParams('target-user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.deleteUser.mockResolvedValue(undefined);

      // Act
      await DELETE(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.deleteUser).toHaveBeenCalledWith(
        'target-user-id',
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        { deleted: true, userId: 'target-user-id' },
        'ユーザーを削除しました',
      );
    });

    test('マネージャーとして他のユーザーを削除できる', async () => {
      // Arrange
      const request = createMockRequest('Bearer manager-token');
      const params = createMockParams('target-user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'manager-id',
          username: 'manager',
          role: UserRole.MANAGER,
        },
      });

      mockContainer.userUseCase.deleteUser.mockResolvedValue(undefined);

      // Act
      await DELETE(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.deleteUser).toHaveBeenCalledWith(
        'target-user-id',
      );
      expect(mockResponse.success).toHaveBeenCalledWith(
        { deleted: true, userId: 'target-user-id' },
        'ユーザーを削除しました',
      );
    });

    test('一般ユーザーがアクセスした場合、403エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('Bearer user-token');
      const params = createMockParams('target-user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'user-id',
          username: 'user',
          role: UserRole.USER,
        },
      });

      // Act
      await DELETE(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.deleteUser).not.toHaveBeenCalled();
      expect(mockResponse.forbidden).toHaveBeenCalledWith(
        '管理者またはマネージャー権限が必要です',
      );
    });

    test('自分自身を削除しようとした場合、403エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('Bearer admin-token');
      const params = createMockParams('admin-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      // Act
      await DELETE(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.deleteUser).not.toHaveBeenCalled();
      expect(mockResponse.forbidden).toHaveBeenCalledWith(
        '自分自身を削除することはできません',
      );
    });

    test('認証が失敗した場合、401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest();
      const params = createMockParams('target-user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: '認証トークンが無効です',
      });

      // Act
      await DELETE(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.deleteUser).not.toHaveBeenCalled();
      expect(mockResponse.unauthorized).toHaveBeenCalledWith('認証トークンが無効です');
    });

    test('存在しないユーザーの場合、404エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('Bearer admin-token');
      const params = createMockParams('non-existent-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.deleteUser.mockRejectedValue(
        new Error('ユーザーが見つかりません'),
      );

      // Act
      await DELETE(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.deleteUser).toHaveBeenCalledWith(
        'non-existent-id',
      );
      expect(mockResponse.notFound).toHaveBeenCalledWith(
        '削除対象のユーザーが見つかりません',
      );
    });

    test('UseCase で予期しないエラーが発生した場合、500エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('Bearer admin-token');
      const params = createMockParams('target-user-id');

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: {
          userId: 'admin-id',
          username: 'admin',
          role: UserRole.ADMIN,
        },
      });

      mockContainer.userUseCase.deleteUser.mockRejectedValue(
        new Error('データベース接続エラー'),
      );

      // Act
      await DELETE(request, { params });

      // Assert
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.userUseCase.deleteUser).toHaveBeenCalledWith(
        'target-user-id',
      );
      expect(mockResponse.internalError).toHaveBeenCalledWith(
        'ユーザーの削除に失敗しました',
      );
    });
  });
});
