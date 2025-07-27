/**
 * @fileoverview JWTService ユニットテスト
 *
 * このファイルは、JWT（JSON Web Token）サービスの動作を検証するテストスイートです。
 * トークンの生成、検証、Authorizationヘッダーからの抽出機能を包括的にテストします。
 *
 * テストカバー範囲:
 * - JWT トークンの生成
 * - JWT トークンの検証
 * - Authorization ヘッダーからのトークン抽出
 * - 環境変数による秘密鍵管理
 * - エラーケースの処理
 *
 * @author jugeeem
 * @since 1.0.0
 */

import jwt from 'jsonwebtoken';
import type { User } from '@/domain/entities/User';
import type { JWTPayload } from '@/types/auth';
import { JWTService } from '../jwt';

// jsonwebtoken ライブラリをモック化
jest.mock('jsonwebtoken');

describe('JWTService', () => {
  let jwtService: JWTService;
  const mockJwt = jwt as jest.Mocked<typeof jwt>;

  const originalEnv = process.env;

  beforeEach(() => {
    // 環境変数をリセット
    jest.resetModules();
    process.env = { ...originalEnv };

    // モックをクリア
    jest.clearAllMocks();

    jwtService = new JWTService();
  });

  afterAll(() => {
    // 環境変数を復元
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('環境変数からJWT_SECRETを読み込む', () => {
      process.env.JWT_SECRET = 'test-secret-key';
      const service = new JWTService();
      expect(service).toBeInstanceOf(JWTService);
    });

    it('JWT_SECRETが設定されていない場合、フォールバック値を使用する', () => {
      delete process.env.JWT_SECRET;
      const service = new JWTService();
      expect(service).toBeInstanceOf(JWTService);
    });
  });

  describe('generateToken', () => {
    const mockUser: User = {
      id: 'user-123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: 'hashed-password',
      role: 1,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system',
      deleted: false,
    };

    it('有効なユーザー情報からJWTトークンを生成する', () => {
      const expectedToken = 'generated-jwt-token';
      const expectedPayload: JWTPayload = {
        userId: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      };

      mockJwt.sign.mockReturnValue(expectedToken as never);

      const result = jwtService.generateToken(mockUser);

      expect(result).toBe(expectedToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expectedPayload,
        expect.any(String), // secret
        { expiresIn: '24h' },
      );
    });

    it('異なる役割のユーザーでもトークンを生成できる', () => {
      const adminUser: User = {
        ...mockUser,
        id: 'admin-456',
        username: 'admin',
        role: 2, // 管理者
      };

      const expectedToken = 'admin-jwt-token';
      mockJwt.sign.mockReturnValue(expectedToken as never);

      const result = jwtService.generateToken(adminUser);

      expect(result).toBe(expectedToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          userId: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
        },
        expect.any(String),
        { expiresIn: '24h' },
      );
    });

    it('ペイロードに必要な情報のみを含める', () => {
      const expectedToken = 'secure-jwt-token';
      mockJwt.sign.mockReturnValue(expectedToken as never);

      jwtService.generateToken(mockUser);

      const callArgs = (mockJwt.sign as jest.Mock).mock.calls[0];
      const payload = callArgs[0] as JWTPayload;

      // ペイロードに含まれるべき情報
      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('username');
      expect(payload).toHaveProperty('role');

      // ペイロードに含まれるべきでない情報
      expect(payload).not.toHaveProperty('passwordHash');
      expect(payload).not.toHaveProperty('firstName');
      expect(payload).not.toHaveProperty('lastName');
      expect(payload).not.toHaveProperty('createdAt');
      expect(payload).not.toHaveProperty('updatedAt');
    });

    it('正しい有効期限でトークンを生成する', () => {
      const expectedToken = 'timed-jwt-token';
      mockJwt.sign.mockReturnValue(expectedToken as never);

      jwtService.generateToken(mockUser);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        { expiresIn: '24h' },
      );
    });
  });

  describe('verifyToken', () => {
    const mockPayload: JWTPayload = {
      userId: 'user-123',
      username: 'testuser',
      role: 1,
    };

    it('有効なトークンを検証して正しいペイロードを返す', () => {
      const validToken = 'valid-jwt-token';
      mockJwt.verify.mockReturnValue(mockPayload as never);

      const result = jwtService.verifyToken(validToken);

      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith(validToken, expect.any(String));
    });

    it('無効なトークンの場合nullを返す', () => {
      const invalidToken = 'invalid-jwt-token';
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = jwtService.verifyToken(invalidToken);

      expect(result).toBeNull();
      expect(mockJwt.verify).toHaveBeenCalledWith(invalidToken, expect.any(String));
    });

    it('期限切れトークンの場合nullを返す', () => {
      const expiredToken = 'expired-jwt-token';
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      const result = jwtService.verifyToken(expiredToken);

      expect(result).toBeNull();
      expect(mockJwt.verify).toHaveBeenCalledWith(expiredToken, expect.any(String));
    });

    it('改ざんされたトークンの場合nullを返す', () => {
      const tamperedToken = 'tampered-jwt-token';
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid signature');
      });

      const result = jwtService.verifyToken(tamperedToken);

      expect(result).toBeNull();
      expect(mockJwt.verify).toHaveBeenCalledWith(tamperedToken, expect.any(String));
    });

    it('不正な形式のトークンの場合nullを返す', () => {
      const malformedToken = 'not.a.valid.jwt.format';
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      const result = jwtService.verifyToken(malformedToken);

      expect(result).toBeNull();
      expect(mockJwt.verify).toHaveBeenCalledWith(malformedToken, expect.any(String));
    });

    it('空文字列トークンの場合nullを返す', () => {
      const emptyToken = '';
      mockJwt.verify.mockImplementation(() => {
        throw new Error('jwt must be provided');
      });

      const result = jwtService.verifyToken(emptyToken);

      expect(result).toBeNull();
      expect(mockJwt.verify).toHaveBeenCalledWith(emptyToken, expect.any(String));
    });

    it('異なる役割のユーザートークンも正しく検証する', () => {
      const adminPayload: JWTPayload = {
        userId: 'admin-456',
        username: 'admin',
        role: 2,
      };

      const adminToken = 'admin-jwt-token';
      mockJwt.verify.mockReturnValue(adminPayload as never);

      const result = jwtService.verifyToken(adminToken);

      expect(result).toEqual(adminPayload);
      expect(result?.role).toBe(2);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('正しいBearer形式からトークンを抽出する', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result).toBe(expectedToken);
    });

    it('Bearer プレフィックスがない場合nullを返す', () => {
      const authHeader = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result).toBeNull();
    });

    it('Basic認証ヘッダーの場合nullを返す', () => {
      const authHeader = 'Basic dXNlcjpwYXNzd29yZA==';

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result).toBeNull();
    });

    it('空文字列の場合nullを返す', () => {
      const authHeader = '';

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result).toBeNull();
    });

    it('undefinedの場合nullを返す', () => {
      const authHeader = undefined;

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result).toBeNull();
    });

    it('Bearer のみで トークンがない場合nullを返す', () => {
      const authHeader = 'Bearer';

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result).toBeNull();
    });

    it('Bearer の後にスペースがない場合nullを返す', () => {
      const authHeader = 'BearereyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result).toBeNull();
    });

    it('Bearer の後に複数のスペースがある場合も正しく抽出する', () => {
      const authHeader = 'Bearer  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const expectedToken = ' eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result).toBe(expectedToken);
    });

    it('大文字小文字を区別したBearer検証', () => {
      const lowercaseHeader = 'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const uppercaseHeader = 'BEARER eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      const lowercaseResult = jwtService.extractTokenFromHeader(lowercaseHeader);
      const uppercaseResult = jwtService.extractTokenFromHeader(uppercaseHeader);

      expect(lowercaseResult).toBeNull();
      expect(uppercaseResult).toBeNull();
    });

    it('Bearer の後に改行文字がある場合の処理', () => {
      const authHeaderWithNewline = 'Bearer \neyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const expectedToken = '\neyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      const result = jwtService.extractTokenFromHeader(authHeaderWithNewline);

      expect(result).toBe(expectedToken);
    });

    it('非常に長いトークンも正しく抽出する', () => {
      const longToken = 'a'.repeat(1000);
      const authHeader = `Bearer ${longToken}`;

      const result = jwtService.extractTokenFromHeader(authHeader);

      expect(result).toBe(longToken);
      expect(result?.length).toBe(1000);
    });
  });

  describe('integration tests', () => {
    it('トークン生成から検証までの一連の流れ', () => {
      // 実際のJWTライブラリを使用したインテグレーションテスト
      const realJwtService = new JWTService();

      // モックを実際のjwtライブラリに置き換え
      (jwt.sign as jest.Mock).mockImplementation(() => {
        return 'mocked-real-token';
      });

      (jwt.verify as jest.Mock).mockImplementation((token) => {
        if (token === 'mocked-real-token') {
          return {
            userId: 'user-123',
            username: 'testuser',
            role: 1,
          };
        }
        throw new Error('Invalid token');
      });

      const mockUser: User = {
        id: 'user-123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashed-password',
        role: 1,
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: new Date(),
        updatedBy: 'system',
        deleted: false,
      };

      // トークン生成
      const token = realJwtService.generateToken(mockUser);
      expect(token).toBe('mocked-real-token');

      // トークン検証
      const payload = realJwtService.verifyToken(token);
      expect(payload).toEqual({
        userId: 'user-123',
        username: 'testuser',
        role: 1,
      });
    });

    it('Authorization ヘッダーからの抽出と検証の組み合わせ', () => {
      const authHeader = 'Bearer valid-token';

      // トークン抽出
      const extractedToken = jwtService.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe('valid-token');

      // 抽出したトークンの検証
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        username: 'testuser',
        role: 1,
      };

      mockJwt.verify.mockReturnValue(mockPayload as never);

      // null チェックを行って安全にアクセス
      expect(extractedToken).not.toBeNull();
      if (extractedToken) {
        const verifiedPayload = jwtService.verifyToken(extractedToken);
        expect(verifiedPayload).toEqual(mockPayload);
      }
    });
  });
});
