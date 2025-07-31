/**
 * @fileoverview Cookie操作ユーティリティ
 *
 * このファイルは、認証情報をCookieで管理するためのユーティリティ関数を提供します。
 * サーバーサイドとクライアントサイドの両方で使用可能で、セキュアなCookie設定を行います。
 *
 * 主な機能:
 * - HttpOnly, Secure, SameSite属性を持つセキュアなCookie設定
 * - サーバーサイドでのCookie操作（NextRequest/NextResponse）
 * - クライアントサイドでのCookie操作（document.cookie）
 * - 型安全なCookie値の取得・設定・削除
 *
 * セキュリティ機能:
 * - HttpOnly属性によるXSS攻撃対策
 * - Secure属性によるHTTPS強制
 * - SameSite=Strict属性によるCSRF攻撃対策
 * - 適切な有効期限設定
 *
 * @author jugeeem
 * @since 1.0.0
 */

import type { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/domain/entities/User';

/**
 * Cookie設定のオプション
 */
export interface CookieOptions {
  /** Cookie有効期限（日数） */
  maxAge?: number;
  /** HttpOnly属性 */
  httpOnly?: boolean;
  /** Secure属性 */
  secure?: boolean;
  /** SameSite属性 */
  sameSite?: 'strict' | 'lax' | 'none';
  /** Path属性 */
  path?: string;
}

/**
 * 認証Cookie名の定数
 */
export const AUTH_COOKIE_NAMES = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
} as const;

/**
 * デフォルトのCookie設定
 * セキュリティを重視した設定を適用
 */
const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  maxAge: 24 * 60 * 60, // 24時間（秒）
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

/**
 * ブラウザ環境かどうかを判定する
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Cookie値をシリアライズする
 */
function serializeCookieValue(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options };
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (opts.maxAge) {
    cookie += `; Max-Age=${opts.maxAge}`;
  }

  if (opts.httpOnly) {
    cookie += '; HttpOnly';
  }

  if (opts.secure) {
    cookie += '; Secure';
  }

  if (opts.sameSite) {
    cookie += `; SameSite=${opts.sameSite}`;
  }

  if (opts.path) {
    cookie += `; Path=${opts.path}`;
  }

  return cookie;
}

/**
 * サーバーサイドでCookieを設定する
 */
export function setServerCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options };
  response.cookies.set(name, value, {
    maxAge: opts.maxAge,
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
  });
}

/**
 * サーバーサイドでCookieを削除する
 */
export function deleteServerCookie(response: NextResponse, name: string): void {
  response.cookies.set(name, '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

/**
 * サーバーサイドでCookieを取得する
 */
export function getServerCookie(request: NextRequest, name: string): string | null {
  const cookies = request.cookies;
  return cookies.get(name)?.value || null;
}

/**
 * クライアントサイドでCookieを設定する（非HttpOnly）
 */
export function setClientCookie(
  name: string,
  value: string,
  options: Omit<CookieOptions, 'httpOnly'> = {},
): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options, httpOnly: false };
    const cookieString = serializeCookieValue(name, value, opts);
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not yet widely supported
    document.cookie = cookieString;
  } catch (error) {
    console.error('Client cookie setting error:', error);
  }
}

/**
 * クライアントサイドでCookieを取得する
 */
export function getClientCookie(name: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const cookies = document.cookie.split(';');
    const cookie = cookies.find((c) => c.trim().startsWith(`${name}=`));

    if (!cookie) {
      return null;
    }

    return decodeURIComponent(cookie.split('=')[1]);
  } catch (error) {
    console.error('Client cookie retrieval error:', error);
    return null;
  }
}

/**
 * クライアントサイドでCookieを削除する
 */
export function deleteClientCookie(name: string): void {
  if (!isBrowser()) {
    return;
  }

  try {
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not yet widely supported
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  } catch (error) {
    console.error('Client cookie deletion error:', error);
  }
}

/**
 * 認証トークンをサーバーサイドで設定する
 */
export function setAuthTokenCookie(response: NextResponse, token: string): void {
  setServerCookie(response, AUTH_COOKIE_NAMES.TOKEN, token);
}

/**
 * ユーザー情報をサーバーサイドで設定する（非HttpOnly）
 */
export function setUserCookie(
  response: NextResponse,
  user: Omit<User, 'passwordHash'>,
): void {
  setServerCookie(response, AUTH_COOKIE_NAMES.USER, JSON.stringify(user), {
    ...DEFAULT_COOKIE_OPTIONS,
    httpOnly: false, // クライアントサイドでアクセス可能にする
  });
}

/**
 * 認証Cookieをサーバーサイドで削除する
 */
export function deleteAuthCookies(response: NextResponse): void {
  deleteServerCookie(response, AUTH_COOKIE_NAMES.TOKEN);
  deleteServerCookie(response, AUTH_COOKIE_NAMES.USER);
}

/**
 * 認証トークンをサーバーサイドで取得する
 */
export function getAuthTokenFromServer(request: NextRequest): string | null {
  return getServerCookie(request, AUTH_COOKIE_NAMES.TOKEN);
}

/**
 * ユーザー情報をクライアントサイドで取得する
 */
export function getUserFromClient(): Omit<User, 'passwordHash'> | null {
  try {
    const userStr = getClientCookie(AUTH_COOKIE_NAMES.USER);
    if (!userStr) {
      return null;
    }

    const user = JSON.parse(userStr);

    // 基本的な構造の検証
    if (typeof user === 'object' && user.id && user.username) {
      return user as Omit<User, 'passwordHash'>;
    }

    return null;
  } catch (error) {
    console.error('User cookie retrieval error:', error);
    return null;
  }
}

/**
 * 認証Cookieをクライアントサイドで削除する
 */
export function deleteAuthCookiesFromClient(): void {
  deleteClientCookie(AUTH_COOKIE_NAMES.TOKEN);
  deleteClientCookie(AUTH_COOKIE_NAMES.USER);
}
