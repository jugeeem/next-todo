'use server';

/**
 * サーバーコンポーネント・Server Actions用のデータフェッチ関数
 *
 * このファイルには、サーバーコンポーネントおよびServer Actionsで使用する
 * データフェッチ関数を定義します。
 * サーバーコンポーネントからAPIルートにHTTPリクエストを送信し、
 * クライアントサイドと同じfetch()パターンで実装します。
 * これにより、初学者がAPIとの疎通方法を学ぶことができます。
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * サーバー側でCookieとヘッダーを含めてフェッチを実行するヘルパー関数
 *
 * Next.jsのサーバーコンポーネントから内部APIを呼び出す際、
 * 元のリクエストのCookieをそのまま転送することで認証を維持します。
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();

  // 認証トークンのCookieのみを取得
  const authToken = cookieStore.get('auth_token');

  const requestHeaders = new Headers(options.headers);

  // 認証トークンがあればCookieヘッダーを設定
  if (authToken) {
    requestHeaders.set('Cookie', `auth_token=${authToken.value}`);
  }

  const response = await fetch(url, {
    ...options,
    headers: requestHeaders,
    cache: 'no-store', // サーバーコンポーネントでは常に最新データを取得
  });

  return response;
}

/**
 * Todo 一覧取得
 */
export async function fetchTodos(params?: {
  page?: number;
  perPage?: number;
  completedFilter?: 'all' | 'completed' | 'incomplete';
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.perPage) searchParams.set('perPage', params.perPage.toString());
  if (params?.completedFilter)
    searchParams.set('completedFilter', params.completedFilter);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetchWithAuth(
    `${API_URL}/api/todos?${searchParams.toString()}`,
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch todos');
  }

  return response.json();
}

/**
 * Todo 詳細取得
 */
export async function fetchTodoById(id: string) {
  const response = await fetchWithAuth(`${API_URL}/api/todos/${id}`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    if (response.status === 404) {
      throw new Error('Not Found');
    }
    if (response.status === 403) {
      throw new Error('Forbidden');
    }
    throw new Error('Failed to fetch todo');
  }

  const result = await response.json();
  return result.data;
}

/**
 * ユーザー情報取得
 */
export async function fetchCurrentUser() {
  const response = await fetchWithAuth(`${API_URL}/api/users/me`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch user');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Todo 統計取得
 */
export async function fetchTodoStats() {
  const response = await fetchWithAuth(`${API_URL}/api/users/me/todos/stats`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch stats');
  }

  const result = await response.json();
  return result.data;
}

/**
 * ユーザーの Todo 一覧取得
 * @param targetUserId - 指定した場合は特定ユーザーのTodoを取得、未指定の場合は現在のユーザーのTodoを取得
 */
export async function fetchUserTodos(targetUserId?: string) {
  const endpoint = targetUserId
    ? `${API_URL}/api/users/${targetUserId}/todos`
    : `${API_URL}/api/users/me/todos`;

  const response = await fetchWithAuth(endpoint);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    if (response.status === 403) {
      throw new Error('Forbidden');
    }
    throw new Error('Failed to fetch user todos');
  }

  const result = await response.json();
  return result.data;
}

/**
 * ユーザー一覧取得（ADMIN・MANAGER専用）
 */
export async function fetchUsers(params?: {
  page?: number;
  perPage?: number;
  roleFilter?: number | 'all';
  sortBy?: 'createdAt' | 'updatedAt' | 'username';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.perPage) searchParams.set('perPage', params.perPage.toString());
  if (params?.roleFilter && params.roleFilter !== 'all') {
    searchParams.set('roleFilter', params.roleFilter.toString());
  }
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params?.search) searchParams.set('search', params.search);

  const response = await fetchWithAuth(
    `${API_URL}/api/users?${searchParams.toString()}`,
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    if (response.status === 403) {
      throw new Error('Forbidden');
    }
    throw new Error('Failed to fetch users');
  }

  return response.json();
}

/**
 * ユーザー詳細取得(ADMIN・MANAGER専用)
 */
export async function fetchUserById(id: string) {
  const response = await fetchWithAuth(`${API_URL}/api/users/${id}`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    if (response.status === 403) {
      throw new Error('Forbidden');
    }
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error('Failed to fetch user');
  }

  const result = await response.json();
  return result.data;
}

// ========================================
// Server Actions (クライアントコンポーネントから呼び出し可能)
// ========================================

/**
 * ユーザー情報取得 (Server Action)
 */
export async function getUserInfo() {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/users/me`);

    if (response.status === 401) {
      redirect('/login');
    }

    if (!response.ok) {
      return {
        success: false,
        error: 'ユーザー情報の取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました',
    };
  }
}

/**
 * Todo統計取得 (Server Action)
 */
export async function getTodoStats() {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/users/me/todos/stats`);

    if (!response.ok) {
      return {
        success: false,
        error: 'Todo統計の取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    console.error('Todo統計の取得エラー:', err);
    return {
      success: false,
      error: 'Todo統計の取得に失敗しました',
    };
  }
}

/**
 * ユーザーのTodo一覧取得 (Server Action)
 */
export async function getUserTodos() {
  try {
    const response = await fetchWithAuth(
      `${API_URL}/api/users/me/todos?page=1&perPage=10`,
    );

    if (!response.ok) {
      return {
        success: false,
        error: 'Todo一覧の取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
    };
  } catch (err) {
    console.error('Todo一覧の取得エラー:', err);
    return {
      success: false,
      error: 'Todo一覧の取得に失敗しました',
    };
  }
}

/**
 * プロフィール更新 (Server Action)
 */
export async function updateProfile(formData: {
  firstName?: string;
  lastName?: string;
}) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'プロフィールの更新に失敗しました',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'プロフィールの更新に失敗しました',
    };
  }
}

