import React, { useState } from "react";
import { login as authLogin, startAutoLogout } from "../services/authService";


function Login({ onLoginSuccess }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Login] 로그인 요청");

    const result = await authLogin(userId, password);

    if (result.success) {
      console.log("성공", result)
      console.log("[Login] 로그인 성공");
      startAutoLogout();
      onLoginSuccess();
    } else {
      console.log("에러", result)
      console.error("[Login] 로그인 실패:", result.error);
      setError("로그인 실패: " + result.error);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">로그인</h2>
      {error && <p className="login-error">{error}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label>아이디</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="아이디"
            autoComplete="username"
          />
        </div>
        <div className="login-field">
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="login-button">
          로그인
        </button>
      </form>
    </div>
  );
}

export default Login;
