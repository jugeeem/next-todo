/**
 * サーバーコンポーネント用のデータフェッチ関数
 *
 * このファイルには、サーバーコンポーネントで使用するデータフェッチ関数を定義します。
 * サーバーコンポーネントからAPIルートにHTTPリクエストを送信し、
 * クライアントサイドと同じfetch()パターンで実装します。
 * これにより、初学者がAPIとの疎通方法を学ぶことができます。
 */

import { cookies } from 'next/headers';

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
 * ユーザー詳細取得（ADMIN・MANAGER専用）
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
