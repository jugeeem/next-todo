import { Text } from '@/components/atoms/Text/Text';
import { BaseComponentProps, ErrorState } from '@/types/components';
import { Input } from '@heroui/react';

interface FormFieldProps extends BaseComponentProps, ErrorState {
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  required?: boolean;
  description?: string;
  value?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  type = 'text',
  required = false,
  description,
  error,
  isInvalid,
  className,
  testId,
  value,
  ...inputProps
}) => {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {/* ラベル */}
      <Text as="label" weight="medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Text>

      {/* 説明テキスト */}
      {description && (
        <Text size="sm" color="muted">
          {description}
        </Text>
      )}

      {/* 入力フィールド */}
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        isRequired={required}
        isInvalid={isInvalid || !!error}
        errorMessage={error}
        data-testid={testId}
        {...inputProps}
      />
    </div>
  );
};