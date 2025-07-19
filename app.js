// app.js
document.addEventListener('DOMContentLoaded', () => {
    const flightNumberInput = document.getElementById('flight-number');
    const datePicker = document.getElementById('date-picker');
    const speedControl = document.getElementById('speed-control');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const timeDisplay = document.getElementById('time-display');
    const airlineSuggestions = document.getElementById('airline-suggestions');

    let map;
    let flightPathPolyline;
    let airplaneMarker;
    let dayNightOverlay;
    let simulationInterval;
    let currentSimulationTime;
    let flightData = null; // 선택된 항공편 경로 데이터
    let currentPathIndex = 0; // 현재 비행기 경로 인덱스

    const SIM_SPEED_KM_PER_HOUR = 900; // 약 900 km/h
    const FRAME_INTERVAL_MS = 100; // 100ms마다 업데이트 (10분 단위 이동을 위한 기본 프레임)

    // --- 1. 지도 초기화 ---
    function initializeMap() {
        map = L.map('map').setView([30, 0], 2); // 초기 지도 위치 및 줌 레벨
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Day/Night Overlay를 위한 초기 Polygon 생성
        dayNightOverlay = L.polygon([], {
            fillColor: '#000',
            fillOpacity: 0.5,
            stroke: false,
            className: 'day-night-overlay'
        }).addTo(map);
    }

    // --- 2. Sunlit Earth (태양광 영역) 계산 및 표시 ---
    function updateSunlightOverlay(simTime) {
        // SunCalc를 사용하여 현재 시간의 태양 위치 및 터미네이터 라인 계산
        // 이 부분은 SunCalc.js 문서를 참고하여 정교하게 구현해야 합니다.
        // 여기서는 예시를 위해 간단한 로직을 구성합니다.
        
        // 실제 구현에서는 날짜와 위도/경도를 기반으로 sunrise, sunset, dawn, dusk 등을 계산하여
        // 낮/밤 경계를 형성하는 일련의 위도/경도 포인트를 생성해야 합니다.
        // SunCalc.getTimes(date, latitude, longitude)
        // SunCalc.getPosition(date, latitude, longitude)
        // 터미네이터 라인을 그리는 것은 복잡하므로, 외부 라이브러리 (예: turf.js와 결합) 또는
        // 미리 계산된 포인트 데이터를 활용하는 것이 좋습니다.

        // 임시 로직: 지도 전체를 덮는 검은색 오버레이로 시작 (실제 구현 필요)
        // const bounds = map.getBounds();
        // const southWest = bounds.getSouthWest();
        // const northEast = bounds.getNorthEast();
        // const overlayCoords = [
        //     [southWest.lat, southWest.lng],
        //     [northEast.lat, southWest.lng],
        //     [northEast.lat, northEast.lng],
        //     [southWest.lat, northEast.lng]
        // ];
        // dayNightOverlay.setLatLngs(overlayCoords);

        // TODO: SunCalc.js를 활용하여 정확한 낮/밤 경계선 계산 및 dayNightOverlay 업데이트
        // 이 부분은 가장 복잡한 로직 중 하나가 될 것입니다.
        // 예시: 간단히 전체 맵을 밤으로 처리 (개발용)
        const darkOverlayCoords = [
            [-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180]
        ];
        dayNightOverlay.setLatLngs(darkOverlayCoords);
        // 실제 구현에서는 simTime을 기준으로 터미네이터 라인을 계산하여
        // 지구의 절반을 밤으로, 나머지 절반을 낮으로 보이도록 투명도를 조절합니다.
        // SunCalc는 특정 지점의 해 뜨는 시간/지는 시간을 주므로, 이를 이용해 여러 위도/경도 지점들을 
        // 연결하여 경계선을 그리는 방식이 일반적입니다.

        // 예시: 간단하게 현재 시간이 18시 이후 6시 이전이면 밤으로 가정 (실제와 다름)
        const hours = simTime.getHours();
        if (hours >= 18 || hours < 6) {
             dayNightOverlay.setStyle({ fillOpacity: 0.5 }); // 밤
        } else {
             dayNightOverlay.setStyle({ fillOpacity: 0 }); // 낮 (투명)
        }
    }


    // --- 3. 항공편 경로 데이터 로드 ---
    async function loadFlightData(flightNumber) {
        try {
            const response = await fetch('data/flightpaths.json');
            const data = await response.json();
            flightData = data[flightNumber.toUpperCase()];
            if (!flightData) {
                alert('해당 항공편의 경로 데이터를 찾을 수 없습니다.');
                return null;
            }
            return flightData;
        } catch (error) {
            console.error('Error loading flight data:', error);
            alert('항공편 데이터를 로드하는 데 실패했습니다.');
            return null;
        }
    }

    // --- 4. 시뮬레이션 시작/일시정지/초기화 ---
    async function startSimulation() {
        const flightNumber = flightNumberInput.value;
        const startDate = datePicker.value;

        if (!flightNumber || !startDate) {
            alert('항공편 번호와 날짜를 입력해주세요.');
            return;
        }

        if (!flightData) {
            flightData = await loadFlightData(flightNumber);
            if (!flightData) return; // 데이터 로드 실패 시 중단
        }

        // 초기 시간 설정: 선택된 날짜의 출발 시간 (flightData[0]의 시간)
        const departureTime = new Date(startDate);
        const [depHours, depMinutes] = flightData.path[0].time.split(':').map(Number);
        departureTime.setHours(depHours, depMinutes, 0, 0);
        currentSimulationTime = departureTime;
        currentPathIndex = 0;

        // 지도에 경로 그리기
        if (flightPathPolyline) {
            map.removeLayer(flightPathPolyline);
        }
        const pathCoords = flightData.path.map(p => [p.latitude, p.longitude]);
        flightPathPolyline = L.polyline(pathCoords, { color: 'blue', weight: 3, opacity: 0.7 }).addTo(map);
        map.fitBounds(flightPathPolyline.getBounds()); // 경로에 맞게 지도 줌

        // 비행기 마커 초기화
        if (airplaneMarker) {
            map.removeLayer(airplaneMarker);
        }
        const initialPos = flightData.path[0];
        airplaneMarker = L.marker([initialPos.latitude, initialPos.longitude], {
            icon: L.divIcon({
                className: 'airplane-icon',
                html: '<span style="font-size: 24px;">✈️</span>', // ✈️ 아이콘
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(map);

        updateMapAndDisplay(); // 첫 프레임 업데이트
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;

        clearInterval(simulationInterval);
        simulationInterval = setInterval(simulateStep, FRAME_INTERVAL_MS);
    }

    function pauseSimulation() {
        clearInterval(simulationInterval);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    function resetSimulation() {
        clearInterval(simulationInterval);
        map.removeLayer(flightPathPolyline);
        map.removeLayer(airplaneMarker);
        dayNightOverlay.setStyle({ fillOpacity: 0 }); // 오버레이 초기화
        timeDisplay.textContent = '';
        currentSimulationTime = null;
        flightData = null;
        currentPathIndex = 0;

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = true;
        map.setView([30, 0], 2); // 초기 뷰로 돌아가기
    }

    // --- 5. 시뮬레이션 스텝 (10분 단위 이동 로직) ---
    function simulateStep() {
        if (!flightData || currentPathIndex >= flightData.path.length - 1) {
            pauseSimulation();
            alert('시뮬레이션이 종료되었습니다.');
            return;
        }

        const currentPos = flightData.path[currentPathIndex];
        const nextPos = flightData.path[currentPathIndex + 1];

        // 각 경로 포인트 사이의 실제 시간 간격을 계산 (분 단위)
        // flightpaths.json의 'time' 필드를 Date 객체로 변환하여 사용
        const currentTimeParts = currentPos.time.split(':').map(Number);
        const nextTimeParts = nextPos.time.split(':').map(Number);

        let currentPointDate = new Date(currentSimulationTime); // 현재 시뮬레이션 날짜 사용
        currentPointDate.setHours(currentTimeParts[0], currentTimeParts[1], 0, 0);

        let nextPointDate = new Date(currentSimulationTime);
        nextPointDate.setHours(nextTimeParts[0], nextTimeParts[1], 0, 0);

        // 다음 날로 넘어가는 경우 처리
        if (nextPointDate < currentPointDate) {
            nextPointDate.setDate(nextPointDate.getDate() + 1);
        }

        const timeDiffMinutes = (nextPointDate.getTime() - currentPointDate.getTime()) / (1000 * 60);
        // console.log(`Path index ${currentPathIndex} to ${currentPathIndex + 1}: Time Diff = ${timeDiffMinutes} minutes`);

        // 여기서는 간단하게 10분 단위로 이동하도록 (실제 데이터와 맞지 않을 수 있음)
        // 실제로는 비행 속도와 거리를 계산하여 다음 포인트까지의 도달 시간을 정확히 계산해야 합니다.
        // 현재는 flightpaths.json에 명시된 포인트들을 순차적으로 이동하는 방식으로 구현합니다.
        
        currentPathIndex++;
        const newPos = flightData.path[currentPathIndex];
        const [newHours, newMinutes] = newPos.time.split(':').map(Number);
        currentSimulationTime.setHours(newHours, newMinutes, 0, 0);

        updateMapAndDisplay();
    }

    // --- 6. 지도 및 시간 표시 업데이트 ---
    function updateMapAndDisplay() {
        if (!airplaneMarker || !flightData) return;

        const currentPos = flightData.path[currentPathIndex];
        airplaneMarker.setLatLng([currentPos.latitude, currentPos.longitude]);
        map.panTo([currentPos.latitude, currentPos.longitude]); // 비행기 위치로 지도 이동

        // 시간 표시 업데이트
        timeDisplay.textContent = `현재 시간: ${currentSimulationTime.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })}`;

        // 태양광 오버레이 업데이트
        updateSunlightOverlay(currentSimulationTime);
    }

    // --- 7. 이벤트 리스너 ---
    startBtn.addEventListener('click', startSimulation);
    pauseBtn.addEventListener('click', pauseSimulation);
    resetBtn.addEventListener('click', resetSimulation);

    speedControl.addEventListener('change', (e) => {
        const speed = parseInt(e.target.value);
        // 시뮬레이션 인터벌 변경 (FRAME_INTERVAL_MS는 고정하고, timeDiffMinutes에 곱하거나 나누는 방식으로 속도 조절 가능)
        // 여기서는 임시로 인터벌 자체를 조절합니다.
        clearInterval(simulationInterval);
        if (simulationInterval) { // 시뮬레이션이 진행 중일 때만 인터벌 다시 설정
            simulationInterval = setInterval(simulateStep, FRAME_INTERVAL_MS / speed);
        }
    });

    // 항공사 IATA 코드 자동완성 (airline-autocomplete.js에서 제공)
    setupAirlineAutocomplete(flightNumberInput, airlineSuggestions);

    // 초기 설정
    initializeMap();
    resetSimulation(); // 초기 상태 설정
    datePicker.valueAsDate = new Date(); // 오늘 날짜로 기본 설정
});
