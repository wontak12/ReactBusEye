import React, { useEffect } from "react";
import "../css/kakaomap.css"; // 스타일 적용
import busIcon from "../images/busIcon.png";
const KakaoMap = () => {
  useEffect(() => {
    const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAOMAP_KEY;
    console.log("🔍 KAKAO_MAP_KEY:", KAKAO_MAP_KEY);

    if (!KAKAO_MAP_KEY) {
      console.error("❌ 카카오 맵 API 키가 설정되지 않았습니다.");
      return;
    }

    if (document.getElementById("kakao-map-script")) {
      console.log("✔️ 카카오 맵 스크립트 이미 로드됨");
      loadKakaoMap();
      return;
    }

    console.log("📌 카카오 맵 스크립트 로드 시작");

    const script = document.createElement("script");
    script.id = "kakao-map-script";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      console.log("✅ 카카오 맵 스크립트 로드 완료");

      if (!window.kakao) {
        console.error("❌ 카카오 API 로드 실패");
        return;
      }
      loadKakaoMap();
    };

    script.onerror = () => {
      console.error("❌ 카카오 맵 API 스크립트 로드 실패! API 키 또는 도메인 등록 문제일 가능성 있음.");
    };
  }, []);

  const loadKakaoMap = () => {
    if (!window.kakao || !window.kakao.maps) {
      console.error("❌ window.kakao 또는 window.kakao.maps가 없음");
      return;
    }
    console.log("🚀 카카오맵 로드 시작");

    window.kakao.maps.load(() => {
      const container = document.getElementById("map");
      if (!container) {
        console.error("❌ 'map' 요소가 없습니다.");
        return;
      }

      console.log("✅ 카카오맵 생성 시작");
      const options = {
        center: new window.kakao.maps.LatLng(37.5651, 126.9784), // 서울시청역 중심
        level: 3, // 확대 수준
      };

      const map = new window.kakao.maps.Map(container, options);
      console.log("✅ 카카오맵 로드 완료");

      // 🚀 서울시청역에 마커 추가
      const markerPosition = new window.kakao.maps.LatLng(37.5651, 126.9784);
      const imageSrc = busIcon; // 원하는 이미지 URL
      const imageSize = new window.kakao.maps.Size(50, 50); // 이미지 크기 (픽셀 단위)
      const imageOption = { offset: new window.kakao.maps.Point(28, 40) }; // 중심점 조정

      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        image: markerImage, // 이미지 적용
        map: map,
      });

      // ✅ 차량 번호를 표시할 CustomOverlay 추가
      const content = `
        <div class="custom-overlay">
          <div class="info-box">
            차량번호
          </div>
        </div>
      `;

const overlay = new window.kakao.maps.CustomOverlay({
  position: markerPosition,
  content: content,
  yAnchor: -0.5, // 마커보다 아래쪽에 위치 조정
  map: map,
});




      console.log("📍 서울시청역 마커 추가 완료");
    });
  };

  return (
    <div className="kakaomap" style={{ backgroundColor: "#eee" }}>
      <div id="map"></div>
    </div>
  );
};

export default KakaoMap;
