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
import reportWebVitals from "./reportWebVitals";

const AppContainer = () => {
  // 사이드바와 캘린더 표시 상태
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [calendarVisible, setCalendarVisible] = useState(false);

  // 선택된 버스와, Calendar에서 선택한 경로(routePoints)를 부모에서 관리
  const [selectedBus, setSelectedBus] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);

  // Sidebar에서 차량 클릭 시 호출되는 함수
  const handleVehicleSelect = (vehicle) => {
    console.log("AppContainer: 차량 행 클릭:", vehicle);
    setSelectedBus(vehicle);
  };

  // (필요 시) KakaoMap에서 버스 클릭 시 달력을 열도록 하는 함수
  const handleOpenCalendar = () => {
    setCalendarVisible(true);
    setSidebarVisible(false);
  };

  // 달력 닫기 시 사이드바로 복귀
  const handleCloseCalendar = () => {
    setCalendarVisible(false);
    setSidebarVisible(true);
  };

  return (
    <>
      <Gnb />
      <div className="contentsBox">
        {sidebarVisible && (
          <Sidebar onVehicleSelect={handleVehicleSelect} />
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
        />
      </div>
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AppContainer />);
reportWebVitals();