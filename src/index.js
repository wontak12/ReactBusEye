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
import Login from "./component/login.js";
import reportWebVitals from "./reportWebVitals";

const AppContainer = () => {
  // 화면 전환, 선택된 버스, 탭, 이동경로 등
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [selectedTab, setSelectedTab] = useState("전체");
  
  // 웹소켓 연결 상태 및 버스 데이터/운행 상태는 상위에서 관리
  const [isConnected, setIsConnected] = useState(false);
  const [buses, setBuses] = useState([]);
  // busOpStatus: { [bus_id]: "운행" 또는 "미운행" }
  const [busOpStatus, setBusOpStatus] = useState({});

  const handleVehicleSelect = (vehicle) => {
    console.log("Vehicle clicked:", vehicle);
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
            closeCalendar={handleCloseCalendar}
            onRouteSelect={setRoutePoints}
          />
        )}
        <KakaoMap
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
