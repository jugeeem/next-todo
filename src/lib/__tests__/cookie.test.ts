/**
 * @fileoverview Cookieベース認証のテストファイル
 *
 * このファイルは、localStorageからCookieベースの認証に移行後の
 * 動作確認用テストケースを提供します。
 */

import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import type { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAMES,
  deleteAuthCookies,
  deleteAuthCookiesFromClient,
  deleteClientCookie,
  deleteServerCookie,
  getAuthTokenFromServer,
  getClientCookie,
  getServerCookie,
  getUserFromClient,
  setAuthTokenCookie,
  setClientCookie,
  setServerCookie,
  setUserCookie,
} from '../cookie';

// JSDOMでのCookieモック設定
// CookieStore クラスでCookieの動作をシミュレート
class CookieStore {
  private cookies: Map<string, { value: string; attributes: string[] }> = new Map();
  private lastSetCookie: string = '';

  get cookieString(): string {
    const cookieArray = Array.from(this.cookies.entries()).map(
      ([name, { value }]) => `${name}=${value}`,
    );
    return cookieArray.join('; ');
  }

  set cookieString(value: string) {
    // 最後に設定されたCookie文字列を保存（属性確認用）
    this.lastSetCookie = value;

    // Cookieの設定処理をシミュレート
    if (value.includes('=')) {
      const parts = value.split(';').map((part) => part.trim());
      const [nameValue] = parts;
      const [name, val] = nameValue.split('=', 2);

      if (name && val !== undefined) {
        const trimmedName = decodeURIComponent(name.trim());
        const trimmedValue = decodeURIComponent(val.trim());

        // Max-Age=0の場合は削除
        if (parts.some((part) => part.startsWith('Max-Age=0'))) {
          this.cookies.delete(trimmedName);
        } else {
          // 属性を保存
          const attributes = parts.slice(1);
          this.cookies.set(trimmedName, { value: trimmedValue, attributes });
        }
      }
    }
  }

  clear() {
    this.cookies.clear();
    this.lastSetCookie = '';
  }

  hasAttribute(name: string, attribute: string): boolean {
    const cookie = this.cookies.get(name);
    return cookie ? cookie.attributes.some((attr) => attr.includes(attribute)) : false;
  }

  getLastSetCookie(): string {
    return this.lastSetCookie;
  }
}

// グローバルなCookieStoreインスタンス
const cookieStore = new CookieStore();

// document.cookieをモック
Object.defineProperty(document, 'cookie', {
  get: () => cookieStore.cookieString,
  set: (value: string) => {
    cookieStore.cookieString = value;
  },
  configurable: true,
});

