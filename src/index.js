// src/index.js
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./css/gnb.css";
import "./css/sidebar/sidedown.css";
import "./css/sidebar/sideup.css";
import "./css/kakaomap.css";
import "./css/calender.css";
import Gnb from "./component/gnb.js";
import Sidebar from "./component/sidebar.js";
import KakaoMap from "./component/kakaomap.js";
import Calendar from "./component/calender.js";
import Login from "./component/login.js"; // 로그인 컴포넌트
import reportWebVitals from "./reportWebVitals";

const AppContainer = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  // Sidebar와 KakaoMap에서 사용하는 탭 상태 (예: "운행", "미운행", "전체")
  const [selectedTab, setSelectedTab] = useState("전체");

  const handleVehicleSelect = (vehicle) => {
    console.log("Vehicle clicked:", vehicle);
    // 동일 차량 선택 시 강제 업데이트 (상태 재전달)
    if (selectedBus && selectedBus.bus_id === vehicle.bus_id) {
      setSelectedBus(null);
      setTimeout(() => {
        setSelectedBus(vehicle);
      }, 0);
    } else {
      setSelectedBus(vehicle);
    }
  };

  const handleOpenCalendar = () => {
    setCalendarVisible(true);
    setSidebarVisible(false);
  };

  const handleCloseCalendar = () => {
    setCalendarVisible(false);
    setSidebarVisible(true);
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
          />
        )}
        {calendarVisible && (
          <Calendar
            selectedBus={selectedBus}
            setCalendarVisible={setCalendarVisible}
            closeCalendar={handleCloseCalendar}
            onRouteSelect={setRoutePoints}
          />
        )}
        <KakaoMap
          selectedBus={selectedBus}
          setSelectedBus={setSelectedBus}
          openCalendar={handleOpenCalendar}
          routePoints={routePoints}
          selectedTab={selectedTab} // 탭 상태 전달
        />
      </div>
    </>
  );
};

// Root 컴포넌트: localStorage에 access_token이 있으면 로그인된 것으로 간주
const Root = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token")
  );

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    console.log("[Root] 로그인 성공, 토큰 유지");
  };

  return isAuthenticated ? <AppContainer /> : <Login onLoginSuccess={handleLoginSuccess} />;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

reportWebVitals();
