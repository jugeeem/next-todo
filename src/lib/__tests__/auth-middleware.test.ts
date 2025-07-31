/**
 * @fileoverview AuthMiddleware ユニットテスト
 */

import type { NextRequest } from 'next/server';
import type { JWTPayload } from '@/types/auth';
import { AuthMiddleware } from '../auth-middleware';
import { JWTService } from '../jwt';

// JWTService をモック化
jest.mock('../jwt');

// Cookie をモック化
jest.mock('../cookie', () => ({
  getAuthTokenFromServer: jest.fn(),
}));

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockJWTService: jest.Mocked<JWTService>;
  let mockCookie: { getAuthTokenFromServer: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    mockJWTService = {
      extractTokenFromHeader: jest.fn(),
      verifyToken: jest.fn(),
      generateToken: jest.fn(),
    } as unknown as jest.Mocked<JWTService>;

    (JWTService as jest.MockedClass<typeof JWTService>).mockImplementation(
      () => mockJWTService,
    );

    mockCookie = jest.requireMock('../cookie');

    authMiddleware = new AuthMiddleware();
  });

  describe('authenticate', () => {
    const mockUser: JWTPayload = {
      userId: 'user-123',
      username: 'testuser',
      role: 1,
    };

    const createMockRequest = (headers: Record<string, string> = {}) =>
      ({
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      }) as unknown as NextRequest;

    it('有効なトークンで認証が成功する', async () => {
      const request = createMockRequest({
        authorization: 'Bearer valid-token',
      });

      mockJWTService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockJWTService.verifyToken.mockResolvedValue(mockUser);

      const result = await authMiddleware.authenticate(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(mockUser);
      }
    });

    it('AuthorizationヘッダーとCookieの両方が存在しない場合は認証失敗する', async () => {
      const request = createMockRequest({});

      mockJWTService.extractTokenFromHeader.mockReturnValue(null);
      mockCookie.getAuthTokenFromServer.mockReturnValue(null);

      const result = await authMiddleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No token provided');
      }
    });

    it('Authorizationヘッダーはないが、Cookieからトークンを取得できる場合は認証成功する', async () => {
      const request = createMockRequest({});
      const token = 'cookie-token';
      const mockUser: JWTPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 1,
      };

      mockJWTService.extractTokenFromHeader.mockReturnValue(null);
      mockCookie.getAuthTokenFromServer.mockReturnValue(token);
      mockJWTService.verifyToken.mockResolvedValue(mockUser);

      const result = await authMiddleware.authenticate(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(mockUser);
      }
    });

    it('無効なトークンの場合は認証失敗する', async () => {
      const request = createMockRequest({
        authorization: 'Bearer invalid-token',
      });

      mockJWTService.extractTokenFromHeader.mockReturnValue('invalid-token');
      mockJWTService.verifyToken.mockResolvedValue(null);

      const result = await authMiddleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid token');
      }
    });

    it('JWT サービスでエラーが発生した場合は認証失敗する', async () => {
      const request = createMockRequest({
        authorization: 'Bearer valid-token',
      });

      mockJWTService.extractTokenFromHeader.mockImplementation(() => {
        throw new Error('JWT Service Error');
      });

      const result = await authMiddleware.authenticate(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Authentication failed');
      }
    });
  });
});
