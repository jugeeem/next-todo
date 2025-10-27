'use client';

import { Button, Card, CardBody } from '@heroui/react';
import type { PaginationInfo } from './types';

interface TodoPaginationProps {
  paginationInfo: PaginationInfo;
  page: number;
  onPageChange: (page: number) => void;
}

/**
 * Todoページネーションコンポーネント
 */
export function TodoPagination({
  paginationInfo,
  page,
  onPageChange,
}: TodoPaginationProps) {
  if (paginationInfo.totalPages <= 1) {
    return null;
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <Button
            color="default"
            variant="flat"
            onPress={() => onPageChange(page - 1)}
            isDisabled={page <= 1}
          >
            前のページ
          </Button>

          <span className="text-gray-700">
            ページ {page} / {paginationInfo.totalPages}
          </span>

          <Button
            color="default"
            variant="flat"
            onPress={() => onPageChange(page + 1)}
            isDisabled={page >= paginationInfo.totalPages}
          >
            次のページ
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
