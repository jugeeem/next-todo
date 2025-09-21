export default function loading() {
  // 固定のダミーID配列
  const skeletonIds = ['a', 'b', 'c'];

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white animate-pulse">
        <div className="h-6 w-32 bg-blue-300 rounded" />
        <div className="h-6 w-24 bg-blue-300 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-blue-300 rounded" />
          <div className="h-8 w-20 bg-blue-300 rounded" />
        </div>
      </header>
      <main className="p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-10 w-full bg-gray-100 rounded" />
            </div>
            <div className="w-full lg:w-48">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-10 w-full bg-gray-100 rounded" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center">
              <div className="h-4 w-24 bg-blue-100 rounded" />
            </div>
          </div>
        </div>
        {/* ユーザーリストのスケルトン */}
        {skeletonIds.map((id) => (
          <div
            key={id}
            className="flex justify-between items-center p-4 bg-white rounded-lg mb-2 animate-pulse"
          >
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-6 w-24 bg-gray-100 rounded" />
            </div>
            <div className="flex flex-col">
              <div className="h-4 w-12 bg-gray-200 rounded mb-2" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-10 bg-gray-100 rounded" />
                <div className="h-6 w-10 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="text-center">
              <div className="h-4 w-10 bg-gray-200 rounded mb-1" />
              <div className="h-6 w-16 bg-gray-100 rounded" />
            </div>
            <div className="text-center">
              <div className="h-4 w-10 bg-gray-200 rounded mb-1" />
              <div className="h-6 w-16 bg-gray-100 rounded" />
            </div>
            <div className="text-center">
              <div className="h-4 w-10 bg-gray-200 rounded mb-1" />
              <div className="h-6 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-blue-200 rounded" />
          </div>
        ))}
        {/* ページネーションのスケルトン */}
        <div className="flex justify-center items-center mt-8 space-x-4">
          <div className="h-10 w-28 bg-gray-200 rounded" />
          <div className="h-10 w-32 bg-gray-100 rounded" />
          <div className="h-10 w-28 bg-gray-200 rounded" />
        </div>
      </main>
    </div>
  );
}
