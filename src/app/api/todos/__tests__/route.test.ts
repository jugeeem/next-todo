/**
 * @fileoverview Todos API route unit tests - 完全修正版
 *
 * TODO APIのルーティングが正しく動作することを検証するテストです。
 * ユーザーAPIと完全に同じモック戦略を適用します。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';

// テスト用の型定義
interface User {
  userId: number;
  username: string;
  role: number;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface Todo {
  id: number;
  title: string;
  descriptions: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface TodoInput {
  title: string;
  descriptions?: string | null;
  userId?: number;
}

// ユーザーAPIと完全に同じモック設定
jest.mock('@/lib/auth-middleware');
jest.mock('@/lib/container');
jest.mock('@/lib/response');

describe('/api/todos API エンドポイント', () => {
  let mockAuthMiddleware: {
    authenticate: jest.MockedFunction<(request: NextRequest) => AuthResult>;
  };

  let mockContainer: {
    todoUseCase: {
      getTodosByUserId: jest.MockedFunction<(userId: number) => Promise<Todo[]>>;
      createTodo: jest.MockedFunction<(todoData: TodoInput) => Promise<Todo>>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // モジュールキャッシュをクリア
    jest.resetModules();

    // ユーザーAPIと完全に同じモック設定パターン
    mockAuthMiddleware = {
      authenticate: jest.fn(),
    };

    mockContainer = {
      todoUseCase: {
        getTodosByUserId: jest.fn(),
        createTodo: jest.fn(),
      },
    };

    // AuthMiddleware のモック設定
    const { AuthMiddleware } = jest.requireMock('@/lib/auth-middleware');
    AuthMiddleware.mockImplementation(() => mockAuthMiddleware);

    // Container のモック設定
    const { Container } = jest.requireMock('@/lib/container');
    Container.getInstance = jest.fn(() => mockContainer);

    // Response関数のモック設定
    const responseLib = jest.requireMock('@/lib/response');
    responseLib.success = jest.fn(() => new Response('success'));
    responseLib.error = jest.fn(() => new Response('error'));
    responseLib.unauthorized = jest.fn(() => new Response('unauthorized'));
    responseLib.internalError = jest.fn(() => new Response('internal error'));
  });

  describe('GET /api/todos - TODO一覧取得', () => {
    const createMockRequest = (method = 'GET', authHeader?: string): NextRequest => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      return {
        method,
        url: 'http://localhost:3000/api/todos',
        headers,
        json: jest.fn(),
      } as unknown as NextRequest;
    };

    test('認証トークンが無効な場合は401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer invalid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: 'Invalid token',
      });

      // Dynamic import after mock setup
      const { GET } = await import('../route');

      // Act
      await GET(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(responseLib.unauthorized).toHaveBeenCalledWith('Invalid token');
      expect(mockContainer.todoUseCase.getTodosByUserId).not.toHaveBeenCalled();
    });

    test('認証されたユーザーとして正常にTODO一覧を取得できる', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer valid-token');
      const mockTodos = [
        {
          id: 1,
          title: 'テストタスク1',
          descriptions: 'テスト用の説明1',
          userId: 1,
          createdAt: '2025-07-27T10:00:00.000Z',
          updatedAt: '2025-07-27T10:00:00.000Z',
        },
      ];

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      // Dynamic import after mock setup
      const { GET } = await import('../route');

      // Act
      await GET(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(1);
      expect(responseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    test('TODOが存在しない場合は空配列を返す', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer valid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue([]);

      // Dynamic import after mock setup
      const { GET } = await import('../route');

      // Act
      await GET(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(1);
      expect(responseLib.success).toHaveBeenCalledWith([]);
    });

    test('予期しないエラーが発生した場合は500エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer valid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      mockContainer.todoUseCase.getTodosByUserId.mockRejectedValue(
        new Error('Database error'),
      );

      // console.error をモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Dynamic import after mock setup
      const { GET } = await import('../route');

      // Act
      await GET(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(consoleSpy).toHaveBeenCalledWith('Get todos error:', expect.any(Error));
      expect(responseLib.internalError).toHaveBeenCalled();

      // モックを復元
      consoleSpy.mockRestore();
    });
  });

  describe('POST /api/todos - TODO作成', () => {
    const createMockRequest = (
      method = 'POST',
      body?: unknown,
      authHeader?: string,
    ): NextRequest => {
      const headers = new Headers();
      headers.set('content-type', 'application/json');
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      return {
        method,
        url: 'http://localhost:3000/api/todos',
        headers,
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    test('正常なTODO作成リクエスト', async () => {
      // Arrange
      const validTodo = { title: '新しいタスク', descriptions: '詳細な説明' };
      const request = createMockRequest('POST', validTodo, 'Bearer valid-token');
      const createdTodo = {
        id: 1,
        ...validTodo,
        userId: 1,
        createdAt: '2025-07-27T10:00:00.000Z',
        updatedAt: '2025-07-27T10:00:00.000Z',
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      mockContainer.todoUseCase.createTodo.mockResolvedValue(createdTodo);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert - TODO APIではuserIdが追加されたオブジェクトを渡している
      const expectedTodoInput = { ...validTodo, userId: 1 };
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.todoUseCase.createTodo).toHaveBeenCalledWith(
        expectedTodoInput,
      );
      expect(responseLib.success).toHaveBeenCalledWith(
        createdTodo,
        'Todo created successfully',
      );
    });

    test('認証トークンが無効な場合は401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest(
        'POST',
        { title: 'テストタスク' },
        'Bearer expired-token',
      );
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: 'Token expired',
      });

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.unauthorized).toHaveBeenCalledWith('Token expired');
      expect(mockContainer.todoUseCase.createTodo).not.toHaveBeenCalled();
    });

    test('バリデーションエラーの場合は400エラーを返す', async () => {
      // Arrange
      const invalidTodo = { descriptions: '説明のみでタイトルなし' }; // titleが必須なのに欠けている
      const request = createMockRequest('POST', invalidTodo, 'Bearer valid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(responseLib.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input:'),
      );
      expect(mockContainer.todoUseCase.createTodo).not.toHaveBeenCalled();
    });

    test('予期しないエラーが発生した場合は500エラーを返す', async () => {
      // Arrange
      const validTodo = { title: '新しいタスク', descriptions: '詳細な説明' };
      const request = createMockRequest('POST', validTodo, 'Bearer valid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      mockContainer.todoUseCase.createTodo.mockRejectedValue(
        new Error('Database error'),
      );

      // console.error をモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(consoleSpy).toHaveBeenCalledWith('Create todo error:', expect.any(Error));
      expect(responseLib.error).toHaveBeenCalledWith('Database error');

      // モックを復元
      consoleSpy.mockRestore();
    });
  });
});
