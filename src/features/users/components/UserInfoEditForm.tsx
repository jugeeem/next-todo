'use client';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { useState } from 'react';
import type { User } from './types';
import { roleLabels } from './types';

/**
 * UserInfoEditFormのPropsタイプ定義
 *
 * @interface UserInfoEditFormProps - UserInfoEditFormコンポーネントのプロパティタイプ定義
 * @property {User} user - 編集するユーザー情報
 * @property {number} currentUserRole - 現在のログインユーザーの権限情報
 * @property {boolean} isSaving - 保存中フラグ
 * @property {(firstName: string, lastName: string, role: number) => Promise<void>} onSave - 保存ボタン押下時のコールバック関数
 * @property {() => void} onCancel - キャンセルボタン押下時のコールバック関数
 *
 */
interface UserInfoEditFormProps {
  user: User;
  currentUserRole: number;
  isSaving: boolean;
  onSave: (firstName: string, lastName: string, role: number) => Promise<void>;
  onCancel: () => void;
}

/**
 * ユーザー情報編集フォームコンポーネント。
 * ユーザーの詳細情報を編集するためのフォームを提供します。
 *
 * @param {UserInfoEditFormProps} props - コンポーネントのプロパティ
 * @return {JSX.Element} - ユーザー情報編集フォームコンポーネント
 */
export function UserInfoEditForm({
  user,
  currentUserRole,
  isSaving,
  onSave,
  onCancel,
}: UserInfoEditFormProps) {
  // ステートの定義
  // 名前の情報
  const [firstName, setFirstName] = useState<string>(user.firstName || '');
  // 姓の情報
  const [lastName, setLastName] = useState<string>(user.lastName || '');
  // ユーザー権限
  const [role, setRole] = useState<number>(user.role);

  /**
   * 保存ボタン押下時のハンドラー
   *
   * @return {Promise<void>} - 保存処理の完了を示すPromise
   */
  const handleSave = async () => {
    await onSave(firstName, lastName, role);
  };

  /**
   * 編集時に選択可能な権限オプションを生成する。
   * ADMIN: すべての権限を選択可能
   */
  const editableRoles = (currentUserRole === 1 ? [1, 2, 3, 4] : [2, 3, 4]).map(
    (roleValue) => ({
      value: roleValue,
      label: roleLabels[roleValue],
    }),
  );

  return (
    <Card className="p-8 mb-8">
      <CardHeader className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-gray-900">ユーザー情報編集</h3>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onPress={handleSave}
            color="primary"
            isLoading={isSaving}
            className="font-medium"
          >
            {isSaving ? '保存中' : '保存'}
          </Button>
          <Button
            type="button"
            onPress={() => {
              onCancel();
            }}
            isDisabled={isSaving}
            className="font-medium"
          >
            キャンセル
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* 名前編集 */}

        {/* ユーザー名 */}
        <div>
          {/* Inputに変更 STEP3 MOD START */}
          <Input
            id="username"
            type="text"
            isDisabled
            isReadOnly
            label="ユーザー名"
            defaultValue={user.username}
          />
          {/* STEP3 MOD END */}
        </div>

        {/* 姓 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {/* input → Input STEP3 MOD START */}
            <Input
              id="lastName"
              label="姓"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="姓"
            />
            {/* STEP3 MOD END */}
          </div>

          {/* 名 */}
          <div>
            {/* input → Input STEP3 MOD START */}
            <Input
              id="firstName"
              label="名"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="名"
            />
            {/* STEP3 MOD END */}
          </div>
        </div>

        {/* 権限編集 */}
        <div>
          {/* select → Select STEP3 MOD START */}
          <Select
            id="role"
            label="ロール"
            selectedKeys={[String(role)]}
            onSelectionChange={(keys) => {
              const selectedRole = Array.from(keys)[0];
              setRole(Number(selectedRole));
            }}
            isRequired
            validationBehavior="aria"
            placeholder="ロールを選択してください"
          >
            {editableRoles.map((roleOption) => (
              <SelectItem key={String(roleOption.value)}>{roleOption.label}</SelectItem>
            ))}
          </Select>
        </div>
      </CardBody>
    </Card>
  );
}
