import { cookies } from 'next/headers';
import { Container } from '@/lib/container';
import { ServerAuth } from './server-auth';

export class ServerDataFetcher {
  private container;
  private serverAuth;

  constructor() {
    this.container = Container.getInstance();
    this.serverAuth = new ServerAuth();
  }

  // ユーザー固有のTodo一覧取得
  async getTodosByUserId(userId: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const authState = await this.serverAuth.getAuthState();

    if (!token || !authState) {
      this.serverAuth.redirectIfAuthenticated();
    }

    // const userId = authState?.userId;
    const todos = await this.container.todoUseCase.getTodosByUserId(userId);

    return todos;
  }

  // 権限チェック付きTodo詳細取得
  async getTodoById(todoId: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      throw new Error('Unauthorized');
    }

    const data = await fetch(`http://localhost:3000/api/todos/${todoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return data.json();
  }

  // 管理者用ユーザー一覧取得
  async getAllUsers() {
    const users = await this.container.userUseCase.getAllUsers();
    return users;
  }

  // 特定ユーザー情報取得
  async getUserById(userId: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      this.serverAuth.redirectIfAuthenticated();
    }

    const data = await fetch(`http://localhost:3000/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return data.json();
  }
}
