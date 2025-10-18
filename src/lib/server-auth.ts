import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { JWTService } from '@/lib/jwt';

interface ServerAuthResult {
  userId: string;
  role: number;
  username: string;
  result: boolean;
}

export class ServerAuth {
  // サーバーサイドでの認証状態取得
  async getAuthState() {
    const jwt = new JWTService();
    const cookie = await cookies();
    const token = cookie.get('auth_token');
    if (!token) {
      return null;
    }
    const payload = await jwt.verifyToken(token.value);

    // 認証失敗時
    if (!payload) {
      return { userId: '', role: -1, username: '', result: false } as ServerAuthResult;
    }
    // 認証成功時
    return payload as ServerAuthResult;
  }

  // 認証必須ページでの認証チェック
  async requireAuth() {
    const authState = await this.getAuthState();
    if (!authState) {
      return false;
    }
    return true;
  }

  // 管理者権限必須ページでの認証チェック
  async requireAdminAuth() {
    const authState = await this.getAuthState();
    if (!authState || authState.role !== 1) {
      return false;
    }
    return true;
  }

  // ログイン済みユーザリダイレクト
  async redirectIfAuthenticated() {
    const authState = await this.getAuthState();
    if (!authState) {
      return;
    }
    redirect('/todos');
  }
}
