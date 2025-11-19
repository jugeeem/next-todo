import { Todo } from '@/domain/entities/Todo';
import { BaseComponentProps } from '../../../types/components';
import { Text } from '../../atoms/Text/Text';
import { TodoItem } from '../../molecules/TodoItem/TodoItem';

interface TodoListProps extends BaseComponentProps {
  todos: Todo[];
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
  emptyMessage?: string;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onEdit,
  onDelete,
  onToggle,
  emptyMessage = 'Todoがありません',
  testId
}) => {
  if (todos.length === 0) {
    return (
      <div className="text-center py-8" data-testid={testId}>
        <Text color="muted">{emptyMessage}</Text>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid={testId}>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};