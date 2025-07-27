/**
 * @fileoverview Auth Register API unit tests
 *
 * ユーザー登録API（POST /api/auth/register）の包括的なユニットテストです。
 * 新規ユーザー作成、バリデーション、エラーハンドリングの各シナリオをカバーしています。
 *
 * テスト対象:
 * - POST /api/auth/register: 新規ユーザー登録
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

interface CreateUserInput {
  username: string;
  password: string;
  firstName?: string;
  firstNameRuby?: string;
  lastName?: string;
  lastNameRuby?: string;
  role?: number;
}

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/response');

describe('/api/auth/register API エンドポイント', () => {
  let mockContainer: {
    authUseCase: {
      register: jest.MockedFunction<(input: CreateUserInput) => Promise<AuthResult>>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // モジュールキャッシュをクリア
    jest.resetModules();

    // Container のモック設定
    mockContainer = {
      authUseCase: {
        register: jest.fn(),
      },
    };

    const { Container } = jest.requireMock('@/lib/container');
    Container.getInstance = jest.fn(() => mockContainer);

    // Response関数のモック設定
    const responseLib = jest.requireMock('@/lib/response');
    responseLib.success = jest.fn(() => new Response('success'));
    responseLib.error = jest.fn(() => new Response('error'));
    responseLib.internalError = jest.fn(() => new Response('internal error'));
  });

  describe('POST /api/auth/register - ユーザー登録', () => {
    const createMockRequest = (body?: unknown): NextRequest => {
      const headers = new Headers();
      headers.set('content-type', 'application/json');

      return {
        method: 'POST',
        url: 'http://localhost:3000/api/auth/register',
        headers,
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    it('最小限の情報で新規ユーザー登録が成功する', async () => {
      // Arrange
      const registerData = {
        username: 'newuser',
        password: 'password123',
      };
      const request = createMockRequest(registerData);

      const mockAuthResult = {
        token: 'jwt-token-new-user',
        user: {
          id: 1,
          username: 'newuser',
        },
      };

      mockContainer.authUseCase.register.mockResolvedValue(mockAuthResult);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
      expect(responseLib.success).toHaveBeenCalledWith(
        mockAuthResult,
        'Registration successful',
      );
    });

    it('全ての項目を含む新規ユーザー登録が成功する', async () => {
      // Arrange
      const registerData = {
        username: 'fulluser',
        password: 'securePass456',
        firstName: '太郎',
        firstNameRuby: 'たろう',
        lastName: '山田',
        lastNameRuby: 'やまだ',
        role: 1,
      };
      const request = createMockRequest(registerData);

      const mockAuthResult = {
        token: 'jwt-token-full-user',
        user: {
          id: 2,
          username: 'fulluser',
          firstName: '太郎',
          firstNameRuby: 'たろう',
          lastName: '山田',
          lastNameRuby: 'やまだ',
          role: 1,
        },
      };

      mockContainer.authUseCase.register.mockResolvedValue(mockAuthResult);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
      expect(responseLib.success).toHaveBeenCalledWith(
        mockAuthResult,
        'Registration successful',
      );
    });

    it('部分的な情報でユーザー登録が成功する', async () => {
      // Arrange
      const registerData = {
        username: 'partialuser',
        password: 'mypass789',
        firstName: 'John',
        lastName: 'Doe',
      };
      const request = createMockRequest(registerData);

      const mockAuthResult = {
        token: 'jwt-token-partial',
        user: {
          id: 3,
          username: 'partialuser',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockContainer.authUseCase.register.mockResolvedValue(mockAuthResult);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
      expect(responseLib.success).toHaveBeenCalledWith(
        mockAuthResult,
        'Registration successful',
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
      expect(mockContainer.authUseCase.register).not.toHaveBeenCalled();
    });

    it('パスワードが短すぎる場合は400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        username: 'testuser',
        password: '123', // 6文字未満
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
      expect(mockContainer.authUseCase.register).not.toHaveBeenCalled();
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
      expect(mockContainer.authUseCase.register).not.toHaveBeenCalled();
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
      expect(mockContainer.authUseCase.register).not.toHaveBeenCalled();
    });

    it('ユーザー名が長すぎる場合は400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        username: 'a'.repeat(51), // 50文字を超える
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
      expect(mockContainer.authUseCase.register).not.toHaveBeenCalled();
    });

    it('名前が長すぎる場合は400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        username: 'testuser',
        password: 'password123',
        firstName: 'a'.repeat(51), // 50文字を超える
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
      expect(mockContainer.authUseCase.register).not.toHaveBeenCalled();
    });

    it('無効なJSONの場合は400エラーを返す', async () => {
      // Arrange
      const request = {
        method: 'POST',
        url: 'http://localhost:3000/api/auth/register',
        headers: new Headers(),
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(responseLib.error).toHaveBeenCalledWith('Invalid JSON', 400);
      expect(mockContainer.authUseCase.register).not.toHaveBeenCalled();
    });

    it('ユーザー名が既に存在する場合は400エラーを返す', async () => {
      // Arrange
      const registerData = {
        username: 'existinguser',
        password: 'password123',
      };
      const request = createMockRequest(registerData);

      mockContainer.authUseCase.register.mockRejectedValue(
        new Error('Username already exists'),
      );

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
      expect(responseLib.error).toHaveBeenCalledWith('Username already exists', 400);
    });

    it('AuthUseCaseで予期しないエラーが発生した場合は500エラーを返す', async () => {
      // Arrange
      const registerData = {
        username: 'testuser',
        password: 'password123',
      };
      const request = createMockRequest(registerData);

      mockContainer.authUseCase.register.mockRejectedValue('Unexpected error');

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
      expect(responseLib.internalError).toHaveBeenCalled();
    });

    it('複数のバリデーションエラーが同時に発生した場合', async () => {
      // Arrange
      const invalidData = {
        username: '', // 空のユーザー名
        password: '12', // 短すぎるパスワード
        firstName: 'a'.repeat(51), // 長すぎる名前
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
      expect(mockContainer.authUseCase.register).not.toHaveBeenCalled();
    });

    it('特殊文字を含むユーザー名でも正常に処理される', async () => {
      // Arrange
      const registerData = {
        username: 'user_123-test',
        password: 'password123',
      };
      const request = createMockRequest(registerData);

      const mockAuthResult = {
        token: 'jwt-token-special',
        user: {
          id: 4,
          username: 'user_123-test',
        },
      };

      mockContainer.authUseCase.register.mockResolvedValue(mockAuthResult);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
      expect(responseLib.success).toHaveBeenCalledWith(
        mockAuthResult,
        'Registration successful',
      );
    });

    it('日本語の名前が正常に処理される', async () => {
      // Arrange
      const registerData = {
        username: 'japanese_user',
        password: 'password123',
        firstName: '花子',
        firstNameRuby: 'はなこ',
        lastName: '佐藤',
        lastNameRuby: 'さとう',
      };
      const request = createMockRequest(registerData);

      const mockAuthResult = {
        token: 'jwt-token-japanese',
        user: {
          id: 5,
          username: 'japanese_user',
          firstName: '花子',
          firstNameRuby: 'はなこ',
          lastName: '佐藤',
          lastNameRuby: 'さとう',
        },
      };

      mockContainer.authUseCase.register.mockResolvedValue(mockAuthResult);

      // Dynamic import after mock setup
      const { POST } = await import('../route');

      // Act
      await POST(request);

      // Assert
      const responseLib = jest.requireMock('@/lib/response');
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
      expect(responseLib.success).toHaveBeenCalledWith(
        mockAuthResult,
        'Registration successful',
      );
    });
  });
});
