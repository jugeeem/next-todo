'use client';

import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<number>(4); // GENERAL (デフォルト)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 認証状態をチェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me');

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserRole(data.data.role);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // 認証不要なページではチェックをスキップ
    if (pathname === '/login' || pathname === '/register') {
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      return;
    }

    checkAuth();
  }, [pathname]);

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setIsAuthenticated(false);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 認証チェック中は何も表示しない
  if (isCheckingAuth) {
    return null;
  }

  // 未認証時(ログイン・登録ページ)はヘッダーを表示しない
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Navbar>
      <NavbarBrand>
        <Link href="/todos" className="text-2xl font-bold">
          Todo アプリ
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link
            href="/todos"
            className={
              pathname.startsWith('/todos')
                ? 'text-blue-500 font-medium'
                : 'text-gray-700 hover:text-blue-500 font-medium'
            }
          >
            Todo一覧
          </Link>
        </NavbarItem>

        <NavbarItem>
          <Link
            href="/profile"
            className={
              pathname === '/profile'
                ? 'text-blue-500 font-medium'
                : 'text-gray-700 hover:text-blue-500 font-medium'
            }
          >
            プロフィール
          </Link>
        </NavbarItem>

        {/* ADMIN・MANAGER のみアクセス可能 */}
        {userRole <= 2 && (
          <NavbarItem>
            <Link
              href="/users"
              className={
                pathname.startsWith('/users')
                  ? 'text-blue-500 font-medium'
                  : 'text-gray-700 hover:text-blue-500 font-medium'
              }
            >
              ユーザー管理
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button color="default" variant="flat" onPress={handleLogout}>
            ログアウト
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
