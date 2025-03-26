// Calendar.js
import React, { useState, useEffect } from "react";
import {
  format,
  addDays,
  startOfMonth,
  startOfWeek,
  isSameMonth,
  isSameDay,
} from "date-fns";

const Calendar = ({
  selectedBus,
  busOpStatus,
  setCalendarVisible,
  closeCalendar,
  onRouteSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dispatchList, setDispatchList] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);
  const [dispatchDays, setDispatchDays] = useState([]);

  const currentBusStatus =
    selectedBus && busOpStatus && busOpStatus[selectedBus.bus_id]
      ? busOpStatus[selectedBus.bus_id]
      : "미운행"; // 웹소켓에서 수신 없으면 기본값 미운행

  const API_BASE_URL = "http://104.197.230.228:8000";

  useEffect(() => {
    if (selectedBus && selectedBus.bus_id) {
      fetchDispatchList(selectedBus.bus_id, selectedDate);
    }
  }, [selectedBus, selectedDate]);

  useEffect(() => {
    if (selectedBus && selectedBus.bus_id) {
      fetchDispatchDays(selectedBus.bus_id, currentMonth);
    }
  }, [selectedBus, currentMonth]);

  const fetchDispatchList = async (busId, date) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const requestUrl = `${API_BASE_URL}/monitoring/vehicle/location-history?bus_id=${busId}&date=${formattedDate}`;
      const res = await fetch(requestUrl);
      if (!res.ok) {
        setDispatchList([]);
        setRouteHistory([]);
        onRouteSelect?.([]);
        return;
      }
      const data = await res.json();
      if (data.result === "true" && Array.isArray(data.data)) {
        setDispatchList(data.data);
        setRouteHistory([]);
        onRouteSelect?.([]);
      } else {
        setDispatchList([]);
        setRouteHistory([]);
        onRouteSelect?.([]);
      }
    } catch (error) {
      console.error("fetchDispatchList 에러:", error);
      setDispatchList([]);
      setRouteHistory([]);
      onRouteSelect?.([]);
    }
  };

  const fetchDispatchDays = async (busId, monthDate) => {
    try {
      const formattedMonth = format(monthDate, "yyyy-MM");
      const requestUrl = `${API_BASE_URL}/monitoring/vehicle/dispatch-status?bus_id=${busId}&date=${formattedMonth}`;
      const res = await fetch(requestUrl);
      const data = await res.json();
      if (data.result === "true" && Array.isArray(data.data)) {
        setDispatchDays(data.data);
      } else {
        setDispatchDays([]);
      }
    } catch (error) {
      console.error("fetchDispatchDays 에러:", error);
      setDispatchDays([]);
    }
  };

  const handleDateClick = (day) => {
    setSelectedDate(day);
    if (selectedBus && selectedBus.bus_id) {
      fetchDispatchList(selectedBus.bus_id, day);
    }
  };

  // 부모에서 전달받은 closeCalendar 함수를 그대로 사용
  const handleCloseCalendar = () => {
    closeCalendar?.();
  };

  const handleRouteClick = (dispatchId) => {
    const selectedDispatch = dispatchList.find(
      (dispatch) => dispatch.dispatch_id === dispatchId
    );
    if (
      selectedDispatch &&
      Array.isArray(selectedDispatch.location_history)
    ) {
      const routePoints = selectedDispatch.location_history.map((pt) => ({
        latitude: pt.latitude,
        longitude: pt.longitude,
        timestamp: pt.timestamp,
      }));
      setRouteHistory(routePoints);
      onRouteSelect?.(routePoints);
    } else {
      setRouteHistory([]);
      onRouteSelect?.([]);
    }
  };

  return (
    <div className="calendar" id="calendar">
      <div className="calenderTitle">
        <div className="calenderTitleTitle">운행 경로</div>
        <div className="close-icon" onClick={handleCloseCalendar} />
      </div>

      <div className="vehicleStatusAndNum">
        <div>
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
          <button onClick={() => setCurrentMonth(addDays(currentMonth, -31))}>
            &lt; 이전달
          </button>
          <div>{format(currentMonth, "yyyy년 MM월")}</div>
          <button onClick={() => setCurrentMonth(addDays(currentMonth, 31))}>
            다음달 &gt;
          </button>
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
            const isDispatchDay =
              isSameMonth(day, currentMonth) &&
              dispatchDays.includes(day.getDate());

            return (
              <div
                key={index}
                className={`day ${!isSameMonth(day, currentMonth) ? "disabled" : ""} ${
                  isSameDay(day, selectedDate) ? "selected" : ""
                }`}
                onClick={() => handleDateClick(day)}
              >
                {format(day, "d")}
                {isDispatchDay && <div className="dot" />}
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