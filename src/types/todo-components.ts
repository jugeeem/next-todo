import { Todo } from '@/domain/entities/Todo';
import { BaseComponentProps, ErrorState, SubmitHandler } from '@/types/components';

// Todoアイテムを表示するコンポーネントの型
export interface TodoItemProps extends BaseComponentProps {
  todo: Todo;
  onEdit?: (todo: Todo) => void;      // 編集ボタンが押された時
  onDelete?: (id: string) => void;    // 削除ボタンが押された時
  onToggle?: (id: string) => void;    // 完了/未完了を切り替える時
}

// Todoフォームで使うデータの型
export interface TodoFormData {
  title: string;
  description?: string;
}

// Todoフォームコンポーネントの型
export interface TodoFormProps extends BaseComponentProps, ErrorState {
  initialData?: Partial<TodoFormData>; // 初期値（編集時に使用）
  onSubmit: SubmitHandler<TodoFormData>; // フォーム送信時
  submitButtonText?: string; // ボタンのテキスト
}