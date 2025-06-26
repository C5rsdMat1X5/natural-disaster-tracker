document.addEventListener("DOMContentLoaded", () => {
  const { ipcRenderer } = require('electron');

  const fireCheckbox = document.getElementById("firesBtn");
  const earthquakeCheckbox = document.getElementById("equakesBtn");
  const accuracyFilterCheckbox = document.getElementById("accuracyBtn");
  const resetButton = document.getElementById("reset");
  const closeButton = document.getElementById('closeAppBtn');
  const datePickerInput = document.getElementById("datePicker");
  const clusterToggle = document.getElementById("clusterBtn");
  const heatmapToggle = document.getElementById("heatmapBtn");

  const map = L.map('map', {
    maxZoom: 15,
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
  const clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 5,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
  });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const heatLayer = L.heatLayer([], {
    radius: 20,
    blur: 15,
    maxZoom: 12,
    canvas: canvas
  });
  map.addLayer(clusterGroup);
  map.addLayer(heatLayer);

  let fireData = [];
  let earthquakeData = [];

  function isValidCoordinate(lat, lng, confidence = null, magnitude = null) {
    if (accuracyFilterCheckbox.checked) {
      if (confidence !== null && confidence < 70) return false;
      if (magnitude !== null && magnitude < 4) return false;
    }
    return true;
  }

  function isDuplicateLatLng(lat, lng, seenCoords) {
    const key = `${lat},${lng}`;
    if (seenCoords.has(key)) return true;
    seenCoords.add(key);
    return false;
  }

  function clearMapLayers() {
    markerGroup.clearLayers();
    clusterGroup.clearLayers();
    heatLayer.setLatLngs([]);
  }

  function updateMapDisplay() {
    clearMapLayers();

    const bounds = map.getBounds();
    const seenCoords = new Set();

    if (earthquakeCheckbox.checked) {
      if (clusterToggle.checked) {
        earthquakeData.forEach(eq => {
          const coords = eq.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return;
          const [lng, lat] = coords;
          if (typeof lat !== 'number' || typeof lng !== 'number') return;
          const mag = eq.properties.mag;
          if (!isValidCoordinate(lat, lng, null, mag)) return;
          if (!bounds.contains([lat, lng])) return;
          if (isDuplicateLatLng(lat, lng, seenCoords)) return;

          const marker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: 'earthquake.png',
              iconSize: [24, 24],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            })
          }).bindPopup(`Magnitude: ${mag}`);

          clusterGroup.addLayer(marker);
        });
      } else {
        earthquakeData.forEach(eq => {
          const coords = eq.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return;
          const [lng, lat] = coords;
          if (typeof lat !== 'number' || typeof lng !== 'number') return;
          const mag = eq.properties.mag;
          if (!isValidCoordinate(lat, lng, null, mag)) return;
          if (!bounds.contains([lat, lng])) return;
          if (isDuplicateLatLng(lat, lng, seenCoords)) return;

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
    }

    if (fireCheckbox.checked) {
      const useCluster = clusterToggle.checked;
      const useHeatmap = heatmapToggle.checked;
      const heatPoints = [];

      fireData.forEach(fire => {
        const lat = parseFloat(fire.latitude);
        const lng = parseFloat(fire.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        const conf = parseFloat(fire.confidence);
        if (!isValidCoordinate(lat, lng, conf, null)) return;
        if (!bounds.contains([lat, lng])) return;
        if (isDuplicateLatLng(lat, lng, seenCoords)) return;

        if (useHeatmap) {
          heatPoints.push([lat, lng, conf / 100]);
        }

        if (useCluster) {
          const marker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: 'flame.png',
              iconSize: [16, 16],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            })
          }).bindPopup(`
            <strong>Fire detected</strong><br>
            Brightness: ${fire.brightness}<br>
            Date: ${fire.acq_date} ${fire.acq_time}<br>
            Confidence: ${fire.confidence}%
          `);

          clusterGroup.addLayer(marker);
        } else if (!useHeatmap) {
          const marker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: 'flame.png',
              iconSize: [16, 16],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            })
          }).bindPopup(`
            <strong>Fire detected</strong><br>
            Brightness: ${fire.brightness}<br>
            Date: ${fire.acq_date} ${fire.acq_time}<br>
            Confidence: ${fire.confidence}%
          `);

          markerGroup.addLayer(marker);
        }
      });

      if (useHeatmap) {
        heatLayer.setLatLngs(heatPoints);
      }
    }
  }

  async function loadData(date) {
    try {
      const promises = [];

      if (earthquakeCheckbox.checked) {
        promises.push(fetch(`http://localhost:8000/api/earthquakes?date=${date}`).then(res => res.json()).then(data => {
          earthquakeData = data.features || [];
        }));
      } else {
        earthquakeData = [];
      }

      if (fireCheckbox.checked) {
        promises.push(fetch(`http://localhost:8000/api/fires?date=${date}`).then(res => res.json()).then(data => {
          fireData = data || [];
        }));
      } else {
        fireData = [];
      }

      await Promise.all(promises);
      updateMapDisplay();
    } catch (err) {
      console.error("Error obtaining data:", err);
      alert("The backend is not running or the API is not available. Please ensure the backend is started and try again.");
    }
  }

  resetButton.addEventListener("click", () => {
    const selectedDate = datePickerInput.value;
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }
    loadData(selectedDate);
  });

  map.on('moveend', () => {
    updateMapDisplay();
  });

  map.on('zoomend', () => {
    updateMapDisplay();
  });

  fireCheckbox.addEventListener("change", () => {
    updateMapDisplay();
  });

  earthquakeCheckbox.addEventListener("change", () => {
    updateMapDisplay();
  });

  accuracyFilterCheckbox.addEventListener("change", () => {
    updateMapDisplay();
  });

  clusterToggle.addEventListener("change", updateMapDisplay);
  heatmapToggle.addEventListener("change", updateMapDisplay);

  flatpickr("#datePicker", {
    dateFormat: "Y-m-d",
    maxDate: "today",
    minDate: new Date(new Date(new Date().setMonth(new Date().getMonth() - 1)).setDate(new Date().getDate() + 2)),
    defaultDate: "today"
  });

  closeButton.addEventListener('click', () => {
    if (ipcRenderer && ipcRenderer.send) {
      ipcRenderer.send('close-app');
    } else {
      console.warn('ipcRenderer is not available, cannot close app');
      alert('Close app functionality is not available in this environment.');
    }
  });

  document.querySelectorAll('.leaflet-control-attribution').forEach(el => el.remove());

  document.getElementById("lastUpdated").textContent = new Date().toLocaleString();
});