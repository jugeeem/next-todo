/**
 * @fileoverview ユーザー別Todo管理APIのテスト
 *
 * このファイルは、特定ユーザーのTodo一覧取得APIエンドポイントの
 * 単体テストを実装します。認証、権限チェック、データ取得の動作を検証します。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { NextRequest } from 'next/server';
import { Container } from '@/lib/container';
import { GET } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

const mockContainer = {
  userUseCase: {
    getUserById: jest.fn(),
  },
  todoUseCase: {
    getTodosByUserId: jest.fn(),
  },
};

const mockSuccess = jest.fn(() => new Response('success'));
const mockUnauthorized = jest.fn(() => new Response('unauthorized'));
const mockForbidden = jest.fn(() => new Response('forbidden'));
const mockNotFound = jest.fn(() => new Response('not found'));
const mockInternalError = jest.fn(() => new Response('internal error'));

// コンテナのモック
(Container.getInstance as jest.Mock).mockReturnValue(mockContainer);

describe('/api/users/[id]/todos', () => {
  const mockTodos = [
    {
      id: 1,
      title: 'Test Todo 1',
      descriptions: 'Test Description 1',
      userId: 'user-123',
      completed: false,
      createdAt: '2025-07-30T00:00:00.000Z',
      updatedAt: '2025-07-30T00:00:00.000Z',
    },
    {
      id: 2,
      title: 'Test Todo 2',
      descriptions: 'Test Description 2',
      userId: 'user-123',
      completed: true,
      createdAt: '2025-07-30T01:00:00.000Z',
      updatedAt: '2025-07-30T01:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Response関数のモック設定
    const responseLib = jest.requireMock('@/lib/response');
    responseLib.success = mockSuccess;
    responseLib.unauthorized = mockUnauthorized;
    responseLib.forbidden = mockForbidden;
    responseLib.notFound = mockNotFound;
    responseLib.internalError = mockInternalError;
  });

  describe('GET /api/users/[id]/todos', () => {
    it('管理者が他ユーザーのTodo一覧を取得できる', async () => {
      // 管理者ユーザーの設定
      const request = new NextRequest('http://localhost/api/users/user-123/todos');
      request.headers.set('x-user-id', 'admin-user');
      request.headers.set('x-user-role', '1'); // 管理者

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue({ id: 'user-123' });
      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);
      mockSuccess.mockReturnValue(new Response('success'));

      await GET(request, context);

      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-123');
      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockSuccess).toHaveBeenCalledWith(mockTodos);
    });

    it('ユーザーが自分のTodo一覧を取得できる', async () => {
      const request = new NextRequest('http://localhost/api/users/user-123/todos');
      request.headers.set('x-user-id', 'user-123');
      request.headers.set('x-user-role', '4'); // 一般ユーザー

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue({ id: 'user-123' });
      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);
      mockSuccess.mockReturnValue(new Response('success'));

      await GET(request, context);

      expect(mockContainer.userUseCase.getUserById).toHaveBeenCalledWith('user-123');
      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockSuccess).toHaveBeenCalledWith(mockTodos);
    });

    it('認証情報がない場合はUnauthorizedを返す', async () => {
      const request = new NextRequest('http://localhost/api/users/user-123/todos');

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockUnauthorized.mockReturnValue(new Response('unauthorized'));

      await GET(request, context);

      expect(mockUnauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('一般ユーザーが他ユーザーのTodoにアクセスしようとした場合はForbiddenを返す', async () => {
      const request = new NextRequest('http://localhost/api/users/user-123/todos');
      request.headers.set('x-user-id', 'user-456');
      request.headers.set('x-user-role', '4'); // 一般ユーザー

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockForbidden.mockReturnValue(new Response('forbidden'));

      await GET(request, context);

      expect(mockForbidden).toHaveBeenCalledWith('Access denied');
    });

    it('存在しないユーザーのTodoを取得しようとした場合はNotFoundを返す', async () => {
      const request = new NextRequest('http://localhost/api/users/nonexistent/todos');
      request.headers.set('x-user-id', 'admin-user');
      request.headers.set('x-user-role', '1'); // 管理者

      const context = {
        params: Promise.resolve({ id: 'nonexistent' }),
      };

      mockContainer.userUseCase.getUserById.mockRejectedValue(
        new Error('User not found'),
      );
      mockNotFound.mockReturnValue(new Response('not found'));

      await GET(request, context);

      expect(mockNotFound).toHaveBeenCalledWith('User not found');
    });

    it('予期しないエラーが発生した場合はInternalErrorを返す', async () => {
      const request = new NextRequest('http://localhost/api/users/user-123/todos');
      request.headers.set('x-user-id', 'user-123');
      request.headers.set('x-user-role', '4');

      const context = {
        params: Promise.resolve({ id: 'user-123' }),
      };

      mockContainer.userUseCase.getUserById.mockResolvedValue({ id: 'user-123' });
      mockContainer.todoUseCase.getTodosByUserId.mockRejectedValue(
        new Error('Database error'),
      );
      mockInternalError.mockReturnValue(new Response('internal error'));

      await GET(request, context);

      expect(mockInternalError).toHaveBeenCalled();
    });
  });
});
