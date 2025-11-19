import { Card, CardBody, Chip } from '@heroui/react';
import { UserCardProps } from '../../../types/user-components';
import { Text } from '../../atoms/Text/Text';
import { UserAvatar } from '../UserAvatar/UserAvatar';

export const UserCard: React.FC<UserCardProps> = ({
  user,
  compact = false,
  onClick,
  showTodoCount = false,
  todoCount = 0,
  className,
  testId
}) => {
  const handleClick = () => {
    onClick?.(user);
  };

  return (
    <Card 
      className={`w-full ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className || ''}`}
      isPressable={!!onClick}
      onPress={handleClick}
      data-testid={testId}
    >
      <CardBody className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between">
          {/* ユーザー情報 */}
          <div className="flex-1">
            <UserAvatar 
              user={user} 
              size={compact ? 'sm' : 'md'}
            />
            
            {!compact && (
              <div className="mt-2 space-y-1">
                
                <div className="flex items-center gap-1">
                  <Text size="sm" color="muted">
                    {new Date(user.createdAt).toLocaleDateString('ja-JP')}に参加
                  </Text>
                </div>
              </div>
            )}
          </div>

          {/* Todo数表示 */}
          {showTodoCount && (
            <Chip size="sm" variant="flat" color="primary">
              {todoCount} Todo
            </Chip>
          )}
        </div>
      </CardBody>
    </Card>
  );
};