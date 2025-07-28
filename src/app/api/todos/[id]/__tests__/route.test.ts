/**
 * @fileoverview API（/api/todos/[id]）のユニットテスト - ヘッダーベース認証対応版
 */

import type { NextRequest } from 'next/server';
import { DELETE, GET, PUT } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

import { Container } from '@/lib/container';
import * as responseLib from '@/lib/response';

interface MockContainer {
  todoUseCase: {
    getTodoById: jest.Mock;
    updateTodo: jest.Mock;
    deleteTodo: jest.Mock;
  };
}

describe('/api/todos/[id]', () => {
  let mockContainer: MockContainer;
  let mockResponseLib: typeof responseLib;

  beforeEach(() => {
    jest.clearAllMocks();

    // mockContainerの初期化
    mockContainer = {
      todoUseCase: {
        getTodoById: jest.fn(),
        updateTodo: jest.fn(),
        deleteTodo: jest.fn(),
      },
    } as MockContainer;

    // responseLibのモック設定
    mockResponseLib = jest.mocked(responseLib);
    mockResponseLib.success = jest.fn().mockReturnValue({ status: 200 });
    mockResponseLib.error = jest.fn().mockReturnValue({ status: 400 });
    mockResponseLib.unauthorized = jest.fn().mockReturnValue({ status: 401 });
    mockResponseLib.forbidden = jest.fn().mockReturnValue({ status: 403 });
    mockResponseLib.notFound = jest.fn().mockReturnValue({ status: 404 });
    mockResponseLib.internalError = jest.fn().mockReturnValue({ status: 500 });

    // Container.getInstanceのモック設定
    const mockGetInstance = jest.fn().mockReturnValue(mockContainer);
    (Container.getInstance as jest.Mock) = mockGetInstance;
  });

  describe('GET /api/todos/[id] - TODO取得', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as unknown as NextRequest;
    };

    it('認証されたユーザーが自分のTODOを正常に取得できる', async () => {
      const mockTodo = {
        id: '1',
        title: 'Test Todo',
        descriptions: 'Test Description',
        userId: 'user-123',
        createdAt: '2025-07-28T00:00:00.000Z',
        updatedAt: '2025-07-28T00:00:00.000Z',
      };

      mockContainer.todoUseCase.getTodoById.mockResolvedValue(mockTodo);

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      await GET(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(mockResponseLib.success).toHaveBeenCalledWith(mockTodo);
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      await GET(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockResponseLib.unauthorized).toHaveBeenCalledWith(
        'Authentication required',
      );
    });

    it('TODOが見つからない場合は404エラーを返す', async () => {
      mockContainer.todoUseCase.getTodoById.mockResolvedValue(null);

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      await GET(request, { params: Promise.resolve({ id: '999' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('999');
      expect(mockResponseLib.notFound).toHaveBeenCalledWith('Todo not found');
    });

    it('他のユーザーのTODOにアクセスしようとした場合は403エラーを返す', async () => {
      const mockTodo = {
        id: '1',
        title: 'Test Todo',
        descriptions: 'Test Description',
        userId: 'other-user',
        createdAt: '2025-07-28T00:00:00.000Z',
        updatedAt: '2025-07-28T00:00:00.000Z',
      };

      mockContainer.todoUseCase.getTodoById.mockResolvedValue(mockTodo);

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      await GET(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(mockResponseLib.forbidden).toHaveBeenCalledWith('Access denied');
    });

    it('データベースエラーが発生した場合は500エラーを返す', async () => {
      mockContainer.todoUseCase.getTodoById.mockRejectedValue(
        new Error('Database connection error'),
      );

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await GET(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockResponseLib.internalError).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('PUT /api/todos/[id] - TODO更新', () => {
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

    it('認証されたユーザーが自分のTODOを正常に更新できる', async () => {
      const mockTodo = {
        id: '1',
        title: 'Old Title',
        descriptions: 'Old Description',
        userId: 'user-123',
        createdAt: '2025-07-28T00:00:00.000Z',
        updatedAt: '2025-07-28T00:00:00.000Z',
      };

      const updatedTodo = {
        ...mockTodo,
        title: 'Updated Title',
        descriptions: 'Updated Description',
        updatedAt: '2025-07-28T01:00:00.000Z',
      };

      const updateData = {
        title: 'Updated Title',
        descriptions: 'Updated Description',
      };

      mockContainer.todoUseCase.getTodoById.mockResolvedValue(mockTodo);
      mockContainer.todoUseCase.updateTodo.mockResolvedValue(updatedTodo);

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '3',
        },
        updateData,
      );

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(mockContainer.todoUseCase.updateTodo).toHaveBeenCalledWith(
        '1',
        updateData,
      );
      expect(mockResponseLib.success).toHaveBeenCalledWith(
        updatedTodo,
        'Todo updated successfully',
      );
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest(
        {},
        {
          title: 'Updated Title',
        },
      );

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockResponseLib.unauthorized).toHaveBeenCalledWith(
        'Authentication required',
      );
    });

    it('存在しないTODOを更新しようとした場合は404エラーを返す', async () => {
      mockContainer.todoUseCase.getTodoById.mockResolvedValue(null);

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '3',
        },
        {
          title: 'Updated Title',
        },
      );

      await PUT(request, { params: Promise.resolve({ id: '999' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('999');
      expect(mockResponseLib.notFound).toHaveBeenCalledWith('Todo not found');
    });

    it('他のユーザーのTODOを更新しようとした場合は403エラーを返す', async () => {
      const mockTodo = {
        id: '1',
        title: 'Test Todo',
        descriptions: 'Test Description',
        userId: 'other-user',
        createdAt: '2025-07-28T00:00:00.000Z',
        updatedAt: '2025-07-28T00:00:00.000Z',
      };

      mockContainer.todoUseCase.getTodoById.mockResolvedValue(mockTodo);

      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '3',
        },
        {
          title: 'Updated Title',
        },
      );

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(mockResponseLib.forbidden).toHaveBeenCalledWith('Access denied');
    });

    it('バリデーションエラーが発生した場合は400エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '3',
        },
        {
          title: '', // 空のタイトル（バリデーションエラー）
        },
      );

      await PUT(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockResponseLib.error).toHaveBeenCalled();
    });

    it('更新処理でエラーが発生した場合は500エラーを返す', async () => {
      // JSON解析でエラーを発生させる
      const mockErrorRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name.toLowerCase() === 'x-user-id') return 'user-123';
            if (name.toLowerCase() === 'x-user-role') return '3';
            return null;
          }),
        },
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await PUT(mockErrorRequest, { params: Promise.resolve({ id: '1' }) });

      // Errorインスタンスの場合はerror()メソッドが呼ばれる
      expect(mockResponseLib.error).toHaveBeenCalledWith('Invalid JSON');

      consoleSpy.mockRestore();
    });

    it('無効なJSONデータが送信された場合は500エラーを返す', async () => {
      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockErrorRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name.toLowerCase() === 'x-user-id') return 'user-123';
            if (name.toLowerCase() === 'x-user-role') return '3';
            return null;
          }),
        },
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON format')),
      } as unknown as NextRequest;

      await PUT(mockErrorRequest, { params: Promise.resolve({ id: '1' }) });

      // Errorインスタンスの場合はerror()メソッドが呼ばれる
      expect(mockResponseLib.error).toHaveBeenCalledWith('Invalid JSON format');

      consoleSpy.mockRestore();
    });
  });

  describe('DELETE /api/todos/[id] - TODO削除', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as unknown as NextRequest;
    };

    it('認証されたユーザーが自分のTODOを正常に削除できる', async () => {
      const mockTodo = {
        id: '1',
        title: 'Test Todo',
        descriptions: 'Test Description',
        userId: 'user-123',
        createdAt: '2025-07-28T00:00:00.000Z',
        updatedAt: '2025-07-28T00:00:00.000Z',
      };

      mockContainer.todoUseCase.getTodoById.mockResolvedValue(mockTodo);
      mockContainer.todoUseCase.deleteTodo.mockResolvedValue(true);

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(mockContainer.todoUseCase.deleteTodo).toHaveBeenCalledWith('1');
      expect(mockResponseLib.success).toHaveBeenCalledWith(
        null,
        'Todo deleted successfully',
      );
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockResponseLib.unauthorized).toHaveBeenCalledWith(
        'Authentication required',
      );
    });

    it('存在しないTODOを削除しようとした場合は404エラーを返す', async () => {
      mockContainer.todoUseCase.getTodoById.mockResolvedValue(null);

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      await DELETE(request, { params: Promise.resolve({ id: '999' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('999');
      expect(mockResponseLib.notFound).toHaveBeenCalledWith('Todo not found');
    });

    it('他のユーザーのTODOを削除しようとした場合は403エラーを返す', async () => {
      const mockTodo = {
        id: '1',
        title: 'Test Todo',
        descriptions: 'Test Description',
        userId: 'other-user',
        createdAt: '2025-07-28T00:00:00.000Z',
        updatedAt: '2025-07-28T00:00:00.000Z',
      };

      mockContainer.todoUseCase.getTodoById.mockResolvedValue(mockTodo);

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(mockResponseLib.forbidden).toHaveBeenCalledWith('Access denied');
    });

    it('削除処理でエラーが発生した場合は500エラーを返す', async () => {
      const mockTodo = {
        id: '1',
        title: 'Test Todo',
        descriptions: 'Test Description',
        userId: 'user-123',
        createdAt: '2025-07-28T00:00:00.000Z',
        updatedAt: '2025-07-28T00:00:00.000Z',
      };

      mockContainer.todoUseCase.getTodoById.mockResolvedValue(mockTodo);
      mockContainer.todoUseCase.deleteTodo.mockRejectedValue(
        new Error('Database error'),
      );

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockResponseLib.internalError).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('削除に失敗した場合は500エラーを返す', async () => {
      const mockTodo = {
        id: '1',
        title: 'Test Todo',
        descriptions: 'Test Description',
        userId: 'user-123',
        createdAt: '2025-07-28T00:00:00.000Z',
        updatedAt: '2025-07-28T00:00:00.000Z',
      };

      mockContainer.todoUseCase.getTodoById.mockResolvedValue(mockTodo);
      mockContainer.todoUseCase.deleteTodo.mockResolvedValue(false);

      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '3',
      });

      await DELETE(request, { params: Promise.resolve({ id: '1' }) });

      expect(mockContainer.todoUseCase.getTodoById).toHaveBeenCalledWith('1');
      expect(mockContainer.todoUseCase.deleteTodo).toHaveBeenCalledWith('1');
      expect(mockResponseLib.notFound).toHaveBeenCalledWith('Todo not found');
    });
  });
});
