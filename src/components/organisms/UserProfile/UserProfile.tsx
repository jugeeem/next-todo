import { CalendarIcon, EnvelopeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Button, Card, CardBody, Divider } from '@heroui/react';
import { UserProfileProps } from '../../../types/user-components';
import { Text } from '../../atoms/Text/Text';
import { UserAvatar } from '../../molecules/UserAvatar/UserAvatar';

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  showEmail = true,
  showCreatedAt = true,
  editable = false,
  onEdit,
  className,
  testId
}) => {
  return (
    <Card className={`w-full ${className || ''}`} data-testid={testId}>
      <CardBody className="p-6">
        {/* ヘッダー部分 */}
        <div className="flex items-start justify-between mb-4">
          <UserAvatar user={user} size="lg" showName={false} />
          
          {editable && (
            <Button
              size="sm"
              variant="light"
              startContent={<PencilIcon className="h-4 w-4" />}
              onClick={() => onEdit?.(user)}
            >
              編集
            </Button>
          )}
        </div>

        {/* ユーザー名 */}
        <Text size="xl" weight="bold" className="mb-2">
          {user.name}
        </Text>

        <Divider className="my-4" />

        {/* 詳細情報 */}
        <div className="space-y-3">
          {showEmail && (
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="w-4 h-4 text-gray-400" />
              <Text size="sm" color="muted">
                {user.email}
              </Text>
            </div>
          )}

          {showCreatedAt && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <Text size="sm" color="muted">
                {new Date(user.createdAt).toLocaleDateString('ja-JP')}に参加
              </Text>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};