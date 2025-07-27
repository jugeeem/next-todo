/**
 * @fileoverview AuthMiddleware ユニットテスト
 *
 * このファイルは、認証ミドルウェアの動作を検証するテストスイートです。
 * JWT トークンベースの認証機能の正常動作とエラーハンドリングを
 * 包括的にテストします。
 *
 * テストカバー範囲:
 * - 正常な認証処理
 * - 無効なトークンの処理
 * - Authorization ヘッダーの欠如
 * - JWT サービスエラーの処理
 * - 様々なエラーシナリオ
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';
import type { JWTPayload } from '@/types/auth';
import { AuthMiddleware } from '../auth-middleware';
import { JWTService } from '../jwt';

// テスト環境でのNext.js モジュールのモック
const mockRequest = jest.fn();
jest.mock('next/server', () => ({
  NextRequest: mockRequest,
}));

// JWTService をモック化
jest.mock('../jwt');

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockJWTService: jest.Mocked<JWTService>;

  beforeEach(() => {
    // JWTService のモックをリセット
    jest.clearAllMocks();

    // JWTService モックの設定
    mockJWTService = {
      extractTokenFromHeader: jest.fn(),
      verifyToken: jest.fn(),
      generateToken: jest.fn(),
    } as unknown as jest.Mocked<JWTService>;

    // JWTService コンストラクタのモック
    (JWTService as jest.MockedClass<typeof JWTService>).mockImplementation(
      () => mockJWTService,
    );

    authMiddleware = new AuthMiddleware();
  });

  describe('constructor', () => {
    it('JWTService のインスタンスが正しく初期化される', () => {
      expect(JWTService).toHaveBeenCalledTimes(1);
      expect(authMiddleware).toBeInstanceOf(AuthMiddleware);
    });
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
          get: jest.fn((name: string) => headers[name.toLowerCase()] || ''),
        },
      }) as unknown as NextRequest;

    it('有効なトークンで認証が成功する', () => {
      // モックリクエストの準備
      const request = createMockRequest({
        authorization: 'Bearer valid-token',
      });

      // JWTService モックの設定
      mockJWTService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockJWTService.verifyToken.mockReturnValue(mockUser);

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(mockUser);
      }
      expect('error' in result).toBe(false);

      // モック関数の呼び出し確認
      expect(mockJWTService.extractTokenFromHeader).toHaveBeenCalledWith(
        'Bearer valid-token',
      );
      expect(mockJWTService.verifyToken).toHaveBeenCalledWith('valid-token');
    });

    it('Authorization ヘッダーが存在しない場合、認証が失敗する', () => {
      // モックリクエストの準備（Authorization ヘッダーなし）
      const request = createMockRequest({});

      // JWTService モックの設定
      mockJWTService.extractTokenFromHeader.mockReturnValue(null);

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No token provided');
      }
      expect('user' in result).toBe(false);

      // モック関数の呼び出し確認
      expect(mockJWTService.extractTokenFromHeader).toHaveBeenCalledWith('');
      expect(mockJWTService.verifyToken).not.toHaveBeenCalled();
    });

    it('空の Authorization ヘッダーの場合、認証が失敗する', () => {
      // モックリクエストの準備
      const request = createMockRequest({
        authorization: '',
      });

      // JWTService モックの設定
      mockJWTService.extractTokenFromHeader.mockReturnValue(null);

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No token provided');
      }
      expect('user' in result).toBe(false);

      // モック関数の呼び出し確認
      expect(mockJWTService.extractTokenFromHeader).toHaveBeenCalledWith('');
      expect(mockJWTService.verifyToken).not.toHaveBeenCalled();
    });

    it('無効な形式のトークンの場合、認証が失敗する', () => {
      // モックリクエストの準備
      const request = createMockRequest({
        authorization: 'Basic invalid-format',
      });

      // JWTService モックの設定
      mockJWTService.extractTokenFromHeader.mockReturnValue(null);

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('No token provided');
      }
      expect('user' in result).toBe(false);

      // モック関数の呼び出し確認
      expect(mockJWTService.extractTokenFromHeader).toHaveBeenCalledWith(
        'Basic invalid-format',
      );
      expect(mockJWTService.verifyToken).not.toHaveBeenCalled();
    });

    it('有効な形式だが無効なトークンの場合、認証が失敗する', () => {
      // モックリクエストの準備
      const request = createMockRequest({
        authorization: 'Bearer invalid-token',
      });

      // JWTService モックの設定
      mockJWTService.extractTokenFromHeader.mockReturnValue('invalid-token');
      mockJWTService.verifyToken.mockReturnValue(null);

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid token');
      }
      expect('user' in result).toBe(false);

      // モック関数の呼び出し確認
      expect(mockJWTService.extractTokenFromHeader).toHaveBeenCalledWith(
        'Bearer invalid-token',
      );
      expect(mockJWTService.verifyToken).toHaveBeenCalledWith('invalid-token');
    });

    it('JWTService で例外が発生した場合、認証が失敗する', () => {
      // モックリクエストの準備
      const request = createMockRequest({
        authorization: 'Bearer error-token',
      });

      // JWTService モックの設定（例外を発生させる）
      mockJWTService.extractTokenFromHeader.mockImplementation(() => {
        throw new Error('JWT Service Error');
      });

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Authentication failed');
      }
      expect('user' in result).toBe(false);

      // モック関数の呼び出し確認
      expect(mockJWTService.extractTokenFromHeader).toHaveBeenCalledWith(
        'Bearer error-token',
      );
    });

    it('verifyToken で例外が発生した場合、認証が失敗する', () => {
      // モックリクエストの準備
      const request = createMockRequest({
        authorization: 'Bearer error-token',
      });

      // JWTService モックの設定
      mockJWTService.extractTokenFromHeader.mockReturnValue('error-token');
      mockJWTService.verifyToken.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Authentication failed');
      }
      expect('user' in result).toBe(false);

      // モック関数の呼び出し確認
      expect(mockJWTService.extractTokenFromHeader).toHaveBeenCalledWith(
        'Bearer error-token',
      );
      expect(mockJWTService.verifyToken).toHaveBeenCalledWith('error-token');
    });

    it('大文字小文字を区別しない Authorization ヘッダーの処理', () => {
      // モックリクエストの準備（Authorization -> authorization）
      const request = createMockRequest({
        authorization: 'Bearer valid-token',
      });

      // JWTService モックの設定
      mockJWTService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockJWTService.verifyToken.mockReturnValue(mockUser);

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(mockUser);
      }

      // モック関数の呼び出し確認
      expect(mockJWTService.extractTokenFromHeader).toHaveBeenCalledWith(
        'Bearer valid-token',
      );
      expect(mockJWTService.verifyToken).toHaveBeenCalledWith('valid-token');
    });

    it('複数の Authorization ヘッダーがある場合、最初のものを使用する', () => {
      // NextRequest では複数の同名ヘッダーは結合されるが、
      // 最初のものを取得することを確認
      const request = createMockRequest({
        authorization: 'Bearer first-token',
      });

      // JWTService モックの設定
      mockJWTService.extractTokenFromHeader.mockReturnValue('first-token');
      mockJWTService.verifyToken.mockReturnValue(mockUser);

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(mockUser);
      }

      // モック関数の呼び出し確認
      expect(mockJWTService.extractTokenFromHeader).toHaveBeenCalledWith(
        'Bearer first-token',
      );
    });

    it('異なるユーザー役割でも正しく認証される', () => {
      // 管理者ユーザーのモック
      const adminUser: JWTPayload = {
        userId: 'admin-456',
        username: 'admin',
        role: 2, // 管理者役割
      };

      // モックリクエストの準備
      const request = createMockRequest({
        authorization: 'Bearer admin-token',
      });

      // JWTService モックの設定
      mockJWTService.extractTokenFromHeader.mockReturnValue('admin-token');
      mockJWTService.verifyToken.mockReturnValue(adminUser);

      // テスト実行
      const result = authMiddleware.authenticate(request);

      // アサーション
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(adminUser);
        expect(result.user.role).toBe(2);
      }
    });
  });
});
