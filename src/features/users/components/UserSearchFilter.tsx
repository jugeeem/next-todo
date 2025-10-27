'use client';

import { Input, Select, SelectItem } from '@heroui/react';

interface Props {
  searchQuery: string;
  roleFilter: number | 'all';
  onSearchChange: (query: string) => void;
  onRoleFilterChange: (role: number | 'all') => void;
}

/**
 * ユーザー検索・フィルターコンポーネント
 */
export function UserSearchFilter({
  searchQuery,
  roleFilter,
  onSearchChange,
  onRoleFilterChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* 検索 */}
      <Input
        type="text"
        label="検索"
        placeholder="ユーザー名、名前で検索"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {/* ロールフィルター */}
      <Select
        label="ロールフィルター"
        selectedKeys={[roleFilter.toString()]}
        onChange={(e) => {
          onRoleFilterChange(e.target.value === 'all' ? 'all' : Number(e.target.value));
        }}
      >
        <SelectItem key="all">すべて</SelectItem>
        <SelectItem key="1">ADMIN</SelectItem>
        <SelectItem key="2">MANAGER</SelectItem>
        <SelectItem key="3">USER</SelectItem>
        <SelectItem key="4">GUEST</SelectItem>
      </Select>
    </div>
  );
}
