/**
 * @fileoverview クライアントサイド認証ユーティリティのテスト
 *
 * このファイルは、auth-client.ts の認証状態管理機能をテストします。
 * Cookie のモック、トークンの有効性チェック、認証状態の管理をテストします。
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { User } from '@/domain/entities/User';
import { UserRole } from '@/domain/entities/User';
import {
  clearAuth,
  getAuthState,
  getToken,
  getUser,
  isAuthenticationRequired,
} from '../auth-client';

// Cookie機能をモック
jest.mock('../cookie', () => ({
  getClientCookie: jest.fn(),
  getUserFromClient: jest.fn(),
  deleteAuthCookiesFromClient: jest.fn(),
  AUTH_COOKIE_NAMES: {
    TOKEN: 'auth_token',
    USER: 'auth_user',
  },
}));

// クライアントサイド環境をモック
const mockDocument = {
  cookie: '',
};

// Windowオブジェクトとdocumentをモック
if (!global.window) {
  Object.defineProperty(global, 'window', {
    value: {},
    writable: true,
  });
}

if (!global.document) {
  Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true,
  });
}

// btoa/atob のモック（Jest環境で必要）
Object.defineProperty(global, 'btoa', {
  value: (str: string) => Buffer.from(str).toString('base64'),
  writable: true,
});

Object.defineProperty(global, 'atob', {
  value: (str: string) => Buffer.from(str, 'base64').toString(),
  writable: true,
});

describe('auth-client', () => {
  const mockCookie = jest.requireMock('../cookie');

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocument.cookie = '';
  });

  /**
   * テスト用のモックユーザーを作成
   */
  function createMockUser(): User {
    return {
      id: 'user-1',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.USER,
      passwordHash: 'hashed-password',
      createdAt: new Date('2025-07-31T03:04:47.057Z'),
      createdBy: 'system',
      updatedAt: new Date('2025-07-31T03:04:47.057Z'),
      updatedBy: 'system',
      deleted: false,
    };
  }

  /**
   * テスト用のモックユーザーを作成（JSON化された版）
   */
  function createMockUserSerialized(): Record<string, string | number | boolean> {
    const user = createMockUser();
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  describe('getToken', () => {
    it('Cookieからトークンを正常に取得できる', () => {
      const token = 'test-jwt-token';
      mockCookie.getClientCookie.mockReturnValue(token);

      const result = getToken();

      expect(result).toBe(token);
      expect(mockCookie.getClientCookie).toHaveBeenCalledWith('auth_token');
    });

    it('トークンが存在しない場合は null を返す', () => {
      mockCookie.getClientCookie.mockReturnValue(null);

      const result = getToken();

      expect(result).toBeNull();
      expect(mockCookie.getClientCookie).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('getUser', () => {
    it('Cookieからユーザー情報を正常に取得できる', () => {
      const userSerialized = createMockUserSerialized();
      mockCookie.getUserFromClient.mockReturnValue(userSerialized);

      const result = getUser();

      expect(result).toEqual(userSerialized);
      expect(mockCookie.getUserFromClient).toHaveBeenCalled();
    });

    it('ユーザー情報が存在しない場合は null を返す', () => {
      mockCookie.getUserFromClient.mockReturnValue(null);

      const result = getUser();

      expect(result).toBeNull();
      expect(mockCookie.getUserFromClient).toHaveBeenCalled();
    });
  });

  describe('getAuthState', () => {
    it('有効なトークンとユーザー情報がある場合は認証済み状態を返す', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6MSwiZXhwIjoyMDAwMDAwMDAwfQ.signature';
      const userSerialized = createMockUserSerialized();

      mockCookie.getClientCookie.mockReturnValue(token);
      mockCookie.getUserFromClient.mockReturnValue(userSerialized);

      const result = getAuthState();

      expect(result.isAuthenticated).toBe(true);
      expect(result.user).toEqual(userSerialized);
      expect(result.token).toBe(token);
    });

    it('トークンがない場合は未認証状態を返す', () => {
      mockCookie.getClientCookie.mockReturnValue(null);
      mockCookie.getUserFromClient.mockReturnValue(createMockUserSerialized());

      const result = getAuthState();

      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
      expect(result.token).toBeNull();
    });

    it('ユーザー情報がない場合は未認証状態を返す', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6MSwiZXhwIjoyMDAwMDAwMDAwfQ.signature';

      mockCookie.getClientCookie.mockReturnValue(token);
      mockCookie.getUserFromClient.mockReturnValue(null);

      const result = getAuthState();

      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
      expect(result.token).toBeNull();
    });

    it('無効なトークン形式の場合は未認証状態を返す', () => {
      const invalidToken = 'invalid-token';
      const userSerialized = createMockUserSerialized();

      mockCookie.getClientCookie.mockReturnValue(invalidToken);
      mockCookie.getUserFromClient.mockReturnValue(userSerialized);

      const result = getAuthState();

      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
      expect(result.token).toBeNull();
    });

    it('期限切れトークンの場合は未認証状態を返す', () => {
      // 期限切れのトークン（exp: 1000000000 = 2001年）
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6MSwiZXhwIjoxMDAwMDAwMDAwfQ.signature';
      const userSerialized = createMockUserSerialized();

      mockCookie.getClientCookie.mockReturnValue(expiredToken);
      mockCookie.getUserFromClient.mockReturnValue(userSerialized);

      const result = getAuthState();

      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
      expect(result.token).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('Cookieから認証情報を削除する', () => {
      clearAuth();

      expect(mockCookie.deleteAuthCookiesFromClient).toHaveBeenCalled();
    });
  });

  describe('isAuthenticationRequired', () => {
    it('認証済みの場合は false を返す', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6MSwiZXhwIjoyMDAwMDAwMDAwfQ.signature';
      const userSerialized = createMockUserSerialized();

      mockCookie.getClientCookie.mockReturnValue(token);
      mockCookie.getUserFromClient.mockReturnValue(userSerialized);

      const result = isAuthenticationRequired();

      expect(result).toBe(false);
    });

    it('未認証の場合は true を返す', () => {
      mockCookie.getClientCookie.mockReturnValue(null);
      mockCookie.getUserFromClient.mockReturnValue(null);

      const result = isAuthenticationRequired();

      expect(result).toBe(true);
    });
  });
});
