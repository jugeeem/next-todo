/**
 * @fileoverview Login API route tests (Fixed version)
 * ログインAPIエンドポイントのテストケース
 */

import { type NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

// モック設定
jest.mock('@/lib/container');
jest.mock('@/lib/cookie');
jest.mock('@/lib/response');

import { Container } from '@/lib/container';
import { setAuthTokenCookie, setUserCookie } from '@/lib/cookie';
import { error, internalError, unauthorized } from '@/lib/response';

const mockContainer = {
  authUseCase: {
    login: jest.fn(),
  },
};

const MockedContainer = Container as jest.Mocked<typeof Container>;
const mockedSetAuthTokenCookie = setAuthTokenCookie as jest.MockedFunction<
  typeof setAuthTokenCookie
>;
const mockedSetUserCookie = setUserCookie as jest.MockedFunction<typeof setUserCookie>;
const mockedError = error as jest.MockedFunction<typeof error>;
const mockedUnauthorized = unauthorized as jest.MockedFunction<typeof unauthorized>;
const mockedInternalError = internalError as jest.MockedFunction<typeof internalError>;

// Helper function to create mock request
const createMockRequest = (body: unknown): NextRequest => {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
};

describe('/api/auth/login API エンドポイント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedContainer.getInstance = jest.fn().mockReturnValue(mockContainer);

    // Set default response mocks
    mockedError.mockReturnValue(
      NextResponse.json({ success: false, message: 'Error' }, { status: 400 }),
    );
    mockedUnauthorized.mockReturnValue(
      NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
    );
    mockedInternalError.mockReturnValue(
      NextResponse.json({ success: false, message: 'Internal Error' }, { status: 500 }),
    );
  });

  describe('POST /api/auth/login - 成功ケース', () => {
    it('有効な認証情報でログインが成功する', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'password123',
      };

      const expectedResult = {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 1,
        },
      };

      mockContainer.authUseCase.login.mockResolvedValue(expectedResult);
      const request = createMockRequest(loginData);

      // Act
      const response = await POST(request);
      const responseBody = await response.json();

      // Assert
      expect(mockContainer.authUseCase.login).toHaveBeenCalledWith(loginData);
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        success: true,
        message: 'Login successful',
        data: expectedResult,
      });
      expect(mockedSetAuthTokenCookie).toHaveBeenCalledWith(
        response,
        expectedResult.token,
      );
      expect(mockedSetUserCookie).toHaveBeenCalledWith(response, expectedResult.user);
    });

    it('最小限の情報でログインが成功する', async () => {
      // Arrange
      const loginData = {
        username: 'simpleuser',
        password: 'simple123',
      };

      const expectedResult = {
        token: 'simple-jwt-token',
        user: {
          id: 2,
          username: 'simpleuser',
        },
      };

      mockContainer.authUseCase.login.mockResolvedValue(expectedResult);
      const request = createMockRequest(loginData);

      // Act
      const response = await POST(request);
      const responseBody = await response.json();

      // Assert
      expect(mockContainer.authUseCase.login).toHaveBeenCalledWith(loginData);
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        success: true,
        message: 'Login successful',
        data: expectedResult,
      });
    });
  });

  describe('POST /api/auth/login - エラーケース', () => {
    it('バリデーションエラーの場合は400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        username: '', // 空のユーザー名
        password: 'password123',
      };

      const request = createMockRequest(invalidData);

      // Act
      await POST(request);

      // Assert
      expect(mockedError).toHaveBeenCalled();
      expect(mockContainer.authUseCase.login).not.toHaveBeenCalled();
    });

    it('無効な認証情報の場合は401エラーを返す', async () => {
      // Arrange
      const invalidCredentials = {
        username: 'wronguser',
        password: 'wrongpassword',
      };

      mockContainer.authUseCase.login.mockRejectedValue(
        new Error('Invalid credentials'),
      );
      const request = createMockRequest(invalidCredentials);

      // Act
      await POST(request);

      // Assert
      expect(mockedUnauthorized).toHaveBeenCalledWith('Invalid credentials');
    });

    it('予期しないエラーが発生した場合は500エラーを返す', async () => {
      // Arrange
      const loginData = {
        username: 'testuser',
        password: 'password123',
      };

      mockContainer.authUseCase.login.mockRejectedValue(
        new Error('Database connection failed'),
      );
      const request = createMockRequest(loginData);

      // Act
      await POST(request);

      // Assert
      expect(mockedUnauthorized).toHaveBeenCalledWith('Database connection failed');
      expect(mockContainer.authUseCase.login).toHaveBeenCalledWith(loginData);
    });
  });
});
