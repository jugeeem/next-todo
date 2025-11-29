'use client';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import type { User } from './types';

/**
 * ProfileDisplayのPropsインターフェース。
 */
interface ShowProfileInfoProps {
  user: User;
  onEdit: () => void;
}

/**
 * プロフィール表示コンポーネント。
 * ユーザーの名前と姓を表示し、編集ボタンを提供します。
 *
 * @param {ShowProfileInfoProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} プロフィール表示コンポーネント
 */
export function ShowProfileInfo({ user, onEdit }: ShowProfileInfoProps) {
  return (
    <Card className='p-6 mb-8'>
      <CardHeader className='justify-between mb-4'>
        <h2 className='text-2xl font-semibold text-gray-900'>
          プロフィール情報
        </h2>
        <Button
          type='button'
          onPress={onEdit}
          color='primary'
          className='font-medium'
        >
          編集
        </Button>
      </CardHeader>

      <CardBody className='space-y-4'>
        <div>
          <p className='text-sm font-medium text-gray-600 mb-1'>ユーザー名</p>
          <p className='text-gray-900'>{user.username}</p>
        </div>
        <div>
          <p className='text-sm font-medium text-gray-600 mb-1'>姓</p>
          <p className='text-gray-900'>{user.lastName || '未設定'}</p>
        </div>
        <div>
          <p className='text-sm font-medium text-gray-600 mb-1'>名</p>
          <p className='text-gray-900'>{user.firstName || '未設定'}</p>
        </div>
      </CardBody>
    </Card>
  );
}
