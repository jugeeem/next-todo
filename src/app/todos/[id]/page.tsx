import TodoDetail from '@/features/todos/components/Detail';

export const metadata = {
  title: 'Todo詳細',
  description: 'Todo詳細ページ',
};

interface TodoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  const { id } = await params;

  return <TodoDetail todoId={id} />;
}
