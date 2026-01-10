"use client";
import React, { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const handleSubmit = (e: React.FormEvent) => {
    //ログイン処理
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-xl font-bold mb-3">ログイン</h1>

      <div className="w-full max-w-sm bg-white p-6 rounded-md shadow-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-3">
        <div className="flex flex-col gap-1">
        <label
          htmlFor="username"
          className="text-sm text-gray-600"
        >
          ユーザー名<span className="text-red-500">*</span>
        </label>

        <input
          id="username"
          type="text"
          value={username}
          placeholder="ユーザー名を入力"
          className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
          <input
            type="text"
            value={password}
            placeholder="パスワードを入力"
            className="w-full px-3 py-2 border border-gray-100 bg-gray-100 0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />

          <button className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600" type="submit">ログイン</button>
        </form>
        <div className="w-full text-sm text-center">
          アカウントをお持ちでない方は
          <a href="" className="text-blue-500 ml-1">
            新規登録
          </a>
        </div>
      </div>
    </div>
  );
}
