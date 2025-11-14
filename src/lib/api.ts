'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/** APIのベースURL */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ===============================================
// サーバーコンポーネント専用のフェッチ関数
// ===============================================

/**
 * サーバー側でCookieを含めてフェッチを実行するヘルパー関数。
 * 認証が必要なAPIリクエストに使用します。
 *
 * @param url フェッチ先のURL
 * @param options フェッチオプション
 * @returns フェッチのレスポンス
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Cookieから認証トークンを取得
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');

  // リクエストヘッダーに認証トークンを設定
  const requestHeaders = new Headers(options.headers);
  // 認証トークンが存在する場合、Cookieヘッダーに追加
  if (authToken) {
    requestHeaders.set('Cookie', `auth_token=${authToken.value}`);
  }

  return await fetch(url, {
    ...options,
    headers: requestHeaders,
    cache: 'no-store', // 常に最新のデータを取得
  });
}

/**
 * Todo一覧を取得。
 * Todo一覧取得APIを呼び出して結果を返します。
 *
 * @param params 取得パラメータ
 * @return Todo一覧のJSONデータ
 * @throws エラーが発生した場合は例外をスロー
 */
export async function fetchTodos(params?: {
  page?: number;
  perPage?: number;
  completedFilter?: 'all' | 'completed' | 'incomplete';
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}) {
  // サーチパラメータの構築
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.perPage) searchParams.set('perPage', params.perPage.toString());
  if (params?.completedFilter)
    searchParams.set('completedFilter', params.completedFilter);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  // APIリクエストの実行
  const response = await fetchWithAuth(
    `${API_URL}/api/todos?${searchParams.toString()}`,
  );

  // レスポンスのエラー処理
  if (!response.ok) {
    // 認証エラー発生時の処理
    if (response.status === 401) throw new Error('認証エラーが発生しました');
    // その他のエラー発生時の処理
    throw new Error('Todoの取得に失敗しました');
  }
  // レスポンスのJSONをオブジェクトに変換して返す。
  return response.json();
}

/**
 * Todo詳細を取得。
 * Todo詳細取得APIを呼び出して結果を返します。
 *
 * @param id TodoのID
 * @returns Todo詳細情報データ
 * @throws エラーが発生した場合は例外をスロー
 */
export async function fetchTodoById(id: string) {
  // APIリクエストの実行。
  const response = await fetchWithAuth(`${API_URL}/api/todos/${id}`);

  // エラー発生時の処理。
  if (!response.ok) {
    // 認証エラー発生時の処理
    if (response.status === 401) throw new Error('認証エラーが発生しました');
    // その他のエラー発生時の処理
    throw new Error('Todoの取得に失敗しました');
  }

  // レスポンス内の必要なデータを抽出して返す。
  const result = await response.json();
  return result.data;
}

/**
 * 現在のユーザー情報を取得。
 * ユーザー情報取得APIを呼び出して結果を返します。
 *
 * @return ユーザー情報のJSONデータ
 * @throws エラーが発生した場合は例外をスロー
 */
