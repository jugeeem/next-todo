'use client';

import { Input, Select, SelectItem } from '@heroui/react';
import type { RoleFilter, SortBy, SortOrder } from './types';

/**
 * UserSearchFilterのPropsタイプ定義
 *
 * @interface UserSearchFilterProps - UserSearchFilterコンポーネントのプロパティタイプ定義
 * @property {string} searchQuery - 現在の検索クエリ
 * @property {RoleFilter} roleFilter - 現在のロールフィルター
 * @property {SortBy} sortBy - 現在のソート基準
 * @property {SortOrder} sortOrder - 現在のソート順序
 * @property {(query: string) => void} onSearchChange - 検索クエリ変更時のコールバック関数
 * @property {(role: RoleFilter) => void} onRoleFilterChange - ロールフィルター変更時のコールバック関数
 * @property {(sortBy: SortBy) => void} onSortByChange - ソート基準変更時のコールバック関数
 * @property {(sortOrder: SortOrder) => void} onSortOrderChange - ソート順序変更時のコールバック関数
 *
 */
interface UserSearchFilterProps {
  searchQuery: string;
  roleFilter: RoleFilter;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSearchChange: (query: string) => void;
  onRoleFilterChange: (role: RoleFilter) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onSortOrderChange: (sortOrder: SortOrder) => void;
}

/**
 * ユーザー検索フィルターコンポーネント。
 * ユーザー名での検索とロールによるフィルタリングを提供します。
 *
 * @param {UserSearchFilterProps} props - コンポーネントのプロパティ
 * @return {JSX.Element} - ユーザー検索フィルターコンポーネント
 */
export function UserSearchFilter({
  searchQuery,
  roleFilter,
  sortBy,
  sortOrder,
  onSearchChange,
  onRoleFilterChange,
  onSortByChange,
  onSortOrderChange,
}: UserSearchFilterProps) {
  return (
    <div className="space-y-4">
      {/* 検索ボックス */}
      <Input
        id="search"
        label="ユーザー名"
        type="text"
        value={searchQuery}
        onChange={(e) => {
          onSearchChange(e.target.value);
        }}
        placeholder="ユーザー名で検索"
      />

      {/* ロールフィルター */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Select
            id="roleFilter"
            label="ロールフィルター"
            selectedKeys={[String(roleFilter)]}
            onSelectionChange={(keys) => {
              // Set から最初の要素を取得
              const selected = Array.from(keys)[0] as string;
              // 'all' の場合はそのまま、数値の場合は Number に変換
              onRoleFilterChange(selected === 'all' ? 'all' : Number(selected));
            }}
          >
            <SelectItem key="all">すべて</SelectItem>
            <SelectItem key="1">ADMIN</SelectItem>
            <SelectItem key="2">MANAGER</SelectItem>
            <SelectItem key="3">USER</SelectItem>
            <SelectItem key="4">GUEST</SelectItem>
          </Select>
        </div>
        {/* ソート項目 */}
        <div>
          <Select
            id="sortBy"
            label="並び順"
            selectedKeys={[sortBy]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as SortBy;
              onSortByChange(selected);
            }}
          >
            <SelectItem key="createdAt">作成日時</SelectItem>
            <SelectItem key="username">ユーザー名</SelectItem>
            <SelectItem key="firstName">名前</SelectItem>
            <SelectItem key="lastName">姓</SelectItem>
            <SelectItem key="role">ロール</SelectItem>
          </Select>
        </div>

        <div>
          <Select
            id="sortOrder"
            label="順序"
            selectedKeys={[sortOrder]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as SortOrder;
              onSortOrderChange(selected);
            }}
          >
            <SelectItem key="desc">降順</SelectItem>
            <SelectItem key="asc">昇順</SelectItem>
          </Select>
        </div>
      </div>
    </div>
  );
}
