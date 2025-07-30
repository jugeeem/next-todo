/**
 * @fileoverview ログインユーザーTodo管理API（/api/users/me/todos）のユニットテスト - ヘッダーベース認証対応版
 */

import type { NextRequest } from 'next/server';
import { GET } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

interface MockContainer {
  todoUseCase: {
    getTodosByUserId: jest.Mock;
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

describe('/api/users/me/todos API エンドポイント', () => {
  let mockContainer: MockContainer;
  let responseLib: MockResponseLib;

  beforeEach(() => {
    jest.clearAllMocks();

    // Container のモック設定
    const { Container } = jest.requireMock('@/lib/container');
    mockContainer = {
      todoUseCase: {
        getTodosByUserId: jest.fn(),
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

  describe('GET /api/users/me/todos - ログインユーザーTodo一覧取得', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as unknown as NextRequest;
    };

    it('認証されたユーザーとして正常にTodo一覧を取得できる', async () => {
      const mockTodos = [
        {
          id: 'todo-1',
          title: 'Todo 1',
          descriptions: 'Todo 1 の説明',
          userId: 'user-123',
          createdAt: new Date('2025-07-30T00:00:00.000Z'),
          updatedAt: new Date('2025-07-30T00:00:00.000Z'),
        },
        {
          id: 'todo-2',
          title: 'Todo 2',
          descriptions: 'Todo 2 の説明',
          userId: 'user-123',
          createdAt: new Date('2025-07-30T01:00:00.000Z'),
          updatedAt: new Date('2025-07-30T01:00:00.000Z'),
        },
      ];

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    it('Todoが0件の場合でも正常に空配列を取得できる', async () => {
      const mockTodos: never[] = [];

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    it('大量のTodoがある場合でも正常に一覧を取得できる', async () => {
      const mockTodos = Array.from({ length: 100 }, (_, index) => ({
        id: `todo-${index + 1}`,
        title: `Todo ${index + 1}`,
        descriptions: `Todo ${index + 1} の説明`,
        userId: 'user-123',
        createdAt: new Date(
          `2025-07-30T${String(index % 24).padStart(2, '0')}:00:00.000Z`,
        ),
        updatedAt: new Date(
          `2025-07-30T${String(index % 24).padStart(2, '0')}:00:00.000Z`,
        ),
      }));

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    it('単一のTodoのみがある場合でも正常に取得できる', async () => {
      const mockTodos = [
        {
          id: 'todo-single',
          title: '唯一のTodo',
          descriptions: '説明文',
          userId: 'user-123',
          createdAt: new Date('2025-07-30T12:00:00.000Z'),
          updatedAt: new Date('2025-07-30T12:00:00.000Z'),
        },
      ];

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    it('説明が空のTodoでも正常に取得できる', async () => {
      const mockTodos = [
        {
          id: 'todo-no-desc',
          title: '説明なしTodo',
          descriptions: null,
          userId: 'user-123',
          createdAt: new Date('2025-07-30T12:00:00.000Z'),
          updatedAt: new Date('2025-07-30T12:00:00.000Z'),
        },
      ];

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      await GET(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(mockContainer.todoUseCase.getTodosByUserId).not.toHaveBeenCalled();
    });

    it('ユーザーIDヘッダーがない場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      await GET(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(mockContainer.todoUseCase.getTodosByUserId).not.toHaveBeenCalled();
    });

    it('ユーザーIDが空文字の場合は401エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': '',
      });

      await GET(request);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(mockContainer.todoUseCase.getTodosByUserId).not.toHaveBeenCalled();
    });

    it('getTodosByUserIdがエラーを投げた場合は500エラーを返す', async () => {
      mockContainer.todoUseCase.getTodosByUserId.mockRejectedValue(
        new Error('Database connection error'),
      );

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.internalError).toHaveBeenCalledWith();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Get user todos error:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('予期しないエラーが発生した場合は500エラーを返す', async () => {
      mockContainer.todoUseCase.getTodosByUserId.mockRejectedValue(
        new Error('Unexpected database error'),
      );

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.internalError).toHaveBeenCalledWith();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Get user todos error:',
        expect.objectContaining({
          message: 'Unexpected database error',
        }),
      );

      consoleSpy.mockRestore();
    });

    it('非同期処理のタイムアウトエラーが発生した場合は500エラーを返す', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockContainer.todoUseCase.getTodosByUserId.mockRejectedValue(timeoutError);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.internalError).toHaveBeenCalledWith();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Get user todos error:',
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
        'Get user todos error:',
        expect.objectContaining({
          message: 'Container initialization failed',
        }),
      );

      consoleSpy.mockRestore();
    });

    it('異なるユーザーIDでも正常にTodo一覧を取得できる', async () => {
      const mockTodos = [
        {
          id: 'todo-another',
          title: '別ユーザーのTodo',
          descriptions: '別ユーザーの説明',
          userId: 'another-user-456',
          createdAt: new Date('2025-07-30T15:00:00.000Z'),
          updatedAt: new Date('2025-07-30T15:00:00.000Z'),
        },
      ];

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      const request = createMockRequest({
        'x-user-id': 'another-user-456',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'another-user-456',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    it('UUIDフォーマットのユーザーIDでも正常にTodo一覧を取得できる', async () => {
      const mockTodos = [
        {
          id: 'todo-uuid',
          title: 'UUID ユーザーのTodo',
          descriptions: 'UUID ユーザーの説明',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          createdAt: new Date('2025-07-30T18:00:00.000Z'),
          updatedAt: new Date('2025-07-30T18:00:00.000Z'),
        },
      ];

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      const request = createMockRequest({
        'x-user-id': '550e8400-e29b-41d4-a716-446655440000',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    it('長いタイトルや説明を持つTodoでも正常に取得できる', async () => {
      const longTitle = 'a'.repeat(32); // 最大長
      const longDescription = 'b'.repeat(128); // 最大長

      const mockTodos = [
        {
          id: 'todo-long',
          title: longTitle,
          descriptions: longDescription,
          userId: 'user-123',
          createdAt: new Date('2025-07-30T20:00:00.000Z'),
          updatedAt: new Date('2025-07-30T20:00:00.000Z'),
        },
      ];

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    it('エラーログが正確に出力される', async () => {
      const testError = new Error('Test database error');
      mockContainer.todoUseCase.getTodosByUserId.mockRejectedValue(testError);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      // console.errorをスパイ
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Get user todos error:', testError);

      consoleSpy.mockRestore();
    });

    it('作成日と更新日が異なるTodoでも正常に取得できる', async () => {
      const mockTodos = [
        {
          id: 'todo-diff-dates',
          title: '日付が異なるTodo',
          descriptions: '作成日と更新日が異なる',
          userId: 'user-123',
          createdAt: new Date('2025-07-29T10:00:00.000Z'),
          updatedAt: new Date('2025-07-30T12:00:00.000Z'),
        },
      ];

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      const request = createMockRequest({
        'x-user-id': 'user-123',
      });

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });
  });
});
