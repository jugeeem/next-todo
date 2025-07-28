import type { User } from '@/domain/entities/User';
import { UserRole } from '@/domain/entities/User';
import { JWTService } from '../jwt';

// joseライブラリのモック（jest.setup.tsで設定されています）

describe('JWTService', () => {
  let jwtService: JWTService;

  beforeEach(() => {
    jwtService = new JWTService();
  });

  describe('generateToken', () => {
    it('有効なユーザーでトークンを生成する', async () => {
      const user: User = {
        id: '1',
        username: 'testuser',
        role: UserRole.USER,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: new Date(),
        updatedBy: 'system',
        deleted: false,
      };

      const token = await jwtService.generateToken(user);

      expect(token).toBe('mock-jwt-token');
    });

    it('管理者ユーザーでトークンを生成する', async () => {
      const user: User = {
        id: '2',
        username: 'admin',
        role: UserRole.ADMIN,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: new Date(),
        updatedBy: 'system',
        deleted: false,
      };

      const token = await jwtService.generateToken(user);

      expect(token).toBe('mock-jwt-token');
    });
  });

  describe('verifyToken', () => {
    it('有効なトークンを検証する', async () => {
      const token = 'valid-token';

      const result = await jwtService.verifyToken(token);

      // jest.setup.tsで設定されたモック返り値に合わせる
      expect(result).toEqual({
        userId: 'user-123',
        username: 'testuser',
        role: 1,
      });
    });

    it('無効なトークンの場合nullを返す', async () => {
      const token = 'invalid-token';

      const result = await jwtService.verifyToken(token);

      expect(result).toBeNull();
    });

    it('トークンが空の場合nullを返す', async () => {
      const token = '';

      const result = await jwtService.verifyToken(token);

      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('Bearerトークンを正しく抽出する', () => {
      const header = 'Bearer valid-token';

      const token = jwtService.extractTokenFromHeader(header);

      expect(token).toBe('valid-token');
    });

    it('Bearer形式でない場合nullを返す', () => {
      const header = 'Invalid-format token';

      const token = jwtService.extractTokenFromHeader(header);

      expect(token).toBeNull();
    });

    it('ヘッダーが空の場合nullを返す', () => {
      const header = '';

      const token = jwtService.extractTokenFromHeader(header);

      expect(token).toBeNull();
    });

    it('ヘッダーがundefinedの場合nullを返す', () => {
      const header = undefined;

      const token = jwtService.extractTokenFromHeader(header);

      expect(token).toBeNull();
    });

    it('Bearerのみでトークン部分がない場合空文字を返す', () => {
      const header = 'Bearer ';

      const token = jwtService.extractTokenFromHeader(header);

      expect(token).toBe('');
    });

    it('複数のスペースが含まれるヘッダーでも正しく抽出する', () => {
      const header = 'Bearer   token-with-spaces';

      const token = jwtService.extractTokenFromHeader(header);

      expect(token).toBe('  token-with-spaces');
    });
  });
});
