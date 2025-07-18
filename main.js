
function simulate() {
  const flightCode = document.getElementById("flightCode").value;
  alert("Simulating flight: " + flightCode);
  const canvas = document.getElementById("map");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "yellow";
  ctx.font = "20px Arial";
  ctx.fillText("Sunlit Earth & Flight Path Simulation", 50, 50);
}
