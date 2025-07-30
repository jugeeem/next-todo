/**
 * @fileoverview PostgresTodoRepository ユニットテスト
 *
 * PostgresTodoRepositoryクラスの全メソッドに対する包括的なユニットテストです。
 * データベース接続をモック化し、各種データ操作の正常性とエラーハンドリングを検証します。
 *
 * テスト対象:
 * - findById: IDによる単一タスク検索
 * - findByUserId: ユーザー別タスク一覧取得
 * - create: 新規タスク作成
 * - update: 既存タスク更新
 * - delete: タスク論理削除
 * - findAll: 全タスク一覧取得
 * - mapRowToTodo: データベース行のエンティティマッピング
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/domain/entities/Todo';
import { database } from '@/infrastructure/database/connection';
import { PostgresTodoRepository } from '../PostgresTodoRepository';

// データベース接続モジュールをモック化
jest.mock('@/infrastructure/database/connection', () => ({
  database: {
    query: jest.fn(),
  },
}));

// UUIDモジュールをモック化（予測可能なIDを生成）
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

const mockDatabase = database as jest.Mocked<typeof database>;
const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('PostgresTodoRepository', () => {
  let repository: PostgresTodoRepository;

  beforeEach(() => {
    repository = new PostgresTodoRepository();
    jest.clearAllMocks();
  });

  /**
   * テスト用のサンプルToDoデータ
   */
  const sampleTodo: Todo = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'テストタスク',
    descriptions: 'テスト用のタスクです',
    completed: false,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    createdBy: 'system',
    updatedAt: new Date('2024-01-01T11:00:00Z'),
    updatedBy: 'system',
    deleted: false,
    userId: 'user-123',
  };

  /**
   * データベース行データのサンプル（snake_case）
   */
  const sampleDbRow = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'テストタスク',
    descriptions: 'テスト用のタスクです',
    completed: false,
    created_at: '2024-01-01T10:00:00Z',
    created_by: 'system',
    updated_at: '2024-01-01T11:00:00Z',
    updated_by: 'system',
    deleted: false,
    user_id: 'user-123',
  };

  describe('findById', () => {
    it('存在するIDで正常にToDoタスクを取得できる', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      mockDatabase.query.mockResolvedValue({
        rows: [sampleDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.findById(todoId);

      // Assert
      expect(result).toEqual(sampleTodo);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, title, descriptions, completed'),
        [todoId],
      );
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND deleted = FALSE'),
        [todoId],
      );
    });

    it('存在しないIDでnullを返す', async () => {
      // Arrange
      const todoId = 'non-existent-id';
      mockDatabase.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.findById(todoId);

      // Assert
      expect(result).toBeNull();
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND deleted = FALSE'),
        [todoId],
      );
    });

    it('データベースエラーが発生した場合は例外を投げる', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const dbError = new Error('Database connection failed');
      mockDatabase.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findById(todoId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('findByUserId', () => {
    it('ユーザーのToDoタスク一覧を正常に取得できる', async () => {
      // Arrange
      const userId = 'user-123';
      const multipleDbRows = [
        sampleDbRow,
        {
          ...sampleDbRow,
          id: '456e7890-e89b-12d3-a456-426614174001',
          title: '別のテストタスク',
          created_at: '2024-01-02T10:00:00Z',
        },
      ];
      mockDatabase.query.mockResolvedValue({
        rows: multipleDbRows,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('テストタスク');
      expect(result[1].title).toBe('別のテストタスク');
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND deleted = FALSE'),
        [userId],
      );
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        [userId],
      );
    });

    it('ユーザーにタスクが存在しない場合は空配列を返す', async () => {
      // Arrange
      const userId = 'user-with-no-tasks';
      mockDatabase.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('新規ToDoタスクを正常に作成できる', async () => {
      // Arrange
      const createInput: CreateTodoInput = {
        title: '新しいタスク',
        descriptions: '新しいタスクの説明',
        completed: false,
        userId: 'user-123',
      };
      const mockId = 'new-todo-id';
      const mockDate = new Date('2024-01-01T12:00:00Z');

      mockUuidv4.mockReturnValue(mockId);
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;

      const createdDbRow = {
        id: mockId,
        title: createInput.title,
        descriptions: createInput.descriptions,
        completed: createInput.completed,
        created_at: mockDate.toISOString(),
        created_by: 'system',
        updated_at: mockDate.toISOString(),
        updated_by: 'system',
        deleted: false,
        user_id: createInput.userId,
      };

      mockDatabase.query.mockResolvedValue({
        rows: [createdDbRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.create(createInput);

      // Assert
      expect(result.id).toBe(mockId);
      expect(result.title).toBe(createInput.title);
      expect(result.descriptions).toBe(createInput.descriptions);
      expect(result.completed).toBe(createInput.completed);
      expect(result.userId).toBe(createInput.userId);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO todos'),
        [
          mockId,
          createInput.title,
          createInput.descriptions,
          createInput.completed,
          createInput.userId,
          mockDate,
          mockDate,
        ],
      );

      // モックをリストア
      global.Date = originalDate;
    });

    it('descriptionなしでToDoタスクを作成できる', async () => {
      // Arrange
      const createInput: CreateTodoInput = {
        title: '説明なしタスク',
        userId: 'user-123',
      };
      const mockId = 'new-todo-id';
      const mockDate = new Date('2024-01-01T12:00:00Z');

      mockUuidv4.mockReturnValue(mockId);
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;

      const createdDbRow = {
        id: mockId,
        title: createInput.title,
        descriptions: null,
        completed: false,
        created_at: mockDate.toISOString(),
        created_by: 'system',
        updated_at: mockDate.toISOString(),
        updated_by: 'system',
        deleted: false,
        user_id: createInput.userId,
      };

      mockDatabase.query.mockResolvedValue({
        rows: [createdDbRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.create(createInput);

      // Assert
      expect(result.descriptions).toBeNull();
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO todos'),
        [
          mockId,
          createInput.title,
          null,
          false,
          createInput.userId,
          mockDate,
          mockDate,
        ],
      );

      // モックをリストア
      global.Date = originalDate;
    });
  });

  describe('update', () => {
    beforeEach(() => {
      // テスト間で独立したDateモックを使用
      jest.clearAllMocks();
    });

    it('ToDoタスクのタイトルを正常に更新できる', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const updateInput: UpdateTodoInput = {
        title: '更新されたタスク',
      };
      const mockDate = new Date('2024-01-01T13:00:00Z');

      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;

      const updatedDbRow = {
        ...sampleDbRow,
        title: updateInput.title,
        updated_at: mockDate.toISOString(),
      };

      mockDatabase.query.mockResolvedValue({
        rows: [updatedDbRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.update(todoId, updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.title).toBe(updateInput.title);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE todos'),
        [updateInput.title, mockDate, todoId],
      );

      // モックをリストア
      global.Date = originalDate;
    });

    it('ToDoタスクの説明を正常に更新できる', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const updateInput: UpdateTodoInput = {
        descriptions: '更新された説明',
      };
      const mockDate = new Date('2024-01-01T13:00:00Z');

      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;

      const updatedDbRow = {
        ...sampleDbRow,
        descriptions: updateInput.descriptions,
        updated_at: mockDate.toISOString(),
      };

      mockDatabase.query.mockResolvedValue({
        rows: [updatedDbRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.update(todoId, updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.descriptions).toBe(updateInput.descriptions);

      // モックをリストア
      global.Date = originalDate;
    });

    it('タイトルと説明を同時に更新できる', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const updateInput: UpdateTodoInput = {
        title: '更新されたタスク',
        descriptions: '更新された説明',
      };
      const mockDate = new Date('2024-01-01T13:00:00Z');

      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;

      const updatedDbRow = {
        ...sampleDbRow,
        title: updateInput.title,
        descriptions: updateInput.descriptions,
        updated_at: mockDate.toISOString(),
      };

      mockDatabase.query.mockResolvedValue({
        rows: [updatedDbRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.update(todoId, updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.title).toBe(updateInput.title);
      expect(result?.descriptions).toBe(updateInput.descriptions);

      // モックをリストア
      global.Date = originalDate;
    });

    it('更新項目が空の場合はfindByIdと同じ動作をする', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const updateInput: UpdateTodoInput = {};

      // findByIdのモック設定
      mockDatabase.query.mockResolvedValue({
        rows: [sampleDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.update(todoId, updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sampleTodo.id);
      expect(result?.title).toBe(sampleTodo.title);
      expect(result?.descriptions).toBe(sampleTodo.descriptions);
      expect(result?.userId).toBe(sampleTodo.userId);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND deleted = FALSE'),
        [todoId],
      );
    });

    it('存在しないIDで更新した場合はnullを返す', async () => {
      // Arrange
      const todoId = 'non-existent-id';
      const updateInput: UpdateTodoInput = {
        title: '更新されたタスク',
      };

      mockDatabase.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.update(todoId, updateInput);

      // Assert
      expect(result).toBeNull();
    });

    it('ToDoタスクの完了状態を正常に更新できる', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const updateInput: UpdateTodoInput = {
        completed: true,
      };
      const mockDate = new Date('2024-01-01T13:00:00Z');

      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;

      const updatedDbRow = {
        ...sampleDbRow,
        completed: updateInput.completed,
        updated_at: mockDate.toISOString(),
      };

      mockDatabase.query.mockResolvedValue({
        rows: [updatedDbRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.update(todoId, updateInput);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.completed).toBe(updateInput.completed);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE todos'),
        [updateInput.completed, mockDate, todoId],
      );

      // モックをリストア
      global.Date = originalDate;
    });
  });

  describe('delete', () => {
    it('ToDoタスクを正常に論理削除できる', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const mockDate = new Date('2024-01-01T14:00:00Z');

      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;

      mockDatabase.query.mockResolvedValue({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.delete(todoId);

      // Assert
      expect(result).toBe(true);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SET deleted = TRUE, updated_at = $1'),
        [mockDate, todoId],
      );

      // モックをリストア
      global.Date = originalDate;
    });

    it('存在しないIDで削除した場合はfalseを返す', async () => {
      // Arrange
      const todoId = 'non-existent-id';

      mockDatabase.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.delete(todoId);

      // Assert
      expect(result).toBe(false);
    });

    it('rowCountがnullの場合はfalseを返す', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';

      mockDatabase.query.mockResolvedValue({
        rows: [],
        rowCount: null,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.delete(todoId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('全てのToDoタスクを正常に取得できる', async () => {
      // Arrange
      const multipleDbRows = [
        sampleDbRow,
        {
          ...sampleDbRow,
          id: '456e7890-e89b-12d3-a456-426614174001',
          title: '2番目のタスク',
          user_id: 'user-456',
        },
        {
          ...sampleDbRow,
          id: '789e0123-e89b-12d3-a456-426614174002',
          title: '3番目のタスク',
          user_id: 'user-789',
        },
      ];

      mockDatabase.query.mockResolvedValue({
        rows: multipleDbRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('テストタスク');
      expect(result[1].title).toBe('2番目のタスク');
      expect(result[2].title).toBe('3番目のタスク');
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE deleted = FALSE'),
      );
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
      );
    });

    it('ToDoタスクが存在しない場合は空配列を返す', async () => {
      // Arrange
      mockDatabase.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('mapRowToTodo (プライベートメソッドのテスト)', () => {
    it('データベース行を正常にToDoエンティティにマッピングできる', async () => {
      // このテストは他のメソッドを通じて間接的にテストされているが、
      // 個別のケースもテストする

      // Arrange & Act
      // findByIdを使用してmapRowToTodoの動作を確認
      mockDatabase.query.mockResolvedValue({
        rows: [sampleDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await repository.findById('test-id');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(sampleTodo.id);
      expect(result?.title).toBe(sampleTodo.title);
      expect(result?.descriptions).toBe(sampleTodo.descriptions);
      expect(result?.userId).toBe(sampleTodo.userId);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('descriptionsがnullの場合はnullのままマッピングされる', async () => {
      // Arrange
      const dbRowWithoutDescription = {
        ...sampleDbRow,
        descriptions: null,
      };

      mockDatabase.query.mockResolvedValue({
        rows: [dbRowWithoutDescription],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Act
      const result = await repository.findById('test-id');

      // Assert
      expect(result?.descriptions).toBeNull();
    });
  });
});
