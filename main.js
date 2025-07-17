
let map = L.map('map').setView([40, 150], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let planeMarker = L.marker([40, 150], {icon: L.divIcon({className: 'plane-icon', html: '✈️'})}).addTo(map);

let interval, speed = 2, minutes = 0;

function startSim() {
  speed = parseInt(document.getElementById("speed").value);
  if (interval) clearInterval(interval);
  interval = setInterval(() => {
    minutes += 10;
    let lat = 40 + minutes * 0.01;
    let lng = 150 - minutes * 0.02;
    planeMarker.setLatLng([lat, lng]);
    map.setView([lat, lng]);
  }, 1000 / speed);
}

function pauseSim() {
  clearInterval(interval);
}
