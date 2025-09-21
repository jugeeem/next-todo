export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
        <h1 className="text-xl font-bold">プロフィール</h1>
        <div className="flex gap-2">
          <div className="bg-blue-300 rounded px-3 py-1 w-20 h-8" />
          <div className="bg-blue-300 rounded px-3 py-1 w-24 h-8" />
        </div>
      </header>
      <main className="p-6 w-full max-w-2xl bg-white rounded-lg shadow-md mt-6 mx-auto flex flex-col items-center animate-pulse">
        <div className="text-2xl font-bold mb-4 bg-gray-200 rounded w-48 h-8" />
        <div className="w-full">
          <div className="mb-2 h-6 w-1/2 bg-gray-100 rounded" />
          <div className="mb-2 h-6 w-1/2 bg-gray-100 rounded" />
          <div className="mb-2 h-6 w-1/3 bg-gray-100 rounded" />
          <div className="mb-2 h-6 w-1/2 bg-gray-100 rounded" />
          <div className="mb-2 h-6 w-1/2 bg-gray-100 rounded" />
        </div>
      </main>
    </div>
  );
}
