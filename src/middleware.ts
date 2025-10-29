import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth-middleware';

/**
 * 指定されたパスが保護されたパスかどうかを判定します。
 * 保護されたパスは認証が必要なルートを示します。
 *
 * @param path - チェックするURLパス文字列
 * @returns パスが保護されている場合は true、そうでない場合は false
 */
function isProtectedPath(path: string): boolean {
  const protectedPaths = [
    '/api/todos',
    '/api/users',
    '/users',
    '/todos',
    '/auth/register',
  ];
  return protectedPaths.some((prefix) => path.startsWith(prefix));
}

/**
 * 指定されたパスが公開パスかどうかを判定します。
 * 公開パスは認証が不要でアクセス可能なルートを示します。
 *
 * @param path - チェックするURLパス文字列
 * @returns パスが公開されている場合は true、そうでない場合は false
 */
function isPublicPath(path: string): boolean {
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/health',
    '/login',
    '/register',
    '/',
  ];

  // 完全一致または特定パスで始まるかをチェック
  return publicPaths.some((publicPath) => {
    if (publicPath === '/') {
      return path === '/';
    }
    return path === publicPath || path.startsWith(`${publicPath}/`);
  });
}

/**
 * Next.jsのミドルウェア関数。リクエストごとに実行され、認証とルートの保護を処理します。
 *
 * - 公開パスへのアクセスは常に許可されます
 * - 保護されたパスへのアクセスには認証が必要です
 * - 認証がない場合は401エラーレスポンスを返します
 *
 * @param request - 処理するNextRequestオブジェクト
 * @returns NextResponseオブジェクト（エラーレスポンスまたは次のミドルウェア/ハンドラへの進行）
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log(`[Middleware] Processing path: ${path}`);

  // 公開パスは認証なしで通す
  if (isPublicPath(path)) {
    console.log(`[Middleware] Public path, skipping auth: ${path}`);
    return NextResponse.next();
  }

  // 保護されたパスの場合は認証をチェック
  if (isProtectedPath(path)) {
    console.log(`[Middleware] Protected path, checking auth: ${path}`);
    const authMiddleware = new AuthMiddleware();
    const authResult = await authMiddleware.authenticate(request);

    if (!authResult.success) {
      console.log(`[Middleware] Auth failed: ${authResult.error}`);
      // APIルートの場合はJSONエラーを返す
      if (path.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: authResult.error,
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Webページの場合はログインページにリダイレクト
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log(`[Middleware] Auth success for user: ${authResult.user.userId}`);

    // 認証成功時はリクエストヘッダーにユーザー情報を追加
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', authResult.user.userId);
    requestHeaders.set('x-user-role', authResult.user.role.toString());

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  console.log(`[Middleware] Unprotected path, allowing: ${path}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/todos/:path*',
    '/api/todos',
    '/api/users/:path*',
    '/api/users',
    '/todos/:path*',
    '/todos',
    '/users/:path*',
    '/users',
    '/profile/:path*',
    '/profile',
  ],
};
