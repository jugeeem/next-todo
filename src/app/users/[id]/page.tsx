import { redirect } from 'next/navigation';
import UserDetailPage from '@/features/users/UserDetailPage';
import { fetchCurrentUser, fetchUserById, fetchUserTodosById } from '@/lib/api';

/**
 * PagePropsの定義
 * Pageコンポーネントに渡されるpropsの型を定義します。
 * @typedef {Object} PageProps
 * @property {Promise<{ id: string }>} params - ユーザーIDを含むパラメータ
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

// STEP2: STEP2: server_component(2025-11) ADD START
/**
 * ユーザー詳細ページのサーバーコンポーネント。
 * ユーザーIDに基づいて特定のユーザーの詳細情報とそのTodo一覧を取得し、UserDetailPageコンポーネントに渡します。
 * @param param0
 */
export default async function Page({ params }: PageProps) {
  try {
    // Promiseを解決してidを取得
    const { id } = await params;

    // 現在のユーザー情報を取得
    const currentUser = await fetchCurrentUser();

    // 権限チェック: roleが3以上（一般ユーザー）の場合、/todosにリダイレクト
    if (currentUser.role >= 3) {
      redirect('/todos');
    }
    // 現在のユーザーが閲覧対象のユーザーかどうかを判定
    const isCurrentUser = id === currentUser.id;

    // 指定されたユーザーの情報をidをもとに取得する。
    const user = await fetchUserById(id);

    // Todo一覧の初期値として空配列を設定
    let todos = [];

    // ユーザー権限チェックを行う。
    const canViewTodos = currentUser.role === 1 || isCurrentUser;

    // Todo一覧の閲覧権限がある場合、指定されたユーザーのTodo一覧を取得する。
    if (canViewTodos) {
      todos = await fetchUserTodosById(id);
    }

    // UserDetailPageコンポーネントにデータを渡してレンダリング
    return (
      <UserDetailPage
        initialUser={user}
        initialTodos={todos}
        currentUserRole={currentUser.role}
        currentUserId={currentUser.id}
      />
    );
  } catch (err) {
    // 認証エラーの場合、ログインページにリダイレクト
    if (err instanceof Error && err.message === '認証エラーが発生しました') {
      redirect('/login');
    }

    // その他のエラーはエラーページへスロー
    throw err;
  }
}

// STEP2: STEP2: server_component(2025-11) ADD END
