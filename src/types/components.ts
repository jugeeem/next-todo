// 全てのコンポーネントが共通で使うプロパティ
export interface BaseComponentProps {
  children?: React.ReactNode;  // 子要素
  className?: string;         // CSSクラス
  testId?: string;           // テスト用ID
}

// ローディング状態を表す型
export interface LoadingState {
  isLoading?: boolean;
  loadingText?: string;
}

// エラー状態を表す型
export interface ErrorState {
  error?: string;
  isInvalid?: boolean;
}

// ボタンのクリックイベント
export type ClickHandler = () => void;

// フォームの送信イベント
export type SubmitHandler<T> = (data: T) => void;