/**
 * @fileoverview ユーザーTodo統計API（/api/users/me/todos/stats）のユニットテスト - ヘッダーベース認証対応版
 */

import type { NextRequest } from 'next/server';
import { GET } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

interface MockContainer {
  todoUseCase: {
    getTodoStatsByUserId: jest.Mock;
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

describe('/api/users/me/todos/stats API エンドポイント', () => {
  let mockContainer: MockContainer;
  let responseLib: MockResponseLib;

  beforeEach(() => {
    jest.clearAllMocks();

    // Container のモック設定
    const { Container } = jest.requireMock('@/lib/container');
    mockContainer = {
      todoUseCase: {
        getTodoStatsByUserId: jest.fn(),
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

  describe('GET /api/users/me/todos/stats - Todo統計情報取得', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as unknown as NextRequest;
    };

    it('認証されたユーザーとして正常にTodo統計情報を取得できる', async () => {
      const mockStats = {
        totalTodos: 10,
        completedTodos: 6,
        pendingTodos: 4,
        completionRate: 60,
      };

      mockContainer.todoUseCase.getTodoStatsByUserId.mockResolvedValue(mockStats);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodoStatsByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockStats);
    });

    it('Todoが0件の場合でも正常に統計情報を取得できる', async () => {
      const mockStats = {
        totalTodos: 0,
        completedTodos: 0,
        pendingTodos: 0,
        completionRate: 0,
      };

      mockContainer.todoUseCase.getTodoStatsByUserId.mockResolvedValue(mockStats);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodoStatsByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockStats);
    });

    it('大量のTodoがある場合でも正常に統計情報を取得できる', async () => {
      const mockStats = {
        totalTodos: 1000,
        completedTodos: 750,
        pendingTodos: 250,
        completionRate: 75,
      };

      mockContainer.todoUseCase.getTodoStatsByUserId.mockResolvedValue(mockStats);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodoStatsByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockStats);
    });

    it('完了率が100%の場合でも正常に統計情報を取得できる', async () => {
      const mockStats = {
        totalTodos: 5,
        completedTodos: 5,
        pendingTodos: 0,
        completionRate: 100,
      };

      mockContainer.todoUseCase.getTodoStatsByUserId.mockResolvedValue(mockStats);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodoStatsByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockStats);
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      await GET(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(mockContainer.todoUseCase.getTodoStatsByUserId).not.toHaveBeenCalled();
    });

    it('ユーザーIDヘッダーがない場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      await GET(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(mockContainer.todoUseCase.getTodoStatsByUserId).not.toHaveBeenCalled();
    });

    it('ユーザーIDが空文字の場合は401エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': '',
      });

      await GET(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(mockContainer.todoUseCase.getTodoStatsByUserId).not.toHaveBeenCalled();
    });

    it('getTodoStatsByUserIdがエラーを投げた場合は500エラーを返す', async () => {
      mockContainer.todoUseCase.getTodoStatsByUserId.mockRejectedValue(
        new Error('Database connection error'),
      );

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request);

      expect(mockContainer.todoUseCase.getTodoStatsByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.internalError).toHaveBeenCalledWith();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Get user todo stats error:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('予期しないエラーが発生した場合は500エラーを返す', async () => {
      mockContainer.todoUseCase.getTodoStatsByUserId.mockRejectedValue(
        new Error('Unexpected database error'),
      );

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request);

      expect(mockContainer.todoUseCase.getTodoStatsByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.internalError).toHaveBeenCalledWith();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Get user todo stats error:',
        expect.objectContaining({
          message: 'Unexpected database error',
        }),
      );

      consoleSpy.mockRestore();
    });

    it('非同期処理のタイムアウトエラーが発生した場合は500エラーを返す', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockContainer.todoUseCase.getTodoStatsByUserId.mockRejectedValue(timeoutError);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request);

      expect(mockContainer.todoUseCase.getTodoStatsByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.internalError).toHaveBeenCalledWith();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Get user todo stats error:',
        expect.objectContaining({
          name: 'TimeoutError',
          message: 'Request timeout',
        }),
      );

      consoleSpy.mockRestore();
    });

    it('Containerインスタンス取得エラーが発生した場合は500エラーを返す', async () => {
      // Container.getInstanceをエラーを投げるようにモック
      const { Container } = jest.requireMock('@/lib/container');
      Container.getInstance = jest.fn(() => {
        throw new Error('Container initialization failed');
      });

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request);

      expect(responseLib.internalError).toHaveBeenCalledWith();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Get user todo stats error:',
        expect.objectContaining({
          message: 'Container initialization failed',
        }),
      );

      consoleSpy.mockRestore();
    });

    it('異なるユーザーIDでも正常に統計情報を取得できる', async () => {
      const mockStats = {
        totalTodos: 3,
        completedTodos: 1,
        pendingTodos: 2,
        completionRate: 33,
      };

      mockContainer.todoUseCase.getTodoStatsByUserId.mockResolvedValue(mockStats);

      const request = createMockRequest({
        'x-user-id': 'another-user-456',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodoStatsByUserId).toHaveBeenCalledWith(
        'another-user-456',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockStats);
    });

    it('UUIDフォーマットのユーザーIDでも正常に統計情報を取得できる', async () => {
      const mockStats = {
        totalTodos: 15,
        completedTodos: 8,
        pendingTodos: 7,
        completionRate: 53,
      };

      mockContainer.todoUseCase.getTodoStatsByUserId.mockResolvedValue(mockStats);

      const request = createMockRequest({
        'x-user-id': '550e8400-e29b-41d4-a716-446655440000',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodoStatsByUserId).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockStats);
    });

    it('エラーログが正確に出力される', async () => {
      const testError = new Error('Test database error');
      mockContainer.todoUseCase.getTodoStatsByUserId.mockRejectedValue(testError);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      // console.errorをスパイ
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Get user todo stats error:', testError);

      consoleSpy.mockRestore();
    });
  });
});
