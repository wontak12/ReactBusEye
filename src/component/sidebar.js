import React, { useState, useEffect } from "react";
import { FaBus, FaExclamationCircle } from "react-icons/fa";
import watchImg from "../images/watch.png";
import timeImg from "../images/time.png";
import kmImg from "../images/km1.png";

function Sidebar({ onVehicleSelect, selectedTab, onTabChange, buses, busOpStatus }) {
  const [activeTab, setActiveTab] = useState("status");
  const [selectedInnerTab, setSelectedInnerTab] = useState("전체");
  const [vehicles, setVehicles] = useState([]);
  const [vehicleData, setVehicleData] = useState({ 운행: 0, 미운행: 0, 전체: 0 });
  const [searchTerm, setSearchTerm] = useState("");

  // 1. 최초에 전체 차량 목록 불러오기
  useEffect(() => {
    const API_URL = `http://104.197.230.228:8000/monitoring/vehicle/list`;
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) setVehicles(data.data);
      })
      .catch((err) => console.error("Sidebar: 차량 목록 불러오기 실패", err));
  }, []);

  // 2. 실시간 buses + busOpStatus 에 따라 vehicles 상태 갱신
  useEffect(() => {
    if (!vehicles.length) return;

    const liveMap = {};
    buses.forEach((b) => { liveMap[b.bus_id] = b; });

    const updated = vehicles.map((v) => {
      const live = liveMap[v.bus_id];
      const status = busOpStatus[v.bus_id] || "미운행";
      return {
        ...v,
        status,
        speed: live?.speed ?? 0,
        distance: live?.distance ?? 0,
        operating_time: live?.operating_time ?? 0,
      };
    });

    setVehicles(updated);
  }, [buses, busOpStatus]);

  // 3. 탭 별 카운트 계산
  useEffect(() => {
    const 운행 = vehicles.filter((v) => v.status === "운행").length;
    const 미운행 = vehicles.filter((v) => v.status === "미운행").length;
    const 전체 = vehicles.length;
    setVehicleData({ 운행, 미운행, 전체 });
  }, [vehicles]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleInnerTabChange = (tab) => {
    setSelectedInnerTab(tab);
    onTabChange(tab);
  };

  // 4. 필터링 및 정렬
  const filtered = vehicles
    .filter((v) => !searchTerm || v.bus_number.includes(searchTerm))
    .filter((v) => selectedInnerTab === "전체" || v.status === selectedInnerTab);

  const sortedVehicles = [...filtered].sort((a, b) => {
    if (selectedInnerTab === "전체") {
      if (a.status === "운행" && b.status !== "운행") return -1;
      if (b.status === "운행" && a.status !== "운행") return 1;
    }
    return 0;
  });

  return (
    <div className="sideSection" id="sideSection">
      <div className="sideUp">
        <div className="allVehicleStatus sideUpArticle">
          {["전체", "운행", "미운행"].map((type, i) => (
            <div key={i} className={`countVehicleDiv ${i < 2 ? "borderRight" : ""}`}>
              <div className="countVehicle">{vehicleData[type]}</div>
              <label>{type}</label>
            </div>
          ))}
        </div>

        <div className="vehicleSearch sideUpArticle">
          <input
            className="vehicleSearchInput"
            placeholder="차량 번호를 입력하세요"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="vehicleStatus sideUpArticle">
          <div className="button-group">
            <button
              className={`tab-button ${activeTab === "status" ? "active" : "inactive"}`}
              onClick={() => setActiveTab("status")}
            >
              <FaBus className="icon" /> 차량현황
            </button>
            <button
              className={`tab-button ${activeTab === "alert" ? "active1" : "inactive1"}`}
              onClick={() => setActiveTab("alert")}
            >
              <FaExclamationCircle className="icon warning" /> 이상
            </button>
          </div>
        </div>
      </div>

      <div className="driveType">
        <div className="tab-container">
          {["운행", "미운행", "전체"].map((tab) => (
            <div
              key={tab}
              className={`tab-item ${selectedInnerTab === tab ? "active" : ""}`}
              onClick={() => handleInnerTabChange(tab)}
            >
              <span>{tab}</span>
              <span className="count">{vehicleData[tab]}</span>
              {selectedInnerTab === tab && <div className="underline" />}
            </div>
          ))}
        </div>
      </div>

      <div className="scrollSection">
        <div className="sideDown">
          <div className="vehicleSection">
            {sortedVehicles.length === 0 ? (
              <p>🚨 차량 데이터가 없습니다.</p>
            ) : (
              sortedVehicles.map((v, idx) => (
                <div
                  key={idx}
                  className={`vehicleArticle ${v.status === "운행" ? "runningVehicle" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => onVehicleSelect(v)}
                >
                  <div className="vehicleArticleArticleTr">
                    <div
                      className={`vehicleArticleStatus ${v.status === "운행" ? "running" : "notRunning"}`}
                      style={{ backgroundColor: v.status === "운행" ? "#fff" : "transparent" }}
                    >
                      {v.status}
                    </div>
                    <span>{v.bus_number}</span>
                  </div>

                  <div className="sidebarFlex">
                    <div className="vehicleArticleArticleTr">
                      <img src={watchImg} alt="속도" />
                      <span className="vehicleArticleArticleTrTitle">현재속도</span>
                      <span>{v.speed} km/h</span>
                    </div>
                    <div className="vehicleArticleArticleTr">
                      <img src={kmImg} alt="거리" />
                      <span className="vehicleArticleArticleTrTitle">운행거리</span>
                      <span>{v.distance} km</span>
                    </div>
                  </div>

                  <div className="driveTime">
                    <div className="vehicleArticleArticleTr">
                      <img src={timeImg} alt="운행시간" />
                      <span className="vehicleArticleArticleTrTitle">운행시간</span>
                      <span>{v.operating_time} 분</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
