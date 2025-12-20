'use client'
import { useState } from "react";

export default function LoginPage(){
    const[username,setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('')
const handleSubmit = () => {
    //ログイン処理
}

    return(
        <div>
            <h1>ログインページ</h1>
            <form onSubmit={handleSubmit}>
                <input
                type="text"
                value={username}
                onChange={(e) => {
                    setUsername(e.target.value)
                }}
                />
                <input
                type="text"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value)
                }}
                />

                <button type="submit">ログイン</button>
                
            </form>
        </div>
    )
}