export async function fetchCurrentUser() {
  // APIリクエストの実行。
  const response = await fetchWithAuth(`${API_URL}/api/users/me`);
  // エラー発生時の処理。
  if (!response.ok) {
    // 認証エラー発生時の処理
    if (response.status === 401) throw new Error('認証エラーが発生しました');
    // その他のエラー発生時の処理
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  // レスポンス内の必要なデータを抽出して返す。
  const result = await response.json();
  return result.data;
}

/**
 * Todo統計情報を取得。
 * プロフィールページでの統計表示に使用されます。
 */
export async function fetchTodoStats() {
  // APIリクエストの実行
  const response = await fetchWithAuth(`${API_URL}/api/users/me/todos/stats`);

  // エラー発生時の処理
  if (!response.ok) {
    // 認証エラー発生時の処理
    if (response.status === 401) throw new Error('認証エラーが発生しました');
    // その他のエラーの発生時の処理
    throw new Error('Todo統計情報の取得に失敗しました');
  }

  // レスポンス内の必要なデータを抽出して返す
  const result = await response.json();
  return result.data;
}

/**
 * ユーザーのTodo一覧を取得。（プロフィールページ用）
 * プロフィールページでユーザーのTodo一覧を表示するために使用されます。
 */
export async function fetchUserTodos() {
  // APIリクエストの実行
  const response = await fetchWithAuth(`${API_URL}/api/users/me/todos`);

  // エラー発生時の処理
  if (!response.ok) {
    // 認証エラー発生時の処理
    if (response.status === 401) throw new Error('認証エラーが発生しました');
    // その他のエラー発生時の処理
    throw new Error('Todo一覧の取得に失敗しました');
  }
  // レスポンス内の必要なデータを抽出して返す
  const result = await response.json();
  return result.data || [];
}

/**
 * 特定ユーザーの詳細情報を取得。
 * ユーザーIDに基づいてユーザー詳細情報を取得します。
 *
 * @param userId ユーザーID
 * @return ユーザー詳細情報のJSONデータ
 * @throws エラーが発生した場合は例外をスロー
 */
export async function fetchUserById(userId: string) {
  // APIリクエストの実行
  const response = await fetchWithAuth(`${API_URL}/api/users/${userId}`);

  // エラー発生時の処理
  if (!response.ok) {
    // 認証エラー発生時の処理
    if (response.status === 401) throw new Error('認証エラーが発生しました');
    // その他のエラー発生時の処理
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  // レスポンス内の必要なデータを抽出して返す
  const result = await response.json();
  return result.data;
}

/**
 * 特定ユーザーのTodo一覧を取得。
 * ユーザーIDに基づいてそのユーザーのTodo一覧を取得します。
 *
 * @param userId ユーザーID
 * @return ユーザーのTodo一覧のJSONデータ
 * @throws エラーが発生した場合は例外をスロー
 */
export async function fetchUserTodosById(userId: string) {
  // APIリクエストの実行
  const response = await fetchWithAuth(`${API_URL}/api/users/${userId}/todos`);

  // エラー発生時の処理
  if (!response.ok) {
    // 認証エラー発生時の処理
    if (response.status === 401) throw new Error('認証エラーが発生しました');
    // その他のエラー発生時の処理
    throw new Error('Todo一覧の取得に失敗しました');
  }

  // レスポンス内の必要なデータを抽出して返す
  const result = await response.json();
  return result.data || [];
}

// ===============================================
// サーバーアクション（クライアントコンポーネントから呼び出し可能）
// ===============================================

/**
 * ログアウト処理（サーバーアクション）。
 * クライアント側でログアウト時に呼び出されます。
 */
export async function logout() {
  try {
    // APIリクエストの実行
    await fetchWithAuth(`${API_URL}/api/auth/logout`, {
      method: 'POST',
    });
  } catch (err) {
    // ログアウト失敗時は、コンソールにエラーを表示
    console.error('ログアウトエラー:', err);
  }
  // redirectは内部的に例外をスローするため、try-catchの外で実行します。
  redirect('/login');
}
/**
 * Todo一覧取得処理（サーバーアクション）。
 * クライアント側でのフィルタリング・ソート・ページング時に呼び出されます。
 *
 * @param params 取得パラメータ
 * @return Todo一覧の取得結果
 */
export async function getTodoList(params?: {
  page?: number;
  perPage?: number;
  completedFilter?: 'all' | 'completed' | 'incomplete';
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}) {
  try {
    // fetchTodosを内部的に呼び出してTodo一覧を取得
    const data = await fetchTodos(params);
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    // 認証エラー発生時はログインページへリダイレクト
    if (err instanceof Error && err.message === '認証エラーが発生しました') {
      redirect('/login');
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの取得に失敗しました',
    };
  }
}

/**
 * Todo作成処理（サーバーアクション）。
 * クライアント側でTodo作成時に呼び出されます。
 *
 * @param title Todoのタイトル
 * @param descriptions Todoの説明
 * @return Todo作成の実行結果
 */
export async function createTodo(formData: { title: string; descriptions?: string }) {
  try {
    // APIリクエストの実行
    const response = await fetchWithAuth(`${API_URL}/api/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        descriptions: formData.descriptions || undefined,
      }),
    });

    // エラー発生時の処理
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Todoの作成に失敗しました',
      };
    }
    // 正常終了時は作成されたTodoデータを返す
    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの作成に失敗しました',
    };
  }
}

/**
 * Todo更新処理（サーバーアクション）
 * クライアント側でTodo更新時に呼び出されます。
 *
 * @param id TodoのID
 * @param formData 更新するTodoデータ
 * @return Todo更新の実行結果
 */
export async function updateTodo(
  id: number,
  formData: {
    title: string;
    descriptions?: string;
    completed: boolean;
  },
) {
  try {
    // APIリクエストの実行
    const response = await fetchWithAuth(`${API_URL}/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        descriptions: formData.descriptions || undefined,
        completed: formData.completed,
      }),
    });

    // エラー発生時の処理
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Todoの更新に失敗しました',
      };
    }
    // 正常終了時、実行結果を返す。
    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの更新に失敗しました',
    };
  }
}

