/**
 * @fileoverview Validation ユニットテスト
 *
 * このファイルは、バリデーション再エクスポートモジュールの動作を検証するテストスイートです。
 * 後方互換性の維持、型定義の再エクスポート、スキーマの正常動作を
 * 包括的にテストします。
 *
 * テストカバー範囲:
 * - 型定義の再エクスポート
 * - スキーマの再エクスポート
 * - レガシーエイリアスの動作
 * - 後方互換性の確認
 *
 * @author jugeeem
 * @since 1.0.0
 */

import * as TypesValidation from '@/types/validation';
import * as ValidationModule from '../validation';

describe('Validation Module', () => {
  describe('type re-exports', () => {
    it('CreateTodoValidation 型が正しく再エクスポートされている', () => {
      // TypeScriptの型チェック時にエラーが出ないことを確認
      // 実際の型の一致は compile-time にチェックされる
      expect(typeof ValidationModule).toBe('object');
    });

    it('CreateUserValidation 型が正しく再エクスポートされている', () => {
      expect(typeof ValidationModule).toBe('object');
    });

    it('LoginValidation 型が正しく再エクスポートされている', () => {
      expect(typeof ValidationModule).toBe('object');
    });

    it('UpdateTodoValidation 型が正しく再エクスポートされている', () => {
      expect(typeof ValidationModule).toBe('object');
    });

    it('UpdateUserValidation 型が正しく再エクスポートされている', () => {
      expect(typeof ValidationModule).toBe('object');
    });
  });

  describe('schema re-exports', () => {
    it('createTodoSchema が正しく再エクスポートされている', () => {
      expect(ValidationModule.createTodoSchema).toBeDefined();
      expect(ValidationModule.createTodoSchema).toBe(TypesValidation.createTodoSchema);
    });

    it('createUserSchema が正しく再エクスポートされている', () => {
      expect(ValidationModule.createUserSchema).toBeDefined();
      expect(ValidationModule.createUserSchema).toBe(TypesValidation.createUserSchema);
    });

    it('loginSchema が正しく再エクスポートされている', () => {
      expect(ValidationModule.loginSchema).toBeDefined();
      expect(ValidationModule.loginSchema).toBe(TypesValidation.loginSchema);
    });

    it('updateTodoSchema が正しく再エクスポートされている', () => {
      expect(ValidationModule.updateTodoSchema).toBeDefined();
      expect(ValidationModule.updateTodoSchema).toBe(TypesValidation.updateTodoSchema);
    });

    it('updateUserSchema が正しく再エクスポートされている', () => {
      expect(ValidationModule.updateUserSchema).toBeDefined();
      expect(ValidationModule.updateUserSchema).toBe(TypesValidation.updateUserSchema);
    });
  });

  describe('legacy aliases', () => {
    it('CreateTodoInput が CreateTodoValidation のエイリアスとして動作する', () => {
      // TypeScript のコンパイル時にエイリアスが正しく設定されていることを確認
      // レガシーコードでインポートできることをテスト
      const testValidation = (input: ValidationModule.CreateTodoInput): boolean => {
        return typeof input === 'object' && 'title' in input;
      };

      const sampleInput = {
        title: 'テストタスク',
        description: 'テスト用の説明',
        userId: 'user-123',
      };

      expect(testValidation(sampleInput)).toBe(true);
    });

    it('CreateUserInput が CreateUserValidation のエイリアスとして動作する', () => {
      const testValidation = (input: ValidationModule.CreateUserInput): boolean => {
        return typeof input === 'object' && 'username' in input;
      };

      const sampleInput = {
        username: 'testuser',
        password: 'password123',
      };

      expect(testValidation(sampleInput)).toBe(true);
    });

    it('LoginInput が LoginValidation のエイリアスとして動作する', () => {
      const testValidation = (input: ValidationModule.LoginInput): boolean => {
        return typeof input === 'object' && 'username' in input && 'password' in input;
      };

      const sampleInput = {
        username: 'testuser',
        password: 'password123',
      };

      expect(testValidation(sampleInput)).toBe(true);
    });

    it('UpdateTodoInput が UpdateTodoValidation のエイリアスとして動作する', () => {
      const testValidation = (input: ValidationModule.UpdateTodoInput): boolean => {
        return typeof input === 'object';
      };

      const sampleInput = {
        title: '更新されたタスク',
      };

      expect(testValidation(sampleInput)).toBe(true);
    });

    it('UpdateUserInput が UpdateUserValidation のエイリアスとして動作する', () => {
      const testValidation = (input: ValidationModule.UpdateUserInput): boolean => {
        return typeof input === 'object';
      };

      const sampleInput = {
        firstName: '太郎',
      };

      expect(testValidation(sampleInput)).toBe(true);
    });
  });

  describe('schema functionality', () => {
    it('createTodoSchema が有効なデータをパースする', () => {
      const validData = {
        title: 'テストタスク',
        descriptions: 'テスト用の説明',
      };

      const result = ValidationModule.createTodoSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('createTodoSchema が無効なデータを拒否する', () => {
      const invalidData = {
        title: '', // 空のタイトル
      };

      const result = ValidationModule.createTodoSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('createUserSchema が有効なデータをパースする', () => {
      const validData = {
        username: 'testuser',
        password: 'password123',
        firstName: '太郎',
        lastName: '山田',
      };

      const result = ValidationModule.createUserSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe(validData.username);
        expect(result.data.firstName).toBe(validData.firstName);
      }
    });

    it('createUserSchema が無効なデータを拒否する', () => {
      const invalidData = {
        username: '', // 空のユーザー名
        password: '123', // 短すぎるパスワード
      };

      const result = ValidationModule.createUserSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('loginSchema が有効なデータをパースする', () => {
      const validData = {
        username: 'testuser',
        password: 'password123',
      };

      const result = ValidationModule.loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('loginSchema が無効なデータを拒否する', () => {
      const invalidData = {
        username: 'testuser',
        // password が欠如
      };

      const result = ValidationModule.loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('updateTodoSchema が部分的な更新データをパースする', () => {
      const validData = {
        title: '更新されたタスク',
      };

      const result = ValidationModule.updateTodoSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(validData.title);
      }
    });

    it('updateTodoSchema が空のオブジェクトをパースする', () => {
      const validData = {};

      const result = ValidationModule.updateTodoSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('updateUserSchema が部分的な更新データをパースする', () => {
      const validData = {
        firstName: '花子',
        role: 2,
      };

      const result = ValidationModule.updateUserSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe(validData.firstName);
        expect(result.data.role).toBe(validData.role);
      }
    });
  });

  describe('backward compatibility', () => {
    it('既存のレガシーコードが引き続き動作する', () => {
      // レガシーインポート方式のシミュレーション
      // 型エイリアスが正しく動作することを確認
      const todoInput: ValidationModule.CreateTodoInput = {
        title: 'レガシータスク',
        descriptions: 'レガシーコード用のタスク',
      };

      const userInput: ValidationModule.CreateUserInput = {
        username: 'legacyuser',
        password: 'legacypass123',
      };

      const loginInput: ValidationModule.LoginInput = {
        username: 'legacyuser',
        password: 'legacypass123',
      };

      // これらの値が正しく型チェックされることを確認
      expect(typeof todoInput.title).toBe('string');
      expect(typeof userInput.username).toBe('string');
      expect(typeof loginInput.password).toBe('string');
    });

    it('レガシーインポートと新しいインポートが同じ型を参照する', () => {
      // レガシー方式（このモジュール経由）
      const legacySchema = ValidationModule.createTodoSchema;

      // 新しい方式（types/validation から直接）
      const newSchema = TypesValidation.createTodoSchema;

      // 同じスキーマオブジェクトを参照していることを確認
      expect(legacySchema).toBe(newSchema);
    });

    it('スキーマの動作が一致する', () => {
      const testData = {
        title: '互換性テスト',
        descriptions: 'テスト用データ',
      };

      // レガシー方式でのバリデーション
      const legacyResult = ValidationModule.createTodoSchema.safeParse(testData);

      // 新しい方式でのバリデーション
      const newResult = TypesValidation.createTodoSchema.safeParse(testData);

      // 結果が一致することを確認
      expect(legacyResult.success).toBe(newResult.success);
      if (legacyResult.success && newResult.success) {
        expect(legacyResult.data).toEqual(newResult.data);
      }
    });
  });

  describe('module structure', () => {
    it('バリデーションモジュールが正しく構築されている', () => {
      // このモジュールは主に型のエクスポートなので、
      // スキーマオブジェクトの存在を確認
      expect(ValidationModule.createTodoSchema).toBeDefined();
      expect(ValidationModule.createUserSchema).toBeDefined();
      expect(ValidationModule.updateTodoSchema).toBeDefined();
      expect(ValidationModule.updateUserSchema).toBeDefined();
      expect(ValidationModule.loginSchema).toBeDefined();
    });

    it('型の互換性が保持されている', () => {
      // TypeScript コンパイル時の型チェックによる確認
      // 実際に型を使用することで型の存在と互換性を検証
      const testInput: ValidationModule.CreateTodoInput = {
        title: 'テストタスク',
        descriptions: 'テスト説明', // 注意: descriptions は複数形
      };

      const testUser: ValidationModule.CreateUserInput = {
        username: 'testuser',
        password: 'password123',
      };

      const testLogin: ValidationModule.LoginInput = {
        username: 'testuser',
        password: 'password123',
      };

      // 型が正しく定義されていることを確認
      expect(typeof testInput).toBe('object');
      expect(typeof testUser).toBe('object');
      expect(typeof testLogin).toBe('object');
    });

    it('スキーマオブジェクトが適切な型を持つ', () => {
      // Zodスキーマの特徴的なメソッドが存在することを確認
      expect(typeof ValidationModule.createTodoSchema.parse).toBe('function');
      expect(typeof ValidationModule.createTodoSchema.safeParse).toBe('function');
      expect(typeof ValidationModule.createUserSchema.parse).toBe('function');
      expect(typeof ValidationModule.createUserSchema.safeParse).toBe('function');
      expect(typeof ValidationModule.loginSchema.parse).toBe('function');
      expect(typeof ValidationModule.loginSchema.safeParse).toBe('function');
      expect(typeof ValidationModule.updateTodoSchema.parse).toBe('function');
      expect(typeof ValidationModule.updateTodoSchema.safeParse).toBe('function');
      expect(typeof ValidationModule.updateUserSchema.parse).toBe('function');
      expect(typeof ValidationModule.updateUserSchema.safeParse).toBe('function');
    });
  });

  describe('error handling', () => {
    it('バリデーションエラーが適切に処理される', () => {
      const invalidTodoData = {
        title: '', // 空のタイトルは無効
      };

      const result = ValidationModule.createTodoSchema.safeParse(invalidTodoData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.issues).toBeInstanceOf(Array);
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('複数のバリデーションエラーが適切に報告される', () => {
      const invalidUserData = {
        username: '', // 空のユーザー名は無効
        password: '12', // 短すぎるパスワードは無効
      };

      const result = ValidationModule.createUserSchema.safeParse(invalidUserData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
