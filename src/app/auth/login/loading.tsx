// サスペンスを活用したローディングUIを表示
export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">ログイン</h1>
        <div className="bg-blue-300 rounded px-3 py-1 w-20 h-8" />
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md bg-white rounded shadow-md p-8 animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded mb-6 mx-auto" />
          {/* ユーザー名 */}
          <div className="mb-4">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
          {/* パスワード */}
          <div className="mb-4">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
          {/* ログインボタン */}
          <div className="h-10 w-full bg-blue-200 rounded mt-6" />
        </div>
      </main>
    </div>
  );
}
