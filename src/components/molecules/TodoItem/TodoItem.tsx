import { Button, Card, CardBody, Checkbox } from '@heroui/react';
import { TodoItemProps } from '../../../types/todo-components';
import { Text } from '../../atoms/Text/Text';

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onEdit,
  onDelete,
  onToggle,
  testId
}) => {
  return (
    <Card className="w-full" data-testid={testId}>
      <CardBody className="flex flex-row items-start gap-3">
        {/* 完了チェックボックス */}
        <Checkbox
          isSelected={todo.completed}
          onValueChange={() => onToggle?.(todo.id)}
          aria-label={`${todo.title}を${todo.completed ? '未完了' : '完了'}にする`}
        />

        {/* Todo内容 */}
        <div className="flex-1">
          <Text 
            weight="medium"
            className={todo.completed ? 'line-through text-gray-500' : ''}
          >
            {todo.title}
          </Text>
          
          {todo.descriptions && (
            <Text 
              size="sm" 
              color="muted"
              className={todo.completed ? 'line-through' : ''}
            >
              {todo.descriptions}
            </Text>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onClick={() => onEdit?.(todo)}
            aria-label={`${todo.title}を編集`}
          >

          </Button>
          
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onClick={() => onDelete?.(todo.id)}
            aria-label={`${todo.title}を削除`}
          >
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};