import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://104.197.230.228:8000";
// 웹소켓 기본 URL (환경변수 또는 직접 입력)
export const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let logoutTimeoutId = null;

/**
 * 로그인 API 호출 및 토큰 저장
 */
export async function login(userId, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      user_id: userId,
      password: password,
    });

    const data = response.data?.data;
    console.log("로그인 응답 데이터:", data);
    if (
      response.data?.result === "true" &&
      data?.access &&
      data?.refresh
    ) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      localStorage.setItem("user_info", JSON.stringify(data.authenticatedUser));
      return { success: true };
    } else {
      return { success: false, error: "서버로부터 유효한 토큰을 받지 못했습니다." };
    }
  } catch (error) {
    console.error("로그인 에러:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * localStorage에서 access token 가져오기
 */
export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * localStorage에서 refresh token 가져오기
 */
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * refresh token으로 토큰 재발급 
 * (로그인 시 받은 refresh 토큰을 사용하여 /token/refresh API 호출)
 */
export async function refreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.error("리프레시 토큰이 없습니다.");
    return false;
  }
  try {
    // /token/refresh 엔드포인트 호출
    const response = await axios.post(`${API_BASE_URL}/token/refresh`, {
      refresh: refreshToken,
    });
    const data = response.data?.data;
    if (response.data?.result === "true" && data?.access && data?.refresh) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      console.log("새로운 토큰이 발급되었습니다.");
      return true;
    } else {
      console.error("유효하지 않은 토큰 응답:", response.data);
      return false;
    }
  } catch (error) {
    console.error("토큰 갱신 에러:", error);
    return false;
  }
}

/**
 * 최신 토큰 반영한 웹소켓 URL 반환 함수
 * useRefresh가 true이면 refresh token, 아니면 access token 사용
 */
export function getWebSocketUrl(useRefresh = false) {
  if (useRefresh) {
    const token = getRefreshToken();
    return token ? `${WEBSOCKET_URL}?token=${token}` : WEBSOCKET_URL;
  } else {
    const token = getAccessToken();
    return token ? `${WEBSOCKET_URL}?token=${token}` : WEBSOCKET_URL;
  }
}

/**
 * 자동 로그아웃 타이머 시작 (30분 후 로그아웃)
 */
export function startAutoLogout() {
  if (logoutTimeoutId) clearTimeout(logoutTimeoutId);
  console.log("[startAutoLogout] 타이머 시작됨");
  // 30분 후 로그아웃 실행
  logoutTimeoutId = setTimeout(() => {
    console.log("[startAutoLogout] 로그아웃 확인창 실행");
    logout();
  }, 30 * 60 * 1000); // 1800000 밀리초
}

/**
 * 자동 로그아웃 타이머 중지
 */
export function stopAutoLogout() {
  if (logoutTimeoutId) {
    clearTimeout(logoutTimeoutId);
    logoutTimeoutId = null;
  }
}

/**
 * 로그아웃 처리: 토큰과 사용자 정보 삭제 후 로그인 페이지로 리디렉션
 */
export function logout() {
  stopAutoLogout(); // 타이머 제거
  alert("자동 로그아웃 됩니다.");
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("user_info");
  window.location.href = "/login";
  window.location.reload();
}

/**
 * 30분마다 refreshTokens()를 호출하여 토큰을 자동 갱신하는 함수
 */
export function startTokenAutoRefresh() {
  const intervalId = setInterval(async () => {
    console.log("[startTokenAutoRefresh] 토큰 갱신 시도");
    const success = await refreshTokens();
    if (!success) {
      console.error("[startTokenAutoRefresh] 토큰 갱신 실패. 로그아웃 실행");
      logout();
    } else {
      const newAccess = getAccessToken();
      const newRefresh = getRefreshToken();
      console.log("[startTokenAutoRefresh] 토큰 갱신 성공", { newAccess, newRefresh });
    }
  }, 30 * 60 * 1000); // 30분마다 실행
  return intervalId;
}
