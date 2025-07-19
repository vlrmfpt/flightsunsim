const map = L.map('map').setView([50, -150], 3);

// 기본 타일
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// KE092 예시 경로 (10월 4일 기준 대략적 좌표 수작업)
const route = [
  [49.1947, -123.1792], // 밴쿠버 출발
  [60, -140],
  [70, -170],
  [65, 160],
  [55, 140],
  [45, 125],
  [37.4691, 126.4505] // 인천 도착
];

// 선으로 표시
L.polyline(route, { color: 'red' }).addTo(map);

// 비행기 위치 초기화
let planeMarker = L.marker(route[0], { icon: L.divIcon({ className: '', html: '✈️' }) }).addTo(map);

// 해빛 경계 그리기
function drawSunlightBoundary(date) {
  const bounds = [];
  for (let lon = -180; lon <= 180; lon += 5) {
    const times = SunCalc.getTimes(date, 0, lon);
    const solarPos = SunCalc.getPosition(times.sunrise, 0, lon);
    const lat = -solarPos.altitude * (180 / Math.PI); // 대략적 경계선 계산
    bounds.push([lat, lon]);
  }
  L.polyline(bounds, { color: 'yellow', dashArray: '5,5' }).addTo(map);
}

// 현재 시간으로 초기 해빛 경계 표시
drawSunlightBoundary(new Date("2024-10-04T15:00:00Z")); // UTC 기준

// 비행 시뮬레이션
let index = 0;
function animateFlight() {
  if (index < route.length) {
    planeMarker.setLatLng(route[index]);
    index++;
    setTimeout(animateFlight, 1500); // 1.5초 간격
  }
}
animateFlight();
