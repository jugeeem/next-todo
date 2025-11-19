import { Button } from '@heroui/react';
import { useState } from 'react';
import { UserFormData, UserFormProps } from '../../../types/user-components';
import { FormField } from '../../molecules/FormField/FormField';

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  submitButtonText = '保存',
  isEditMode = false,
  error,
  testId
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: initialData?.password || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof UserFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid={testId}>
      <FormField
        label="ユーザー名"
        placeholder="ユーザー名を入力してください"
        value={formData.name}
        onValueChange={handleChange('name')}
        required
      />

      <FormField
        label="メールアドレス"
        type="email"
        placeholder="メールアドレスを入力してください"
        value={formData.email}
        onValueChange={handleChange('email')}
        required
      />

      {/* 編集モードでない場合のみパスワードフィールドを表示 */}
      {!isEditMode && (
        <FormField
          label="パスワード"
          type="password"
          placeholder="パスワードを入力してください"
          description="8文字以上で入力してください"
          value={formData.password}
          onValueChange={handleChange('password')}
          required
        />
      )}

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