import React, { useEffect, useState, useRef } from "react";
import "../css/kakaomap.css";
import busIcon from "../images/busIcon.png";

const KakaoMap = ({ selectedBus, setSelectedBus, openCalendar, routePoints }) => {
  const [buses, setBuses] = useState([]);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const overlayRef = useRef({});
  const labelRef = useRef({});
  const polylinesRef = useRef([]); // 폴리라인 관리

  useEffect(() => {
    const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAOMAP_KEY;
    if (!KAKAO_MAP_KEY) {
      console.error("❌ 카카오 맵 API 키가 설정되지 않았습니다.");
      return;
    }
    if (!document.getElementById("kakao-map-script")) {
      const script = document.createElement("script");
      script.id = "kakao-map-script";
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        if (!window.kakao || !window.kakao.maps) {
          console.error("❌ 카카오 API 로드 실패 (kakao.maps 없음)");
          return;
        }
        window.kakao.maps.load(() => {
          loadKakaoMap();
          connectWebSocket();
        });
      };
    } else {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          loadKakaoMap();
          connectWebSocket();
        });
      } else {
        console.error("❌ window.kakao 또는 window.kakao.maps가 준비되지 않음");
      }
    }
  }, []);

  const loadKakaoMap = () => {
    const container = document.getElementById("map");
    if (!container) {
      console.error("❌ map 컨테이너(#map)를 찾을 수 없습니다.");
      return;
    }
    const options = {
      center: new window.kakao.maps.LatLng(37.5651, 126.9784),
      level: 3,
    };
    mapRef.current = new window.kakao.maps.Map(container, options);
    console.log("✅ Kakao map 로드 완료:", mapRef.current);
  };

  const connectWebSocket = () => {
    const socket = new WebSocket("ws://104.197.230.228:8000/ws/dispatch/all");
    socket.onopen = () => console.log("✅ WebSocket 연결됨");
    socket.onmessage = (event) => {
      try {
        let data = JSON.parse(event.data);
        console.log("✅ WebSocket 메시지:", data);
        if (!Array.isArray(data)) data = [data];
        updateBuses(data);
      } catch (error) {
        console.error("❌ JSON 파싱 오류:", error);
      }
    };
    socket.onerror = (error) => console.error("❌ WebSocket 오류:", error);
    socket.onclose = () => console.warn("⚠️ WebSocket 연결 종료됨");
  };

  const updateBuses = (busData) => {
    setBuses(busData);
    if (!mapRef.current) return;
    busData.forEach((bus) => {
      const { bus_id, bus_number, latitude, longitude } = bus;
      if (!bus_id || !latitude || !longitude || !bus_number) {
        console.error("❌ 잘못된 버스 데이터:", bus);
        return;
      }
      const position = new window.kakao.maps.LatLng(latitude, longitude);
      if (markersRef.current[bus_id]) {
        markersRef.current[bus_id].setPosition(position);
        if (labelRef.current[bus_id]) {
          labelRef.current[bus_id].setPosition(position);
        }
      } else {
        const markerImage = new window.kakao.maps.MarkerImage(
          busIcon,
          new window.kakao.maps.Size(50, 50),
          { offset: new window.kakao.maps.Point(25, 50) }
        );
        const marker = new window.kakao.maps.Marker({
          position,
          image: markerImage,
          map: mapRef.current,
        });
        const labelContent = `<div class="marker-label">${bus_number}</div>`;
        const labelOverlay = new window.kakao.maps.CustomOverlay({
          position,
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
        markersRef.current[bus_id] = marker;
      }
    });
  };

  useEffect(() => {
    if (selectedBus && mapRef.current) {
      let busToShow = selectedBus;
      if (!busToShow.latitude || !busToShow.longitude) {
        const found = buses.find((b) => b.bus_id === selectedBus.bus_id);
        if (found) {
          busToShow = found;
        } else {
          console.error("선택된 버스의 좌표 정보가 없습니다.");
          return;
        }
      }
      showPopup(busToShow);
    }
  }, [selectedBus]);

  const showPopup = (bus) => {
    if (!mapRef.current) return;
    if (overlayRef.current[bus.bus_id]) {
      overlayRef.current[bus.bus_id].setMap(null);
    }
    const position = new window.kakao.maps.LatLng(bus.latitude, bus.longitude);
    const content = document.createElement("div");
    content.className = "custom-overlay";
    content.innerHTML = `
      <div class="popup-box">
        <div class="busInfoBox">
          <div class="busInfoBoxTitle">
            <div class="busInfoBoxStatus">운행</div>
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
      document.getElementById("closeOverlay").addEventListener("click", () => closeOverlay(bus.bus_id));
      document.getElementById("openCalendarBtn").addEventListener("click", openCalendar);
    }, 100);
  };

  const closeOverlay = (busId) => {
    if (overlayRef.current[busId]) {
      overlayRef.current[busId].setMap(null);
    }
  };

  // ✅ `drawArrowsOnPath` 함수 추가 ✅
  const drawArrowsOnPath = (points) => {
    polylinesRef.current.forEach((pl) => pl.setMap(null));
    polylinesRef.current = [];

    if (!mapRef.current || points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = new window.kakao.maps.LatLng(points[i].latitude, points[i].longitude);
      const p2 = new window.kakao.maps.LatLng(points[i + 1].latitude, points[i + 1].longitude);

      const segmentPolyline = new window.kakao.maps.Polyline({
        map: mapRef.current,
        path: [p1, p2],
        strokeWeight: 8,
        strokeColor: "black",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
        endArrow: true,
      });
      polylinesRef.current.push(segmentPolyline);
    }
  };

  useEffect(() => {
    if (routePoints.length > 0) {
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
