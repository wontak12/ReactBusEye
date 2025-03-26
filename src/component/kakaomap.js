import React, { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import "../css/kakaomap.css";

import busIcon from "../images/busIcon.png";
import NoBusIcon from "../images/NoBusicon.png";
import startIcon from "../images/출발.png";
import arriveIcon from "../images/도착.png";

import { getAccessToken, getWebSocketUrl, refreshTokens } from "../services/authService.js";

const KakaoMap = forwardRef(({
  selectedBus,
  setSelectedBus,
  openCalendar,
  routePoints,
  isConnected,
  setIsConnected,
  buses,
  setBuses,
  busOpStatus,
  setBusOpStatus,
}, ref) => {
  const mapRef = useRef(null);
  const markersRef = useRef({});     // 버스별 마커 저장
  const overlayRef = useRef({});     // 버스별 오버레이 저장
  const labelRef = useRef({});       // 버스별 라벨 오버레이 저장
  const polylinesRef = useRef([]);
  const startEndMarkersRef = useRef([]);
  const socketRef = useRef(null);
  const lastUpdateRef = useRef({});

  const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;

  const onTimeout = () => {
    const now = Date.now();
    setBusOpStatus((prevStatus) => {
      const updated = { ...prevStatus };
      Object.entries(lastUpdateRef.current).forEach(([busId, timestamp]) => {
        if (now - timestamp > 5000) {
          updated[busId] = "미운행";
        }
      });
      return updated;
    });
  };

  // buses 또는 busOpStatus 변경 시 updateMarkers 호출
  useEffect(() => {
    console.log("[DEBUG] updateMarkers useEffect called. buses:", buses, "busOpStatus:", busOpStatus);
    updateMarkers(buses);
  }, [buses, busOpStatus]);

  // selectedBus가 변경될 때만 지도 중심 재설정 (데이터 업데이트 시에는 중심 이동 안함)
  useEffect(() => {
    if (!selectedBus || !mapRef.current) return;
    const bus = buses.find((b) => b && b.bus_id === selectedBus.bus_id);
    if (!bus || !bus.latitude || !bus.longitude) return;
    const pos = new window.kakao.maps.LatLng(bus.latitude, bus.longitude);
    console.log("[DEBUG] Setting map center for selectedBus:", bus.bus_id, pos.toString());
    mapRef.current.setCenter(pos);
    mapRef.current.setLevel(3);
  }, [selectedBus]);

  // 초기화: Kakao Map 스크립트 로드, 맵 초기화, 마지막 데이터 로드, 웹소켓 연결
  useEffect(() => {
    const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAOMAP_KEY;
    if (!KAKAO_MAP_KEY) return;
    if (!document.getElementById("kakao-map-script")) {
      const script = document.createElement("script");
      script.id = "kakao-map-script";
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
      script.onload = () => {
        window.kakao.maps.load(() => {
          initMap();
          loadLastBusData();
          connectWebSocket(false);
        });
      };
    } else {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          initMap();
          loadLastBusData();
          connectWebSocket(false);
        });
      }
    }
    const timer = setInterval(onTimeout, 2000);
    return () => {
      if (socketRef.current) socketRef.current.close();
      clearInterval(timer);
    };
  }, []);

  const initMap = () => {
    const container = document.getElementById("map");
    const options = {
      center: new window.kakao.maps.LatLng(37.24555802870491, 126.99230765874883),
      level: 8,
    };
    mapRef.current = new window.kakao.maps.Map(container, options);
    console.log("Kakao Map 초기화 완료");
  };

  const loadLastBusData = () => {
    const storedData = localStorage.getItem("lastBusData");
    if (storedData) {
      try {
        const parsedObj = JSON.parse(storedData);
        const parsedArr = Object.values(parsedObj);
        if (Array.isArray(parsedArr)) {
          setBuses(parsedArr);
          updateMarkers(parsedArr);
          console.log("저장된 버스 데이터 로드 완료", parsedArr);
        }
      } catch (e) {
        console.error("lastBusData JSON 파싱 오류:", e);
      }
    }
  };

  /**
   * 웹소켓 연결 함수  
   * @param {boolean} useRefresh - true이면 refresh token을 사용하여 연결 후 토큰 재발급 시도
   */
  const connectWebSocket = async (useRefresh = false) => {
    const wsUrl = getWebSocketUrl(useRefresh);
    console.log("WebSocket 연결 시도, useRefresh =", useRefresh, " URL:", wsUrl);

    if (socketRef.current) {
      console.log("기존 웹소켓 연결 종료");
      socketRef.current.close();
    }

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = async () => {
      setIsConnected(true);
      console.log("WebSocket 연결 열림 -", useRefresh ? "refresh token 사용" : "access token 사용");

      if (useRefresh) {
        const success = await refreshTokens();
        if (success) {
          console.log("토큰이 재발급되었습니다. 새로운 access token으로 재연결합니다.");
          socket.close();
          connectWebSocket(false);
        } else {
          console.error("토큰 재발급 실패");
        }
      }
    };
    socket.onmessage = (event) => {
      console.log("WebSocket 메시지 수신:", event.data);
      try {
        let data = JSON.parse(event.data);
        if (!Array.isArray(data)) data = [data];
        
        setIsConnected(true);
        
        setBuses((prev) => {
          const combined = [...prev, ...data.filter(Boolean)];
          const busMap = new Map();
          combined.forEach((bus) => {
            if (!bus || !bus.bus_id) return;
            const busId = bus.bus_id;
            const timestamp = new Date(bus.put_time).getTime();
            if (!busMap.has(busId)) {
              busMap.set(busId, { ...bus, put_time: timestamp });
            } else {
              const existing = busMap.get(busId);
              // 만약 put_time이 더 크거나, 위도 또는 경도가 달라지면 업데이트
              if (
                timestamp > existing.put_time ||
                bus.latitude !== existing.latitude ||
                bus.longitude !== existing.longitude
              ) {
                busMap.set(busId, { ...bus, put_time: timestamp });
              }
            }
          });
          const newBuses = Array.from(busMap.values());
          console.log("[DEBUG] 업데이트 후 buses 상태:", newBuses);
          return newBuses;
        });
        
        // 버스 운행 상태 업데이트 (예: 각 버스 상태를 "운행"으로 업데이트)
        setBusOpStatus((prevStatus) => {
          const updated = { ...prevStatus };
          data.forEach((bus) => {
            if (!bus || !bus.bus_id) return;
            updated[bus.bus_id] = "운행";
            lastUpdateRef.current[bus.bus_id] = Date.now();
          });
          return updated;
        });
        
      } catch (error) {
        console.error("웹소켓 메시지 JSON 파싱 오류:", error);
      }
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket 오류 발생:", error);
    };

    socket.onclose = (event) => {
      setIsConnected(false);
      console.log("WebSocket 연결 종료됨. 코드:", event.code, "이유:", event.reason);
    };
  };

  const updateMarkers = (busData) => {
    if (!mapRef.current) return;
  
    console.log("[DEBUG] updateMarkers called with busData:", busData);
  
    // 1. 새 데이터에 존재하는 bus_id(문자열 형태)만 추출
    const newBusIds = new Set(busData.map((b) => String(b.bus_id)));
  
    // 2. 기존 마커 중 새 데이터에 없는 버스 제거
    Object.keys(markersRef.current).forEach((existingBusId) => {
      if (!newBusIds.has(existingBusId)) {
        console.log("[DEBUG] Removing marker for bus_id:", existingBusId);
        markersRef.current[existingBusId].setMap(null);
        delete markersRef.current[existingBusId];
  
        if (labelRef.current[existingBusId]) {
          labelRef.current[existingBusId].setMap(null);
          delete labelRef.current[existingBusId];
        }
      }
    });
  
    // 3. 새 데이터에 있는 각 버스에 대해 마커 및 라벨 강제 재생성
    busData.forEach((bus) => {
      if (!bus || !bus.bus_id) return;
      const busIdStr = String(bus.bus_id);
      const { bus_number, latitude, longitude } = bus;
      if (!latitude || !longitude) return;
      
      // busOpStatus에 따른 상태 ("운행" 또는 "미운행")
      const finalStatus = busOpStatus[busIdStr] || "미운행";
      const pos = new window.kakao.maps.LatLng(latitude, longitude);
      console.log(
        `[DEBUG] Creating marker for bus_id: ${busIdStr} at (${latitude}, ${longitude}) with status: ${finalStatus}`
      );
  
      // 강제로 기존 마커 제거 후 새로 생성
      if (markersRef.current[busIdStr]) {
        markersRef.current[busIdStr].setMap(null);
        delete markersRef.current[busIdStr];
      }
      const markerImage = new window.kakao.maps.MarkerImage(
        finalStatus === "미운행" ? NoBusIcon : busIcon,
        new window.kakao.maps.Size(50, 50),
        { offset: new window.kakao.maps.Point(25, 50) }
      );
      const marker = new window.kakao.maps.Marker({
        position: pos,
        image: markerImage,
        map: mapRef.current,
      });
      markersRef.current[busIdStr] = marker;
  
      // 마커 클릭 이벤트: 항상 오버레이 재생성
      window.kakao.maps.event.addListener(marker, "click", () => {
        console.log("[DEBUG] Marker clicked for bus_id:", busIdStr);
        showOverlay(bus);
        setSelectedBus({ ...bus });
      });
  
      // 기존 라벨 제거 후 새 라벨 오버레이 생성
      if (labelRef.current[busIdStr]) {
        labelRef.current[busIdStr].setMap(null);
        delete labelRef.current[busIdStr];
      }
      const labelContent = `<div class="marker-label ${finalStatus === '미운행' ? 'no' : 'yes'}">${bus_number || ""}</div>`;
      const labelOverlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: labelContent,
        yAnchor: 0.7,
        zIndex: -100000,
        map: mapRef.current,
      });
      labelRef.current[busIdStr] = labelOverlay;
    });
  };
  

  const showOverlay = (bus) => {
    // 1. 기존에 열려있는 모든 오버레이 제거
    Object.keys(overlayRef.current).forEach((id) => {
      overlayRef.current[id].setMap(null);
    });
    overlayRef.current = {};

    const { bus_id, bus_number, speed, distance, driver_name, phone, operating_time } = bus;
    const busIdStr = String(bus_id);
    const finalStatus = busOpStatus[busIdStr] || "미운행";
    if (!bus.latitude || !bus.longitude) {
      console.warn(`유효하지 않은 위치: bus_id ${busIdStr}`);
      return;
    }
    const pos = new window.kakao.maps.LatLng(bus.latitude, bus.longitude);

    console.log("[DEBUG] Creating overlay for bus_id:", busIdStr, "with status:", finalStatus);

    // 2. 오버레이 내용 생성
    const content = document.createElement("div");
    content.className = "custom-overlay";
    content.innerHTML = `
      <div class="popup-box">
        <div class="busInfoBox">
          <div class="busInfoBoxTitle">
            <div class="busInfoBoxStatus ${finalStatus}">${finalStatus}</div>
            <div class="busInfoBoxNumber">${bus_number || "차량번호 없음"}</div>
            <div class="close-icon" id="closeOverlay"></div>
          </div>
          <div class="busInfoBoxArticle">
            <div class="usInfoBoxArticleArticle">노선명</div>
            <div class="usInfoBoxArticleArticle">${distance || 0} km</div>
            <div class="usInfoBoxArticleArticle">현재속도</div>
            <div class="usInfoBoxArticleArticle">${speed || 0} km/h</div>
          </div>
          <div class="busInfoBoxArticle">
            <div class="usInfoBoxArticleArticle">운전자명</div>
            <div class="usInfoBoxArticleArticle">${driver_name || "정보 없음"}</div>
            <div class="usInfoBoxArticleArticle">운행시간</div>
            <div class="usInfoBoxArticleArticle">${operating_time || 0} 분</div>
          </div>
          <div class="busInfoBoxArticle">
            <div class="usInfoBoxArticleArticle">연락처</div>
            <div class="usInfoBoxArticleArticle">${phone || "정보 없음"}</div>
          </div>
        </div>
        <div class="calenderBtn" id="openCalendarBtn">운행경로</div>
      </div>
    `;

    content.addEventListener("click", (e) => {
      if (e.target.id === "closeOverlay") {
        closeAllOverlays();
      } else if (e.target.id === "openCalendarBtn" && openCalendar) {
        openCalendar();
      }
    });

    const overlay = new window.kakao.maps.CustomOverlay({
      position: pos,
      content,
      yAnchor: 1.3,
      xAnchor: 0.5,
      zIndex: 2,
      map: mapRef.current,
    });
    overlayRef.current[busIdStr] = overlay;
  };

  const closeAllOverlays = () => {
    Object.keys(overlayRef.current).forEach((busId) => {
      overlayRef.current[busId].setMap(null);
    });
    overlayRef.current = {};
    polylinesRef.current.forEach((pl) => pl.setMap(null));
    polylinesRef.current = [];
    startEndMarkersRef.current.forEach((m) => m.setMap(null));
    startEndMarkersRef.current = [];
  };

  const updateOverlays = () => {
    Object.keys(overlayRef.current).forEach((busId) => {
      const bus = buses.find((b) => b && b.bus_id === parseInt(busId));
      if (bus) showOverlay(bus);
    });
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
    mapRef.current.setCenter(startPos);
    mapRef.current.setLevel(3);
  };

  useImperativeHandle(ref, () => ({
    closeAllOverlays,
  }));

  useEffect(() => {
    drawArrowsOnPath(routePoints);
  }, [routePoints]);

  return (
    <div className="kakaomap" style={{ backgroundColor: "#eee" }}>
      <div id="map"></div>
    </div>
  );
});

export default KakaoMap;
