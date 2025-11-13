import { redirect } from 'next/navigation';
import UserListPage from '@/features/users/UserListPage';
import { fetchCurrentUser } from '@/lib/api';

export const dynamic = 'force-dynamic';

// STEP2: server_component(2025-11) ADD START
/**
 * ユーザー管理ページ(サーバーコンポーネント)
 * 現在のユーザー情報をサーバー側で取得し、UserListPageコンポーネントに渡します。
 *
 *
 */
export default async function UserListServerPage() {
  try {
    // 現在のユーザー情報を取得
    const currentUser = await fetchCurrentUser();

    // ADMIN、MANAGER以外のユーザーはアクセス不可
    if (currentUser.role >= 3) {
      redirect('/todos');
    }

    // クライアントコンポーネントに現在のユーザー情報を渡す
    return (
      <UserListPage currentUserId={currentUser.id} currentUserRole={currentUser.role} />
    );
  } catch (err) {
    // エラー発生時はコンソールにエラーを出力し、ログインページへリダイレクト
    console.error('ユーザー情報取得エラー: ', err);
    redirect('/login');
  }
}
// STEP2: server_component(2025-11) ADD END
