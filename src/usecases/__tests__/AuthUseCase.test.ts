/**
 * @fileoverview AuthUseCase ユニットテスト
 *
 * AuthUseCaseクラスの全メソッドに対する包括的なユニットテストです。
 * リポジトリ層とJWTサービスをモック化し、ユースケース層のビジネスロジックを検証します。
 *
 * テスト対象メソッド:
 * - register: ユーザー登録処理
 * - login: ログイン認証処理
 * - getUserById: IDによるユーザー取得
 *
 * @author jugeeem
 * @since 1.0.0
 */

import bcrypt from 'bcryptjs';
import type {
  AuthResult,
  CreateUserInput,
  LoginInput,
  User,
} from '@/domain/entities/User';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { JWTService } from '@/lib/jwt';
import { AuthUseCase } from '../AuthUseCase';

// bcryptのモック
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// UserRepositoryのモック
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};

// JWTServiceのモック
const mockJWTService = {
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
} as unknown as jest.Mocked<JWTService>;

describe('AuthUseCase', () => {
  let authUseCase: AuthUseCase;

  // テスト用のサンプルデータ
  const sampleUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
    passwordHash: '$2a$12$hashedpassword',
    firstName: '太郎',
    firstNameRuby: 'タロウ',
    lastName: '田中',
    lastNameRuby: 'タナカ',
    role: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'system',
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    updatedBy: 'system',
    deleted: false,
  };

  const sampleCreateInput: CreateUserInput = {
    username: 'newuser',
    password: 'password123',
    firstName: '花子',
    firstNameRuby: 'ハナコ',
    lastName: '山田',
    lastNameRuby: 'ヤマダ',
    role: 1,
  };

  const sampleLoginInput: LoginInput = {
    username: 'testuser',
    password: 'password123',
  };

  const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testtoken';

  const expectedAuthResult: AuthResult = {
    user: {
      id: sampleUser.id,
      username: sampleUser.username,
      firstName: sampleUser.firstName,
      firstNameRuby: sampleUser.firstNameRuby,
      lastName: sampleUser.lastName,
      lastNameRuby: sampleUser.lastNameRuby,
      role: sampleUser.role,
      createdAt: sampleUser.createdAt,
      createdBy: sampleUser.createdBy,
      updatedAt: sampleUser.updatedAt,
      updatedBy: sampleUser.updatedBy,
      deleted: sampleUser.deleted,
    },
    token: sampleToken,
  };

  beforeEach(() => {
    // テストごとにモックをクリア
    jest.clearAllMocks();

    // AuthUseCaseのインスタンスを作成
    authUseCase = new AuthUseCase(mockUserRepository, mockJWTService);
  });

  describe('constructor', () => {
    it('should create AuthUseCase instance with repository and JWT service', () => {
      // Act
      const useCase = new AuthUseCase(mockUserRepository, mockJWTService);

      // Assert
      expect(useCase).toBeInstanceOf(AuthUseCase);
      expect(
        (useCase as unknown as { userRepository: UserRepository }).userRepository,
      ).toBe(mockUserRepository);
      expect((useCase as unknown as { jwtService: JWTService }).jwtService).toBe(
        mockJWTService,
      );
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(sampleUser);
      mockJWTService.generateToken.mockReturnValue(sampleToken);

      // Act
      const result = await authUseCase.register(sampleCreateInput);

      // Assert
      expect(result).toEqual(expectedAuthResult);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        sampleCreateInput.username,
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(sampleCreateInput);
      expect(mockJWTService.generateToken).toHaveBeenCalledWith(sampleUser);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
      expect(mockJWTService.generateToken).toHaveBeenCalledTimes(1);
    });

    it('should throw error when username already exists', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(sampleUser);

      // Act & Assert
      await expect(authUseCase.register(sampleCreateInput)).rejects.toThrow(
        'Username already exists',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        sampleCreateInput.username,
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockJWTService.generateToken).not.toHaveBeenCalled();
    });

    it('should propagate repository errors during user creation', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(null);
      const error = new Error('Database connection failed');
      mockUserRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(authUseCase.register(sampleCreateInput)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        sampleCreateInput.username,
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(sampleCreateInput);
      expect(mockJWTService.generateToken).not.toHaveBeenCalled();
    });

    it('should propagate repository errors during username check', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockUserRepository.findByUsername.mockRejectedValue(error);

      // Act & Assert
      await expect(authUseCase.register(sampleCreateInput)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        sampleCreateInput.username,
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockJWTService.generateToken).not.toHaveBeenCalled();
    });

    it('should exclude password hash from response', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(sampleUser);
      mockJWTService.generateToken.mockReturnValue(sampleToken);

      // Act
      const result = await authUseCase.register(sampleCreateInput);

      // Assert
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.username).toBe(sampleUser.username);
      expect(result.user.firstName).toBe(sampleUser.firstName);
      expect(result.user.lastName).toBe(sampleUser.lastName);
      expect(result.token).toBe(sampleToken);
    });

    it('should handle user creation with minimal data', async () => {
      // Arrange
      const minimalInput: CreateUserInput = {
        username: 'minimal',
        password: 'pass123',
        firstName: '名',
        lastName: '姓',
        role: 1,
      };

      const minimalUser: User = {
        ...sampleUser,
        username: minimalInput.username,
        firstName: minimalInput.firstName,
        lastName: minimalInput.lastName,
        firstNameRuby: undefined,
        lastNameRuby: undefined,
      };

      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(minimalUser);
      mockJWTService.generateToken.mockReturnValue(sampleToken);

      // Act
      const result = await authUseCase.register(minimalInput);

      // Assert
      expect(result.user.username).toBe(minimalInput.username);
      expect(result.user.firstName).toBe(minimalInput.firstName);
      expect(result.user.lastName).toBe(minimalInput.lastName);
      expect(result.user.firstNameRuby).toBeUndefined();
      expect(result.user.lastNameRuby).toBeUndefined();
      expect(result.token).toBe(sampleToken);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(sampleUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJWTService.generateToken.mockReturnValue(sampleToken);

      // Act
      const result = await authUseCase.login(sampleLoginInput);

      // Assert
      expect(result).toEqual(expectedAuthResult);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        sampleLoginInput.username,
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        sampleLoginInput.password,
        sampleUser.passwordHash,
      );
      expect(mockJWTService.generateToken).toHaveBeenCalledWith(sampleUser);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledTimes(1);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);
      expect(mockJWTService.generateToken).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(authUseCase.login(sampleLoginInput)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        sampleLoginInput.username,
      );
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(mockJWTService.generateToken).not.toHaveBeenCalled();
    });

    it('should throw error when password is invalid', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(sampleUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authUseCase.login(sampleLoginInput)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        sampleLoginInput.username,
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        sampleLoginInput.password,
        sampleUser.passwordHash,
      );
      expect(mockJWTService.generateToken).not.toHaveBeenCalled();
    });

    it('should propagate repository errors during user lookup', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockUserRepository.findByUsername.mockRejectedValue(error);

      // Act & Assert
      await expect(authUseCase.login(sampleLoginInput)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        sampleLoginInput.username,
      );
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
      expect(mockJWTService.generateToken).not.toHaveBeenCalled();
    });

    it('should propagate bcrypt errors during password comparison', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(sampleUser);
      const error = new Error('Bcrypt comparison failed');
      (mockBcrypt.compare as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(authUseCase.login(sampleLoginInput)).rejects.toThrow(
        'Bcrypt comparison failed',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        sampleLoginInput.username,
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        sampleLoginInput.password,
        sampleUser.passwordHash,
      );
      expect(mockJWTService.generateToken).not.toHaveBeenCalled();
    });

    it('should exclude password hash from response', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(sampleUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJWTService.generateToken.mockReturnValue(sampleToken);

      // Act
      const result = await authUseCase.login(sampleLoginInput);

      // Assert
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.username).toBe(sampleUser.username);
      expect(result.user.firstName).toBe(sampleUser.firstName);
      expect(result.user.lastName).toBe(sampleUser.lastName);
      expect(result.token).toBe(sampleToken);
    });

    it('should handle login for user with special characters in username', async () => {
      // Arrange
      const specialUser: User = {
        ...sampleUser,
        username: 'user-with.special_chars@test',
      };
      const specialLoginInput: LoginInput = {
        username: 'user-with.special_chars@test',
        password: 'password123',
      };

      mockUserRepository.findByUsername.mockResolvedValue(specialUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJWTService.generateToken.mockReturnValue(sampleToken);

      // Act
      const result = await authUseCase.login(specialLoginInput);

      // Assert
      expect(result.user.username).toBe(specialUser.username);
      expect(result.token).toBe(sampleToken);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        specialLoginInput.username,
      );
    });

    it('should handle case-sensitive username correctly', async () => {
      // Arrange
      const caseLoginInput: LoginInput = {
        username: 'TestUser', // 大文字小文字が違う
        password: 'password123',
      };

      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(authUseCase.login(caseLoginInput)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('TestUser');
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      mockUserRepository.findById.mockResolvedValue(sampleUser);

      // Act
      const result = await authUseCase.getUserById(userId);

      // Assert
      expect(result).toEqual(sampleUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await authUseCase.getUserById(userId);

      // Assert
      expect(result).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const userId = 'test-id';
      const error = new Error('Database connection failed');
      mockUserRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(authUseCase.getUserById(userId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle invalid UUID format gracefully', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';
      const error = new Error('Invalid UUID format');
      mockUserRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(authUseCase.getUserById(invalidId)).rejects.toThrow(
        'Invalid UUID format',
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(invalidId);
    });

    it('should return user with all properties including passwordHash', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      mockUserRepository.findById.mockResolvedValue(sampleUser);

      // Act
      const result = await authUseCase.getUserById(userId);

      // Assert
      expect(result).toEqual(sampleUser);
      expect(result?.passwordHash).toBe(sampleUser.passwordHash);
      expect(result?.username).toBe(sampleUser.username);
      expect(result?.firstName).toBe(sampleUser.firstName);
      expect(result?.lastName).toBe(sampleUser.lastName);
      expect(result?.role).toBe(sampleUser.role);
    });

    it('should handle deleted user correctly', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      // リポジトリが論理削除されたユーザーを返さないことを前提
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await authUseCase.getUserById(userId);

      // Assert
      expect(result).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty string inputs gracefully', async () => {
      // Arrange
      const emptyLoginInput: LoginInput = {
        username: '',
        password: '',
      };

      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(authUseCase.login(emptyLoginInput)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('');
    });

    it('should handle null/undefined repository responses', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(null);

      // getUserById でも null を返すケース
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      const loginResult = authUseCase.login({
        username: 'testuser',
        password: 'password123',
      });
      await expect(loginResult).rejects.toThrow('Invalid credentials');

      const getUserResult = await authUseCase.getUserById('nonexistent');
      expect(getUserResult).toBeNull();
    });

    it('should handle JWT service errors during token generation', async () => {
      // Arrange - 登録時のJWT生成エラー
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(sampleUser);
      const jwtError = new Error('JWT generation failed');
      mockJWTService.generateToken.mockImplementation(() => {
        throw jwtError;
      });

      // Act & Assert
      await expect(authUseCase.register(sampleCreateInput)).rejects.toThrow(
        'JWT generation failed',
      );

      // Arrange - ログイン時のJWT生成エラー
      mockUserRepository.findByUsername.mockResolvedValue(sampleUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(authUseCase.login(sampleLoginInput)).rejects.toThrow(
        'JWT generation failed',
      );
    });

    it('should handle very long username inputs', async () => {
      // Arrange
      const longUsername = 'a'.repeat(1000);
      const longUsernameInput: LoginInput = {
        username: longUsername,
        password: 'password123',
      };

      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(authUseCase.login(longUsernameInput)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(longUsername);
    });

    it('should handle concurrent access scenarios', async () => {
      // Arrange - 同時に同じユーザー名で登録しようとするケース
      const concurrentInput1: CreateUserInput = {
        username: 'concurrent',
        password: 'password1',
        firstName: '太郎',
        lastName: '田中',
        role: 1,
      };

      const concurrentInput2: CreateUserInput = {
        username: 'concurrent',
        password: 'password2',
        firstName: '花子',
        lastName: '田中',
        role: 1,
      };

      // 最初の呼び出しでは存在しない、2回目では存在する
      mockUserRepository.findByUsername
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(sampleUser);

      mockUserRepository.create.mockResolvedValue(sampleUser);
      mockJWTService.generateToken.mockReturnValue(sampleToken);

      // Act
      const promise1 = authUseCase.register(concurrentInput1);
      const promise2 = authUseCase.register(concurrentInput2);

      // Assert
      await expect(promise1).resolves.toBeDefined();
      await expect(promise2).rejects.toThrow('Username already exists');
    });
  });
});
