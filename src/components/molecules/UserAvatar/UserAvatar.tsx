import { Avatar } from '@heroui/react';
import { UserAvatarProps } from '../../../types/user-components';
import { Text } from '../../atoms/Text/Text';

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showName = true,
  className,
  testId
}) => {
  // サイズに応じたアバターサイズを決める
  const avatarSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  // サイズに応じたテキストサイズを決める
  const textSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const
  };

  return (
    <div 
      className={`flex items-center gap-2 ${className || ''}`}
      data-testid={testId}
    >
      {/* アバター画像 */}
      <Avatar
        size={size}
        name={user.username}
        classNames={{
          base: avatarSizes[size]
        }}
      />

      {/* ユーザー名 */}
      {showName && (
        <Text size={textSizes[size]} weight="medium">
          {user.username}
        </Text>
      )}
    </div>
  );
};