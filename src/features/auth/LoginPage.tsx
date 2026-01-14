"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { z } from "zod";

type FieldsErrors = {username?:string; password?:string}

const loginSchema = z.object({
  username:z.string().min(1,{message: "このフィールドを入力してください"}),
  password:z.string().min(1,{message: "このフィールドを入力してください"}),
})

export default function LoginPage() {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [fieldErrors,setFieldErrors] = useState<FieldsErrors>({})

  const router = useRouter()


  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();

    //フォームエラーの初期化
    setError("")
    //前回入力のエラーを初期化
    setFieldErrors({})

    const result = loginSchema.safeParse({username,password})

    if(!result.success){
      const fe = result.error.flatten().fieldErrors;
      setFieldErrors({
        username: fe.username?.[0],
        password: fe.password?.[0],
      });
      return
    }

    //ログイン処理
    try{
      const res = await fetch('/api/auth/login' , {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:JSON.stringify({username,password}),
      })

      if (!res.ok) {
        const errorData = await res.json()
        const raw = errorData.error;

        if (raw === "Invalid credentials") {
          setError("ログインに失敗しました");
        }
        return
      }

      //ログイン成功の処理
      router.push('/todos')
    }catch{

    }finally{

    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-xl font-bold mb-3">ログイン</h1>

      <div className="w-full max-w-sm bg-white p-6 rounded-md shadow-md">
        <form onSubmit={handleSubmit} className="flex flex-col mb-3">

      <div className="relative mb-4">
        <label
          htmlFor="username"
          className={`absolute top-1 left-3 text-xs pointer-events-none
            ${fieldErrors.username && "text-red-500"}`
          }
        >
          ユーザー名<span className="text-red-500">*</span>
        </label>

        <input
          id="username"
          type="text"
          value={username}
          placeholder="ユーザー名を入力"
          className={`w-full pt-6 px-3 pb-2 rounded-md focus:outline-none focus:ring-2 ${
            fieldErrors.username
              ? "bg-red-100 ring-2 ring-red-200 focus:ring-red-300"
              : "bg-gray-100 focus:ring-blue-500"
          }`}
          onChange={(e) => {
            setUsername(e.target.value);
            setFieldErrors(prev => ({ ...prev, username: undefined }));
            setError("");
          }}
        />

        {fieldErrors.username && (
          <p className="text-xs text-red-600 mt-1">
            {fieldErrors.username}
          </p>
        )}
      </div>

      <div className="relative mb-4">
        <label
          htmlFor="password"
          className={`absolute top-1 left-3 text-xs pointer-events-none
            ${fieldErrors.password && "text-red-500"}`
          }        
          >
          パスワード<span className="text-red-500">*</span>
        </label>

        <input
          id="password"
          type="password"
          value={password}
          placeholder="パスワードを入力"
          className={`w-full pt-6 px-3 pb-2 rounded-md focus:outline-none focus:ring-2 ${
            fieldErrors.password
              ? "bg-red-100 ring-2 ring-red-200 focus:ring-red-300"
              : "bg-gray-100 focus:ring-blue-500"
          }`}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors(prev => ({ ...prev, password: undefined }));
            setError("");
          }}
        />

          {fieldErrors.password && (
            <p className="text-xs text-red-600 mt-1">
              {fieldErrors.password}
            </p>
          )}
      </div>
      {error && (
        <div className="text-red-700 text-xs bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          {error}
        </div>
      )}

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
