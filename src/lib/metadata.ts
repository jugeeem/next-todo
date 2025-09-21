export function generatePageMetadata({ title, url }: { title: string; url: string }) {
  return {
    title: title,
    description: `${title}ページ`,
    canonical: `localhost:3000/${url}`,
  };
}

export function generateTodoMetadata({ todoId }: { todoId: string }) {
  return {
    title: 'Todo詳細',
    description: 'Todo詳細ページ',
    canonical: `localhost:3000/todos/${todoId}`,
  };
}

export function generateUserMetadata({ userId }: { userId: string }) {
  return {
    title: 'ユーザー詳細',
    description: 'ユーザー詳細ページ',
    canonical: `localhost:3000/users/${userId}`,
  };
}
