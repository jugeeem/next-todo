/**
 * @fileoverview TodoUseCase ユニットテスト
 *
 * TodoUseCaseクラスの全メソッドに対する包括的なユニットテストです。
 * リポジトリ層をモック化し、ユースケース層のビジネスロジックを検証します。
 *
 * テスト対象メソッド:
 * - createTodo: 新規タスク作成
 * - getTodoById: IDによる単一タスク取得
 * - getTodosByUserId: ユーザー別タスク一覧取得
 * - updateTodo: タスク情報更新
 * - deleteTodo: タスク削除
 * - getAllTodos: 全タスク取得
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/domain/entities/Todo';
import type { TodoRepository } from '@/domain/repositories/TodoRepository';
import { TodoUseCase } from '../TodoUseCase';

// TodoRepositoryのモック
const mockTodoRepository: jest.Mocked<TodoRepository> = {
  findById: jest.fn(),
  findByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};

describe('TodoUseCase', () => {
  let todoUseCase: TodoUseCase;

  // テスト用のサンプルデータ
  const sampleTodo: Todo = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'サンプルタスク',
    descriptions: 'テスト用のタスクです',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'test-user',
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    updatedBy: 'test-user',
    deleted: false,
    userId: 'user-123',
  };

  const sampleCreateInput: CreateTodoInput = {
    title: '新しいタスク',
    descriptions: '新規作成するタスクです',
    userId: 'user-123',
  };

  const sampleUpdateInput: UpdateTodoInput = {
    title: '更新されたタスク',
    descriptions: '更新されたタスクの説明',
  };

  beforeEach(() => {
    // テストごとにモックをクリア
    jest.clearAllMocks();

    // TodoUseCaseのインスタンスを作成
    todoUseCase = new TodoUseCase(mockTodoRepository);
  });

  describe('constructor', () => {
    it('should create TodoUseCase instance with repository', () => {
      // Act
      const useCase = new TodoUseCase(mockTodoRepository);

      // Assert
      expect(useCase).toBeInstanceOf(TodoUseCase);
      expect(
        (useCase as unknown as { todoRepository: TodoRepository }).todoRepository,
      ).toBe(mockTodoRepository);
    });
  });

  describe('createTodo', () => {
    it('should create a new todo successfully', async () => {
      // Arrange
      const expectedTodo: Todo = {
        ...sampleTodo,
        title: sampleCreateInput.title,
        descriptions: sampleCreateInput.descriptions,
        userId: sampleCreateInput.userId,
      };

      mockTodoRepository.create.mockResolvedValue(expectedTodo);

      // Act
      const result = await todoUseCase.createTodo(sampleCreateInput);

      // Assert
      expect(result).toEqual(expectedTodo);
      expect(mockTodoRepository.create).toHaveBeenCalledWith(sampleCreateInput);
      expect(mockTodoRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should create todo with minimal data (no description)', async () => {
      // Arrange
      const minimalInput: CreateTodoInput = {
        title: 'ミニマルタスク',
        userId: 'user-456',
      };

      const expectedTodo: Todo = {
        ...sampleTodo,
        title: minimalInput.title,
        descriptions: undefined,
        userId: minimalInput.userId,
      };

      mockTodoRepository.create.mockResolvedValue(expectedTodo);

      // Act
      const result = await todoUseCase.createTodo(minimalInput);

      // Assert
      expect(result).toEqual(expectedTodo);
      expect(mockTodoRepository.create).toHaveBeenCalledWith(minimalInput);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockTodoRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.createTodo(sampleCreateInput)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockTodoRepository.create).toHaveBeenCalledWith(sampleCreateInput);
    });

    it('should handle validation errors from repository', async () => {
      // Arrange
      const error = new Error('Title is required');
      mockTodoRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.createTodo(sampleCreateInput)).rejects.toThrow(
        'Title is required',
      );
    });
  });

  describe('getTodoById', () => {
    it('should return todo when found', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440000';
      mockTodoRepository.findById.mockResolvedValue(sampleTodo);

      // Act
      const result = await todoUseCase.getTodoById(todoId);

      // Assert
      expect(result).toEqual(sampleTodo);
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
      expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null when todo not found', async () => {
      // Arrange
      const todoId = 'nonexistent-id';
      mockTodoRepository.findById.mockResolvedValue(null);

      // Act
      const result = await todoUseCase.getTodoById(todoId);

      // Assert
      expect(result).toBeNull();
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const todoId = 'test-id';
      const error = new Error('Database connection failed');
      mockTodoRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.getTodoById(todoId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    });

    it('should handle invalid UUID format gracefully', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';
      const error = new Error('Invalid UUID format');
      mockTodoRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.getTodoById(invalidId)).rejects.toThrow(
        'Invalid UUID format',
      );
    });
  });

  describe('getTodosByUserId', () => {
    it('should return user todos when found', async () => {
      // Arrange
      const userId = 'user-123';
      const userTodos: Todo[] = [
        { ...sampleTodo, id: 'todo-1', title: 'タスク1' },
        { ...sampleTodo, id: 'todo-2', title: 'タスク2' },
        { ...sampleTodo, id: 'todo-3', title: 'タスク3' },
      ];

      mockTodoRepository.findByUserId.mockResolvedValue(userTodos);

      // Act
      const result = await todoUseCase.getTodosByUserId(userId);

      // Assert
      expect(result).toEqual(userTodos);
      expect(result).toHaveLength(3);
      expect(mockTodoRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockTodoRepository.findByUserId).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no todos', async () => {
      // Arrange
      const userId = 'user-without-todos';
      mockTodoRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await todoUseCase.getTodosByUserId(userId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockTodoRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return todos in correct order (newest first)', async () => {
      // Arrange
      const userId = 'user-123';
      const olderTodo: Todo = {
        ...sampleTodo,
        id: 'todo-old',
        title: '古いタスク',
        createdAt: new Date('2023-12-01T00:00:00Z'),
      };
      const newerTodo: Todo = {
        ...sampleTodo,
        id: 'todo-new',
        title: '新しいタスク',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      // リポジトリは新しい順で返すことを前提
      mockTodoRepository.findByUserId.mockResolvedValue([newerTodo, olderTodo]);

      // Act
      const result = await todoUseCase.getTodosByUserId(userId);

      // Assert
      expect(result[0]).toEqual(newerTodo);
      expect(result[1]).toEqual(olderTodo);
      expect(result[0].createdAt.getTime()).toBeGreaterThan(
        result[1].createdAt.getTime(),
      );
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const userId = 'user-123';
      const error = new Error('Database connection failed');
      mockTodoRepository.findByUserId.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.getTodosByUserId(userId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockTodoRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle user with large number of todos', async () => {
      // Arrange
      const userId = 'power-user';
      const largeTodoList: Todo[] = Array.from({ length: 100 }, (_, index) => ({
        ...sampleTodo,
        id: `todo-${index}`,
        title: `タスク ${index + 1}`,
      }));

      mockTodoRepository.findByUserId.mockResolvedValue(largeTodoList);

      // Act
      const result = await todoUseCase.getTodosByUserId(userId);

      // Assert
      expect(result).toHaveLength(100);
      expect(result[0].id).toBe('todo-0');
      expect(result[99].id).toBe('todo-99');
    });
  });

  describe('updateTodo', () => {
    it('should update todo successfully', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440000';
      const updatedTodo: Todo = {
        ...sampleTodo,
        title: sampleUpdateInput.title as string,
        descriptions: sampleUpdateInput.descriptions,
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      };

      mockTodoRepository.update.mockResolvedValue(updatedTodo);

      // Act
      const result = await todoUseCase.updateTodo(todoId, sampleUpdateInput);

      // Assert
      expect(result).toEqual(updatedTodo);
      expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, sampleUpdateInput);
      expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should return null when todo not found', async () => {
      // Arrange
      const todoId = 'nonexistent-id';
      mockTodoRepository.update.mockResolvedValue(null);

      // Act
      const result = await todoUseCase.updateTodo(todoId, sampleUpdateInput);

      // Assert
      expect(result).toBeNull();
      expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, sampleUpdateInput);
    });

    it('should update only title', async () => {
      // Arrange
      const todoId = 'test-id';
      const titleOnlyUpdate: UpdateTodoInput = {
        title: 'タイトルのみ更新',
      };
      const updatedTodo: Todo = {
        ...sampleTodo,
        title: titleOnlyUpdate.title as string,
      };

      mockTodoRepository.update.mockResolvedValue(updatedTodo);

      // Act
      const result = await todoUseCase.updateTodo(todoId, titleOnlyUpdate);

      // Assert
      expect(result).toEqual(updatedTodo);
      expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, titleOnlyUpdate);
    });

    it('should update only description', async () => {
      // Arrange
      const todoId = 'test-id';
      const descriptionOnlyUpdate: UpdateTodoInput = {
        descriptions: '説明のみ更新',
      };
      const updatedTodo: Todo = {
        ...sampleTodo,
        descriptions: descriptionOnlyUpdate.descriptions,
      };

      mockTodoRepository.update.mockResolvedValue(updatedTodo);

      // Act
      const result = await todoUseCase.updateTodo(todoId, descriptionOnlyUpdate);

      // Assert
      expect(result).toEqual(updatedTodo);
      expect(mockTodoRepository.update).toHaveBeenCalledWith(
        todoId,
        descriptionOnlyUpdate,
      );
    });

    it('should handle empty update input', async () => {
      // Arrange
      const todoId = 'test-id';
      const emptyUpdate: UpdateTodoInput = {};

      mockTodoRepository.update.mockResolvedValue(sampleTodo);

      // Act
      const result = await todoUseCase.updateTodo(todoId, emptyUpdate);

      // Assert
      expect(result).toEqual(sampleTodo);
      expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, emptyUpdate);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const todoId = 'test-id';
      const error = new Error('Database connection failed');
      mockTodoRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.updateTodo(todoId, sampleUpdateInput)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, sampleUpdateInput);
    });

    it('should handle validation errors from repository', async () => {
      // Arrange
      const todoId = 'test-id';
      const error = new Error('Title cannot be empty');
      mockTodoRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.updateTodo(todoId, sampleUpdateInput)).rejects.toThrow(
        'Title cannot be empty',
      );
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo successfully', async () => {
      // Arrange
      const todoId = '550e8400-e29b-41d4-a716-446655440000';
      mockTodoRepository.delete.mockResolvedValue(true);

      // Act
      const result = await todoUseCase.deleteTodo(todoId);

      // Assert
      expect(result).toBe(true);
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(todoId);
      expect(mockTodoRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should return false when todo not found', async () => {
      // Arrange
      const todoId = 'nonexistent-id';
      mockTodoRepository.delete.mockResolvedValue(false);

      // Act
      const result = await todoUseCase.deleteTodo(todoId);

      // Assert
      expect(result).toBe(false);
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(todoId);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const todoId = 'test-id';
      const error = new Error('Database connection failed');
      mockTodoRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.deleteTodo(todoId)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(todoId);
    });

    it('should handle invalid UUID format gracefully', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';
      const error = new Error('Invalid UUID format');
      mockTodoRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.deleteTodo(invalidId)).rejects.toThrow(
        'Invalid UUID format',
      );
    });

    it('should handle already deleted todo', async () => {
      // Arrange
      const todoId = 'already-deleted-id';
      mockTodoRepository.delete.mockResolvedValue(false);

      // Act
      const result = await todoUseCase.deleteTodo(todoId);

      // Assert
      expect(result).toBe(false);
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(todoId);
    });
  });

  describe('getAllTodos', () => {
    it('should return all todos', async () => {
      // Arrange
      const allTodos: Todo[] = [
        { ...sampleTodo, id: 'todo-1', userId: 'user-1', title: 'ユーザー1のタスク' },
        { ...sampleTodo, id: 'todo-2', userId: 'user-2', title: 'ユーザー2のタスク' },
        { ...sampleTodo, id: 'todo-3', userId: 'user-1', title: 'ユーザー1の別タスク' },
      ];

      mockTodoRepository.findAll.mockResolvedValue(allTodos);

      // Act
      const result = await todoUseCase.getAllTodos();

      // Assert
      expect(result).toEqual(allTodos);
      expect(result).toHaveLength(3);
      expect(mockTodoRepository.findAll).toHaveBeenCalledWith();
      expect(mockTodoRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no todos exist', async () => {
      // Arrange
      mockTodoRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await todoUseCase.getAllTodos();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockTodoRepository.findAll).toHaveBeenCalledWith();
    });

    it('should handle large number of todos', async () => {
      // Arrange
      const largeTodoList: Todo[] = Array.from({ length: 1000 }, (_, index) => ({
        ...sampleTodo,
        id: `todo-${index}`,
        userId: `user-${index % 10}`, // 10人のユーザーに分散
        title: `タスク ${index + 1}`,
      }));

      mockTodoRepository.findAll.mockResolvedValue(largeTodoList);

      // Act
      const result = await todoUseCase.getAllTodos();

      // Assert
      expect(result).toHaveLength(1000);
      expect(result[0].id).toBe('todo-0');
      expect(result[999].id).toBe('todo-999');
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockTodoRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(todoUseCase.getAllTodos()).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockTodoRepository.findAll).toHaveBeenCalledWith();
    });

    it('should return todos with all required fields', async () => {
      // Arrange
      const allTodos: Todo[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: '完全なタスク',
          descriptions: '全フィールドが設定されたタスク',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          createdBy: 'user-1',
          updatedAt: new Date('2024-01-01T00:00:00Z'),
          updatedBy: 'user-1',
          deleted: false,
          userId: 'user-1',
        },
      ];

      mockTodoRepository.findAll.mockResolvedValue(allTodos);

      // Act
      const result = await todoUseCase.getAllTodos();

      // Assert
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('descriptions');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('createdBy');
      expect(result[0]).toHaveProperty('updatedAt');
      expect(result[0]).toHaveProperty('updatedBy');
      expect(result[0]).toHaveProperty('deleted');
      expect(result[0]).toHaveProperty('userId');

      expect(result[0].deleted).toBe(false); // 論理削除されていないタスクのみ
    });
  });

  // エッジケースとエラーハンドリングのテスト
  describe('Edge Cases and Error Handling', () => {
    it('should handle repository returning unexpected null values', async () => {
      // Arrange
      mockTodoRepository.findById.mockResolvedValue(null);
      mockTodoRepository.update.mockResolvedValue(null);

      // Act & Assert
      const findResult = await todoUseCase.getTodoById('test-id');
      expect(findResult).toBeNull();

      const updateResult = await todoUseCase.updateTodo('test-id', {});
      expect(updateResult).toBeNull();
    });

    it('should handle repository timing out', async () => {
      // Arrange
      const timeoutError = new Error('Operation timed out');
      mockTodoRepository.findAll.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(todoUseCase.getAllTodos()).rejects.toThrow('Operation timed out');
    });

    it('should handle repository connection issues', async () => {
      // Arrange
      const connectionError = new Error('Connection refused');
      mockTodoRepository.create.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(todoUseCase.createTodo(sampleCreateInput)).rejects.toThrow(
        'Connection refused',
      );
    });

    it('should maintain consistency across multiple operations', async () => {
      // Arrange
      const todoId = 'test-consistency-id';

      mockTodoRepository.findById.mockResolvedValue(sampleTodo);
      mockTodoRepository.update.mockResolvedValue({ ...sampleTodo, title: '更新済み' });
      mockTodoRepository.delete.mockResolvedValue(true);

      // Act
      const foundTodo = await todoUseCase.getTodoById(todoId);
      const updatedTodo = await todoUseCase.updateTodo(todoId, { title: '更新済み' });
      const deleted = await todoUseCase.deleteTodo(todoId);

      // Assert
      expect(foundTodo).toBeTruthy();
      expect(updatedTodo?.title).toBe('更新済み');
      expect(deleted).toBe(true);

      // リポジトリメソッドが正しく呼ばれていることを確認
      expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
      expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, {
        title: '更新済み',
      });
      expect(mockTodoRepository.delete).toHaveBeenCalledWith(todoId);
    });
  });
});
