let map = null;
let poiMarkers = [];
let routeLine = null;
let userMarker = null;
let gpsCircle = null;
let gpsWatchId = null;

function initializeMap(pois = [], mapSettings = {}) {
  if (typeof L === 'undefined') {
    updateGPSStatus('Cartografia non disponibile: controlla la connessione.');
    return;
  }
  const centerLat = Number(mapSettings.centerLat);
  const centerLng = Number(mapSettings.centerLng);
  const zoom = Number(mapSettings.zoom);
  const center = Number.isFinite(centerLat) && Number.isFinite(centerLng)
    ? [centerLat, centerLng] : [52.5200, 13.4050];

  if (!map) {
    map = L.map('map').setView(center, Number.isFinite(zoom) ? zoom : 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    }).addTo(map);
  }
  poiMarkers.forEach(marker => map.removeLayer(marker));
  poiMarkers = [];
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  const validPOIs = (Array.isArray(pois) ? pois : []).filter(poi => {
    const lat = Number(poi.lat);
    const lng = Number(poi.lng);
    return poi.lat !== null && poi.lat !== '' && poi.lng !== null && poi.lng !== '' &&
      Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  });

  validPOIs.forEach((poi, index) => {
    const marker = L.marker([Number(poi.lat), Number(poi.lng)])
      .addTo(map)
      .bindPopup(`<strong>${escapeHTML(poi.name || `Tappa ${index + 1}`)}</strong><br>Tappa ${index + 1}`);
    poiMarkers.push(marker);
  });

  if (validPOIs.length > 1) {
    const coordinates = validPOIs.map(poi => [Number(poi.lat), Number(poi.lng)]);
    routeLine = L.polyline(coordinates, {
      color: '#b58a52', weight: 4, opacity: 0.85
    }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [30, 30], maxZoom: 16 });
  } else if (validPOIs.length === 1) {
    map.setView([Number(validPOIs[0].lat), Number(validPOIs[0].lng)], 15);
  } else {
    map.setView(center, Number.isFinite(zoom) ? zoom : 13);
  }
  refreshMapSize();
}

function refreshMapSize() {
  if (map) setTimeout(() => map.invalidateSize(), 150);
}

function startGPS() {
  if (!map) {
    updateGPSStatus('Apri prima un itinerario per attivare la mappa.');
    return;
  }
  if (!navigator.geolocation) {
    updateGPSStatus('Localizzazione non supportata dal dispositivo.');
    return;
  }
  if (gpsWatchId !== null) {
    updateGPSStatus('GPS già attivo.');
    return;
  }
  updateGPSStatus('Ricerca della posizione...');
  gpsWatchId = navigator.geolocation.watchPosition(position => {
    const latLng = [position.coords.latitude, position.coords.longitude];
    const accuracy = position.coords.accuracy;
    if (!userMarker) {
      userMarker = L.circleMarker(latLng, {
        radius: 9, color: '#ffffff', weight: 3, fillColor: '#2879e0', fillOpacity: 1
      }).addTo(map);
      gpsCircle = L.circle(latLng, {
        radius: accuracy, color: '#2879e0', fillOpacity: 0.08
      }).addTo(map);
    } else {
      userMarker.setLatLng(latLng);
      gpsCircle.setLatLng(latLng).setRadius(accuracy);
    }
    updateGPSStatus(`Posizione aggiornata · precisione ${Math.round(accuracy)} m`);
  }, error => {
    const messages = {
      1: 'Permesso di localizzazione negato.',
      2: 'Posizione non disponibile.',
      3: 'Tempo di attesa GPS scaduto.'
    };
    updateGPSStatus(messages[error.code] || 'Errore GPS.');
    stopGPS(false);
  }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
}

function stopGPS(updateStatus = true) {
  if (gpsWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
  }
  if (updateStatus) updateGPSStatus('GPS fermato.');
}

function updateGPSStatus(message) {
  const element = document.getElementById('gpsStatus');
  if (element) element.textContent = message;
}
