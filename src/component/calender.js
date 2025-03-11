import React, { useState, useEffect } from "react";
import { format, addDays, startOfMonth, startOfWeek, isSameMonth, isSameDay } from "date-fns";

/**
 * Calendar 컴포넌트
 * - 선택된 버스와 날짜에 따라 배차 정보를 조회하고,
 * - 배차 행(tr)을 클릭하면 해당 배차의 location_history를 추출하여 onRouteSelect 콜백을 통해 부모에 전달합니다.
 *
 * Props:
 * - selectedBus: { bus_id: 58, bus_num: "경기70바 7271", bus_number: "경기70바 7271", ... }
 * - setCalendarVisible: 캘린더 표시/숨김 제어 함수 (옵션)
 * - closeCalendar: 캘린더 닫기 함수 (옵션)
 * - onRouteSelect: 배차 항목 클릭 시 운행 경로(routePoints)를 부모에 전달하는 함수
 */
const Calendar = ({ selectedBus, setCalendarVisible, closeCalendar, onRouteSelect }) => {
  // 디버깅용: 초기값을 2025년 3월로 설정 (실제 사용 시 new Date()로 변경)
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 2, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 2, 7));
  const [dispatchList, setDispatchList] = useState([]);
  const [routeHistory, setRouteHistory] = useState([]);

  // 실제 Django 서버 주소 (필요에 따라 수정)
  const API_BASE_URL = "http://104.197.230.228:8000";

  // selectedBus 또는 selectedDate 변경 시 배차정보 재조회
  useEffect(() => {
    console.log("🟨 [Calendar useEffect] selectedBus:", selectedBus);
    console.log("🟨 [Calendar useEffect] selectedDate:", selectedDate);
    if (selectedBus && selectedBus.bus_id) {
      fetchDispatchList(selectedBus.bus_id, selectedDate);
    } else {
      console.warn("🚨 [Calendar] selectedBus 또는 bus_id가 없습니다.");
    }
  }, [selectedBus, selectedDate]);

  const fetchDispatchList = async (busId, date) => {
    if (!busId) {
      console.warn("🟧 [fetchDispatchList] busId가 없습니다. 요청 중단.");
      return;
    }
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const requestUrl = `${API_BASE_URL}/monitoring/vehicle/location-history?bus_id=${encodeURIComponent(busId)}&date=${formattedDate}`;
      console.log("📌 [fetchDispatchList] requestUrl:", requestUrl);

      const res = await fetch(requestUrl);
      if (!res.ok) {
        if (res.status === 404) {
          console.warn("⚠️ [fetchDispatchList] 404 Not Found: 해당 날짜에 배차 정보가 없습니다.");
          setDispatchList([]);
          setRouteHistory([]);
          if (onRouteSelect) onRouteSelect([]);
          return;
        } else {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      }
      const data = await res.json();
      console.log("✅ [fetchDispatchList] 응답 데이터:", data);

      if (data.result === "true" && Array.isArray(data.data) && data.data.length > 0) {
        setDispatchList(data.data);
        setRouteHistory([]);
        if (onRouteSelect) onRouteSelect([]);
      } else {
        console.warn("⚠️ [fetchDispatchList] 배차 데이터가 없습니다:", data);
        setDispatchList([]);
        setRouteHistory([]);
        if (onRouteSelect) onRouteSelect([]);
      }
    } catch (error) {
      console.error("❌ [fetchDispatchList] API 호출 실패:", error);
      setDispatchList([]);
      setRouteHistory([]);
      if (onRouteSelect) onRouteSelect([]);
    }
  };

  /**
   * 배차 행 클릭 시, 해당 배차의 location_history를 추출하여 routePoints로 변환하고,
   * onRouteSelect 콜백을 통해 부모에 전달합니다.
   */
  const handleRouteClick = (dispatchId) => {
    console.log("🔎 [handleRouteClick] dispatchId:", dispatchId);
    const selectedDispatch = dispatchList.find(
      (dispatch) => dispatch.dispatch_id === dispatchId
    );
    console.log("🔎 [handleRouteClick] selectedDispatch:", selectedDispatch);
    if (selectedDispatch && Array.isArray(selectedDispatch.location_history) && selectedDispatch.location_history.length > 0) {
      const routePoints = selectedDispatch.location_history.map((pt) => ({
        latitude: pt.latitude,
        longitude: pt.longitude,
        timestamp: pt.timestamp,
      }));
      console.log("✅ [handleRouteClick] routePoints:", routePoints);
      setRouteHistory(routePoints);
      if (onRouteSelect) {
        onRouteSelect(routePoints);
      }
    } else {
      console.warn("⚠️ [handleRouteClick] 이동 경로가 없습니다.");
      setRouteHistory([]);
      if (onRouteSelect) {
        onRouteSelect([]);
      }
    }
  };

  const nextMonth = () => {
    console.log("🟨 [nextMonth] 현재 month:", currentMonth);
    setCurrentMonth(addDays(currentMonth, 31));
  };

  const prevMonth = () => {
    console.log("🟨 [prevMonth] 현재 month:", currentMonth);
    setCurrentMonth(addDays(currentMonth, -31));
  };

  const handleDateClick = (day) => {
    console.log("✅ [handleDateClick] 선택된 날짜:", day);
    setSelectedDate(day);
    if (selectedBus && selectedBus.bus_id) {
      fetchDispatchList(selectedBus.bus_id, day);
    }
  };

  const handleCloseCalendar = () => {
    console.log("🟨 [handleCloseCalendar] 캘린더 닫기");
    if (closeCalendar) {
      closeCalendar();
    }
  };

  return (
    <div className="calendar" id="calendar">
      <div className="calenderTitle">
        <div className="calenderTitleTitle">운행 경로</div>
        <div className="close-icon" onClick={handleCloseCalendar} style={{ cursor: "pointer" }} />
      </div>

      <div className="vehicleStatusAndNum">
        <div>
          <div className="statusBox">운행</div>
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
            <div key={day} className="weekday">{day}</div>
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

      {/* 테스트용으로 routeHistory 테이블 표시 */}
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
