/**
 * @fileoverview Container ユニットテスト
 *
 * このファイルは、依存性注入コンテナの動作を検証するテストスイートです。
 * Singleton パターンの実装、依存関係の解決、インスタンス管理を
 * 包括的にテストします。
 *
 * テストカバー範囲:
 * - Singleton パターンの動作
 * - 依存関係の正しい注入
 * - インスタンスの初期化
 * - 複数回取得時の同一性保証
 *
 * @author jugeeem
 * @since 1.0.0
 */

// Node.js環境でのWeb API polyfill
import { TextDecoder, TextEncoder } from 'node:util';

// グローバルでTextEncoder/TextDecoderを定義
Object.assign(global, { TextDecoder, TextEncoder });

// PostgreSQLの依存関係を完全にモック化
jest.mock('@/infrastructure/database/connection', () => ({
  DatabaseConnection: {
    getInstance: jest.fn(),
    getPool: jest.fn(),
  },
}));

jest.mock('@/infrastructure/repositories/PostgresTodoRepository');
jest.mock('@/infrastructure/repositories/PostgresUserRepository');
jest.mock('@/lib/jwt');
jest.mock('@/usecases/AuthUseCase');
jest.mock('@/usecases/TodoUseCase');
jest.mock('@/usecases/UserUseCase');

import { PostgresTodoRepository } from '@/infrastructure/repositories/PostgresTodoRepository';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { JWTService } from '@/lib/jwt';
import { AuthUseCase } from '@/usecases/AuthUseCase';
import { TodoUseCase } from '@/usecases/TodoUseCase';
import { UserUseCase } from '@/usecases/UserUseCase';
import { Container } from '../container';

// Containerクラスの内部プロパティアクセス用の型定義
interface ContainerStatic {
  instance: Container | null;
  getInstance(): Container;
}

// 依存関係をモック化
jest.mock('@/infrastructure/repositories/PostgresTodoRepository');
jest.mock('@/infrastructure/repositories/PostgresUserRepository');
jest.mock('@/lib/jwt');
jest.mock('@/usecases/AuthUseCase');
jest.mock('@/usecases/TodoUseCase');
jest.mock('@/usecases/UserUseCase');

