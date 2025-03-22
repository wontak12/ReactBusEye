import React, { useEffect, useRef } from "react";
import "../css/kakaomap.css";

import busIcon from "../images/busIcon.png";
import NoBusIcon from "../images/NoBusicon.png";
import startIcon from "../images/출발.png";
import arriveIcon from "../images/도착.png";

import { getAccessToken } from "../services/authService";

const KakaoMap = ({
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
}) => {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const overlayRef = useRef({});
  const labelRef = useRef({});
  const polylinesRef = useRef([]);
  const startEndMarkersRef = useRef([]);
  const socketRef = useRef(null);
  const lastUpdateRef = useRef({});

  const WEBSOCKET_URL =
    process.env.REACT_APP_WEBSOCKET_URL || "ws://104.197.230.228:8000/ws/dispatch/all";

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

  useEffect(() => {
    updateMarkers(buses);
    updateOverlays();
  }, [busOpStatus]);

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
        }
      } catch (e) {
        console.error("lastBusData JSON 파싱 오류:", e);
      }
    }
  };

  const connectWebSocket = async () => {
    const token = getAccessToken();
    const wsUrl = token ? `${WEBSOCKET_URL}?token=${token}` : WEBSOCKET_URL;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        let data = JSON.parse(event.data);
        if (!Array.isArray(data)) data = [data];

        const now = Date.now();

        setIsConnected(true);

        setBusOpStatus((prevStatus) => {
          const updatedStatus = { ...prevStatus };
          data.forEach((bus) => {
            updatedStatus[bus.bus_id] = "운행";
            lastUpdateRef.current[bus.bus_id] = now;
          });
          return updatedStatus;
        });

        setBuses((prev) => {
          const map = new Map(prev.map((bus) => [bus.bus_id, bus]));
          data.forEach((bus) => map.set(bus.bus_id, bus));
          return Array.from(map.values());
        });

        const existingData = localStorage.getItem("lastBusData");
        let busDataObj = existingData ? JSON.parse(existingData) : {};
        data.forEach((bus) => {
          busDataObj[bus.bus_id] = bus;
        });
        localStorage.setItem("lastBusData", JSON.stringify(busDataObj));
      } catch (error) {
        console.error("웹소켓 메시지 JSON 파싱 오류:", error);
      }
    };

    socket.onerror = (error) => console.error("웹소켓 오류:", error);
    socket.onclose = () => {
      setIsConnected(false);
    };
  };

  const updateMarkers = (busData) => {
    if (!mapRef.current) return;
    busData.forEach((bus) => {
      const { bus_id, bus_number, latitude, longitude } = bus;
      if (!bus_id || !latitude || !longitude) return;
      const finalStatus = busOpStatus[bus_id] || "미운행";
      const pos = new window.kakao.maps.LatLng(latitude, longitude);
      const markerImage = new window.kakao.maps.MarkerImage(
        finalStatus === "미운행" ? NoBusIcon : busIcon,
        new window.kakao.maps.Size(50, 50),
        { offset: new window.kakao.maps.Point(25, 50) }
      );

      if (markersRef.current[bus_id]) {
        markersRef.current[bus_id].setMap(null);
      }

      const marker = new window.kakao.maps.Marker({ position: pos, image: markerImage, map: mapRef.current });
      markersRef.current[bus_id] = marker;

      const labelContent = `<div class="marker-label ${finalStatus === '미운행' ? 'no' : 'yes'}">${bus_number || ""}</div>`;
      if (labelRef.current[bus_id]) {
        labelRef.current[bus_id].setPosition(pos);
        labelRef.current[bus_id].setContent(labelContent);
      } else {
        const labelOverlay = new window.kakao.maps.CustomOverlay({
          position: pos,
          content: labelContent,
          yAnchor: 0.7,
          zIndex: -100000,
          map: mapRef.current,
        });
        labelRef.current[bus_id] = labelOverlay;
      }

      window.kakao.maps.event.addListener(marker, "click", () => {
        setSelectedBus(bus);
        mapRef.current.setCenter(pos);
        drawArrowsOnPath(routePoints);
        showOverlay(bus);
      });
    });
  };

  const showOverlay = (bus) => {
    const { bus_id, bus_number, speed, distance, driver_name, phone, operating_time } = bus;
    const finalStatus = busOpStatus[bus_id] || "미운행";
    const pos = new window.kakao.maps.LatLng(bus.latitude, bus.longitude);
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
        closeOverlay(bus_id);
      } else if (e.target.id === "openCalendarBtn" && openCalendar) {
        openCalendar();
      }
    });

    const overlay = new window.kakao.maps.CustomOverlay({
      position: pos,
      content,
      yAnchor: 1.3,
      xAnchor: 0.5,
      map: mapRef.current,
    });

    Object.values(overlayRef.current).forEach((ov) => ov.setMap(null));
    overlayRef.current = { [bus_id]: overlay };
  };

  const closeOverlay = (busId) => {
    if (overlayRef.current[busId]) {
      overlayRef.current[busId].setMap(null);
      delete overlayRef.current[busId];
    }
  
    // 👉 폴리라인 및 출발/도착 마커 제거
    polylinesRef.current.forEach((pl) => pl.setMap(null));
    polylinesRef.current = [];
  
    startEndMarkersRef.current.forEach((m) => m.setMap(null));
    startEndMarkersRef.current = [];
  };
  

  const updateOverlays = () => {
    Object.keys(overlayRef.current).forEach((busId) => {
      const bus = buses.find((b) => b.bus_id === parseInt(busId));
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

  useEffect(() => {
    drawArrowsOnPath(routePoints);
  }, [routePoints]);

  return (
    <div className="kakaomap" style={{ backgroundColor: "#eee" }}>
      <div id="map" style={{ width: "100%", height: "100vh" }}></div>
    </div>
  );
};

export default KakaoMap;
