'use client';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
        <p className="text-red-700 mb-4">
          {error.message || 'プロフィール情報の読み込み中にエラーが発生しました。'}
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/todos';
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Todo一覧に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
