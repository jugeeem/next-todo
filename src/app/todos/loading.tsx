export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* ヘッダー部分 */}
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>

        {/* フィルター・ソート部分 */}
        <div className="flex gap-4 mb-6">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Todo作成フォーム */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="h-10 bg-gray-200 rounded mb-3"></div>
          <div className="h-20 bg-gray-200 rounded mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Todo一覧 */}
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>

        {/* ページネーション */}
        <div className="flex justify-center gap-4 mt-6">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}
