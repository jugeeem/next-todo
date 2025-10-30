/**
 * UserUseCase ユニットテスト
 *
 * UserUseCaseクラスの全メソッドの包括的なテストスイートです。
 */

import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserRole,
} from '@/domain/entities/User';
import type { UserRepository } from '@/domain/repositories/UserRepository';
import { type AdminUpdateUserInput, UserUseCase } from '../UserUseCase';

// bcryptのモック
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$mockedHashedPassword'),
}));

// データベース接続のモック
jest.mock('@/infrastructure/database/connection', () => ({
  database: {
    query: jest.fn().mockResolvedValue({ rowCount: 1 }),
  },
}));

// UserRepositoryのモック
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findWithFilters: jest.fn(),
  changePassword: jest.fn(),
};

describe('UserUseCase', () => {
  let userUseCase: UserUseCase;

  // テスト用のサンプルデータ
  const sampleUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'test_user',
    firstName: '太郎',
    firstNameRuby: 'タロウ',
    lastName: '田中',
    lastNameRuby: 'タナカ',
    role: 4 as UserRole,
    passwordHash: '$2a$12$hashedPassword123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'system',
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    updatedBy: 'system',
    deleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userUseCase = new UserUseCase(mockUserRepository);
  });

  describe('constructor', () => {
    it('should create UserUseCase instance', () => {
      const useCase = new UserUseCase(mockUserRepository);
      expect(useCase).toBeInstanceOf(UserUseCase);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users without password hashes', async () => {
      const allUsers: User[] = [
        { ...sampleUser, id: 'user-1', username: 'user1' },
        { ...sampleUser, id: 'user-2', username: 'user2', role: 1 as UserRole },
      ];

      mockUserRepository.findAll.mockResolvedValue(allUsers);

      const result = await userUseCase.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(result[1]).not.toHaveProperty('passwordHash');
      expect(mockUserRepository.findAll).toHaveBeenCalledWith();
    });

    it('should return empty array when no users exist', async () => {
      mockUserRepository.findAll.mockResolvedValue([]);

      const result = await userUseCase.getAllUsers();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getUserById', () => {
    it('should return user without password hash when found', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      mockUserRepository.findById.mockResolvedValue(sampleUser);

      const result = await userUseCase.getUserById(userId);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.username).toBe(sampleUser.username);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null when user not found', async () => {
      const userId = 'nonexistent-id';
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userUseCase.getUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create new user successfully', async () => {
      const createInput: CreateUserInput = {
        username: 'new_user',
        firstName: '花子',
        lastName: '佐藤',
        password: 'plainPassword123',
      };

      const expectedUser: User = {
        ...sampleUser,
        username: createInput.username,
        firstName: createInput.firstName,
        lastName: createInput.lastName,
      };

      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);

      const result = await userUseCase.createUser(createInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.username).toBe(createInput.username);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        createInput.username,
      );
    });

    it('should throw error when username already exists', async () => {
      const createInput: CreateUserInput = {
        username: 'existing_user',
        password: 'password123',
      };

      mockUserRepository.findByUsername.mockResolvedValue(sampleUser);

      await expect(userUseCase.createUser(createInput)).rejects.toThrow(
        'このユーザー名は既に使用されています',
      );
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const updateInput: UpdateUserInput = {
        firstName: '更新花子',
        lastName: '更新佐藤',
      };

      const updatedUser: User = {
        ...sampleUser,
        firstName: updateInput.firstName as string,
        lastName: updateInput.lastName as string,
      };

      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userUseCase.updateUser(userId, updateInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.firstName).toBe(updateInput.firstName);
    });

    it('should throw error when user not found', async () => {
      const userId = 'non-existent-id';
      const updateInput: UpdateUserInput = {
        firstName: 'Updated',
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userUseCase.updateUser(userId, updateInput)).rejects.toThrow(
        'ユーザーが見つかりません',
      );
    });

    it('should throw error when user update fails', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const updateInput: UpdateUserInput = {
        firstName: 'Updated',
      };

      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockUserRepository.update.mockResolvedValue(null);

      await expect(userUseCase.updateUser(userId, updateInput)).rejects.toThrow(
        'ユーザーの更新に失敗しました',
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockUserRepository.delete.mockResolvedValue(true);

      await userUseCase.deleteUser(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      const userId = 'nonexistent-id';
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userUseCase.deleteUser(userId)).rejects.toThrow(
        'ユーザーが見つかりません',
      );
    });

    it('should handle already deleted user (implementation allows)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const deletedUser: User = { ...sampleUser, deleted: true };

      mockUserRepository.findById.mockResolvedValue(deletedUser);
      mockUserRepository.delete.mockResolvedValue(true);

      // 現在の実装では削除済みユーザーのチェックは行われていない
      await userUseCase.deleteUser(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserByUsername', () => {
    it('should return user without password hash when found', async () => {
      const username = 'test_user';
      mockUserRepository.findByUsername.mockResolvedValue(sampleUser);

      const result = await userUseCase.getUserByUsername(username);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.username).toBe(username);
    });

    it('should return null when user not found', async () => {
      const username = 'nonexistent_user';
      mockUserRepository.findByUsername.mockResolvedValue(null);

      const result = await userUseCase.getUserByUsername(username);

      expect(result).toBeNull();
    });
  });

  describe('updateUserAsAdmin', () => {
    beforeEach(() => {
      const mockDatabase = jest.requireMock('@/infrastructure/database/connection');
      mockDatabase.database.query.mockClear();
    });

    it('should update user basic info as admin', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const adminUpdateInput: AdminUpdateUserInput = {
        firstName: 'Updated',
        lastName: 'Admin',
        role: 2 as UserRole,
      };

      const updatedUser = { ...sampleUser, ...adminUpdateInput };

      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userUseCase.updateUserAsAdmin(userId, adminUpdateInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Admin');
      expect(result.role).toBe(2);
    });

    it('should throw error when user not found in updateUserAsAdmin', async () => {
      const userId = 'non-existent-id';
      const adminUpdateInput: AdminUpdateUserInput = {
        role: 2 as UserRole,
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        userUseCase.updateUserAsAdmin(userId, adminUpdateInput),
      ).rejects.toThrow('ユーザーが見つかりません');
    });

    it('should throw error when basic update fails in updateUserAsAdmin', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const adminUpdateInput: AdminUpdateUserInput = {
        role: 2 as UserRole,
      };

      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockUserRepository.update.mockResolvedValue(null);

      await expect(
        userUseCase.updateUserAsAdmin(userId, adminUpdateInput),
      ).rejects.toThrow('ユーザーの更新に失敗しました');
    });

    it('should update password when provided', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const adminUpdateInput: AdminUpdateUserInput = {
        password: 'newpassword123',
        role: 2 as UserRole,
      };

      const updatedUser = { ...sampleUser, role: 2 as UserRole };

      mockUserRepository.findById.mockResolvedValueOnce(sampleUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);
      mockUserRepository.findById.mockResolvedValueOnce(updatedUser);

      const result = await userUseCase.updateUserAsAdmin(userId, adminUpdateInput);

      const mockDatabase = jest.requireMock('@/infrastructure/database/connection');
      expect(mockDatabase.database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([
          '$2a$12$mockedHashedPassword',
          expect.any(Date),
          userId,
        ]),
      );
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error when user not found after password update', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const adminUpdateInput: AdminUpdateUserInput = {
        password: 'newpassword123',
        role: 2 as UserRole,
      };

      const updatedUser = { ...sampleUser, role: 2 as UserRole };

      mockUserRepository.findById.mockResolvedValueOnce(sampleUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);
      mockUserRepository.findById.mockResolvedValueOnce(null);

      await expect(
        userUseCase.updateUserAsAdmin(userId, adminUpdateInput),
      ).rejects.toThrow('ユーザーの更新後の取得に失敗しました');
    });

    it('should update username when provided and not duplicate', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const adminUpdateInput: AdminUpdateUserInput = {
        username: 'newusername',
        role: 2 as UserRole,
      };

      const updatedUser = {
        ...sampleUser,
        username: 'newusername',
        role: 2 as UserRole,
      };

      mockUserRepository.findById.mockResolvedValueOnce(sampleUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValueOnce(updatedUser);

      const result = await userUseCase.updateUserAsAdmin(userId, adminUpdateInput);

      const mockDatabase = jest.requireMock('@/infrastructure/database/connection');
      expect(mockDatabase.database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['newusername', expect.any(Date), userId]),
      );
      expect(result.username).toBe('newusername');
    });

    it('should throw error when username already exists', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const adminUpdateInput: AdminUpdateUserInput = {
        username: 'existinguser',
        role: 2 as UserRole,
      };

      const existingUserWithSameUsername = {
        ...sampleUser,
        id: 'different-id',
        username: 'existinguser',
      };
      const updatedUser = { ...sampleUser, role: 2 as UserRole };

      mockUserRepository.findById.mockResolvedValueOnce(sampleUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);
      mockUserRepository.findByUsername.mockResolvedValue(existingUserWithSameUsername);

      await expect(
        userUseCase.updateUserAsAdmin(userId, adminUpdateInput),
      ).rejects.toThrow('このユーザー名は既に使用されています');
    });

    it('should allow updating to same username', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const adminUpdateInput: AdminUpdateUserInput = {
        username: sampleUser.username, // 同じユーザー名
        role: 2 as UserRole,
      };

      const updatedUser = { ...sampleUser, role: 2 as UserRole };

      mockUserRepository.findById.mockResolvedValueOnce(sampleUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userUseCase.updateUserAsAdmin(userId, adminUpdateInput);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.role).toBe(2);
    });

    it('should throw error when user not found after username update', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const adminUpdateInput: AdminUpdateUserInput = {
        username: 'newusername',
        role: 2 as UserRole,
      };

      const updatedUser = { ...sampleUser, role: 2 as UserRole };

      mockUserRepository.findById.mockResolvedValueOnce(sampleUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValueOnce(null);

      await expect(
        userUseCase.updateUserAsAdmin(userId, adminUpdateInput),
      ).rejects.toThrow('ユーザーの更新後の取得に失敗しました');
    });
  });

  describe('Security', () => {
    it('should ensure password hash is never exposed', async () => {
      const userWithPassword: User = {
        ...sampleUser,
        passwordHash: 'sensitive_hash_data',
      };

      mockUserRepository.findById.mockResolvedValue(userWithPassword);

      const result = await userUseCase.getUserById(sampleUser.id);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');

      const resultString = JSON.stringify(result);
      expect(resultString).not.toContain('sensitive_hash_data');
    });
  });
});
