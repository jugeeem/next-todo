import { User } from '../../../domain/entities';
import { BaseComponentProps } from '../../../types/components';
import { Text } from '../../atoms/Text/Text';
import { UserCard } from '../../molecules/UserCard/UserCard';

interface UserListProps extends BaseComponentProps {
  users: User[];
  onUserClick?: (user: User) => void;
  showTodoCount?: boolean;
  todoCountMap?: Record<string, number>; // ユーザーIDをキーにしたTodo数のマップ
  compact?: boolean;
  emptyMessage?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  onUserClick,
  showTodoCount = false,
  todoCountMap = {},
  compact = false,
  emptyMessage = 'ユーザーがいません',
  testId
}) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8" data-testid={testId}>
        <Text color="muted">{emptyMessage}</Text>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid={testId}>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          compact={compact}
          onClick={onUserClick}
          showTodoCount={showTodoCount}
          todoCount={todoCountMap[user.id] || 0}
        />
      ))}
    </div>
  );
};