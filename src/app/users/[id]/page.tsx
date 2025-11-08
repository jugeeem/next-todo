'use client';

import UserDetailPage from '@/features/users/UserDetailPage';

/**
 * PagePropsの定義
 * Pageコンポーネントに渡されるpropsの型を定義します。
 * @typedef {Object} PageProps
 * @property {Promise<{ id: string }>} params - ユーザーIDを含むパラメータ
 */
interface PageProps {
  params: Promise<{ id: string }>;
}
// Propsとしてparamsを受け取り、UserDetailPageに渡す。
export default function Page({ params }: PageProps) {
  return <UserDetailPage params={params} />;
}
