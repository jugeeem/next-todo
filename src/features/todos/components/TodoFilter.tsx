'use client';

import { Select, SelectItem } from '@heroui/react';
import type { CompletedFilter, SortBy, SortOrder } from './types';

/**
 * TodoFilterのPropsインターフェース。
 *
 * @property {CompletedFilter} completedFilter - 現在の完了状態フィルター
 * @property {SortBy} sortBy - 現在のソート基準
 * @property {SortOrder} sortOrder - 現在のソート順序
 * @property {(filter: CompletedFilter) => void} onFilterChange - フィルター変更ハンドラ
 * @property {(sortBy: SortBy) => void} onSortByChange - ソート基準変更ハンドラ
 * @property {(sortOrder: SortOrder) => void} onSortOrderChange - ソート順序変更ハンドラ
 */
interface TodoFilterProps {
  completedFilter: CompletedFilter;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onFilterChange: (filter: CompletedFilter) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onSortOrderChange: (sortOrder: SortOrder) => void;
}

/**
 * フィルター・ソートコンポーネント。
 * フィルターソートの選択肢を提供し、選択変更を親コンポーネントに通知します。
 *
 * @param {TodoFilterProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} フィルター・ソートコンポーネント
 */
export function TodoFilter({
  completedFilter,
  sortBy,
  sortOrder,
  onFilterChange,
  onSortByChange,
  onSortOrderChange,
}: TodoFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 表示フィルター */}
      <Select
        id="filter"
        label="表示フィルター"
        selectedKeys={new Set([completedFilter])}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as CompletedFilter;
          onFilterChange(selected);
        }}
      >
        <SelectItem key="all">すべて</SelectItem>
        <SelectItem key="completed">完了済み</SelectItem>
        <SelectItem key="incomplete">未完了</SelectItem>
      </Select>

      {/* ソート項目 */}
      <Select
        id="sortBy"
        label="並び順"
        selectedKeys={new Set([sortBy])}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as SortBy;
          onSortByChange(selected);
        }}
      >
        <SelectItem key="createdAt">作成日時</SelectItem>
        <SelectItem key="updatedAt">更新日時</SelectItem>
        <SelectItem key="title">タイトル</SelectItem>
      </Select>

      {/* ソート順序 */}
      <Select
        id="sortOrder"
        label="順序"
        selectedKeys={new Set([sortOrder])}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as SortOrder;
          onSortOrderChange(selected);
        }}
      >
        <SelectItem key="desc">降順</SelectItem>
        <SelectItem key="asc">昇順</SelectItem>
      </Select>
    </div>
  );
}
