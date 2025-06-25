const { ipcRenderer } = require('electron');

const firesCheckbox = document.getElementById("firesBtn");
const earthquakesCheckbox = document.getElementById("equakesBtn");
const accuracyCheckbox = document.getElementById("accuracyBtn");
const btnReset = document.getElementById("reset");
const closeAppBtn = document.getElementById('closeAppBtn');
const datePicker = document.getElementById("datePicker");

const map = L.map('map', {
  maxZoom: 12,
  minZoom: 3,
  maxBounds: [
    [-90, -180],
    [90, 180]
  ],
  maxBoundsViscosity: 1.0,
  worldCopyJump: false
}).setView([-33.45, -70.6667], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const markerGroup = L.layerGroup().addTo(map);

let firesData = [];
let earthquakesData = [];

function isCoordinateValid(lat, lng, confidence = null, magnitude = null) {
  if (accuracyCheckbox.checked) {
    if (confidence !== null && confidence < 70) return false;
    if (magnitude !== null && magnitude < 4) return false;
  }
  return true;
}

function isDuplicateCoordinate(lat, lng, seenCoords) {
  const key = `${lat},${lng}`;
  if (seenCoords.has(key)) return true;
  seenCoords.add(key);
  return false;
}

function clearMap() {
  markerGroup.clearLayers();
}

function filterAndDisplayData() {
  clearMap();

  const bounds = map.getBounds();
  const seenCoords = new Set();

  if (earthquakesCheckbox.checked) {
    earthquakesData.forEach(eq => {
      const coords = eq.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return;
      const [lng, lat] = coords;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      const mag = eq.properties.mag;
      if (!isCoordinateValid(lat, lng, null, mag)) return;
      if (!bounds.contains([lat, lng])) return;
      if (isDuplicateCoordinate(lat, lng, seenCoords)) return;

      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'earthquake.png',
          iconSize: [24, 24],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        })
      }).bindPopup(`Magnitude: ${mag}`);

      markerGroup.addLayer(marker);
    });
  }

  if (firesCheckbox.checked) {
    firesData.forEach(fire => {
      const lat = parseFloat(fire.latitude);
      const lng = parseFloat(fire.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      const conf = parseFloat(fire.confidence);
      if (!isCoordinateValid(lat, lng, conf, null)) return;
      if (!bounds.contains([lat, lng])) return;
      if (isDuplicateCoordinate(lat, lng, seenCoords)) return;

      const popupContent = `
        <strong>Fire detected</strong><br>
        Brightness: ${fire.brightness}<br>
        Date: ${fire.acq_date} ${fire.acq_time}<br>
        Confidence: ${fire.confidence}%
      `;

      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'flame.png',
          iconSize: [16, 16],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        })
      }).bindPopup(popupContent);

      markerGroup.addLayer(marker);
    });
  }
}

async function fetchData(date) {
  const promises = [];

  if (earthquakesCheckbox.checked) {
    promises.push(fetch(`http://localhost:8000/api/earthquakes?date=${date}`).then(res => res.json()).then(data => {
      earthquakesData = data.features || [];
    }));
  } else {
    earthquakesData = [];
  }

  if (firesCheckbox.checked) {
    promises.push(fetch(`http://localhost:8000/api/fires?date=${date}`).then(res => res.json()).then(data => {
      firesData = data || [];
    }));
  } else {
    firesData = [];
  }

  await Promise.all(promises);
  filterAndDisplayData();
}

btnReset.addEventListener("click", () => {
  const selectedDate = datePicker.value;
  if (!selectedDate) {
    alert("Please select a date");
    return;
  }
  fetchData(selectedDate);
});

map.on('moveend', () => {
  filterAndDisplayData();
});

map.on('zoomend', () => {
  filterAndDisplayData();
});

firesCheckbox.addEventListener("change", () => {
  filterAndDisplayData();
});

earthquakesCheckbox.addEventListener("change", () => {
  filterAndDisplayData();
});

accuracyCheckbox.addEventListener("change", () => {
  filterAndDisplayData();
});

document.addEventListener("DOMContentLoaded", () => {
  flatpickr("#datePicker", {
    dateFormat: "Y-m-d",
    maxDate: "today",
    minDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    defaultDate: "today"
  });
});

closeAppBtn.addEventListener('click', () => {
  ipcRenderer.send('close-app');
});

document.querySelectorAll('.leaflet-control-attribution').forEach(el => el.remove());

document.getElementById("lastUpdated").textContent = new Date().toLocaleString();