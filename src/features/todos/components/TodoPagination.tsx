'use client';

import { Button } from '@heroui/react';
import type { PaginationInfo } from './types';

/**
 * TodoPaginationのPropsインターフェース。
 *
 * @property {PaginationInfo} paginationInfo - ページネーション情報
 * @property {number} currentPage - 現在のページ番号
 * @property {(newPage: number) => void} onPageChange - ページ変更ハンドラ関数
 */
interface TodoPaginationProps {
  paginationInfo: PaginationInfo;
  currentPage: number;
  onPageChange: (newPage: number) => void;
}

/**
 * ページネーションコンポーネント。
 * 現在のページ情報を表示し、前後のページへのナビゲーションを提供します。
 *
 * @param {TodoPaginationProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} ページネーションコンポーネント
 */
export function TodoPagination({
  paginationInfo,
  currentPage,
  onPageChange,
}: TodoPaginationProps) {
  // 総ページ数が1以下の場合は表示しない
  if (paginationInfo.totalPages <= 1) {
    return null;
  }

  // 前後ボタンの無効化判定
  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = currentPage === paginationInfo.totalPages;

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      {/* ページネーションボタン */}
      <div className="flex items-center justify-between">
        {/* 前へボタン */}
        <Button
          type="button"
          onPress={() => onPageChange(currentPage - 1)}
          isDisabled={isPrevDisabled}
          variant={isPrevDisabled ? 'flat' : 'solid'}
          className="px-6 py-2.5"
        >
          前のページ
        </Button>

        {/* 現在のページ表示 */}
        <span className="text-sm text-gray-600 font-medium">
          ページ {currentPage} / {paginationInfo.totalPages}
        </span>

        {/* 次へボタン */}
        <Button
          type="button"
          onPress={() => onPageChange(currentPage + 1)}
          isDisabled={isNextDisabled}
          variant={isNextDisabled ? 'flat' : 'solid'}
          className="px-6 py-2.5"
        >
          次のページ
        </Button>
      </div>
    </div>
  );
}
