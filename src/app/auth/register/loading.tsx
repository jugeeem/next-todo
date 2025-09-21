export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ユーザー登録</h1>
        <div className="bg-blue-300 rounded px-3 py-1 w-20 h-8" />
      </header>
      <div className="w-full max-w-md bg-white rounded shadow-md p-8 mx-auto mt-12 animate-pulse">
        <div className="h-8 w-40 bg-gray-200 rounded mb-6 mx-auto" />
        {/* ユーザー名 */}
        <div className="mb-4">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-100 rounded" />
        </div>
        {/* 名・姓 */}
        <div className="mb-4 flex gap-2">
          <div className="w-full">
            <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
          <div className="w-full">
            <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
        </div>
        {/* 名のよみ・姓のよみ */}
        <div className="mb-4 flex gap-2">
          <div className="w-full">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
          <div className="w-full">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
        </div>
        {/* 権限 */}
        <div className="mb-4">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-100 rounded" />
        </div>
        {/* パスワード */}
        <div className="mb-4">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-100 rounded" />
        </div>
        {/* パスワード確認 */}
        <div className="mb-4">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-100 rounded" />
        </div>
        {/* 登録ボタン */}
        <div className="h-10 w-full bg-blue-200 rounded mt-6" />
      </div>
    </div>
  );
}
