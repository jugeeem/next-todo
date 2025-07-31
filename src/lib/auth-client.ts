/**
 * @fileoverview クライアントサイド認証ユーティリティ
 *
 * このファイルは、ブラウザ環境でのJWT認証状態の管理機能を提供します。
 * Cookie を使用したトークンとユーザー情報の管理を行います。
 *
 * 主な機能:
 * - Cookie からの認証トークン・ユーザー情報取得
 * - 認証状態の検証
 * - トークンの有効性チェック
 * - ユーザー情報の型安全な取得
 *
 * 使用例:
 * - ページコンポーネントでの認証状態チェック
 * - 認証が必要なページでのリダイレクト判定
 * - ユーザー情報の表示
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { User } from '@/domain/entities/User';
import {
  AUTH_COOKIE_NAMES,
  deleteAuthCookiesFromClient,
  getClientCookie,
  getUserFromClient,
} from '@/lib/cookie';

/**
 * 認証状態の結果を表すインターフェース
 */
export interface AuthState {
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** 認証済みユーザー情報（認証済みの場合のみ） */
  user: Omit<User, 'passwordHash'> | null;
  /** JWTトークン（認証済みの場合のみ） */
  token: string | null;
}

/**
 * ブラウザ環境かどうかを判定する
 *
 * @returns ブラウザ環境の場合は true、サーバー環境の場合は false
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Cookie からJWTトークンを取得する
 *
 * @returns JWTトークン文字列、存在しない場合は null
 */
export function getToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    return getClientCookie(AUTH_COOKIE_NAMES.TOKEN);
  } catch (error) {
    console.error('Token retrieval error:', error);
    return null;
  }
}

/**
 * Cookie からユーザー情報を取得する
 *
 * @returns ユーザー情報オブジェクト、存在しない場合は null
 */
export function getUser(): Omit<User, 'passwordHash'> | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    return getUserFromClient();
  } catch (error) {
    console.error('User retrieval error:', error);
    return null;
  }
}

/**
 * JWTトークンの有効性を簡易チェックする
 *
 * @param token - チェックするJWTトークン
 * @returns トークンが有効な形式の場合は true
 */
function isValidTokenFormat(token: string): boolean {
  try {
    // JWT は 3つの部分が'.'で区切られている
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Payload部分をデコードして有効期限をチェック
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    // 有効期限チェック
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 現在の認証状態を取得する
 *
 * @returns 認証状態オブジェクト
 */
export function getAuthState(): AuthState {
  const token = getToken();
  const user = getUser();

  // トークンとユーザー情報の両方が存在し、トークンが有効な形式の場合のみ認証済みとみなす
  const isAuthenticated = Boolean(token && user && isValidTokenFormat(token));

  return {
    isAuthenticated,
    user: isAuthenticated ? user : null,
    token: isAuthenticated ? token : null,
  };
}

/**
 * 認証情報をクリアする（ログアウト時に使用）
 */
export function clearAuth(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    deleteAuthCookiesFromClient();
  } catch (error) {
    console.error('Auth clearing error:', error);
  }
}

/**
 * 認証が必要かどうかを判定する
 *
 * @returns 認証が必要な場合は true
 */
export function isAuthenticationRequired(): boolean {
  const { isAuthenticated } = getAuthState();
  return !isAuthenticated;
}
