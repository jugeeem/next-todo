'use client';

import { useState } from 'react';

export default function TodoForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initialValues?: { title: string; descriptions?: string };
  onSubmit: (form: { title: string; descriptions?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    descriptions: initialValues?.descriptions || '',
  });
  const [error, setError] = useState<
    Partial<{ titleError: string | null; descriptionsError: string | null }>
  >({ titleError: null, descriptionsError: null });
  const [isSending, setIsSending] = useState(false);

  // リアルタイムバリデーション
  const validateForm = (target?: { name: string; value: string }) => {
    const newError = { ...error };
    let valid = true;

    // タイトル
    const titleValue = target?.name === 'title' ? target.value : form.title;
    if (!titleValue) {
      newError.titleError = 'タイトルは必須です';
      valid = false;
    } else if (titleValue.length > 100) {
      newError.titleError = 'タイトルは100文字以内で入力してください';
      valid = false;
    } else {
      newError.titleError = null;
    }

    // 説明
    const descValue =
      target?.name === 'descriptions' ? target.value : form.descriptions;
    if (descValue && descValue.length > 500) {
      newError.descriptionsError = '説明は500文字以内で入力してください';
      valid = false;
    } else {
      newError.descriptionsError = null;
    }

    setError(newError);
    return valid;
  };

  const handleTaskUpdate = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validateForm({ name, value }); // 入力ごとにバリデーション
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSending(true);
    onSubmit(form);
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Ctrl+Enterのみ送信、Enter単体は無効化
    if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="w-80 mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">
        {mode === 'create' ? '新規Todo作成' : 'Todo編集'}
      </h2>
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="title">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            className="w-full px-3 py-2 border rounded"
            placeholder="Todoのタイトルを入力"
            onChange={handleTaskUpdate}
          />
          {error && <p className="text-red-500">{error.titleError}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="descriptions">
            説明
          </label>
          <textarea
            id="descriptions"
            name="descriptions"
            value={form.descriptions}
            className="w-full px-3 py-2 border rounded"
            placeholder="Todoの説明を入力 (任意)"
            onChange={handleTaskUpdate}
          />
          {error && <p className="text-red-500">{error.descriptionsError}</p>}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className={`bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSending}
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 ml-2 rounded transition-colors ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSending}
          >
            {mode === 'create' ? '作成' : '更新'}
          </button>
        </div>
      </form>
    </div>
  );
}
