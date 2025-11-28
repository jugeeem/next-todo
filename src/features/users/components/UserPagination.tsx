'use client';

import { Button, CardFooter } from '@heroui/react';
import type { PaginationInfo } from './types';

/**
 * UserPaginationのPropsタイプ定義
 */
interface UserPaginationProps {
  paginationInfo: PaginationInfo | null;
  currentPage: number;
  onPageChange: (page: number) => void;
}

/**
 * ユーザーページネーションコンポーネント。
 * ユーザーリストのページ切り替えを提供します。
 *
 * @param {UserPaginationProps} props - コンポーネントのプロパティ
 * @return {JSX.Element} - ユーザーページネーションコンポーネント
 */
export function UserPagination({
  paginationInfo,
  currentPage,
  onPageChange,
}: UserPaginationProps) {
  // ページネーションが不要な場合は何も表示しない
  if (!paginationInfo || paginationInfo.totalPages <= 1) {
    return null;
  }

  return (
    <CardFooter className="justify-between mt-8 pt-6 border-t border-gray-200">
      <Button
        type="button"
        onPress={() => onPageChange(currentPage - 1)}
        isDisabled={currentPage === 1}
        variant={currentPage === 1 ? 'flat' : 'solid'}
        className="px-6 py-2.5"
      >
        前のページ
      </Button>

      <span className="text-sm text-gray-600 font-medium">
        ページ {paginationInfo.currentPage} / {paginationInfo.totalPages}
      </span>

      <Button
        type="button"
        onPress={() => onPageChange(currentPage + 1)}
        isDisabled={currentPage === paginationInfo.totalPages}
        variant={currentPage === paginationInfo.totalPages ? 'flat' : 'solid'}
        className="px-6 py-2.5"
      >
        次のページ
      </Button>
    </CardFooter>
  );
}
