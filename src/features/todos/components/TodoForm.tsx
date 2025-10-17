'use client';

import { Button, Card, CardBody, CardHeader, Input, Textarea } from '@heroui/react';
import { useState } from 'react';

export default function TodoForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit';
  initialValues?: { title: string; descriptions: string; completed?: boolean };
  onSubmit: (form: {
    title: string;
    descriptions: string;
    completed?: boolean;
  }) => void;
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
    <Card shadow="none" className="w-80 p-3">
      <CardHeader>
        <h2 className="text-xl font-bold">
          {mode === 'create' ? '新規Todo作成' : 'Todo編集'}
        </h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <Input
            label="タイトル"
            type="text"
            id="title"
            name="title"
            value={form.title}
            placeholder="Todoのタイトルを入力"
            onChange={handleTaskUpdate}
            className="mb-5"
          />
          {error && <p className="text-red-500">{error.titleError}</p>}
          <div className="mb-4">
            <Textarea
              label="説明"
              id="descriptions"
              name="descriptions"
              value={form.descriptions}
              placeholder="Todoの説明を入力 (任意)"
              onChange={handleTaskUpdate}
            />
            {error && <p className="text-red-500">{error.descriptionsError}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              color="danger"
              disabled={isSending}
              variant="light"
              onPress={onCancel}
            >
              キャンセル
            </Button>
            <Button type="submit" color="primary" disabled={isSending}>
              {mode === 'create' ? '作成' : '更新'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
