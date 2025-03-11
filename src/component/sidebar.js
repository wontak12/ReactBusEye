import React, { useState, useEffect } from "react";
import { FaBus, FaExclamationCircle } from "react-icons/fa"; // 아이콘 추가
import watchImg from "../images/watch.png";
import timeImg from "../images/time.png";
import kmImg from "../images/km1.png";

function Sidebar({ onVehicleSelect }) {
  const [activeTab, setActiveTab] = useState("status"); // 차량현황 or 이상 상태 관리
  const [selectedTab, setSelectedTab] = useState("전체"); // 운행, 미운행, 전체

  // API에서 받아온 차량 데이터 상태
  const [vehicles, setVehicles] = useState([]);
  const [vehicleData, setVehicleData] = useState({
    운행: 0,
    미운행: 0,
    전체: 0,
  });

  // 🔎 검색어 상태
  const [searchTerm, setSearchTerm] = useState("");

  // 🚀 API 데이터 가져오기
  useEffect(() => {
    const url = "http://104.197.230.228:8000";
    const API_URL = `${url}/monitoring/vehicle/list`;
    console.log(`Fetching data from: ${API_URL}`);

    fetch(API_URL)
      .then((res) => res.json()) // JSON 변환
      .then((data) => {
        console.log("✅ Parsed JSON:", data);

        if (!data || !Array.isArray(data.data)) {
          throw new Error("🚨 데이터 형식이 잘못되었습니다. `data.data`가 배열이어야 합니다.");
        }

        setVehicles(data.data);

        // 🚗 운행/미운행 개수 계산
        const 운행 = data.data.filter((v) => v.status === "운행").length;
        const 미운행 = data.data.filter((v) => v.status === "미운행").length;
        const 전체 = data.data.length;

        setVehicleData({ 운행, 미운행, 전체 });
      })
      .catch((err) => console.error("❌ 데이터 불러오기 실패:", err));
  }, []);

  // 🔎 검색어 입력 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 🔎 차량 검색 + 탭 필터 적용
  const filteredVehicles = vehicles
    .filter((vehicle) => {
      if (!searchTerm.trim()) return true;
      return vehicle.bus_number.includes(searchTerm.trim());
    })
    .filter((vehicle) => {
      if (selectedTab === "전체") return true;
      return vehicle.status === selectedTab;
    });

  // 🔽 "전체" 탭일 때만 "운행" 차량을 맨 위로 정렬, 나머지 탭은 그대로 사용
  let sortedVehicles = [...filteredVehicles];
  if (selectedTab === "전체") {
    sortedVehicles.sort((a, b) => {
      if (a.status === "운행" && b.status !== "운행") return -1;
      if (b.status === "운행" && a.status !== "운행") return 1;
      return 0;
    });
  }

  return (
    <div className="sideSection" id="sideSection">
      <div className="sideUp">
        {/* 🚍 차량 통계 */}
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

        {/* 🔎 차량 검색 */}
        <div className="vehicleSearch sideUpArticle">
          <input
            className="vehicleSearchInput"
            placeholder="차량 번호를 입력하세요"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* 🚀 차량현황 & 이상 버튼 */}
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

      {/* 📌 운행/미운행 탭 */}
      <div className="driveType">
        <div className="tab-container">
          {["운행", "미운행", "전체"].map((tab) => (
            <div
              key={tab}
              className={`tab-item ${selectedTab === tab ? "active" : ""}`}
              onClick={() => setSelectedTab(tab)}
            >
              <span>{tab}</span>
              <span className="count">{vehicleData[tab]}</span>
              {selectedTab === tab && <div className="underline" />}
            </div>
          ))}
        </div>
      </div>

      {/* 🚗 차량 리스트 */}
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
                  onClick={() => onVehicleSelect(vehicle)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="vehicleArticleArticleTr">
                    <div
                        className={`vehicleArticleStatus ${vehicle.status === "운행" ? "running" : "notRunning"}`}
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
