export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen" aria-busy="true">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
        >
          戻る
        </button>
        <h1>Todo Detail</h1>
      </header>
      <main className="p-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">
          <span className="sr-only">Todo詳細を読み込み中</span>
          <span
            className="inline-block w-32 h-6 bg-gray-200 rounded animate-pulse"
            aria-hidden="true"
          />
        </h1>

        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                <span className="sr-only">タイトル</span>
                <span
                  className="inline-block w-40 h-5 bg-gray-200 rounded"
                  aria-hidden="true"
                />
              </h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">説明:</span>
                  <span
                    className="inline-block w-48 h-4 bg-gray-200 rounded ml-2"
                    aria-hidden="true"
                  />
                </p>
                <p>
                  <span className="font-medium">ステータス:</span>{' '}
                  <span
                    className="inline-block w-20 h-4 bg-gray-200 rounded ml-2"
                    aria-hidden="true"
                  />
                </p>
                <p>
                  <span className="font-medium">作成者:</span>{' '}
                  <span
                    className="inline-block w-24 h-4 bg-gray-200 rounded ml-2"
                    aria-hidden="true"
                  />
                </p>
                <p>
                  <span className="font-medium">作成日:</span>{' '}
                  <span
                    className="inline-block w-28 h-4 bg-gray-200 rounded ml-2"
                    aria-hidden="true"
                  />
                </p>
                <p>
                  <span className="font-medium">更新日:</span>{' '}
                  <span
                    className="inline-block w-28 h-4 bg-gray-200 rounded ml-2"
                    aria-hidden="true"
                  />
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <span
                  className="inline-block h-10 w-24 bg-gray-200 rounded"
                  aria-hidden="true"
                />
                <span
                  className="inline-block h-10 w-24 bg-gray-200 rounded"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <span className="sr-only">Todo詳細を読み込んでいます</span>
    </div>
  );
}
