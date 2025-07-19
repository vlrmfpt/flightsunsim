// airline-autocomplete.js

// 예시 데이터: 실제로는 훨씬 더 많은 데이터를 포함해야 합니다.
// 전체 항공사 IATA 코드는 인터넷에서 검색하여 CSV 또는 JSON 형태로 수집할 수 있습니다.
const airlines = [
    { code: 'KE', name: 'Korean Air' },
    { code: 'KL', name: 'KLM Royal Dutch Airlines' },
    { code: 'LH', name: 'Lufthansa' },
    { code: 'AF', name: 'Air France' },
    { code: 'UA', name: 'United Airlines' },
    { code: 'DL', name: 'Delta Air Lines' },
    { code: 'AA', name: 'American Airlines' },
    { code: 'BA', name: 'British Airways' },
    { code: 'JL', name: 'Japan Airlines' },
    { code: 'NH', name: 'All Nippon Airways' },
    { code: 'OZ', name: 'Asiana Airlines' },
    { code: 'EK', name: 'Emirates' },
    { code: 'QR', name: 'Qatar Airways' },
    { code: 'SQ', name: 'Singapore Airlines' },
    { code: 'CX', name: 'Cathay Pacific' },
    // ... 더 많은 항공사 데이터 추가
];

function setupAirlineAutocomplete(inputElement, datalistElement) {
    inputElement.addEventListener('input', () => {
        const inputValue = inputElement.value.toUpperCase();
        datalistElement.innerHTML = ''; // 기존 옵션 초기화

        if (inputValue.length < 1) { // 최소 1글자 입력 시 동작 (또는 2글자)
            return;
        }

        const filteredAirlines = airlines.filter(airline => 
            airline.code.startsWith(inputValue) || 
            airline.name.toUpperCase().includes(inputValue)
        ).slice(0, 10); // 최대 10개 결과만 표시

        filteredAirlines.forEach(airline => {
            const option = document.createElement('option');
            option.value = airline.code; // 자동 완성 시 IATA 코드 입력
            option.textContent = `${airline.code} - ${airline.name}`; // 드롭다운에 표시
            datalistElement.appendChild(option);
        });
    });
}
