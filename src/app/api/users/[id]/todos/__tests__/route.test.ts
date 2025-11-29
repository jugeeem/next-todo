/**
 * @fileoverview ユーザー別Todo管理APIのテスト（ページネーション対応）
 *
 * このファイルは、特定ユーザーのTodo一覧取得APIエンドポイントの
 * 単体テストを実装します。認証、権限チェック、ページネーション、
 * フィルター、ソート機能の動作を検証します。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import { GET } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

interface MockContainer {
  userUseCase: {
    getUserById: jest.Mock;
  };
  todoUseCase: {
    getTodosByUserIdWithOptions: jest.Mock;
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

describe('/api/users/[id]/todos', () => {
  let mockContainer: MockContainer;
  let responseLib: MockResponseLib;

  const mockTodos = [
    {
      id: 'todo-1',
      title: 'Test Todo 1',
      descriptions: 'Test Description 1',
      userId: 'user-123',
      completed: false,
      createdAt: new Date('2025-07-30T00:00:00.000Z'),
      updatedAt: new Date('2025-07-30T00:00:00.000Z'),
    },
    {
      id: 'todo-2',
      title: 'Test Todo 2',
      descriptions: 'Test Description 2',
      userId: 'user-123',
      completed: true,
      createdAt: new Date('2025-07-30T01:00:00.000Z'),
      updatedAt: new Date('2025-07-30T01:00:00.000Z'),
    },
  ];

  const mockPaginatedResponse = {
    data: mockTodos,
    total: 50,
    page: 1,
    perPage: 10,
    totalPages: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Container のモック設定
    const { Container } = jest.requireMock('@/lib/container');
    mockContainer = {
      userUseCase: {
        getUserById: jest.fn(),
      },
      todoUseCase: {
        getTodosByUserIdWithOptions: jest.fn(),
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

  const createMockRequest = (
    url: string,
    headers: Record<string, string> = {},
  ): NextRequest => {
    return {
      url,
      headers: {
        get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
      },
    } as unknown as NextRequest;
  };

  describe('GET /api/users/[id]/todos', () => {
    it('デフォルトパラメータでTodo一覧を取得できる', async () => {
      const request = createMockRequest('http://localhost/api/users/user-123/todos', {
        'x-user-id': 'user-123',
        'x-user-role': '4',
      });

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue({ id: 'user-123' });
      mockContainer.todoUseCase.getTodosByUserIdWithOptions.mockResolvedValue(
        mockPaginatedResponse,
      );

      await GET(request, context);

      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-123');
      expect(
        mockContainer.todoUseCase.getTodosByUserIdWithOptions,
      ).toHaveBeenCalledWith('user-123', {
        page: 1,
        perPage: 10,
        completedFilter: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(responseLib.success).toHaveBeenCalledWith(
        mockPaginatedResponse,
        'Todos retrieved successfully',
      );
    });

    it('ページネーションパラメータを指定してTodo一覧を取得できる', async () => {
      const request = createMockRequest(
        'http://localhost/api/users/user-123/todos?page=2&perPage=20',
        {
          'x-user-id': 'user-123',
          'x-user-role': '4',
        },
      );

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      const paginatedResponse = {
        ...mockPaginatedResponse,
        page: 2,
        perPage: 20,
        totalPages: 3,
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue({ id: 'user-123' });
      mockContainer.todoUseCase.getTodosByUserIdWithOptions.mockResolvedValue(
        paginatedResponse,
      );

      await GET(request, context);

      expect(
        mockContainer.todoUseCase.getTodosByUserIdWithOptions,
      ).toHaveBeenCalledWith('user-123', {
        page: 2,
        perPage: 20,
        completedFilter: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(responseLib.success).toHaveBeenCalledWith(
        paginatedResponse,
        'Todos retrieved successfully',
      );
    });

    it('完了状態フィルターを指定してTodo一覧を取得できる', async () => {
      const request = createMockRequest(
        'http://localhost/api/users/user-123/todos?completedFilter=incomplete',
        {
          'x-user-id': 'user-123',
          'x-user-role': '4',
        },
      );

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue({ id: 'user-123' });
      mockContainer.todoUseCase.getTodosByUserIdWithOptions.mockResolvedValue(
        mockPaginatedResponse,
      );

      await GET(request, context);

      expect(
        mockContainer.todoUseCase.getTodosByUserIdWithOptions,
      ).toHaveBeenCalledWith('user-123', {
        page: 1,
        perPage: 10,
        completedFilter: 'incomplete',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('ソート条件を指定してTodo一覧を取得できる', async () => {
      const request = createMockRequest(
        'http://localhost/api/users/user-123/todos?sortBy=title&sortOrder=asc',
        {
          'x-user-id': 'user-123',
          'x-user-role': '4',
        },
      );

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue({ id: 'user-123' });
      mockContainer.todoUseCase.getTodosByUserIdWithOptions.mockResolvedValue(
        mockPaginatedResponse,
      );

      await GET(request, context);

      expect(
        mockContainer.todoUseCase.getTodosByUserIdWithOptions,
      ).toHaveBeenCalledWith('user-123', {
        page: 1,
        perPage: 10,
        completedFilter: 'all',
        sortBy: 'title',
        sortOrder: 'asc',
      });
    });

    it('管理者が他ユーザーのTodo一覧を取得できる', async () => {
      const request = createMockRequest('http://localhost/api/users/user-123/todos', {
        'x-user-id': 'admin-user',
        'x-user-role': '1',
      });

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue({ id: 'user-123' });
      mockContainer.todoUseCase.getTodosByUserIdWithOptions.mockResolvedValue(
        mockPaginatedResponse,
      );

      await GET(request, context);

      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-123');
      expect(
        mockContainer.todoUseCase.getTodosByUserIdWithOptions,
      ).toHaveBeenCalledWith('user-123', {
        page: 1,
        perPage: 10,
        completedFilter: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(responseLib.success).toHaveBeenCalledWith(
        mockPaginatedResponse,
        'Todos retrieved successfully',
      );
    });

    it('不正なページ番号でバリデーションエラーを返す', async () => {
      const request = createMockRequest(
        'http://localhost/api/users/user-123/todos?page=0',
        {
          'x-user-id': 'user-123',
          'x-user-role': '4',
        },
      );

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      await GET(request, context);

      expect(responseLib.error).toHaveBeenCalledWith(
        'Validation failed',
        400,
        expect.any(Array),
      );
    });

    it('不正なperPage値でバリデーションエラーを返す', async () => {
      const request = createMockRequest(
        'http://localhost/api/users/user-123/todos?perPage=101',
        {
          'x-user-id': 'user-123',
          'x-user-role': '4',
        },
      );

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      await GET(request, context);

      expect(responseLib.error).toHaveBeenCalledWith(
        'Validation failed',
        400,
        expect.any(Array),
      );
    });

    it('認証情報がない場合はUnauthorizedを返す', async () => {
      const request = createMockRequest('http://localhost/api/users/user-123/todos');

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      await GET(request, context);

      expect(responseLib.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('一般ユーザーが他ユーザーのTodoにアクセスしようとした場合はForbiddenを返す', async () => {
      const request = createMockRequest('http://localhost/api/users/user-123/todos', {
        'x-user-id': 'user-456',
        'x-user-role': '4',
      });

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      await GET(request, context);

      expect(responseLib.forbidden).toHaveBeenCalledWith('Access denied');
    });

    it('存在しないユーザーのTodoを取得しようとした場合はNotFoundを返す', async () => {
      const request = createMockRequest(
        'http://localhost/api/users/nonexistent/todos',
        {
          'x-user-id': 'admin-user',
          'x-user-role': '1',
        },
      );

      const context = {
        params: Promise.resolve({ id: 'nonexistent' }),
      };

      mockContainer.userUseCase.getUserById.mockRejectedValue(
        new Error('User not found'),
      );

      await GET(request, context);

      expect(responseLib.notFound).toHaveBeenCalledWith('User not found');
    });

    it('予期しないエラーが発生した場合はInternalErrorを返す', async () => {
      const request = createMockRequest('http://localhost/api/users/user-123/todos', {
        'x-user-id': 'user-123',
        'x-user-role': '4',
      });

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue({ id: 'user-123' });
      mockContainer.todoUseCase.getTodosByUserIdWithOptions.mockRejectedValue(
        new Error('Database error'),
      );

      await GET(request, context);

      expect(responseLib.internalError).toHaveBeenCalledWith('Failed to retrieve todos');
    });
  });
});
