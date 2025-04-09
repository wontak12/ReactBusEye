import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./css/gnb.css";
import "./css/sidebar/sidedown.css";
import "./css/sidebar/sideup.css";
import "./css/kakaomap.css";
import "./css/calender.css";
import "./css/login.css";
import Gnb from "./component/gnb.js";
import Sidebar from "./component/sidebar.js";
import KakaoMap from "./component/kakaomap.js";
import Calendar from "./component/calender.js";
import Login from "./component/login.js";
import reportWebVitals from "./reportWebVitals";
import { startAutoLogout, startTokenAutoRefresh } from "./services/authService";

const AppContainer = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [selectedTab, setSelectedTab] = useState("전체");
  const [isConnected, setIsConnected] = useState(false);
  const [buses, setBuses] = useState([]);
  const [busOpStatus, setBusOpStatus] = useState({});

  // KakaoMap 내부 함수에 접근하기 위한 ref 선언
  const kakaoMapRef = useRef(null);

  const handleVehicleSelect = (vehicle) => {
    console.log("Vehicle clicked:", vehicle);
    if (selectedBus && selectedBus.bus_id === vehicle.bus_id) {
      setSelectedBus(null);
      setTimeout(() => {
        setSelectedBus(vehicle);
        setCalendarVisible(true);
        setSidebarVisible(false);
      }, 0);
    } else {
      setSelectedBus(vehicle);
      setCalendarVisible(true);
      setSidebarVisible(false);
    }
  };

  const handleOpenCalendar = () => {
    setCalendarVisible(true);
    setSidebarVisible(false);
  };

  // Calendar의 X 버튼 클릭 시 호출 – KakaoMap의 closeAllOverlays() 실행 후 캘린더 숨김
  const handleCloseCalendar = () => {
    if (kakaoMapRef.current) {
      kakaoMapRef.current.closeAllOverlays();
    }
    setCalendarVisible(false);
    setSidebarVisible(true);
    setRoutePoints([]);
  };

  return (
    <>
      <Gnb />
      <div className="contentsBox">
        {sidebarVisible && (
          <Sidebar
            onVehicleSelect={handleVehicleSelect}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            buses={buses}
            busOpStatus={busOpStatus}
          />
        )}
        {calendarVisible && (
          <Calendar
            selectedBus={selectedBus}
            busOpStatus={busOpStatus}
            setCalendarVisible={setCalendarVisible}
            closeCalendar={handleCloseCalendar}  // 부모의 closeCalendar 전달
            onRouteSelect={setRoutePoints}
          />
        )}
        <KakaoMap
          ref={kakaoMapRef}  // ref를 통해 KakaoMap 내부 함수 접근
          isConnected={isConnected}
          setIsConnected={setIsConnected}
          selectedBus={selectedBus}
          setSelectedBus={setSelectedBus}
          openCalendar={handleOpenCalendar}
          routePoints={routePoints}
          selectedTab={selectedTab}
          buses={buses}
          setBuses={setBuses}
          busOpStatus={busOpStatus}
          setBusOpStatus={setBusOpStatus}
        />
      </div>
    </>
  );
};

const Root = () => {
  useEffect(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handleUserActivity = () => {
      startAutoLogout();
    };

    window.addEventListener("click", handleUserActivity);
    return () => {
      window.removeEventListener("click", handleUserActivity);
    };
  }, []);

  // 로그인 성공 시 호출 (Login 컴포넌트에서 onLoginSuccess prop을 통해)
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    console.log("[Root] 로그인 성공, 토큰 유지");
    startAutoLogout();
    // 여기서 토큰 자동 갱신 시작 (30분마다)
    const refreshIntervalId = startTokenAutoRefresh();
    // 필요 시 컴포넌트 unmount 시 정리
    return () => clearInterval(refreshIntervalId);
  };

  

  return isAuthenticated ? (
    <AppContainer />
  ) : (
    <Login onLoginSuccess={handleLoginSuccess} />
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

reportWebVitals();