describe('Container', () => {
  beforeEach(() => {
    // Container のSingletonインスタンスをリセット
    // プライベートプロパティなので、テスト用にリフレクションを使用
    (Container as unknown as ContainerStatic).instance = null;

    // モックをクリア
    jest.clearAllMocks();
  });

  describe('Singleton pattern', () => {
    it('getInstance() で同じインスタンスが返される', () => {
      const container1 = Container.getInstance();
      const container2 = Container.getInstance();

      expect(container1).toBe(container2);
      expect(container1).toBeInstanceOf(Container);
    });

    it('複数回呼び出しても新しいインスタンスは作成されない', () => {
      const container1 = Container.getInstance();
      const container2 = Container.getInstance();
      const container3 = Container.getInstance();

      expect(container1).toBe(container2);
      expect(container2).toBe(container3);
      expect(container1).toBe(container3);
    });

    it('初回呼び出し時にのみインスタンスが作成される', () => {
      // 最初のインスタンス取得でコンストラクタが呼ばれる
      const container1 = Container.getInstance();
      expect(container1).toBeDefined();

      // 2回目以降は同じインスタンスが返される
      const container2 = Container.getInstance();
      expect(container2).toBe(container1);
    });
  });

  describe('dependency initialization', () => {
    let container: Container;

    beforeEach(() => {
      container = Container.getInstance();
    });

    it('PostgresUserRepository が正しく初期化される', () => {
      expect(PostgresUserRepository).toHaveBeenCalledTimes(1);
      expect(container.userRepository).toBeInstanceOf(PostgresUserRepository);
    });

    it('PostgresTodoRepository が正しく初期化される', () => {
      expect(PostgresTodoRepository).toHaveBeenCalledTimes(1);
      expect(container.todoRepository).toBeInstanceOf(PostgresTodoRepository);
    });

    it('JWTService が正しく初期化される', () => {
      expect(JWTService).toHaveBeenCalledTimes(1);
      expect(container.jwtService).toBeInstanceOf(JWTService);
    });

    it('AuthUseCase が正しい依存関係で初期化される', () => {
      expect(AuthUseCase).toHaveBeenCalledTimes(1);
      expect(AuthUseCase).toHaveBeenCalledWith(
        container.userRepository,
        container.jwtService,
      );
      expect(container.authUseCase).toBeInstanceOf(AuthUseCase);
    });

    it('TodoUseCase が正しい依存関係で初期化される', () => {
      expect(TodoUseCase).toHaveBeenCalledTimes(1);
      expect(TodoUseCase).toHaveBeenCalledWith(container.todoRepository);
      expect(container.todoUseCase).toBeInstanceOf(TodoUseCase);
    });

    it('UserUseCase が正しい依存関係で初期化される', () => {
      expect(UserUseCase).toHaveBeenCalledTimes(1);
      expect(UserUseCase).toHaveBeenCalledWith(container.userRepository);
      expect(container.userUseCase).toBeInstanceOf(UserUseCase);
    });
  });

  describe('dependency injection order', () => {
    it('依存関係が正しい順序で初期化される', () => {
      // モックの呼び出し順序を記録
      const callOrder: string[] = [];

      (
        PostgresUserRepository as jest.MockedClass<typeof PostgresUserRepository>
      ).mockImplementation(() => {
        callOrder.push('PostgresUserRepository');
        return {} as PostgresUserRepository;
      });

      (
        PostgresTodoRepository as jest.MockedClass<typeof PostgresTodoRepository>
      ).mockImplementation(() => {
        callOrder.push('PostgresTodoRepository');
        return {} as PostgresTodoRepository;
      });

      (JWTService as jest.MockedClass<typeof JWTService>).mockImplementation(() => {
        callOrder.push('JWTService');
        return {} as JWTService;
      });

      (AuthUseCase as jest.MockedClass<typeof AuthUseCase>).mockImplementation(() => {
        callOrder.push('AuthUseCase');
        return {} as AuthUseCase;
      });

      (TodoUseCase as jest.MockedClass<typeof TodoUseCase>).mockImplementation(() => {
        callOrder.push('TodoUseCase');
        return {} as TodoUseCase;
      });

      (UserUseCase as jest.MockedClass<typeof UserUseCase>).mockImplementation(() => {
        callOrder.push('UserUseCase');
        return {} as UserUseCase;
      });

      // コンテナの初期化
      Container.getInstance();

      // 期待される順序を検証
      expect(callOrder).toEqual([
        'PostgresUserRepository',
        'PostgresTodoRepository',
        'JWTService',
        'AuthUseCase',
        'TodoUseCase',
        'UserUseCase',
      ]);
    });
  });

  describe('property accessibility', () => {
    let container: Container;

    beforeEach(() => {
      container = Container.getInstance();
    });

    it('全てのプロパティが readonly として公開される', () => {
      // プロパティの存在を確認
      expect(container).toHaveProperty('userRepository');
      expect(container).toHaveProperty('todoRepository');
      expect(container).toHaveProperty('jwtService');
      expect(container).toHaveProperty('authUseCase');
      expect(container).toHaveProperty('todoUseCase');
      expect(container).toHaveProperty('userUseCase');

      // readonly プロパティの型チェック（コンパイル時）
      // TypeScript では readonly プロパティへの代入はコンパイルエラーになる
    });

    it('リポジトリインスタンスが正しく定義されている', () => {
      expect(container.userRepository).toBeDefined();
      expect(container.todoRepository).toBeDefined();
    });

    it('サービスインスタンスが正しく定義されている', () => {
      expect(container.jwtService).toBeDefined();
    });

    it('ユースケースインスタンスが正しく定義されている', () => {
      expect(container.authUseCase).toBeDefined();
      expect(container.todoUseCase).toBeDefined();
      expect(container.userUseCase).toBeDefined();
    });
  });

  describe('memory management', () => {
    it('複数回取得してもメモリリークしない', () => {
      const instances = [];

      // 100回インスタンスを取得
      for (let i = 0; i < 100; i++) {
        instances.push(Container.getInstance());
      }

      // 全て同じインスタンスであることを確認
      const firstInstance = instances[0];
      for (const instance of instances) {
        expect(instance).toBe(firstInstance);
      }

      // 依存関係は一度だけ初期化されることを確認
      expect(PostgresUserRepository).toHaveBeenCalledTimes(1);
      expect(PostgresTodoRepository).toHaveBeenCalledTimes(1);
      expect(JWTService).toHaveBeenCalledTimes(1);
      expect(AuthUseCase).toHaveBeenCalledTimes(1);
      expect(TodoUseCase).toHaveBeenCalledTimes(1);
      expect(UserUseCase).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrent access', () => {
    it('並行アクセス時も同じインスタンスが返される', async () => {
      // 並行してインスタンスを取得
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(Container.getInstance()),
      );

      const instances = await Promise.all(promises);

      // 全て同じインスタンスであることを確認
      const firstInstance = instances[0];
      for (const instance of instances) {
        expect(instance).toBe(firstInstance);
      }
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      // 全てのモックを完全にリセット
      jest.resetAllMocks();
      jest.clearAllMocks();

      // Singleton をリセット
      (Container as unknown as ContainerStatic).instance = null;
    });
    it('依存関係の初期化エラー時も適切に処理される', () => {
      // PostgresUserRepository の初期化でエラーを発生
      (
        PostgresUserRepository as jest.MockedClass<typeof PostgresUserRepository>
      ).mockImplementation(() => {
        throw new Error('Repository initialization failed');
      });

      // エラーが適切に伝播されることを確認
      expect(() => Container.getInstance()).toThrow('Repository initialization failed');
    });

    it('JWTService の初期化エラー時も適切に処理される', () => {
      // JWTService のモックでエラーを発生させる
      (JWTService as jest.MockedClass<typeof JWTService>).mockImplementation(() => {
        throw new Error('JWT Service initialization failed');
      });

      expect(() => Container.getInstance()).toThrow(
        'JWT Service initialization failed',
      );
    });

    it('UseCase の初期化エラー時も適切に処理される', () => {
      // AuthUseCase のモックでエラーを発生させる
      (AuthUseCase as jest.MockedClass<typeof AuthUseCase>).mockImplementation(() => {
        throw new Error('AuthUseCase initialization failed');
      });

      expect(() => Container.getInstance()).toThrow(
        'AuthUseCase initialization failed',
      );
    });
  });

  describe('dependency relationships', () => {
    let container: Container;

    beforeEach(() => {
      // 全てのモックを完全にリセット
      jest.resetAllMocks();
      jest.clearAllMocks();

      // Singleton をリセット
      (Container as unknown as ContainerStatic).instance = null;

      container = Container.getInstance();
    });

    it('AuthUseCase が UserRepository と JWTService に依存している', () => {
      expect(AuthUseCase).toHaveBeenCalledWith(
        container.userRepository,
        container.jwtService,
      );
    });

    it('TodoUseCase が TodoRepository にのみ依存している', () => {
      expect(TodoUseCase).toHaveBeenCalledWith(container.todoRepository);
    });

    it('UserUseCase が UserRepository にのみ依存している', () => {
      expect(UserUseCase).toHaveBeenCalledWith(container.userRepository);
    });

    it('同じリポジトリインスタンスが複数のユースケースで共有される', () => {
      // AuthUseCase と UserUseCase が同じ UserRepository インスタンスを使用
      const authUseCaseCall = (AuthUseCase as jest.Mock).mock.calls[0];
      const userUseCaseCall = (UserUseCase as jest.Mock).mock.calls[0];

      expect(authUseCaseCall[0]).toBe(userUseCaseCall[0]); // userRepository
    });
  });
});
