'use client';

import { Select, SelectItem } from '@heroui/react';

interface TodoFilterProps {
  value: 'all' | 'completed' | 'incomplete';
  onChange: (value: 'all' | 'completed' | 'incomplete') => void;
}

/**
 * Todoフィルターコンポーネント
 */
export function TodoFilter({ value, onChange }: TodoFilterProps) {
  return (
    <Select
      label="表示フィルター"
      selectedKeys={[value]}
      onChange={(e) => {
        onChange(e.target.value as 'all' | 'completed' | 'incomplete');
      }}
    >
      <SelectItem key="all">すべて</SelectItem>
      <SelectItem key="completed">完了済み</SelectItem>
      <SelectItem key="incomplete">未完了</SelectItem>
    </Select>
  );
}
