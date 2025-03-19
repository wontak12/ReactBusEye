// src/component/login.js
import React, { useState } from "react";
import { login as authLogin } from "../services/authService"; // authService.js의 login 함수를 가져옴

function Login({ onLoginSuccess }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("[Login] handleSubmit 호출");
    console.log("[Login] 입력값 userId:", userId, " / password:", password);

    // authService.js의 login 함수를 호출합니다.
    const result = await authLogin(userId, password);
    if (result.success) {
      console.log("[Login] 로그인 성공, 토큰 저장 완료, onLoginSuccess 호출");
      onLoginSuccess();
    } else {
      console.error("[Login] 로그인 실패:", result.error);
      setError("로그인 실패: " + result.error);
    }
  }

  return (
    <div style={{ margin: "50px", textAlign: "center" }}>
      <h2>로그인</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>아이디</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="아이디"
            autoComplete="username"
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" style={{ marginTop: "10px" }}>
          로그인
        </button>
      </form>
    </div>
  );
}

export default Login;
