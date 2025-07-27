/**
 * @fileoverview Todos API [id] route unit tests - Next.js 15対応版
 *
 * TODO APIの個別TODO操作エンドポイント（GET, PUT, DELETE）の包括的なユニットテストです。
 * 認証、認可、バリデーション、エラーハンドリングの各シナリオをカバーしています。
 *
 * テスト対象:
 * - GET /api/todos/[id]: 指定IDのTODO取得
 * - PUT /api/todos/[id]: 指定IDのTODO更新
 * - DELETE /api/todos/[id]: 指定IDのTODO削除
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';

// TypeScript型定義
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
  title?: string;
  descriptions?: string;
}

// モック設定 - ユーザーAPIテストと同じパターン
jest.mock('@/lib/auth-middleware');
jest.mock('@/lib/container');
jest.mock('@/lib/response');

describe('/api/todos/[id] API エンドポイント', () => {
  let mockAuthMiddleware: {
    authenticate: jest.MockedFunction<(request: NextRequest) => AuthResult>;
  };

  let mockContainer: {
    todoUseCase: {
      getTodoById: jest.MockedFunction<(id: string) => Promise<Todo | null>>;
      updateTodo: jest.MockedFunction<
        (id: string, data: TodoInput) => Promise<Todo | null>
      >;
      deleteTodo: jest.MockedFunction<(id: string) => Promise<boolean>>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // モジュールキャッシュをクリア
    jest.resetModules();

    // モック設定
    mockAuthMiddleware = {
      authenticate: jest.fn(),
    };

    mockContainer = {
      todoUseCase: {
        getTodoById: jest.fn(),
        updateTodo: jest.fn(),
        deleteTodo: jest.fn(),
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
    responseLib.notFound = jest.fn(() => new Response('not found'));
  });

  describe('GET /api/todos/[id] - TODO取得', () => {
    const createMockRequest = (method = 'GET', authHeader?: string): NextRequest => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      return {
        method,
        url: 'http://localhost:3000/api/todos/1',
        headers,
        json: jest.fn(),
      } as unknown as NextRequest;
    };

    // Next.js 15対応: paramsはPromiseを返す
    const mockParams = {
      params: Promise.resolve({ id: '1' }),
    };

    it('認証されたユーザーが自分のTODOを正常に取得できる', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer valid-token');
      const mockTodo = {
        id: 1,
        title: 'テストタスク',
        descriptions: 'テスト用の説明',
        userId: 1,
        createdAt: '2025-07-27T10:00:00.000Z',
        updatedAt: '2025-07-27T10:00:00.000Z',
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      mockContainer.todoUseCase.getTodoById.mockResolvedValue(mockTodo);

      // Dynamic import after mock setup
      const { GET } = await import('../route');

      // Act
      await GET(request, mockParams);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(responseLib.success).toHaveBeenCalledWith(mockTodo);
    });

    it('認証トークンが無効な場合は401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer invalid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: 'Invalid token',
      });

      // Dynamic import after mock setup
      const { GET } = await import('../route');

      // Act
      await GET(request, mockParams);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(responseLib.unauthorized).toHaveBeenCalledWith('Invalid token');
      expect(mockContainer.todoUseCase.getTodoById).not.toHaveBeenCalled();
    });

    it('TODOが存在しない場合は404エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('GET', 'Bearer valid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      mockContainer.todoUseCase.getTodoById.mockResolvedValue(null);

      // Dynamic import after mock setup
      const { GET } = await import('../route');

      // Act
      await GET(request, mockParams);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(responseLib.notFound).toHaveBeenCalledWith('Todo not found');
    });
  });

  describe('PUT /api/todos/[id] - TODO更新', () => {
    const createMockRequest = (
      method = 'PUT',
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
        url: 'http://localhost:3000/api/todos/1',
        headers,
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    // Next.js 15対応: paramsはPromiseを返す
    const mockParams = {
      params: Promise.resolve({ id: '1' }),
    };

    it('認証されたユーザーが自分のTODOを正常に更新できる', async () => {
      // Arrange
      const updateData = { title: '更新されたタスク', descriptions: '更新された説明' };
      const request = createMockRequest('PUT', updateData, 'Bearer valid-token');
      const existingTodo = {
        id: 1,
        title: '旧タイトル',
        descriptions: '旧説明',
        userId: 1,
        createdAt: '2025-07-27T10:00:00.000Z',
        updatedAt: '2025-07-27T10:00:00.000Z',
      };
      const updatedTodo = {
        id: 1,
        ...updateData,
        userId: 1,
        createdAt: '2025-07-27T10:00:00.000Z',
        updatedAt: '2025-07-27T11:00:00.000Z',
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      // getTodoByIdが先に呼ばれる
      mockContainer.todoUseCase.getTodoById.mockResolvedValue(existingTodo);
      mockContainer.todoUseCase.updateTodo.mockResolvedValue(updatedTodo);

      // Dynamic import after mock setup
      const { PUT } = await import('../route');

      // Act
      await PUT(request, mockParams);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(mockContainer.todoUseCase.updateTodo).toHaveBeenCalledWith(
        '1',
        updateData,
      );
      expect(responseLib.success).toHaveBeenCalledWith(
        updatedTodo,
        'Todo updated successfully',
      );
    });

    it('認証トークンが無効な場合は401エラーを返す', async () => {
      // Arrange
      const updateData = { title: '更新されたタスク' };
      const request = createMockRequest('PUT', updateData, 'Bearer invalid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: 'Invalid token',
      });

      // Dynamic import after mock setup
      const { PUT } = await import('../route');

      // Act
      await PUT(request, mockParams);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.unauthorized).toHaveBeenCalledWith('Invalid token');
      expect(mockContainer.todoUseCase.updateTodo).not.toHaveBeenCalled();
    });

    it('バリデーションエラーの場合は400エラーを返す', async () => {
      // Arrange
      const invalidData = { title: '', descriptions: null }; // 空のタイトル
      const request = createMockRequest('PUT', invalidData, 'Bearer valid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });

      // Dynamic import after mock setup
      const { PUT } = await import('../route');

      // Act
      await PUT(request, mockParams);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input:'),
      );
      expect(mockContainer.todoUseCase.updateTodo).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/todos/[id] - TODO削除', () => {
    const createMockRequest = (method = 'DELETE', authHeader?: string): NextRequest => {
      const headers = new Headers();
      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      return {
        method,
        url: 'http://localhost:3000/api/todos/1',
        headers,
        json: jest.fn(),
      } as unknown as NextRequest;
    };

    // Next.js 15対応: paramsはPromiseを返す
    const mockParams = {
      params: Promise.resolve({ id: '1' }),
    };

    it('認証されたユーザーが自分のTODOを正常に削除できる', async () => {
      // Arrange
      const request = createMockRequest('DELETE', 'Bearer valid-token');
      const existingTodo = {
        id: 1,
        title: 'テストタスク',
        descriptions: 'テスト用の説明',
        userId: 1,
        createdAt: '2025-07-27T10:00:00.000Z',
        updatedAt: '2025-07-27T10:00:00.000Z',
      };

      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      // getTodoByIdが先に呼ばれる
      mockContainer.todoUseCase.getTodoById.mockResolvedValue(existingTodo);
      mockContainer.todoUseCase.deleteTodo.mockResolvedValue(true);

      // Dynamic import after mock setup
      const { DELETE } = await import('../route');

      // Act
      await DELETE(request, mockParams);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockAuthMiddleware.authenticate).toHaveBeenCalledWith(request);
      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(mockContainer.todoUseCase.deleteTodo).toHaveBeenCalledWith('1');
      expect(responseLib.success).toHaveBeenCalledWith(
        null,
        'Todo deleted successfully',
      );
    });

    it('認証トークンが無効な場合は401エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('DELETE', 'Bearer invalid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: false,
        error: 'Invalid token',
      });

      // Dynamic import after mock setup
      const { DELETE } = await import('../route');

      // Act
      await DELETE(request, mockParams);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.unauthorized).toHaveBeenCalledWith('Invalid token');
      expect(mockContainer.todoUseCase.deleteTodo).not.toHaveBeenCalled();
    });

    it('TODOが存在しない場合は404エラーを返す', async () => {
      // Arrange
      const request = createMockRequest('DELETE', 'Bearer valid-token');
      mockAuthMiddleware.authenticate.mockReturnValue({
        success: true,
        user: { userId: 1, username: 'testuser', role: 4 },
      });
      // getTodoByIdでnullが返される
      mockContainer.todoUseCase.getTodoById.mockResolvedValue(null);

      // Dynamic import after mock setup
      const { DELETE } = await import('../route');

      // Act
      await DELETE(request, mockParams);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(responseLib.notFound).toHaveBeenCalledWith('Todo not found');
      // deleteTodoは呼ばれない
      expect(mockContainer.todoUseCase.deleteTodo).not.toHaveBeenCalled();
    });
  });
});
