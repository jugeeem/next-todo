/**
 * @jest-environment node
 */

import type { QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../../domain/entities/User';
import { database } from '../../database/connection';
import { PostgresUserRepository } from '../PostgresUserRepository';

// Mock dependencies
jest.mock('../../database/connection');
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));
jest.mock('uuid');

const mockDatabase = database as jest.Mocked<typeof database>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');
const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('PostgresUserRepository', () => {
  let repository: PostgresUserRepository;

  beforeEach(() => {
    repository = new PostgresUserRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockRow = {
        id: userId,
        username: 'testuser',
        first_name: '太郎',
        first_name_ruby: 'タロウ',
        last_name: '山田',
        last_name_ruby: 'ヤマダ',
        password_hash: 'hashedpassword',
        role: UserRole.USER,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'system',
        updated_at: '2024-01-01T00:00:00Z',
        updated_by: 'system',
        deleted: false,
      };

      const mockResult: QueryResult = {
        rows: [mockRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toEqual({
        id: userId,
        username: 'testuser',
        firstName: '太郎',
        firstNameRuby: 'タロウ',
        lastName: '山田',
        lastNameRuby: 'ヤマダ',
        passwordHash: 'hashedpassword',
        role: UserRole.USER,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'system',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        updatedBy: 'system',
        deleted: false,
      });

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId],
      );
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      const mockResult: QueryResult = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(repository.findById(userId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      // Arrange
      const username = 'testuser';
      const mockRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: username,
        first_name: '太郎',
        first_name_ruby: 'タロウ',
        last_name: '山田',
        last_name_ruby: 'ヤマダ',
        password_hash: 'hashedpassword',
        role: UserRole.USER,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'system',
        updated_at: '2024-01-01T00:00:00Z',
        updated_by: 'system',
        deleted: false,
      };

      const mockResult: QueryResult = {
        rows: [mockRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findByUsername(username);

      // Assert
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: username,
        firstName: '太郎',
        firstNameRuby: 'タロウ',
        lastName: '山田',
        lastNameRuby: 'ヤマダ',
        passwordHash: 'hashedpassword',
        role: UserRole.USER,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'system',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        updatedBy: 'system',
        deleted: false,
      });
    });

    it('should return null when user not found by username', async () => {
      // Arrange
      const username = 'nonexistentuser';
      const mockResult: QueryResult = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findByUsername(username);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      // Arrange
      const username = 'testuser';
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(repository.findByUsername(username)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('create', () => {
    it('should create user with complete data and hash password', async () => {
      // Arrange
      const newUserId = '123e4567-e89b-12d3-a456-426614174000';
      const hashedPassword = '$2a$10$hashedpassword';
      const createUserInput = {
        username: 'newuser',
        firstName: '花子',
        firstNameRuby: 'ハナコ',
        lastName: '佐藤',
        lastNameRuby: 'サトウ',
        password: 'password123',
        role: UserRole.USER,
        createdBy: 'admin',
      };

      mockUuidv4.mockReturnValue(newUserId);
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const mockRow = {
        id: newUserId,
        username: createUserInput.username,
        first_name: createUserInput.firstName,
        first_name_ruby: createUserInput.firstNameRuby,
        last_name: createUserInput.lastName,
        last_name_ruby: createUserInput.lastNameRuby,
        password_hash: hashedPassword,
        role: createUserInput.role,
        created_at: '2022-01-01T00:00:00.000Z',
        created_by: createUserInput.createdBy,
        updated_at: '2022-01-01T00:00:00.000Z',
        updated_by: createUserInput.createdBy,
        deleted: false,
      };

      const mockResult: QueryResult = {
        rows: [mockRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.create(createUserInput);

      // Assert
      expect(result).toEqual({
        id: newUserId,
        username: createUserInput.username,
        firstName: createUserInput.firstName,
        firstNameRuby: createUserInput.firstNameRuby,
        lastName: createUserInput.lastName,
        lastNameRuby: createUserInput.lastNameRuby,
        passwordHash: hashedPassword,
        role: createUserInput.role,
        createdAt: new Date('2022-01-01T00:00:00.000Z'),
        createdBy: createUserInput.createdBy,
        updatedAt: new Date('2022-01-01T00:00:00.000Z'),
        updatedBy: createUserInput.createdBy,
        deleted: false,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserInput.password, 10);
      expect(mockUuidv4).toHaveBeenCalled();
    });

    it('should create user with minimal data', async () => {
      // Arrange
      const newUserId = '123e4567-e89b-12d3-a456-426614174000';
      const hashedPassword = '$2a$10$hashedpassword';
      const createUserInput = {
        username: 'minimaluser',
        password: 'password123',
        role: UserRole.GUEST,
        createdBy: 'system',
      };

      mockUuidv4.mockReturnValue(newUserId);
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const mockRow = {
        id: newUserId,
        username: createUserInput.username,
        first_name: null,
        first_name_ruby: null,
        last_name: null,
        last_name_ruby: null,
        password_hash: hashedPassword,
        role: createUserInput.role,
        created_at: '2022-01-01T00:00:00.000Z',
        created_by: createUserInput.createdBy,
        updated_at: '2022-01-01T00:00:00.000Z',
        updated_by: createUserInput.createdBy,
        deleted: false,
      };

      const mockResult: QueryResult = {
        rows: [mockRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.create(createUserInput);

      // Assert
      expect(result).toEqual({
        id: newUserId,
        username: createUserInput.username,
        firstName: null,
        firstNameRuby: null,
        lastName: null,
        lastNameRuby: null,
        passwordHash: hashedPassword,
        role: createUserInput.role,
        createdAt: new Date('2022-01-01T00:00:00.000Z'),
        createdBy: createUserInput.createdBy,
        updatedAt: new Date('2022-01-01T00:00:00.000Z'),
        updatedBy: createUserInput.createdBy,
        deleted: false,
      });
    });

    it('should handle bcrypt hashing error', async () => {
      // Arrange
      const createUserInput = {
        username: 'newuser',
        password: 'password123',
        role: UserRole.USER,
        createdBy: 'admin',
      };

      bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

      // Act & Assert
      await expect(repository.create(createUserInput)).rejects.toThrow(
        'Hashing failed',
      );
    });

    it('should handle database error during creation', async () => {
      // Arrange
      const createUserInput = {
        username: 'newuser',
        password: 'password123',
        role: UserRole.USER,
        createdBy: 'admin',
      };

      bcrypt.hash.mockResolvedValue('$2a$10$hashedpassword');
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(repository.create(createUserInput)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('update', () => {
    it('should update user with complete data', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateUserInput = {
        firstName: '次郎',
        firstNameRuby: 'ジロウ',
        lastName: '田中',
        lastNameRuby: 'タナカ',
        role: UserRole.MANAGER,
      };

      const mockRow = {
        id: userId,
        username: 'originaluser',
        first_name: updateUserInput.firstName,
        first_name_ruby: updateUserInput.firstNameRuby,
        last_name: updateUserInput.lastName,
        last_name_ruby: updateUserInput.lastNameRuby,
        password_hash: 'originalhashedpassword',
        role: updateUserInput.role,
        created_at: '2021-01-01T00:00:00.000Z',
        created_by: 'system',
        updated_at: '2022-01-01T00:00:00.000Z',
        updated_by: 'system',
        deleted: false,
      };

      const mockResult: QueryResult = {
        rows: [mockRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.update(userId, updateUserInput);

      // Assert
      expect(result).toEqual({
        id: userId,
        username: 'originaluser',
        firstName: updateUserInput.firstName,
        firstNameRuby: updateUserInput.firstNameRuby,
        lastName: updateUserInput.lastName,
        lastNameRuby: updateUserInput.lastNameRuby,
        passwordHash: 'originalhashedpassword',
        role: updateUserInput.role,
        createdAt: new Date('2021-01-01T00:00:00.000Z'),
        createdBy: 'system',
        updatedAt: new Date('2022-01-01T00:00:00.000Z'),
        updatedBy: 'system',
        deleted: false,
      });
    });

    it('should return null when user not found for update', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      const updateUserInput = {
        firstName: 'updatedname',
      };

      const mockResult: QueryResult = {
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.update(userId, updateUserInput);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database error during update', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateUserInput = {
        firstName: 'updatedname',
      };

      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(repository.update(userId, updateUserInput)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('delete', () => {
    it('should soft delete user successfully', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult: QueryResult = {
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.delete(userId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user not found for deletion', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      const mockResult: QueryResult = {
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.delete(userId);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle null rowCount', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult: QueryResult = {
        rows: [],
        rowCount: null,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.delete(userId);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle database error during deletion', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(repository.delete(userId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return all users ordered by creation date', async () => {
      // Arrange
      const mockRows = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          username: 'user1',
          first_name: '太郎',
          first_name_ruby: 'タロウ',
          last_name: '山田',
          last_name_ruby: 'ヤマダ',
          password_hash: 'hashedpassword1',
          role: UserRole.ADMIN,
          created_at: '2024-01-02T00:00:00Z',
          created_by: 'system',
          updated_at: '2024-01-02T00:00:00Z',
          updated_by: 'system',
          deleted: false,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          username: 'user2',
          first_name: '花子',
          first_name_ruby: 'ハナコ',
          last_name: '佐藤',
          last_name_ruby: 'サトウ',
          password_hash: 'hashedpassword2',
          role: UserRole.USER,
          created_at: '2024-01-01T00:00:00Z',
          created_by: 'system',
          updated_at: '2024-01-01T00:00:00Z',
          updated_by: 'system',
          deleted: false,
        },
      ];

      const mockResult: QueryResult = {
        rows: mockRows,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174001',
        username: 'user1',
        firstName: '太郎',
        firstNameRuby: 'タロウ',
        lastName: '山田',
        lastNameRuby: 'ヤマダ',
        passwordHash: 'hashedpassword1',
        role: UserRole.ADMIN,
        createdAt: new Date('2024-01-02T00:00:00Z'),
        createdBy: 'system',
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        updatedBy: 'system',
        deleted: false,
      });
      expect(result[1]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174002',
        username: 'user2',
        firstName: '花子',
        firstNameRuby: 'ハナコ',
        lastName: '佐藤',
        lastNameRuby: 'サトウ',
        passwordHash: 'hashedpassword2',
        role: UserRole.USER,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'system',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        updatedBy: 'system',
        deleted: false,
      });
    });

    it('should return empty array when no users found', async () => {
      // Arrange
      const mockResult: QueryResult = {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle users with null optional fields', async () => {
      // Arrange
      const mockRows = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          username: 'minimaluser',
          first_name: null,
          first_name_ruby: null,
          last_name: null,
          last_name_ruby: null,
          password_hash: 'hashedpassword',
          role: UserRole.GUEST,
          created_at: '2024-01-01T00:00:00Z',
          created_by: 'system',
          updated_at: '2024-01-01T00:00:00Z',
          updated_by: 'system',
          deleted: false,
        },
      ];

      const mockResult: QueryResult = {
        rows: mockRows,
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174001',
        username: 'minimaluser',
        firstName: null,
        firstNameRuby: null,
        lastName: null,
        lastNameRuby: null,
        passwordHash: 'hashedpassword',
        role: UserRole.GUEST,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'system',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        updatedBy: 'system',
        deleted: false,
      });
    });

    it('should handle database error', async () => {
      // Arrange
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(repository.findAll()).rejects.toThrow('Database connection failed');
    });
  });
});
