import React, { useState, useEffect } from "react";
import { format, addDays, startOfMonth, startOfWeek, isSameMonth, isSameDay } from "date-fns";

const Calendar = ({ selectedBus, busOpStatus, setCalendarVisible, closeCalendar, onRouteSelect }) => {
  // 날짜 관련 state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dispatchList, setDispatchList] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);

  // 전달받은 busOpStatus를 이용해 선택된 버스의 상태 표시 (운행/미운행)
  const currentBusStatus = selectedBus && busOpStatus && busOpStatus[selectedBus.bus_id]
    ? busOpStatus[selectedBus.bus_id]
    : "운행";

  // 실제 Django 서버 주소 (필요에 따라 수정)
  const API_BASE_URL = "http://104.197.230.228:8000";

  // selectedBus 또는 selectedDate 변경 시 배차정보 재조회
  useEffect(() => {
    console.log("[Calendar] selectedBus:", selectedBus);
    console.log("[Calendar] selectedDate:", selectedDate);
    if (selectedBus && selectedBus.bus_id) {
      fetchDispatchList(selectedBus.bus_id, selectedDate);
    } else {
      console.warn("selectedBus 또는 bus_id가 없습니다.");
    }
  }, [selectedBus, selectedDate]);

  const fetchDispatchList = async (busId, date) => {
    if (!busId) {
      console.warn("busId가 없습니다. 요청 중단.");
      return;
    }
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const requestUrl = `${API_BASE_URL}/monitoring/vehicle/location-history?bus_id=${encodeURIComponent(busId)}&date=${formattedDate}`;
      console.log("requestUrl:", requestUrl);

      const res = await fetch(requestUrl);
      if (!res.ok) {
        if (res.status === 404) {
          console.warn("404 Not Found: 해당 날짜에 배차 정보가 없습니다.");
          setDispatchList([]);
          setRouteHistory([]);
          if (onRouteSelect) onRouteSelect([]);
          return;
        } else {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      }
      const data = await res.json();
      console.log("응답 데이터:", data);

      if (data.result === "true" && Array.isArray(data.data) && data.data.length > 0) {
        setDispatchList(data.data);
        setRouteHistory([]);
        if (onRouteSelect) onRouteSelect([]);
      } else {
        console.warn("배차 데이터가 없습니다:", data);
        setDispatchList([]);
        setRouteHistory([]);
        if (onRouteSelect) onRouteSelect([]);
      }
    } catch (error) {
      console.error("API 호출 실패:", error);
      setDispatchList([]);
      setRouteHistory([]);
      if (onRouteSelect) onRouteSelect([]);
    }
  };

  const nextMonth = () => {
    console.log("현재 month:", currentMonth);
    setCurrentMonth(addDays(currentMonth, 31));
  };

  const prevMonth = () => {
    console.log("현재 month:", currentMonth);
    setCurrentMonth(addDays(currentMonth, -31));
  };

  const handleDateClick = (day) => {
    console.log("선택된 날짜:", day);
    setSelectedDate(day);
    if (selectedBus && selectedBus.bus_id) {
      fetchDispatchList(selectedBus.bus_id, day);
    }
  };

  const handleCloseCalendar = () => {
    console.log("캘린더 닫기");
    if (closeCalendar) closeCalendar();
  };

  const handleRouteClick = (dispatchId) => {
    console.log("dispatchId:", dispatchId);
    const selectedDispatch = dispatchList.find(
      (dispatch) => dispatch.dispatch_id === dispatchId
    );
    console.log("selectedDispatch:", selectedDispatch);
    if (
      selectedDispatch &&
      Array.isArray(selectedDispatch.location_history) &&
      selectedDispatch.location_history.length > 0
    ) {
      const routePoints = selectedDispatch.location_history.map((pt) => ({
        latitude: pt.latitude,
        longitude: pt.longitude,
        timestamp: pt.timestamp,
      }));
      console.log("routePoints:", routePoints);
      setRouteHistory(routePoints);
      if (onRouteSelect) onRouteSelect(routePoints);
    } else {
      console.warn("이동 경로가 없습니다.");
      setRouteHistory([]);
      if (onRouteSelect) onRouteSelect([]);
    }
  };

  return (
    <div className="calendar" id="calendar">
      <div className="calenderTitle">
        <div className="calenderTitleTitle">운행 경로</div>
        <div
          className="close-icon"
          onClick={handleCloseCalendar}
          style={{ cursor: "pointer" }}
        />
      </div>

      <div className="vehicleStatusAndNum">
        <div>
          {/* 전달받은 운행 상태(currentBusStatus)를 표시 */}
          <div
            className="statusBox"
            style={{
              backgroundColor: currentBusStatus === "미운행" ? "#848692" : "#1CA04B",
              color: "#fff",
            }}
          >
            {currentBusStatus}
          </div>
          <div className="vehicleNumBox">
            {selectedBus ? selectedBus.bus_number : "차량번호 정보 없음"}
          </div>
        </div>
      </div>

      <div className="calenderArticle">
        <div className="header">
          <button onClick={prevMonth}>&lt; 이전달</button>
          <div>{format(currentMonth, "yyyy년 MM월")}</div>
          <button onClick={nextMonth}>다음달 &gt;</button>
        </div>
        <div className="weekdays">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="days">
          {Array.from({ length: 42 }).map((_, index) => {
            const day = addDays(startOfWeek(startOfMonth(currentMonth)), index);
            return (
              <div
                key={index}
                className={`day ${!isSameMonth(day, currentMonth) ? "disabled" : ""} ${isSameDay(day, selectedDate) ? "selected" : ""}`}
                onClick={() => handleDateClick(day)}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>
      </div>

      <div className="articleDispatch">
        <table className="dispatchTheadTable">
          <thead>
            <tr>
              <td>번호</td>
              <td>출발시간</td>
              <td>도착시간</td>
              <td>노선명</td>
            </tr>
          </thead>
        </table>
        <div className="scrollDiv">
          <table className="dispatchTbodyTable">
            <tbody>
              {dispatchList.length > 0 ? (
                dispatchList.map((dispatch, index) => (
                  <tr
                    key={dispatch.dispatch_id}
                    onClick={() => handleRouteClick(dispatch.dispatch_id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{index + 1}</td>
                    <td>{dispatch.departure_time}</td>
                    <td>{dispatch.arrival_time}</td>
                    <td>{dispatch.route}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">해당 날짜에 배차 정보가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {routeHistory.length > 0 && (
        <div className="routeHistorySection">
          <h3>이동 경로 (테이블)</h3>
          <table className="routeHistoryTable">
            <thead>
              <tr>
                <td>번호</td>
                <td>위도</td>
                <td>경도</td>
                <td>타임스탬프</td>
              </tr>
            </thead>
            <tbody>
              {routeHistory.map((pt, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{pt.latitude}</td>
                  <td>{pt.longitude}</td>
                  <td>{pt.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Calendar;
