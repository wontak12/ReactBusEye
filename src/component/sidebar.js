import React, { useState, useEffect } from "react";
import { FaBus, FaExclamationCircle } from "react-icons/fa"; // 아이콘 추가
import alarmImg from "../images/alarm.png";
import watchImg from "../images/watch.png";
import settingImg from "../images/setting.png";
import kmImg from "../images/km.png";


function Sidebar() {
    const [activeTab, setActiveTab] = useState("status"); // 차량현황 or 이상 상태 관리
    const [buttonGroupStyle, setButtonGroupStyle] = useState({});
    const [selectedTab, setSelectedTab] = useState("운행");
    const [vehicleData, setVehicleData] = useState({
        운행: 0,
        미운행: 0,
        전체: 0,
    });
    const [buttonStyle, setButtonStyle] = useState({});

    useEffect(() => {
        fetch() // API 엔드포인트 변경 필요
            .then((res) => res.json())
            .then((data) => {
                setVehicleData({
                    운행: data.running,
                    미운행: data.notRunning,
                    전체: data.total,
                });
            })
            .catch((err) => console.error("데이터 불러오기 실패", err));
    }, []);


    useEffect(() => {
        let newButtonGroupStyle = {};
        let newButtonStyle = {};

        if (activeTab === "status") {
            newButtonGroupStyle = { paddingRight: "1.7rem", paddingLeft: "0" };
            newButtonStyle = {
                inactive1: {
                    borderTopRightRadius: "2.5rem",
                    borderBottomRightRadius: "2.5rem",  
                },
            };
        } else if (activeTab === "alert") {
            newButtonGroupStyle = { paddingRight: "0", paddingLeft: "1.7rem" };
            newButtonStyle = {
                inactive: {
                    borderTopLeftRadius: "2.5rem",
                    borderBottomLeftRadius: "2.5rem",
                },
            };
        } else {
            newButtonGroupStyle = { paddingRight: "0", paddingLeft: "0" };
            newButtonStyle = {};
        }

        setButtonGroupStyle(newButtonGroupStyle);
        setButtonStyle(newButtonStyle);
    }, [activeTab]);

    return (
        <div className="sideSection">
            <div className="sideUp">
                <div className="allVehicleStatus sideUpArticle">
                    <div className="allVehicle borderRight countVehicleDiv">
                        <div className="countVehicle">113</div>
                        <label>전체</label>
                    </div>
                    <div className="driveVehicle borderRight countVehicleDiv">
                        <div className="countVehicle">113</div>
                        <label>운행</label>
                    </div>
                    <div className="noDriveVehicle countVehicleDiv">
                        <div className="countVehicle">113</div>
                        <label>미운행</label>
                    </div>
                </div>
                <div className="vehicleSearch sideUpArticle">
                    <input className="vehicleSearchInput" placeholder="차량 번호를 입력하세요" />
                </div>

                {/* 🚀 차량현황 & 이상 버튼 추가 (vehicleStatus 안에 위치) */}
                <div className="vehicleStatus sideUpArticle">
                    <div className="button-group" style={buttonGroupStyle}>
                        {/* 차량현황 버튼 */}
                        <button
                            className={`tab-button ${activeTab === "status" ? "active" : "inactive"}`}
                            onClick={() => setActiveTab("status")}
                            style={activeTab !== "status" ? buttonStyle.inactive : {}}
                        >
                            <FaBus className="icon" />
                            차량현황
                        </button>

                        {/* 이상 버튼 */}
                        <button
                            className={`tab-button ${activeTab === "alert" ? "active1" : "inactive1"}`}
                            onClick={() => setActiveTab("alert")}
                            style={activeTab !== "alert" ? buttonStyle.inactive1 : {}}
                        >
                            <FaExclamationCircle className="icon warning" />
                            이상
                        </button>
                    </div>
                </div>

            </div>
            <div class="driveType">
                {(activeTab === "status" || activeTab === "alert") && ( //나중에는 || activeTab === "alert" 삭제
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
                    )}
            </div>
            <div class="scrollSection">
                <div class="sideDown">
                    <div class="vehicleArticle">
                        <div class="vehicleArticleArticle">
                            <div class="vehicleArticleArticleTr">
                                <div class="vehicleArticleStatus">미운행</div>
                                <span>서울34이 3947</span>
                            </div>
                            <div class="vehicleArticleArticleTr">
                                <img src={watchImg}></img>
                            </div>
                            <div class="vehicleArticleArticleTr"></div>
                        </div>
                        <div class="driveTime"></div>
                    </div>
                </div>
            </div>
            
        </div>
    );
}

export default Sidebar;
