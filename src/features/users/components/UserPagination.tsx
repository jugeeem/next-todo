'use client';

import { Button, Card, CardBody } from '@heroui/react';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * ユーザーリストページネーションコンポーネント
 */
export function UserPagination({ currentPage, totalPages, onPageChange }: Props) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => onPageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
          >
            前のページ
          </Button>

          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages} ページ
          </span>

          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => onPageChange(currentPage + 1)}
            isDisabled={currentPage === totalPages}
          >
            次のページ
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
