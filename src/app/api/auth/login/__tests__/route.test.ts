/**
 * @fileoverview Auth Login API unit tests
 *
 * ユーザーログインAPI（POST /api/auth/login）の包括的なユニットテストです。
 * 認証、バリデーション、エラーハンドリングの各シナリオをカバーしています。
 *
 * テスト対象:
 * - POST /api/auth/login: ユーザーログイン認証
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';

// TypeScript型定義
interface User {
  id: number;
  username: string;
  firstName?: string;
  firstNameRuby?: string;
  lastName?: string;
  lastNameRuby?: string;
  role?: number;
}

interface AuthResult {
  token: string;
  user: User;
}

interface LoginInput {
  username: string;
  password: string;
}

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

describe('/api/auth/login API エンドポイント', () => {
  let mockContainer: {
    authUseCase: {
      login: jest.MockedFunction<(input: LoginInput) => Promise<AuthResult>>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // モジュールキャッシュをクリア
    jest.resetModules();

    // Container のモック設定
    mockContainer = {
      authUseCase: {
        login: jest.fn(),
      },
    };

    const { Container } = jest.requireMock('@/lib/container');
    Container.getInstance = jest.fn(() => mockContainer);

    // Response関数のモック設定
    const responseLib = jest.requireMock('@/lib/response');
    responseLib.success = jest.fn(() => new Response('success'));
    responseLib.error = jest.fn(() => new Response('error'));
    responseLib.unauthorized = jest.fn(() => new Response('unauthorized'));
    responseLib.internalError = jest.fn(() => new Response('internal error'));
  });

  describe('POST /api/auth/login - ユーザーログイン', () => {
    const createMockRequest = (body?: unknown): NextRequest => {
      const headers = new Headers();
      headers.set('content-type', 'application/json');

      return {
        method: 'POST',
        url: 'http://localhost:3000/api/auth/login',
        headers,
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    it('有効な認証情報でログインが成功する', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'password123',
      };
      const request = createMockRequest(loginData);

      const mockAuthResult = {
        token: 'jwt-token-12345',
        user: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 4,
        },
      };

      mockContainer.authUseCase.login.mockResolvedValue(mockAuthResult);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.login).toHaveBeenCalledWith(loginData);
      expect(responseLib.success).toHaveBeenCalledWith(
        mockAuthResult,
        'Login successful',
      );
    });

    it('最小限の情報でログインが成功する', async () => {
      // Arrange
      const loginData = {
        username: 'simpleuser',
        password: 'simple123',
      };
      const request = createMockRequest(loginData);

      const mockAuthResult = {
        token: 'jwt-token-67890',
        user: {
          id: 2,
          username: 'simpleuser',
        },
      };

      mockContainer.authUseCase.login.mockResolvedValue(mockAuthResult);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.login).toHaveBeenCalledWith(loginData);
      expect(responseLib.success).toHaveBeenCalledWith(
        mockAuthResult,
        'Login successful',
      );
    });

    it('ユーザー名が空の場合は400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        username: '',
        password: 'password123',
      };
      const request = createMockRequest(invalidData);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input:'),
      );
      expect(mockContainer.authUseCase.login).not.toHaveBeenCalled();
    });

    it('パスワードが空の場合は400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        username: 'testuser',
        password: '',
      };
      const request = createMockRequest(invalidData);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input:'),
      );
      expect(mockContainer.authUseCase.login).not.toHaveBeenCalled();
    });

    it('ユーザー名とパスワードが両方空の場合は400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        username: '',
        password: '',
      };
      const request = createMockRequest(invalidData);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input:'),
      );
      expect(mockContainer.authUseCase.login).not.toHaveBeenCalled();
    });

    it('必須フィールドが不足している場合は400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        username: 'testuser',
        // password不足
      };
      const request = createMockRequest(invalidData);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input:'),
      );
      expect(mockContainer.authUseCase.login).not.toHaveBeenCalled();
    });

    it('無効なJSONの場合は401エラーを返す', async () => {
      // Arrange
      const request = {
        method: 'POST',
        url: 'http://localhost:3000/api/auth/login',
        headers: new Headers(),
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.unauthorized).toHaveBeenCalledWith('Invalid JSON');
      expect(mockContainer.authUseCase.login).not.toHaveBeenCalled();
    });

    it('認証に失敗した場合は401エラーを返す', async () => {
      // Arrange
      const loginData = {
        username: 'wronguser',
        password: 'wrongpassword',
      };
      const request = createMockRequest(loginData);

      mockContainer.authUseCase.login.mockRejectedValue(
        new Error('Invalid username or password'),
      );

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.login).toHaveBeenCalledWith(loginData);
      expect(responseLib.unauthorized).toHaveBeenCalledWith(
        'Invalid username or password',
      );
    });

    it('AuthUseCaseで予期しないエラーが発生した場合は500エラーを返す', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'password123',
      };
      const request = createMockRequest(loginData);

      mockContainer.authUseCase.login.mockRejectedValue('Unexpected error');

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.login).toHaveBeenCalledWith(loginData);
      expect(responseLib.internalError).toHaveBeenCalled();
    });

    it('長いユーザー名でも正常に処理される', async () => {
      // Arrange
      const loginData = {
        username: 'very_long_username_that_might_cause_issues_in_some_systems',
        password: 'password123',
      };
      const request = createMockRequest(loginData);

      const mockAuthResult = {
        token: 'jwt-token-long',
        user: {
          id: 3,
          username: 'very_long_username_that_might_cause_issues_in_some_systems',
        },
      };

      mockContainer.authUseCase.login.mockResolvedValue(mockAuthResult);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.login).toHaveBeenCalledWith(loginData);
      expect(responseLib.success).toHaveBeenCalledWith(
        mockAuthResult,
        'Login successful',
      );
    });
  });
});
