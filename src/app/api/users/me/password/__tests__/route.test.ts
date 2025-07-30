/**
 * @fileoverview パスワード変更API（/api/users/me/password）のユニットテスト - ヘッダーベース認証対応版
 */

import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { PUT } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

interface MockContainer {
  userUseCase: {
    changePassword: jest.Mock;
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

describe('/api/users/me/password API エンドポイント', () => {
  let mockContainer: MockContainer;
  let responseLib: MockResponseLib;

  beforeEach(() => {
    jest.clearAllMocks();

    // Container のモック設定
    const { Container } = jest.requireMock('@/lib/container');
    mockContainer = {
      userUseCase: {
        changePassword: jest.fn(),
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

  describe('PUT /api/users/me/password - パスワード変更', () => {
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

    it('認証されたユーザーとして正常にパスワードを変更できる', async () => {
      mockContainer.userUseCase.changePassword.mockResolvedValue(undefined);

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
        },
        {
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
          confirmPassword: 'newPassword123',
        },
      );

      await PUT(request);

      expect(mockContainer.userUseCase.changePassword).toHaveBeenCalledWith(
        'user-123',
        'currentPassword123',
        'newPassword123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(
        null,
        'パスワードを変更しました',
      );
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest(
        {},
        {
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
          confirmPassword: 'newPassword123',
        },
      );

      await PUT(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(mockContainer.userUseCase.changePassword).not.toHaveBeenCalled();
    });

    it('ユーザーIDヘッダーがない場合は401エラーを返す', async () => {
      const request = createMockRequest(
        {},
        {
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
          confirmPassword: 'newPassword123',
        },
      );

      await PUT(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(mockContainer.userUseCase.changePassword).not.toHaveBeenCalled();
    });

    it('現在のパスワードが未入力の場合は400エラーを返す', async () => {
      const zodError = new ZodError([
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Current password is required',
          path: ['currentPassword'],
        },
      ]);

      const request = {
        headers: {
          get: jest.fn().mockReturnValueOnce('user-123'), // x-user-id
        },
        json: jest.fn().mockImplementation(() => {
          throw zodError;
        }),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(responseLib.error).toHaveBeenCalledWith(
        '入力データが正しくありません: Current password is required',
        400,
      );
      expect(mockContainer.userUseCase.changePassword).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('新しいパスワードが6文字未満の場合は400エラーを返す', async () => {
      const zodError = new ZodError([
        {
          code: 'too_small',
          minimum: 6,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Password must be at least 6 characters',
          path: ['newPassword'],
        },
      ]);

      const request = {
        headers: {
          get: jest.fn().mockReturnValueOnce('user-123'), // x-user-id
        },
        json: jest.fn().mockImplementation(() => {
          throw zodError;
        }),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(responseLib.error).toHaveBeenCalledWith(
        '入力データが正しくありません: Password must be at least 6 characters',
        400,
      );
      expect(mockContainer.userUseCase.changePassword).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('確認パスワードが未入力の場合は400エラーを返す', async () => {
      const zodError = new ZodError([
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Password confirmation is required',
          path: ['confirmPassword'],
        },
      ]);

      const request = {
        headers: {
          get: jest.fn().mockReturnValueOnce('user-123'), // x-user-id
        },
        json: jest.fn().mockImplementation(() => {
          throw zodError;
        }),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(responseLib.error).toHaveBeenCalledWith(
        '入力データが正しくありません: Password confirmation is required',
        400,
      );
      expect(mockContainer.userUseCase.changePassword).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('新しいパスワードと確認パスワードが一致しない場合は400エラーを返す', async () => {
      const zodError = new ZodError([
        {
          code: 'custom',
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        },
      ]);

      const request = {
        headers: {
          get: jest.fn().mockReturnValueOnce('user-123'), // x-user-id
        },
        json: jest.fn().mockImplementation(() => {
          throw zodError;
        }),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(responseLib.error).toHaveBeenCalledWith(
        '入力データが正しくありません: Passwords do not match',
        400,
      );
      expect(mockContainer.userUseCase.changePassword).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('複数のバリデーションエラーがある場合は全てのエラーメッセージを返す', async () => {
      const zodError = new ZodError([
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Current password is required',
          path: ['currentPassword'],
        },
        {
          code: 'too_small',
          minimum: 6,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Password must be at least 6 characters',
          path: ['newPassword'],
        },
      ]);

      const request = {
        headers: {
          get: jest.fn().mockReturnValueOnce('user-123'), // x-user-id
        },
        json: jest.fn().mockImplementation(() => {
          throw zodError;
        }),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(responseLib.error).toHaveBeenCalledWith(
        '入力データが正しくありません: Current password is required, Password must be at least 6 characters',
        400,
      );
      expect(mockContainer.userUseCase.changePassword).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('ユーザーが見つからない場合は401エラーを返す', async () => {
      mockContainer.userUseCase.changePassword.mockRejectedValue(
        new Error('ユーザーが見つかりません'),
      );

      const request = createMockRequest(
        {
          'x-user-id': 'nonexistent-user',
        },
        {
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
          confirmPassword: 'newPassword123',
        },
      );

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(mockContainer.userUseCase.changePassword).toHaveBeenCalledWith(
        'nonexistent-user',
        'currentPassword123',
        'newPassword123',
      );
      expect(responseLib.unauthorized).toHaveBeenCalledWith(
        'ユーザー情報が見つかりません',
      );

      consoleSpy.mockRestore();
    });

    it('現在のパスワードが間違っている場合は400エラーを返す', async () => {
      mockContainer.userUseCase.changePassword.mockRejectedValue(
        new Error('現在のパスワードが間違っています'),
      );

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
        },
        {
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123',
          confirmPassword: 'newPassword123',
        },
      );

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(mockContainer.userUseCase.changePassword).toHaveBeenCalledWith(
        'user-123',
        'wrongPassword',
        'newPassword123',
      );
      expect(responseLib.error).toHaveBeenCalledWith(
        '現在のパスワードが間違っています',
        400,
      );

      consoleSpy.mockRestore();
    });

    it('パスワード更新に失敗した場合は500エラーを返す', async () => {
      mockContainer.userUseCase.changePassword.mockRejectedValue(
        new Error('パスワードの更新に失敗しました'),
      );

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
        },
        {
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
          confirmPassword: 'newPassword123',
        },
      );

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(mockContainer.userUseCase.changePassword).toHaveBeenCalledWith(
        'user-123',
        'currentPassword123',
        'newPassword123',
      );
      expect(responseLib.internalError).toHaveBeenCalledWith(
        'パスワードの更新に失敗しました',
      );

      consoleSpy.mockRestore();
    });

    it('予期しないエラーが発生した場合は500エラーを返す', async () => {
      mockContainer.userUseCase.changePassword.mockRejectedValue(
        new Error('Database connection error'),
      );

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
        },
        {
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
          confirmPassword: 'newPassword123',
        },
      );

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(mockContainer.userUseCase.changePassword).toHaveBeenCalledWith(
        'user-123',
        'currentPassword123',
        'newPassword123',
      );
      expect(responseLib.internalError).toHaveBeenCalledWith(
        'パスワード変更処理中にエラーが発生しました',
      );

      consoleSpy.mockRestore();
    });

    it('JSONパースエラーが発生した場合は500エラーを返す', async () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValueOnce('user-123'), // x-user-id
        },
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(request);

      expect(responseLib.internalError).toHaveBeenCalledWith(
        'パスワード変更処理中にエラーが発生しました',
      );
      expect(mockContainer.userUseCase.changePassword).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('最小限の有効なデータでパスワード変更が成功する', async () => {
      mockContainer.userUseCase.changePassword.mockResolvedValue(undefined);

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
        },
        {
          currentPassword: 'current',
          newPassword: '123456', // 最小6文字
          confirmPassword: '123456',
        },
      );

      await PUT(request);

      expect(mockContainer.userUseCase.changePassword).toHaveBeenCalledWith(
        'user-123',
        'current',
        '123456',
      );
      expect(responseLib.success).toHaveBeenCalledWith(
        null,
        'パスワードを変更しました',
      );
    });

    it('長いパスワードでも正常に処理できる', async () => {
      mockContainer.userUseCase.changePassword.mockResolvedValue(undefined);

      const longPassword = 'a'.repeat(100); // 100文字のパスワード

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
        },
        {
          currentPassword: 'currentPassword123',
          newPassword: longPassword,
          confirmPassword: longPassword,
        },
      );

      await PUT(request);

      expect(mockContainer.userUseCase.changePassword).toHaveBeenCalledWith(
        'user-123',
        'currentPassword123',
        longPassword,
      );
      expect(responseLib.success).toHaveBeenCalledWith(
        null,
        'パスワードを変更しました',
      );
    });

    it('特殊文字を含むパスワードでも正常に処理できる', async () => {
      mockContainer.userUseCase.changePassword.mockResolvedValue(undefined);

      const specialCharPassword = 'pass@#$%^&*()_+{}|:"<>?[];,./';

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
        },
        {
          currentPassword: 'currentPassword123',
          newPassword: specialCharPassword,
          confirmPassword: specialCharPassword,
        },
      );

      await PUT(request);

      expect(mockContainer.userUseCase.changePassword).toHaveBeenCalledWith(
        'user-123',
        'currentPassword123',
        specialCharPassword,
      );
      expect(responseLib.success).toHaveBeenCalledWith(
        null,
        'パスワードを変更しました',
      );
    });
  });
});
