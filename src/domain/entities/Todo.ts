/**
 * @fileoverview ToDoドメインエンティティ
 *
 * このファイルは、ToDoアプリケーションのタスク管理に関するドメインモデルを定義します。
 * ドメイン駆動設計（DDD）のアプローチに従い、ToDoタスクのビジネスロジックと
 * データ構造をインフラストラクチャから独立して定義しています。
 *
 * @author jugeeem
 * @since 1.0.0
 */

/**
 * ToDoタスクエンティティ
 *
 * システム内の個々のToDoタスクを表現するドメインエンティティです。
 * ユーザーが作成・管理するタスクの全ての属性と状態を保持します。
 *
 * @interface Todo
 * @example
 * ```typescript
 * const todo: Todo = {
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   title: "プロジェクトの企画書を作成",
 *   descriptions: "Q1の新プロジェクトの企画書を作成し、関係者に共有する",
 *   completed: false,
 *   createdAt: new Date("2024-01-01T09:00:00Z"),
 *   createdBy: "user-123",
 *   updatedAt: new Date("2024-01-02T14:30:00Z"),
 *   updatedBy: "user-123",
 *   deleted: false,
 *   userId: "user-123"
 * };
 * ```
 */
export interface Todo {
  /** ToDoタスクの一意識別子（UUID v4形式） */
  id: string;

  /** タスクのタイトル（必須、1-32文字） */
  title: string;

  /** タスクの詳細説明（任意、最大128文字） */
  descriptions?: string;

  /** タスクの完了状態（true: 完了、false: 未完了） */
  completed: boolean;

  /** タスク作成日時 */
  createdAt: Date;

  /** タスク作成者のユーザーID */
  createdBy: string;

  /** タスク最終更新日時 */
  updatedAt: Date;

  /** タスク最終更新者のユーザーID */
  updatedBy: string;

  /** 論理削除フラグ（true: 削除済み、false: 有効） */
  deleted: boolean;

  /** タスクを所有するユーザーのID */
  userId: string;
}

/**
 * ToDoタスク作成入力データ
 *
 * 新しいToDoタスクを作成する際に必要な入力データを定義します。
 * システムによって自動設定される項目（ID、タイムスタンプなど）は含まれません。
 *
 * @interface CreateTodoInput
 * @example
 * ```typescript
 * const createTodoData: CreateTodoInput = {
 *   title: "APIドキュメントの更新",
 *   descriptions: "新機能追加に伴うAPIドキュメントの更新作業",
 *   completed: false,
 *   userId: "user-456"
 * };
 * ```
 */
export interface CreateTodoInput {
  /** タスクのタイトル（必須、1-32文字） */
  title: string;

  /** タスクの詳細説明（任意、最大128文字） */
  descriptions?: string;

  /** タスクの完了状態（任意、デフォルト: false） */
  completed?: boolean;

  /** タスクを所有するユーザーのID（必須） */
  userId: string;
}

/**
 * ToDoタスク更新入力データ
 *
 * 既存のToDoタスクを更新する際に使用するデータ構造です。
 * 全てのフィールドが任意であり、部分的な更新が可能です。
 * ユーザーIDは更新対象外です（タスクの所有権は変更不可）。
 *
 * @interface UpdateTodoInput
 * @example
 * ```typescript
 * const updateData: UpdateTodoInput = {
 *   title: "APIドキュメントの更新（完了）",
 *   descriptions: "新機能追加に伴うAPIドキュメントの更新作業 - レビュー完了",
 *   completed: true
 * };
 * ```
 */
export interface UpdateTodoInput {
  /** タスクのタイトル（任意、1-32文字） */
  title?: string;

  /** タスクの詳細説明（任意、最大128文字） */
  descriptions?: string;

  /** タスクの完了状態（任意） */
  completed?: boolean;
}
