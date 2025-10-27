'use client';

import { Select, SelectItem } from '@heroui/react';

interface TodoSortProps {
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: 'createdAt' | 'updatedAt' | 'title') => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
}

/**
 * Todoソートコンポーネント
 */
export function TodoSort({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: TodoSortProps) {
  return (
    <>
      <Select
        label="並び順"
        selectedKeys={[sortBy]}
        onChange={(e) =>
          onSortByChange(e.target.value as 'createdAt' | 'updatedAt' | 'title')
        }
      >
        <SelectItem key="createdAt">作成日時</SelectItem>
        <SelectItem key="updatedAt">更新日時</SelectItem>
        <SelectItem key="title">タイトル</SelectItem>
      </Select>

      <Select
        label="順序"
        selectedKeys={[sortOrder]}
        onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
      >
        <SelectItem key="asc">昇順</SelectItem>
        <SelectItem key="desc">降順</SelectItem>
      </Select>
    </>
  );
}
