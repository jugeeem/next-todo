/**
 * @fileoverview Register API route tests (Fixed version)
 * 登録APIエンドポイントのテストケース
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
    register: jest.fn(),
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

describe('/api/auth/register API エンドポイント', () => {
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

  describe('POST /api/auth/register - 成功ケース', () => {
    it('新規ユーザー登録が成功する', async () => {
      // Arrange
      const registerData = {
        username: 'newuser',
        password: 'password123',
      };

      const expectedResult = {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          username: 'newuser',
        },
      };

      mockContainer.authUseCase.register.mockResolvedValue(expectedResult);
      const request = createMockRequest(registerData);

      // Act
      const response = await POST(request);
      const responseBody = await response.json();

      // Assert
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
      expect(response.status).toBe(200); // レジスターは200を返す
      expect(responseBody).toEqual({
        success: true,
        message: 'Registration successful',
        data: expectedResult,
      });
      expect(mockedSetAuthTokenCookie).toHaveBeenCalledWith(
        response,
        expectedResult.token,
      );
      expect(mockedSetUserCookie).toHaveBeenCalledWith(response, expectedResult.user);
    });

    it('全ての情報を含む新規ユーザー登録が成功する', async () => {
      // Arrange
      const registerData = {
        username: 'fulluser',
        password: 'password123',
        firstName: '太郎',
        firstNameRuby: 'たろう',
        lastName: '山田',
        lastNameRuby: 'やまだ',
        role: 1,
      };

      const expectedResult = {
        token: 'full-jwt-token',
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

      mockContainer.authUseCase.register.mockResolvedValue(expectedResult);
      const request = createMockRequest(registerData);

      // Act
      const response = await POST(request);
      const responseBody = await response.json();

      // Assert
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
      expect(response.status).toBe(200); // レジスターは200を返す
      expect(responseBody).toEqual({
        success: true,
        message: 'Registration successful',
        data: expectedResult,
      });
    });
  });

  describe('POST /api/auth/register - エラーケース', () => {
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
      expect(mockContainer.authUseCase.register).not.toHaveBeenCalled();
    });

    it('ユーザー名が既に存在する場合は400エラーを返す', async () => {
      // Arrange
      const duplicateData = {
        username: 'existinguser',
        password: 'password123',
      };

      mockContainer.authUseCase.register.mockRejectedValue(
        new Error('Username already exists'),
      );
      const request = createMockRequest(duplicateData);

      // Act
      await POST(request);

      // Assert - register routeはerror()を呼び出し、400エラーを返す
      expect(mockedError).toHaveBeenCalledWith('Username already exists', 400);
    });

    it('予期しないエラーが発生した場合は500エラーを返す', async () => {
      // Arrange
      const registerData = {
        username: 'testuser',
        password: 'password123',
      };

      mockContainer.authUseCase.register.mockRejectedValue(
        new Error('Database connection failed'),
      );
      const request = createMockRequest(registerData);

      // Act
      await POST(request);

      // Assert - register routeはerror()を呼び出し、400エラーを返す（catch文で）
      expect(mockedError).toHaveBeenCalledWith('Database connection failed', 400);
      expect(mockContainer.authUseCase.register).toHaveBeenCalledWith(registerData);
    });
  });
});
