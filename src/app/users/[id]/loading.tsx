// ユーザー詳細ページ専用ローディングスケルトン（UserDetailの見た目を忠実に再現・アバター画像なし）

export default function Loading() {
  // 固定のダミーID配列
  const skeletonIds = ['a', 'b', 'c'];

  return (
    <div className="bg-gray-50 min-h-screen" aria-busy="true">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー詳細</h1>
        <span className="text-sm"></span>
        <button
          type="button"
          className="bg-blue-300 px-3 py-1 rounded w-24 h-8"
          disabled
        >
          -
        </button>
      </header>

      <main className="w-[80%] min-w-[320px] max-w-2xl mt-6 mx-auto flex flex-col gap-6">
        {/* プロフィールカードのスケルトン（アバターなし） */}
        <section className="w-full max-w-2xl mx-auto flex flex-col items-center bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
          <div className="flex gap-4 mb-4 w-full justify-center">
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        </section>

        {/* アクションボタンのスケルトン */}
        <div className="w-full max-w-2xl flex gap-4 justify-center">
          <div className="h-10 w-28 bg-gray-200 rounded" />
          <div className="h-10 w-28 bg-gray-200 rounded" />
        </div>

        {/* Todo統計 & 一覧のスケルトン */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-4 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div className="h-6 w-24 bg-gray-200 rounded" />
            <div className="flex gap-6">
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          </div>
          {/* タスク一覧スケルトン */}
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
            <div className="grid gap-4">
              {skeletonIds.map((id) => (
                <div key={id} className="bg-gray-100 rounded-lg shadow-md h-14" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