describe('Cookie Utilities', () => {
  beforeEach(() => {
    // テスト前にCookieをクリア
    cookieStore.clear();
  });

  afterEach(() => {
    // テスト後にCookieをクリア
    cookieStore.clear();
  });

  describe('setClientCookie / getClientCookie', () => {
    test('should set and get cookie correctly', () => {
      const testValue = 'test-token-value';

      // Cookieを設定
      setClientCookie(AUTH_COOKIE_NAMES.TOKEN, testValue);

      // documentが正しく設定されたかを確認
      expect(document.cookie).toContain(
        `${AUTH_COOKIE_NAMES.TOKEN}=${encodeURIComponent(testValue)}`,
      );

      // 取得できることを確認
      const retrievedValue = getClientCookie(AUTH_COOKIE_NAMES.TOKEN);
      expect(retrievedValue).toBe(testValue);
    });

    test('should handle special characters in cookie value', () => {
      const testValue = 'test value with spaces & symbols!';

      setClientCookie(AUTH_COOKIE_NAMES.TOKEN, testValue);

      // 最後に設定されたCookie文字列でエンコードされていることを確認
      const lastSetCookie = cookieStore.getLastSetCookie();
      expect(lastSetCookie).toContain(encodeURIComponent(testValue));

      // 正しく取得できることを確認
      const retrievedValue = getClientCookie(AUTH_COOKIE_NAMES.TOKEN);
      expect(retrievedValue).toBe(testValue);
    });

    test('should return null for non-existent cookie', () => {
      const result = getClientCookie('non-existent-cookie');
      expect(result).toBeNull();
    });

    test('should handle malformed cookie string', () => {
      // 不正な形式のCookieを設定
      Object.defineProperty(document, 'cookie', {
        get: () => 'malformed-cookie-without-equals-sign',
        configurable: true,
      });

      const result = getClientCookie(AUTH_COOKIE_NAMES.TOKEN);
      expect(result).toBeNull();

      // document.cookieを復元
      Object.defineProperty(document, 'cookie', {
        get: () => cookieStore.cookieString,
        set: (value: string) => {
          cookieStore.cookieString = value;
        },
        configurable: true,
      });
    });

    test('should handle empty cookie value', () => {
      // 空の値のCookieを設定
      Object.defineProperty(document, 'cookie', {
        get: () => `${AUTH_COOKIE_NAMES.TOKEN}=`,
        configurable: true,
      });

      const result = getClientCookie(AUTH_COOKIE_NAMES.TOKEN);
      expect(result).toBe('');

      // document.cookieを復元
      Object.defineProperty(document, 'cookie', {
        get: () => cookieStore.cookieString,
        set: (value: string) => {
          cookieStore.cookieString = value;
        },
        configurable: true,
      });
    });
  });

  describe('getUserFromClient', () => {
    test('should return null when no user cookie exists', () => {
      const result = getUserFromClient();
      expect(result).toBeNull();
    });

    test('should return null when user cookie is invalid JSON', () => {
      // 無効なJSONをモック
      setClientCookie(AUTH_COOKIE_NAMES.USER, 'invalid-json');

      const result = getUserFromClient();
      expect(result).toBeNull();
    });

    test('should return user object when valid user cookie exists', () => {
      const testUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 1,
      };
      setClientCookie(AUTH_COOKIE_NAMES.USER, JSON.stringify(testUser));

      const result = getUserFromClient();
      expect(result).toEqual(testUser);
    });

    test('should return null when user cookie has invalid structure', () => {
      const invalidUser = { name: 'test' }; // id と username がない
      setClientCookie(AUTH_COOKIE_NAMES.USER, JSON.stringify(invalidUser));

      const result = getUserFromClient();
      expect(result).toBeNull();
    });
  });

  describe('deleteClientCookie', () => {
    test('should delete individual cookies', () => {
      // Cookieを設定
      setClientCookie(AUTH_COOKIE_NAMES.TOKEN, 'test-token');
      setClientCookie(
        AUTH_COOKIE_NAMES.USER,
        JSON.stringify({ id: '1', username: 'test' }),
      );

      // 1つのCookieを削除
      deleteClientCookie(AUTH_COOKIE_NAMES.TOKEN);

      // 削除されたCookieが存在しないことを確認
      expect(document.cookie).not.toContain(`${AUTH_COOKIE_NAMES.TOKEN}=`);
      // 他のCookieは残っていることを確認
      expect(document.cookie).toContain(`${AUTH_COOKIE_NAMES.USER}=`);
    });
  });

  describe('deleteAuthCookiesFromClient', () => {
    test('should delete both auth cookies', () => {
      // まずCookieを設定
      setClientCookie(AUTH_COOKIE_NAMES.TOKEN, 'test-token');
      setClientCookie(
        AUTH_COOKIE_NAMES.USER,
        JSON.stringify({ id: '1', username: 'test' }),
      );

      // 削除を実行
      deleteAuthCookiesFromClient();

      // 削除後にCookieが存在しないことを確認
      expect(document.cookie).not.toContain(`${AUTH_COOKIE_NAMES.TOKEN}=test-token`);
      expect(document.cookie).not.toContain(`${AUTH_COOKIE_NAMES.USER}=`);

      // Cookie ストアから完全に削除されたことを確認
      expect(cookieStore.cookieString).toBe('');
    });
  });

  describe('Cookie Security', () => {
    test('should set SameSite=strict for security', () => {
      setClientCookie(AUTH_COOKIE_NAMES.TOKEN, 'test-token');

      // 最後に設定されたCookie文字列に属性が含まれているかを確認
      const lastSetCookie = cookieStore.getLastSetCookie();
      expect(lastSetCookie).toContain('SameSite=strict');
    });

    test('should set HttpOnly=false for client-side user cookie', () => {
      // ユーザーCookieはクライアントサイドでアクセス可能である必要がある
      const testUser = { id: '1', username: 'test', role: 1 };
      setClientCookie(AUTH_COOKIE_NAMES.USER, JSON.stringify(testUser));

      // 最後に設定されたCookie文字列にHttpOnlyが含まれていないことを確認
      const lastSetCookie = cookieStore.getLastSetCookie();
      expect(lastSetCookie).not.toContain('HttpOnly');
    });
  });

  describe('Server-side Cookie Functions', () => {
    let mockResponse: Partial<NextResponse>;
    let mockRequest: {
      cookies: {
        get: jest.Mock;
      };
    };

    beforeEach(() => {
      // NextResponseのモック
      mockResponse = {
        cookies: {
          set: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
          getAll: jest.fn(),
          has: jest.fn(),
        },
      };

      // NextRequestのモック
      mockRequest = {
        cookies: {
          get: jest.fn(),
        },
      };
    });

    describe('setServerCookie', () => {
      test('should set server cookie with default options', () => {
        setServerCookie(mockResponse as NextResponse, 'test-cookie', 'test-value');

        expect(mockResponse.cookies?.set).toHaveBeenCalledWith(
          'test-cookie',
          'test-value',
          {
            maxAge: 24 * 60 * 60,
            httpOnly: true,
            secure: false, // NODE_ENV is test
            sameSite: 'strict',
            path: '/',
          },
        );
      });

      test('should set server cookie with custom options', () => {
        const customOptions = {
          maxAge: 3600,
          httpOnly: false,
          secure: true,
          sameSite: 'lax' as const,
        };

        setServerCookie(
          mockResponse as NextResponse,
          'test-cookie',
          'test-value',
          customOptions,
        );

        expect(mockResponse.cookies?.set).toHaveBeenCalledWith(
          'test-cookie',
          'test-value',
          {
            maxAge: 3600,
            httpOnly: false,
            secure: true,
            sameSite: 'lax',
            path: '/',
          },
        );
      });
    });

    describe('deleteServerCookie', () => {
      test('should delete server cookie', () => {
        deleteServerCookie(mockResponse as NextResponse, 'test-cookie');

        expect(mockResponse.cookies?.set).toHaveBeenCalledWith('test-cookie', '', {
          maxAge: 0,
          httpOnly: true,
          secure: false, // NODE_ENV is test
          sameSite: 'strict',
          path: '/',
        });
      });
    });

    describe('getServerCookie', () => {
      test('should get server cookie value', () => {
        // Mapのgetメソッドをモック
        mockRequest.cookies.get.mockReturnValue({ value: 'test-token' });

        const result = getServerCookie(
          mockRequest as unknown as NextRequest,
          AUTH_COOKIE_NAMES.TOKEN,
        );

        expect(mockRequest.cookies.get).toHaveBeenCalledWith(AUTH_COOKIE_NAMES.TOKEN);
        expect(result).toBe('test-token');
      });

      test('should return null when cookie does not exist', () => {
        mockRequest.cookies.get.mockReturnValue(undefined);

        const result = getServerCookie(
          mockRequest as unknown as NextRequest,
          'non-existent',
        );

        expect(result).toBeNull();
      });
    });

    describe('setAuthTokenCookie', () => {
      test('should set auth token cookie', () => {
        setAuthTokenCookie(mockResponse as NextResponse, 'test-token');

        expect(mockResponse.cookies?.set).toHaveBeenCalledWith(
          AUTH_COOKIE_NAMES.TOKEN,
          'test-token',
          expect.objectContaining({
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
          }),
        );
      });
    });

    describe('setUserCookie', () => {
      test('should set user cookie with HttpOnly=false', () => {
        const testUser = {
          id: '1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 1,
          createdAt: new Date(),
          createdBy: 'system',
          updatedAt: new Date(),
          updatedBy: 'system',
          deleted: false,
        };
        setUserCookie(mockResponse as NextResponse, testUser);

        expect(mockResponse.cookies?.set).toHaveBeenCalledWith(
          AUTH_COOKIE_NAMES.USER,
          JSON.stringify(testUser),
          expect.objectContaining({
            httpOnly: false, // クライアントサイドでアクセス可能
            secure: false,
            sameSite: 'strict',
          }),
        );
      });
    });

    describe('deleteAuthCookies', () => {
      test('should delete both auth cookies', () => {
        deleteAuthCookies(mockResponse as NextResponse);

        expect(mockResponse.cookies?.set).toHaveBeenCalledWith(
          AUTH_COOKIE_NAMES.TOKEN,
          '',
          expect.objectContaining({ maxAge: 0 }),
        );
        expect(mockResponse.cookies?.set).toHaveBeenCalledWith(
          AUTH_COOKIE_NAMES.USER,
          '',
          expect.objectContaining({ maxAge: 0 }),
        );
      });
    });

    describe('getAuthTokenFromServer', () => {
      test('should get auth token from server request', () => {
        mockRequest.cookies.get.mockReturnValue({ value: 'server-token' });

        const result = getAuthTokenFromServer(mockRequest as unknown as NextRequest);

        expect(mockRequest.cookies.get).toHaveBeenCalledWith(AUTH_COOKIE_NAMES.TOKEN);
        expect(result).toBe('server-token');
      });
    });
  });

  describe('Error Handling', () => {
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
      originalConsoleError = console.error;
      console.error = jest.fn();
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    test('should handle errors in setClientCookie', () => {
      // document.cookieに書き込む際にエラーを発生させる
      Object.defineProperty(document, 'cookie', {
        get: () => cookieStore.cookieString,
        set: () => {
          throw new Error('Cookie setting error');
        },
        configurable: true,
      });

      setClientCookie(AUTH_COOKIE_NAMES.TOKEN, 'test');

      // エラーがコンソールに出力されることを確認
      expect(console.error).toHaveBeenCalledWith(
        'Client cookie setting error:',
        expect.any(Error),
      );

      // document.cookieを復元
      Object.defineProperty(document, 'cookie', {
        get: () => cookieStore.cookieString,
        set: (value: string) => {
          cookieStore.cookieString = value;
        },
        configurable: true,
      });
    });

    test('should handle errors in getClientCookie', () => {
      // document.cookieを壊してエラーを発生させる
      Object.defineProperty(document, 'cookie', {
        get: () => {
          throw new Error('Cookie access error');
        },
        configurable: true,
      });

      const result = getClientCookie(AUTH_COOKIE_NAMES.TOKEN);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Client cookie retrieval error:',
        expect.any(Error),
      );

      // document.cookieを復元
      Object.defineProperty(document, 'cookie', {
        get: () => cookieStore.cookieString,
        set: (value: string) => {
          cookieStore.cookieString = value;
        },
        configurable: true,
      });
    });

    test('should handle errors in deleteClientCookie', () => {
      // document.cookieに書き込む際にエラーを発生させる
      Object.defineProperty(document, 'cookie', {
        get: () => cookieStore.cookieString,
        set: () => {
          throw new Error('Cookie deletion error');
        },
        configurable: true,
      });

      deleteClientCookie(AUTH_COOKIE_NAMES.TOKEN);

      expect(console.error).toHaveBeenCalledWith(
        'Client cookie deletion error:',
        expect.any(Error),
      );

      // document.cookieを復元
      Object.defineProperty(document, 'cookie', {
        get: () => cookieStore.cookieString,
        set: (value: string) => {
          cookieStore.cookieString = value;
        },
        configurable: true,
      });
    });
  });

  describe('Browser Environment Detection', () => {
    test('should return null from getClientCookie when not in browser', () => {
      const originalWindow = global.window;
      const originalDocument = global.document;

      // windowとdocumentの両方を削除
      delete (global as { window?: Window }).window;
      delete (global as { document?: Document }).document;

      const result = getClientCookie(AUTH_COOKIE_NAMES.TOKEN);

      expect(result).toBeNull();

      // windowとdocumentを復元
      global.window = originalWindow;
      global.document = originalDocument;
    });
  });
});
