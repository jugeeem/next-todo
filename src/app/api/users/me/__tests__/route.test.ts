/**
 * @fileoverview ユーザーme API（/api/users/me）のユニットテスト - ヘッダーベース認証対応版
 */

import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { GET, PATCH } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

interface MockContainer {
  userUseCase: {
    getUserById: jest.Mock;
    updateUser: jest.Mock;
  };
}

interface MockResponseLib {
  success: jest.Mock;
  error: jest.Mock;
  unauthorized: jest.Mock;
  forbidden: jest.Mock;
  notFound: jest.Mock;
  internalError: jest.Mock;
}

describe('/api/users/me API エンドポイント', () => {
  let mockContainer: MockContainer;
  let responseLib: MockResponseLib;

  beforeEach(() => {
    jest.clearAllMocks();

    // Container のモック設定
    const { Container } = jest.requireMock('@/lib/container');
    mockContainer = {
      userUseCase: {
        getUserById: jest.fn(),
        updateUser: jest.fn(),
      },
    };
    Container.getInstance = jest.fn(() => mockContainer);

    // Response関数のモック設定
    responseLib = jest.requireMock('@/lib/response');
    responseLib.success = jest.fn(() => new Response('success'));
    responseLib.error = jest.fn(() => new Response('error'));
    responseLib.unauthorized = jest.fn(() => new Response('unauthorized'));
    responseLib.forbidden = jest.fn(() => new Response('forbidden'));
    responseLib.notFound = jest.fn(() => new Response('not found'));
    responseLib.internalError = jest.fn(() => new Response('internal error'));
  });

  describe('GET /api/users/me - 現在ユーザー情報取得', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as unknown as NextRequest;
    };

    it('認証されたユーザーとして正常に自分の情報を取得できる', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 3,
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue(mockUser);

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      await GET(request);

      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-123');
      expect(responseLib.success).toHaveBeenCalledWith(
        mockUser,
        'ユーザー情報を取得しました',
      );
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      await GET(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('ユーザーIDヘッダーがない場合は401エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-role': '3',
      });

      await GET(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('ユーザーが見つからない場合は401エラーを返す', async () => {
      mockContainer.userUseCase.getUserById.mockResolvedValue(null);

      const request = createMockRequest({
        'x-user-id': 'nonexistent-user',
        'x-user-role': '3',
      });

      await GET(request);

      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith(
        'nonexistent-user',
      );
      expect(responseLib.unauthorized).toHaveBeenCalledWith(
        'ユーザー情報が見つかりません',
      );
    });

    it('データベースエラーが発生した場合は500エラーを返す', async () => {
      mockContainer.userUseCase.getUserById.mockRejectedValue(
        new Error('Database connection error'),
      );

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      await GET(request);

      expect(responseLib.internalError).toHaveBeenCalledWith(
        'ユーザー情報の取得に失敗しました',
      );
    });
  });

  describe('PATCH /api/users/me - 現在ユーザー情報更新', () => {
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

    it('管理者として正常にユーザー情報を更新できる（roleフィールド含む）', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        username: 'testuser',
        firstName: 'Updated',
        lastName: 'Name',
        role: 2,
      };

      mockContainer.userUseCase.updateUser.mockResolvedValue(mockUpdatedUser);

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '1', // ADMIN
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
          role: 2,
        },
      );

      await PATCH(request);

      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith('user-123', {
        firstName: 'Updated',
        lastName: 'Name',
        role: 2,
      });
      expect(responseLib.success).toHaveBeenCalledWith(
        mockUpdatedUser,
        'プロフィールを更新しました',
      );
    });

    it('マネージャーとして正常にユーザー情報を更新できる（roleフィールド含む）', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        username: 'testuser',
        firstName: 'Updated',
        lastName: 'Name',
        role: 3,
      };

      mockContainer.userUseCase.updateUser.mockResolvedValue(mockUpdatedUser);

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '2', // MANAGER
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
          role: 3,
        },
      );

      await PATCH(request);

      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith('user-123', {
        firstName: 'Updated',
        lastName: 'Name',
        role: 3,
      });
      expect(responseLib.success).toHaveBeenCalledWith(
        mockUpdatedUser,
        'プロフィールを更新しました',
      );
    });

    it('一般ユーザーとして正常にユーザー情報を更新できる（roleフィールド除外）', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        username: 'testuser',
        firstName: 'Updated',
        lastName: 'Name',
        role: 3,
      };

      mockContainer.userUseCase.updateUser.mockResolvedValue(mockUpdatedUser);

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '3', // USER
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
          role: 1, // この値は無視される
        },
      );

      await PATCH(request);

      expect(mockContainer.userUseCase.updateUser).toHaveBeenCalledWith('user-123', {
        firstName: 'Updated',
        lastName: 'Name',
        // roleフィールドが除外されている
      });
      expect(responseLib.success).toHaveBeenCalledWith(
        mockUpdatedUser,
        'プロフィールを更新しました',
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

      await PATCH(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('ユーザーIDヘッダーがない場合は401エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-role': '3',
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
        },
      );

      await PATCH(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('ユーザーロールヘッダーがない場合は401エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
        },
      );

      await PATCH(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('バリデーションエラーが発生した場合は400エラーを返す', async () => {
      const zodError = new ZodError([
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'First name is required',
          path: ['firstName'],
        },
      ]);

      // request.jsonをモックしてZodErrorを投げる
      const request = {
        headers: {
          get: jest
            .fn()
            .mockReturnValueOnce('user-123') // x-user-id
            .mockReturnValueOnce('3'), // x-user-role
        },
        json: jest.fn().mockImplementation(() => {
          throw zodError;
        }),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PATCH(request);

      expect(responseLib.error).toHaveBeenCalledWith(
        '入力データが正しくありません',
        400,
      );

      consoleSpy.mockRestore();
    });

    it('ユーザーが見つからない場合は401エラーを返す', async () => {
      mockContainer.userUseCase.updateUser.mockRejectedValue(
        new Error('ユーザーが見つかりません'),
      );

      const request = createMockRequest(
        {
          'x-user-id': 'nonexistent-user',
          'x-user-role': '3',
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
        },
      );

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PATCH(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith(
        'ユーザー情報が見つかりません',
      );

      consoleSpy.mockRestore();
    });

    it('予期しないエラーが発生した場合は500エラーを返す', async () => {
      mockContainer.userUseCase.updateUser.mockRejectedValue(
        new Error('Database connection error'),
      );

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '3',
        },
        {
          firstName: 'Updated',
          lastName: 'Name',
        },
      );

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PATCH(request);

      expect(responseLib.internalError).toHaveBeenCalledWith(
        'プロフィールの更新に失敗しました',
      );

      consoleSpy.mockRestore();
    });

    it('JSONパースエラーが発生した場合は500エラーを返す', async () => {
      const request = {
        headers: {
          get: jest
            .fn()
            .mockReturnValueOnce('user-123') // x-user-id
            .mockReturnValueOnce('3'), // x-user-role
        },
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PATCH(request);

      expect(responseLib.internalError).toHaveBeenCalledWith(
        'プロフィールの更新に失敗しました',
      );

      consoleSpy.mockRestore();
    });
  });
});
