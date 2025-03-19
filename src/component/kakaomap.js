import React, { useEffect, useState, useRef } from "react";
import "../css/kakaomap.css";

import busIcon from "../images/busIcon.png";
import NoBusIcon from "../images/NoBusicon.png";

import startIcon from "../images/출발.png";
import arriveIcon from "../images/도착.png";

import { getAccessToken, refreshAccessToken } from "../services/authService";

const KakaoMap = ({ selectedBus, setSelectedBus, openCalendar, routePoints }) => {
  const [buses, setBuses] = useState([]); // 최신 버스 데이터 (웹소켓 수신)
  const mapRef = useRef(null);             // 카카오 맵 객체
  const markersRef = useRef({});           // 마커 정보 { bus_id: kakao.maps.Marker }
  const overlayRef = useRef({});           // 팝업 오버레이 { bus_id: kakao.maps.CustomOverlay }
  const labelRef = useRef({});             // 라벨 오버레이 { bus_id: kakao.maps.CustomOverlay }
  const polylinesRef = useRef([]);         // 운행 경로 폴리라인
  const startEndMarkersRef = useRef([]);   // 출발/도착 마커
  const socketRef = useRef(null);          // 웹소켓 객체

  const WEBSOCKET_URL =
    process.env.REACT_APP_WEBSOCKET_URL || "ws://104.197.230.228:8000/ws/dispatch/all";

  useEffect(() => {
    const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAOMAP_KEY;
    if (!KAKAO_MAP_KEY) {
      console.error("❌ 카카오 맵 API 키가 없습니다.");
      return;
    }

    if (!document.getElementById("kakao-map-script")) {
      const script = document.createElement("script");
      script.id = "kakao-map-script";
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
      console.log("[KakaoMap] Kakao Maps SDK 스크립트 추가됨");

      script.onload = () => {
        if (!window.kakao || !window.kakao.maps) {
          console.error("❌ kakao.maps가 없습니다.");
          return;
        }
        window.kakao.maps.load(() => {
          initMap();
          loadLastBusData();
          connectWebSocket();
        });
      };
    } else {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          initMap();
          loadLastBusData();
          connectWebSocket();
        });
      } else {
        console.error("❌ window.kakao 또는 window.kakao.maps가 준비되지 않음");
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initMap = () => {
    const container = document.getElementById("map");
    if (!container) {
      console.error("❌ #map 컨테이너 없음");
      return;
    }
    const options = {
      center: new window.kakao.maps.LatLng(37.24555802870491, 126.99230765874883),
      level: 8,
    };
    mapRef.current = new window.kakao.maps.Map(container, options);
    console.log("[KakaoMap] 지도 초기화 완료:", mapRef.current);
  };

  const loadLastBusData = () => {
    const storedData = localStorage.getItem("lastBusData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (Array.isArray(parsed)) {
          setBuses(parsed);
          console.log("[KakaoMap] 마지막 버스 데이터 불러옴:", parsed);
          updateMarkers(parsed);
        }
      } catch (e) {
        console.error("❌ lastBusData JSON 파싱 오류:", e);
      }
    }
  };

  const connectWebSocket = async () => {
    // 현재 저장된 토큰 (로그인 시 발급되거나 재로그인 후 갱신된 토큰)
    const token = getAccessToken();
    console.log("[KakaoMap] 웹소켓 연결 시도, 토큰:", token);
  
    // 토큰을 쿼리 파라미터로 추가
    const wsUrl = token ? `${WEBSOCKET_URL}?token=${token}` : WEBSOCKET_URL;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
  
    socket.onopen = () => {
      console.log("✅ WebSocket 연결됨:", wsUrl);
    };
    socket.onmessage = (event) => {
      try {
        let data = JSON.parse(event.data);
        console.log("[KakaoMap] 웹소켓 메시지 수신:", data);
        if (!Array.isArray(data)) data = [data];
        setBuses(data);
        updateMarkers(data);
      } catch (error) {
        console.error("❌ 웹소켓 메시지 JSON 파싱 오류:", error);
      }
    };
    socket.onerror = (error) => {
      console.error("❌ 웹소켓 오류:", error);
    };
    socket.onclose = () => {
      console.warn("⚠️ 웹소켓 연결 종료됨.");
    };
  };
  
  // handleTokenRefresh 함수는 더 이상 사용하지 않고, 토큰 문제 발생 시 자동 로그아웃 처리됩니다.
  
  
  // // 토큰 갱신이 필요할 때 호출 (예: 주기적 자동 갱신이나 오류 발생 시)
  // async function handleTokenRefresh() {
  //   const success = await refreshAccessToken();
  //   if (success) {
  //     // 토큰이 갱신되었으므로 기존 연결 종료 후 새 토큰으로 재연결
  //     if (socketRef.current) socketRef.current.close();
  //     connectWebSocket();
  //   } else {
  //     // 재발급 실패 시 추가 처리 (예: 로그아웃)
  //   }
  // }
  

  useEffect(() => {
    updateMarkers(buses);
  }, [buses]);

  const updateMarkers = (busData) => {
    if (!mapRef.current) return;
    busData.forEach((bus) => {
      const { bus_id, bus_number, latitude, longitude, status } = bus;
      if (!bus_id || !latitude || !longitude) {
        return;
      }
      const pos = new window.kakao.maps.LatLng(latitude, longitude);
      const icon = status === "미운행" ? NoBusIcon : busIcon;
      const markerImage = new window.kakao.maps.MarkerImage(
        icon,
        new window.kakao.maps.Size(50, 50),
        { offset: new window.kakao.maps.Point(25, 50) }
      );

      if (markersRef.current[bus_id]) {
        markersRef.current[bus_id].setPosition(pos);
        markersRef.current[bus_id].setImage(markerImage);
        if (labelRef.current[bus_id]) {
          labelRef.current[bus_id].setPosition(pos);
        }
      } else {
        const marker = new window.kakao.maps.Marker({
          position: pos,
          image: markerImage,
          map: mapRef.current,
        });
        markersRef.current[bus_id] = marker;

        const labelContent = `<div class="marker-label">${bus_number || ""}</div>`;
        const labelOverlay = new window.kakao.maps.CustomOverlay({
          position: pos,
          content: labelContent,
          yAnchor: 0.7,
          zIndex: -100000,
          map: mapRef.current,
        });
        labelRef.current[bus_id] = labelOverlay;

        window.kakao.maps.event.addListener(marker, "click", () => {
          setSelectedBus(bus);
          showPopup(bus);
        });
      }
    });
  };

  // 선택된 버스 변경 시 지도 이동 + 팝업 표시 (디버깅 로그 추가 및 위치 데이터 보완)
  useEffect(() => {
    if (!selectedBus || !mapRef.current) return;

    console.debug("[KakaoMap] selectedBus 변경 감지:", selectedBus);

    let busData = selectedBus;
    if (!selectedBus.latitude || !selectedBus.longitude) {
      // 선택된 차량에 위치 정보가 없다면, 현재 buses 배열에서 찾아봅니다.
      const foundBus = buses.find((b) => b.bus_id === selectedBus.bus_id);
      if (foundBus && foundBus.latitude && foundBus.longitude) {
        busData = foundBus;
        console.debug("[KakaoMap] buses 배열에서 찾은 위치 데이터:", busData);
      } else {
        console.warn("[KakaoMap] 선택된 버스에 위치 데이터가 없습니다:", selectedBus);
        return;
      }
    }
    const latLng = new window.kakao.maps.LatLng(
      busData.latitude,
      busData.longitude
    );
    console.debug("[KakaoMap] 지도 이동 좌표:", latLng);
    mapRef.current.setCenter(latLng);
    mapRef.current.setLevel(2);
    showPopup(busData);
  }, [selectedBus, buses]);

  const showPopup = (bus) => {
    if (!mapRef.current) return;

    if (overlayRef.current[bus.bus_id]) {
      overlayRef.current[bus.bus_id].setMap(null);
    }

    const position = new window.kakao.maps.LatLng(bus.latitude, bus.longitude);
    const statusText = bus.status === "미운행" ? "미운행" : "운행";
    const statusClass = bus.status === "미운행" ? "inactive" : "active";

    const content = document.createElement("div");
    content.className = "custom-overlay";
    content.innerHTML = `
      <div class="popup-box">
        <div class="busInfoBox">
          <div class="busInfoBoxTitle">
            <div class="busInfoBoxStatus ${statusClass}">
              ${statusText}
            </div>
            <div class="busInfoBoxNumber">${bus.bus_number || "차량번호 없음"}</div>
            <div class="close-icon" id="closeOverlay"></div>
          </div>
          <div class="busInfoBoxArticle">
            <div class="usInfoBoxArticleArticle">노선명</div>
            <div class="usInfoBoxArticleArticle">${bus.distance || "0"} km/h</div>
            <div class="usInfoBoxArticleArticle">현재속도</div>
            <div class="usInfoBoxArticleArticle">${bus.speed || "0"} km</div>
          </div>
          <div class="busInfoBoxArticle">
            <div class="usInfoBoxArticleArticle">운전자명</div>
            <div class="usInfoBoxArticleArticle">${bus.speed || "0"} km/h</div>
            <div class="usInfoBoxArticleArticle">운행거리</div>
            <div class="usInfoBoxArticleArticle">${bus.distance || "0"} km</div>
          </div>
          <div class="busInfoBoxArticle">
            <div class="usInfoBoxArticleArticle">연락처</div>
            <div class="usInfoBoxArticleArticle">${bus.speed || "0"} km/h</div>
            <div class="usInfoBoxArticleArticle">운행시간</div>
            <div class="usInfoBoxArticleArticle">${bus.distance || "0"} km</div>
          </div>
        </div>
        <div class="calenderBtn" id="openCalendarBtn">운행경로</div>
      </div>
    `;

    const overlay = new window.kakao.maps.CustomOverlay({
      position,
      content,
      yAnchor: 1.3,
      map: mapRef.current,
    });
    overlayRef.current[bus.bus_id] = overlay;

    setTimeout(() => {
      const closeEl = document.getElementById("closeOverlay");
      const calendarEl = document.getElementById("openCalendarBtn");
      if (closeEl) {
        closeEl.addEventListener("click", () => closeOverlay(bus.bus_id));
      }
      if (calendarEl && openCalendar) {
        calendarEl.addEventListener("click", () => openCalendar());
      }
    }, 100);
  };

  const closeOverlay = (busId) => {
    if (overlayRef.current[busId]) {
      overlayRef.current[busId].setMap(null);
    }
    polylinesRef.current.forEach((pl) => pl.setMap(null));
    polylinesRef.current = [];
    startEndMarkersRef.current.forEach((m) => m.setMap(null));
    startEndMarkersRef.current = [];
  };

  const drawArrowsOnPath = (points) => {
    polylinesRef.current.forEach((pl) => pl.setMap(null));
    polylinesRef.current = [];
    startEndMarkersRef.current.forEach((m) => m.setMap(null));
    startEndMarkersRef.current = [];

    if (!mapRef.current || points.length < 1) return;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = new window.kakao.maps.LatLng(points[i].latitude, points[i].longitude);
      const p2 = new window.kakao.maps.LatLng(points[i + 1].latitude, points[i + 1].longitude);
      const isLast = i === points.length - 2;
      const line = new window.kakao.maps.Polyline({
        map: mapRef.current,
        path: [p1, p2],
        strokeWeight: 6,
        strokeColor: "#4A69E4",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
        endArrow: isLast,
      });
      polylinesRef.current.push(line);
    }

    const startPos = new window.kakao.maps.LatLng(points[0].latitude, points[0].longitude);
    const startMarkerImage = new window.kakao.maps.MarkerImage(
      startIcon,
      new window.kakao.maps.Size(50, 50),
      { offset: new window.kakao.maps.Point(25, 50) }
    );
    const startMarker = new window.kakao.maps.Marker({
      position: startPos,
      image: startMarkerImage,
      map: mapRef.current,
    });
    startEndMarkersRef.current.push(startMarker);

    if (points.length > 1) {
      const endPos = new window.kakao.maps.LatLng(
        points[points.length - 1].latitude,
        points[points.length - 1].longitude
      );
      const arriveMarkerImage = new window.kakao.maps.MarkerImage(
        arriveIcon,
        new window.kakao.maps.Size(50, 50),
        { offset: new window.kakao.maps.Point(25, 50) }
      );
      const endMarker = new window.kakao.maps.Marker({
        position: endPos,
        image: arriveMarkerImage,
        map: mapRef.current,
      });
      startEndMarkersRef.current.push(endMarker);
    }
   // 여기서 첫번째 좌표로 지도의 중심 이동 및 확대 적용
   mapRef.current.setCenter(startPos);
   mapRef.current.setLevel(3); // 숫자가 작을수록 확대 정도가 큽니다. 필요에 따라 값을 조절하세요.
  };

  useEffect(() => {
    if (routePoints && routePoints.length > 0) {
      drawArrowsOnPath(routePoints);
    }
  }, [routePoints]);

  return (
    <div className="kakaomap" style={{ backgroundColor: "#eee" }}>
      <div id="map"></div>
    </div>
  );
};

export default KakaoMap;
