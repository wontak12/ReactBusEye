// src/services/authService.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://104.197.230.228:8000";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// 자동 로그아웃을 위한 timeout ID를 저장
let logoutTimeoutId = null;

export async function login(userId, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      user_id: userId,
      password: password,
    });
    if (
      response.data &&
      response.data.result === "true" &&
      response.data.data &&
      response.data.data.access &&
      response.data.data.refresh
    ) {
      localStorage.setItem(ACCESS_TOKEN_KEY, response.data.data.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.data.refresh);
      localStorage.setItem("user_info", JSON.stringify(response.data.data.authenticatedUser));
      
      // 로그인 성공 후 10분 후 자동 로그아웃 시작
      startAutoLogout();
      
      return { success: true };
    } else {
      return { success: false, error: "토큰이 없습니다." };
    }
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

export async function refreshAccessToken() {
  // 이 함수는 더 이상 사용하지 않습니다.
  // 만약 토큰 갱신을 시도할 경우 자동 로그아웃 처리로 대체됩니다.
  throw new Error("토큰 재발급 대신 재로그인이 필요합니다.");
}

export function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("user_info");
  stopAutoLogout(); // 로그아웃 시 자동 로그아웃 타이머 중지
  window.location.href = "/login";
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

// 10분 후 자동 로그아웃을 시작하는 함수
export function startAutoLogout() {
  // 기존 타이머가 있으면 제거하여 중복 실행 방지
  if (logoutTimeoutId) clearTimeout(logoutTimeoutId);
  
  // 10분(600,000ms) 후에 logout() 호출
  logoutTimeoutId = setTimeout(() => {
    logout();
  }, 600000);
}

// 자동 로그아웃을 중지하는 함수 (예: 로그아웃 시 호출)
export function stopAutoLogout() {
  if (logoutTimeoutId) {
    clearTimeout(logoutTimeoutId);
    logoutTimeoutId = null;
  }
}
