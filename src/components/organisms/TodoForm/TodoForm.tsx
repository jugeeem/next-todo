import { Button } from '@heroui/react';
import { useState } from 'react';
import { TodoFormData, TodoFormProps } from '../../../types/todo-components';
import { FormField } from '../../molecules/FormField/FormField';

export const TodoForm: React.FC<TodoFormProps> = ({
  initialData,
  onSubmit,
  submitButtonText = '保存',
  error,
  testId
}) => {
  const [formData, setFormData] = useState<TodoFormData>({
    title: initialData?.title || '',
    description: initialData?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof TodoFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid={testId}>
      <FormField
        label="タイトル"
        placeholder="Todoのタイトルを入力"
        value={formData.title}
        onValueChange={handleChange('title')}
        required
      />

      <FormField
        label="説明"
        placeholder="詳細な説明（任意）"
        value={formData.description}
        onValueChange={handleChange('description')}
      />

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        color="primary"
        className="w-full"
      >
        {submitButtonText}
      </Button>
    </form>
  );
};