let map = L.map('map').setView([40, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let planeIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1547/1547140.png",
  iconSize: [40, 40]
});

let flight = JSON.parse(document.querySelector("script[src$='flightpaths.json']").textContent).KE092;
let marker = L.marker(flight.path[0], { icon: planeIcon }).addTo(map);
let polyline = L.polyline(flight.path, { color: 'red' }).addTo(map);

let speed = 1, index = 0, simTime, interval;

document.getElementById('start').onclick = () => {
  clearInterval(interval);
  speed = parseInt(document.getElementById("speed").value);
  let startTime = new Date(document.getElementById("datetime").value);
  simTime = startTime.getTime();
  interval = setInterval(() => {
    simTime += 1000 * speed;
    updateSimulation(simTime);
  }, 1000);
};

document.getElementById('pause').onclick = () => clearInterval(interval);
document.getElementById('reset').onclick = () => {
  clearInterval(interval);
  marker.setLatLng(flight.path[0]);
  drawSunlight(new Date(document.getElementById("datetime").value));
};

function updateSimulation(time) {
  let t = (time - new Date(document.getElementById("datetime").value).getTime()) / (1000 * 60 * 60);
  index = Math.min(Math.floor(t / 1), flight.path.length - 1);
  if (index < flight.path.length - 1) {
    let from = flight.path[index], to = flight.path[index + 1];
    let progress = t % 1;
    let lat = from[0] + (to[0] - from[0]) * progress;
    let lng = from[1] + (to[1] - from[1]) * progress;
    marker.setLatLng([lat, lng]);
  }
  drawSunlight(new Date(time));
}

function drawSunlight(time) {
  if (window.sunLayer) map.removeLayer(window.sunLayer);
  let bounds = [];
  for (let lon = -180; lon <= 180; lon += 10) {
    let times = SunCalc.getTimes(time, 0, lon);
    let night = times.sunrise.getTime() > time.getTime();
    bounds.push([[85, lon], [-85, lon]]);
  }
  window.sunLayer = L.rectangle([[-85, -180], [85, 180]], {
    color: 'black',
    fillColor: 'black',
    fillOpacity: 0.5,
    weight: 0
  }).addTo(map);
}

