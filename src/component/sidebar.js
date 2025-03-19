import React, { useState, useEffect } from "react";
import { FaBus, FaExclamationCircle } from "react-icons/fa";
import watchImg from "../images/watch.png";
import timeImg from "../images/time.png";
import kmImg from "../images/km1.png";

function Sidebar({ onVehicleSelect, selectedTab, onTabChange }) {
  const [activeTab, setActiveTab] = useState("status");
  const [selectedInnerTab, setSelectedInnerTab] = useState("전체");
  const [vehicles, setVehicles] = useState([]);
  const [vehicleData, setVehicleData] = useState({
    운행: 0,
    미운행: 0,
    전체: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const url = "http://104.197.230.228:8000";
    const API_URL = `${url}/monitoring/vehicle/list`;
    console.debug("Sidebar: 데이터 요청 URL ->", API_URL);

    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        console.debug("Sidebar: API 응답 데이터 ->", data);
        if (!data || !Array.isArray(data.data)) {
          throw new Error("🚨 데이터 형식 오류: data.data는 배열이어야 합니다.");
        }
        setVehicles(data.data);
        const 운행 = data.data.filter((v) => v.status === "운행").length;
        const 미운행 = data.data.filter((v) => v.status === "미운행").length;
        const 전체 = data.data.length;
        setVehicleData({ 운행, 미운행, 전체 });
      })
      .catch((err) => console.error("❌ 데이터 불러오기 실패:", err));
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleInnerTabChange = (tab) => {
    console.debug("Sidebar: 탭 선택 ->", tab);
    setSelectedInnerTab(tab);
    onTabChange(tab);
  };

  const filteredVehicles = vehicles
    .filter((vehicle) => {
      if (!searchTerm.trim()) return true;
      return vehicle.bus_number.includes(searchTerm.trim());
    })
    .filter((vehicle) => {
      if (selectedInnerTab === "전체") return true;
      return vehicle.status === selectedInnerTab;
    });

  let sortedVehicles = [...filteredVehicles];
  if (selectedInnerTab === "전체") {
    sortedVehicles.sort((a, b) => {
      if (a.status === "운행" && b.status !== "운행") return -1;
      if (b.status === "운행" && a.status !== "운행") return 1;
      return 0;
    });
  }

  return (
    <div className="sideSection" id="sideSection">
      <div className="sideUp">
        <div className="allVehicleStatus sideUpArticle">
          <div className="allVehicle borderRight countVehicleDiv">
            <div className="countVehicle">{vehicleData.전체}</div>
            <label>전체</label>
          </div>
          <div className="driveVehicle borderRight countVehicleDiv">
            <div className="countVehicle">{vehicleData.운행}</div>
            <label>운행</label>
          </div>
          <div className="noDriveVehicle countVehicleDiv">
            <div className="countVehicle">{vehicleData.미운행}</div>
            <label>미운행</label>
          </div>
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
              <FaBus className="icon" />
              차량현황
            </button>
            <button
              className={`tab-button ${activeTab === "alert" ? "active1" : "inactive1"}`}
              onClick={() => setActiveTab("alert")}
            >
              <FaExclamationCircle className="icon warning" />
              이상
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
              sortedVehicles.map((vehicle, index) => (
                <div
                  className={`vehicleArticle ${vehicle.status === "운행" ? "runningVehicle" : ""}`}
                  key={index}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    console.debug("Sidebar: 차량 클릭 ->", vehicle);
                    onVehicleSelect(vehicle);
                  }}
                >
                  <div className="vehicleArticleArticleTr">
                    <div
                      className={`vehicleArticleStatus ${
                        vehicle.status === "운행" ? "running" : "notRunning"
                      }`}
                      style={{
                        backgroundColor: vehicle.status === "운행" ? "#fff" : "transparent",
                      }}
                    >
                      {vehicle.status}
                    </div>
                    <span>{vehicle.bus_number}</span>
                  </div>
                  <div className="sidebarFlex">
                    <div className="vehicleArticleArticleTr">
                      <img src={watchImg} alt="속도" />
                      <span className="vehicleArticleArticleTrTitle">현재속도</span>
                      <span>{vehicle.speed} km/h</span>
                    </div>
                    <div className="vehicleArticleArticleTr">
                      <img src={kmImg} alt="거리" />
                      <span className="vehicleArticleArticleTrTitle">운행거리</span>
                      <span>{vehicle.distance} km</span>
                    </div>
                  </div>
                  <div className="driveTime">
                    <div className="vehicleArticleArticleTr">
                      <img src={timeImg} alt="운행시간" />
                      <span className="vehicleArticleArticleTrTitle">운행시간</span>
                      <span>{vehicle.operating_time} 분</span>
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
