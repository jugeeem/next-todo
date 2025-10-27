'use client';

import { Select, SelectItem } from '@heroui/react';

interface Props {
  sortBy: 'created_at' | 'username' | 'first_name' | 'last_name' | 'role';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (
    sortBy: 'created_at' | 'username' | 'first_name' | 'last_name' | 'role',
  ) => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
}

/**
 * ユーザーソート選択コンポーネント
 */
export function UserSortSelect({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* ソート項目 */}
      <Select
        label="並び順"
        selectedKeys={[sortBy]}
        onChange={(e) =>
          onSortByChange(
            e.target.value as
              | 'created_at'
              | 'username'
              | 'first_name'
              | 'last_name'
              | 'role',
          )
        }
      >
        <SelectItem key="created_at">作成日時</SelectItem>
        <SelectItem key="username">ユーザー名</SelectItem>
        <SelectItem key="first_name">名前</SelectItem>
        <SelectItem key="last_name">姓</SelectItem>
        <SelectItem key="role">ロール</SelectItem>
      </Select>

      {/* ソート順 */}
      <Select
        label="順序"
        selectedKeys={[sortOrder]}
        onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
      >
        <SelectItem key="asc">昇順</SelectItem>
        <SelectItem key="desc">降順</SelectItem>
      </Select>
    </div>
  );
}
