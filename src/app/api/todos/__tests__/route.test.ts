/**
 * @fileoverview Todos API（/api/todos）のユニットテスト - ヘッダーベース認証対応版
 */

import type { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

describe('/api/todos API エンドポイント', () => {
  let mockContainer: {
    todoUseCase: {
      getTodosByUserId: jest.Mock;
      createTodo: jest.Mock;
    };
  };

  let mockResponseLib: {
    success: jest.Mock;
    error: jest.Mock;
    unauthorized: jest.Mock;
    forbidden: jest.Mock;
    internalError: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Container のモック設定
    mockContainer = {
      todoUseCase: {
        getTodosByUserId: jest.fn(),
        createTodo: jest.fn(),
      },
    };

    const { Container } = jest.requireMock('@/lib/container');
    Container.getInstance = jest.fn(() => mockContainer);

    // Response関数のモック設定
    mockResponseLib = {
      success: jest.fn(() => new Response('success')),
      error: jest.fn(() => new Response('error')),
      unauthorized: jest.fn(() => new Response('unauthorized')),
      forbidden: jest.fn(() => new Response('forbidden')),
      internalError: jest.fn(() => new Response('internal error')),
    };

    const responseLib = jest.requireMock('@/lib/response');
    Object.assign(responseLib, mockResponseLib);
  });

  describe('GET /api/todos - TODO一覧取得', () => {
    const createMockRequest = (headers: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as unknown as NextRequest;
    };

    it('認証されたユーザーとして正常にTODO一覧を取得できる', async () => {
      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '1',
      });

      const mockTodos = [
        { id: '1', title: 'Test Todo 1', userId: 'user-123' },
        { id: '2', title: 'Test Todo 2', userId: 'user-123' },
      ];

      mockContainer.todoUseCase.getTodosByUserId.mockResolvedValue(mockTodos);

      await GET(request);

      expect(mockContainer.todoUseCase.getTodosByUserId).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockResponseLib.success).toHaveBeenCalledWith(mockTodos);
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest({});

      await GET(request);

      expect(mockResponseLib.unauthorized).toHaveBeenCalledWith(
        'Authentication required',
      );
    });

    it('データベースエラーが発生した場合は500エラーを返す', async () => {
      const request = createMockRequest({
        'x-user-id': 'user-123',
        'x-user-role': '1',
      });

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockContainer.todoUseCase.getTodosByUserId.mockRejectedValue(
        new Error('Database error'),
      );

      await GET(request);

      expect(mockResponseLib.internalError).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Get todos error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('POST /api/todos - TODO作成', () => {
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

    it('正常なTODO作成リクエスト', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '1',
        },
        {
          title: 'New Todo',
          descriptions: 'New Description',
        },
      );

      const mockCreatedTodo = {
        id: '1',
        title: 'New Todo',
        descriptions: 'New Description',
        userId: 'user-123',
      };

      mockContainer.todoUseCase.createTodo.mockResolvedValue(mockCreatedTodo);

      await POST(request);

      expect(mockContainer.todoUseCase.createTodo).toHaveBeenCalledWith({
        title: 'New Todo',
        descriptions: 'New Description',
        userId: 'user-123',
      });
      expect(mockResponseLib.success).toHaveBeenCalledWith(
        mockCreatedTodo,
        'Todo created successfully',
      );
    });

    it('認証ヘッダーが無い場合は401エラーを返す', async () => {
      const request = createMockRequest(
        {},
        {
          title: 'New Todo',
        },
      );

      await POST(request);

      expect(mockResponseLib.unauthorized).toHaveBeenCalledWith(
        'Authentication required',
      );
    });

    it('バリデーションエラーが発生した場合は400エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '1',
        },
        {
          // titleが空文字でバリデーションエラー
          title: '',
          descriptions: 'Test description',
        },
      );

      await POST(request);

      expect(mockResponseLib.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input:'),
      );
    });

    it('JSON解析エラーが発生した場合は500エラーを返す', async () => {
      const mockErrorRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name.toLowerCase() === 'x-user-id') return 'user-123';
            if (name.toLowerCase() === 'x-user-role') return '1';
            return null;
          }),
        },
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await POST(mockErrorRequest);

      expect(mockResponseLib.error).toHaveBeenCalledWith('Invalid JSON');
      expect(consoleSpy).toHaveBeenCalledWith('Create todo error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('データベースエラーが発生した場合は500エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '1',
        },
        {
          title: 'New Todo',
          descriptions: 'Test description',
        },
      );

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockContainer.todoUseCase.createTodo.mockRejectedValue(
        new Error('Database connection error'),
      );

      await POST(request);

      expect(mockResponseLib.error).toHaveBeenCalledWith('Database connection error');
      expect(consoleSpy).toHaveBeenCalledWith('Create todo error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('非Errorオブジェクトの例外が発生した場合は500エラーを返す', async () => {
      const request = createMockRequest(
        {
          'x-user-id': 'user-123',
          'x-user-role': '1',
        },
        {
          title: 'New Todo',
          descriptions: 'Test description',
        },
      );

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Errorオブジェクト以外の例外をスロー
      mockContainer.todoUseCase.createTodo.mockRejectedValue('Unexpected error');

      await POST(request);

      expect(mockResponseLib.internalError).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Create todo error:', 'Unexpected error');

      consoleSpy.mockRestore();
    });
  });
});
