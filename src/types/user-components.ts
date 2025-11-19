import { User } from '@/domain/entities/User';
import { BaseComponentProps, ErrorState, SubmitHandler } from './components';

// ユーザー表示コンポーネントの型
export interface UserAvatarProps extends BaseComponentProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

// ユーザープロフィール表示コンポーネントの型
export interface UserProfileProps extends BaseComponentProps {
  user: User;
  showEmail?: boolean;
  showCreatedAt?: boolean;
  editable?: boolean;
  onEdit?: (user: User) => void;
}

// ユーザーフォームで使うデータの型
export interface UserFormData {
  name: string;
  email: string;
  password?: string; // 新規作成時のみ必要
}

// ユーザーフォームコンポーネントの型
export interface UserFormProps extends BaseComponentProps, ErrorState {
  initialData?: Partial<UserFormData>; // 初期値（編集時に使用）
  onSubmit: SubmitHandler<UserFormData>; // フォーム送信時
  submitButtonText?: string; // ボタンのテキスト
  isEditMode?: boolean; // 編集モードかどうか
}

// ユーザーカードコンポーネントの型
export interface UserCardProps extends BaseComponentProps {
  user: User;
  compact?: boolean; // コンパクト表示かどうか
  onClick?: (user: User) => void;
  showTodoCount?: boolean; // Todo数を表示するかどうか
  todoCount?: number;
}