/**
 * パスワード変更 (Server Action)
 */
export async function changePassword(formData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/users/me/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'パスワードの変更に失敗しました',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'パスワードの変更に失敗しました',
    };
  }
}

/**
 * ログアウト (Server Action)
 */
export async function logout() {
  try {
    await fetchWithAuth(`${API_URL}/api/auth/logout`, {
      method: 'POST',
    });

    redirect('/login');
  } catch (err) {
    console.error('Logout error:', err);
    redirect('/login');
  }
}

/**
 * ログイン (Server Action)
 */
export async function login(formData: { username: string; password: string }) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'ログインに失敗しました',
      };
    }

    // Cookieを取得してサーバー側でも設定
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Cookieをパースして設定
      const cookieStore = await cookies();
      const cookieEntries = setCookieHeader.split(', ');

      for (const cookieEntry of cookieEntries) {
        const [cookiePart] = cookieEntry.split(';');
        const [name, value] = cookiePart.split('=');

        if (name && value) {
          cookieStore.set(name, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24時間
          });
        }
      }
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ログインに失敗しました',
    };
  }
}

/**
 * ユーザー登録 (Server Action)
 */
export async function register(formData: {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: number;
}) {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        role: formData.role || 4, // デフォルトはユーザーロール
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'ユーザー登録に失敗しました',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ユーザー登録に失敗しました',
    };
  }
}

/**
 * Todo一覧取得 (Server Action)
 */
export async function getTodoList(params?: {
  page?: number;
  perPage?: number;
  completedFilter?: 'all' | 'completed' | 'incomplete';
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}) {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.perPage) searchParams.set('perPage', params.perPage.toString());
    if (params?.completedFilter)
      searchParams.set('completedFilter', params.completedFilter);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await fetchWithAuth(
      `${API_URL}/api/todos?${searchParams.toString()}`,
    );

    if (response.status === 401) {
      redirect('/login');
    }

    if (!response.ok) {
      return {
        success: false,
        error: 'Todoの取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの取得に失敗しました',
    };
  }
}

/**
 * Todo詳細取得 (Server Action)
 */
export async function getTodoDetail(id: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/todos/${id}`);

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.status === 404) {
      return {
        success: false,
        error: 'Todoが見つかりません',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: 'Todoの取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの取得に失敗しました',
    };
  }
}

/**
 * Todo作成 (Server Action)
 */
export async function createTodo(formData: { title: string; descriptions?: string }) {
  try {
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

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Todoの作成に失敗しました',
      };
    }

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
 * Todo更新 (Server Action)
 */
export async function updateTodo(
  id: string,
  formData: {
    title: string;
    descriptions?: string;
    completed: boolean;
  },
) {
  try {
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

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Todoの更新に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todoの更新に失敗しました',
    };
  }
}

/**
 * Todo削除 (Server Action)
 */
export async function deleteTodo(id: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/todos/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Todoの削除に失敗しました',
      };
    }

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
 * ユーザー一覧取得 (Server Action)
 */
export async function getUserList(params?: {
  page?: number;
  perPage?: number;
  role?: number;
  sortBy?: 'createdAt' | 'username' | 'firstName' | 'lastName' | 'role';
  sortOrder?: 'asc' | 'desc';
  username?: string;
}) {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.perPage) searchParams.set('perPage', params.perPage.toString());
    if (params?.role) searchParams.set('role', params.role.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params?.username) searchParams.set('username', params.username);

    const response = await fetchWithAuth(
      `${API_URL}/api/users?${searchParams.toString()}`,
    );

    if (response.status === 401) {
      redirect('/login');
    }

    if (!response.ok) {
      return {
        success: false,
        error: 'ユーザー一覧の取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ユーザー一覧の取得に失敗しました',
    };
  }
}

/**
 * ユーザー詳細取得 (Server Action)
 */
export async function getUserDetail(id: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/users/${id}`);

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.status === 404) {
      return {
        success: false,
        error: 'ユーザーが見つかりません',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: 'ユーザー情報の取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました',
    };
  }
}

/**
 * ユーザーのTodo一覧取得 (Server Action)
 */
export async function getUserTodoList(
  userId: string,
  params?: { page?: number; perPage?: number },
) {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.perPage) searchParams.set('perPage', params.perPage.toString());

    const response = await fetchWithAuth(
      `${API_URL}/api/users/${userId}/todos?${searchParams.toString()}`,
    );

    if (!response.ok) {
      return {
        success: false,
        error: 'Todo一覧の取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Todo一覧の取得に失敗しました',
    };
  }
}

/**
 * ユーザー作成 (Server Action)
 */
export async function createUser(formData: {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: number;
}) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        role: formData.role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'ユーザーの作成に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ユーザーの作成に失敗しました',
    };
  }
}

/**
 * ユーザー更新 (Server Action)
 */
export async function updateUser(
  id: string,
  formData: {
    firstName?: string;
    lastName?: string;
    role?: number;
  },
) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        role: formData.role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'ユーザー情報の更新に失敗しました',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ユーザー情報の更新に失敗しました',
    };
  }
}

/**
 * ユーザー削除 (Server Action)
 */
export async function deleteUser(id: string) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'ユーザーの削除に失敗しました',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ユーザーの削除に失敗しました',
    };
  }
}
