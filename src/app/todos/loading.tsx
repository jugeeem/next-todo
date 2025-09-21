export default function Loading() {
  // 固定のダミーID配列
  const skeletonIds = ['a', 'b', 'c', 'd', 'e'];

  return (
    <div className="bg-gray-50 min-h-screen" aria-busy="true">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">Todoアプリ</h1>
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          プロフィール
        </button>
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          ログアウト
        </button>
      </header>
      <main className="p-4 flex flex-col items-center">
        <span
          className="inline-block h-[28px] w-24 mb-4 bg-gray-200 rounded animate-pulse"
          aria-hidden="true"
        />
        <span
          className="inline-block h-[28px] w-16 mb-4 bg-gray-200 rounded animate-pulse"
          aria-hidden="true"
        />
        <div
          className="h-[32px] w-[96px] py-1 px-4 my-4 bg-gray-200 rounded-full animate-pulse"
          aria-hidden="true"
        />
        <div className="w-full max-w-2xl mx-auto">
          {skeletonIds.map((id) => (
            <div
              key={id}
              className="h-[148px] bg-white rounded-lg shadow-md mb-6 overflow-hidden animate-pulse"
              aria-hidden="true"
            >
              <div className="mb-2 flex justify-between items-center bg-blue-200 p-2">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded" />
              </div>
              <div className="p-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-8 w-24 bg-gray-200 rounded-full mt-2" />
              </div>
            </div>
          ))}
        </div>
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-4 my-4 text-center animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
        </div>
      </main>
      <span className="sr-only">Todo一覧を読み込んでいます</span>
    </div>
  );
}
