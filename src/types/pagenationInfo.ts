/**
 * ページネーション情報を表すインターフェース
 */
export interface PaginationInfo {
  currentPage: number; // 現在のページ番号
  totalPages: number; // 総ページ数
  totalItems: number; // 総アイテム数
  itemsPerPage: number; // 1ページあたりのアイテム数
}