/**
 * Todo削除処理（サーバーアクション）。
 * クライアント側でTodo削除時に呼び出されます。
 *
 * @param id TodoのID
 * @return Todo削除の実行結果
 */
export async function deleteTodo(id: string) {
  try {
    // APIリクエストの実行
    const response = await fetchWithAuth(`${API_URL}/api/todos/${id}`, {
      method: 'DELETE',
    });

    // エラー発生時の処理
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Todoの削除に失敗しました',
      };
    }
    // 正常終了時、実行結果を返す。
    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの削除に失敗しました',
    };
  }
}

/**
 * Todo詳細取得処理（サーバーアクション）。
 * クライアント側でTodo詳細取得時に呼び出されます。
 *
 * @param id TodoのID
 * @returns Todo詳細情報の取得結果
 */
export async function getTodoDetail(id: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/todos/${id}`);

    // 認証エラー発生時はログインページへリダイレクト
    if (response.status === 401) {
      redirect('/login');
    }
    // エラー発生時の処理
    if (!response.ok) {
      return {
        success: false,
        error: 'Todoの取得に失敗しました',
      };
    }

    // レスポンスのJSONをオブジェクトに変換して返す。
    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    // 例外発生時のレスポンス
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの取得に失敗しました',
    };
  }
}

/**
 * ユーザー情報更新処理（サーバーアクション）
 * クライアント側でユーザー情報更新時に呼び出されます。
 *
 * @param userId ユーザーID
 * @param formData 更新するユーザーデータ
 * @return ユーザー情報更新の実行結果
 */

export async function updateUser(
  userId: string,
  formData: {
    firstName?: string;
    lastName?: string;
    role?: number;
  },
) {
  try {
    // APIリクエストの実行
    const response = await fetchWithAuth(`${API_URL}/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    // エラー発生時の処理
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'ユーザー情報の更新に失敗しました',
      };
    }

    // 正常終了時、実行結果を返す。
    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      // 例外発生時のレスポンス
      success: false,
      error: err instanceof Error ? err.message : 'ユーザー情報の更新に失敗しました',
    };
  }
}

/**
 * ユーザー削除処理（サーバーアクション）
 * クライアント側でユーザー削除時に呼び出されます。
 *
 * @param userId ユーザーID
 * @return ユーザー削除の実行結果
 */
export async function deleteUser(userId: string) {
  try {
    // APIリクエストの実行
    const response = await fetchWithAuth(`${API_URL}/api/users/${userId}`, {
      method: 'DELETE',
    });

    // エラー発生時の処理
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'ユーザーの削除に失敗しました',
      };
    }
    // 正常終了時、実行結果を返す。
    return {
      success: true,
    };
  } catch (err) {
    // 例外発生時のレスポンス
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ユーザーの削除に失敗しました',
    };
  }
}
