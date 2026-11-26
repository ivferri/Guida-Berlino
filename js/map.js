let map = null;
let poiMarkers = [];
let routeLine = null;
let userMarker = null;
let gpsCircle = null;
let gpsWatchId = null;

function initializeMap(pois) {
  const mapElement = document.getElementById("map");

  if (!map) {
    map = L.map("map");
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }
    ).addTo(map);
  }

  poiMarkers.forEach(marker => map.removeLayer(marker));
  poiMarkers = [];

  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  const validPOIs = pois.filter(poi =>
    Number.isFinite(poi.lat) &&
    Number.isFinite(poi.lng)
  );

  validPOIs.forEach((poi, index) => {
    const marker = L.marker([poi.lat, poi.lng])
      .addTo(map)
      .bindPopup(`
        <strong>${escapeHTML(poi.name)}</strong><br>
        Tappa ${index + 1}
      `);

    poiMarkers.push(marker);
  });

  if (validPOIs.length > 0) {
    const coordinates = validPOIs.map(poi => [
      poi.lat,
      poi.lng
    ]);

    routeLine = L.polyline(coordinates, {
      color: "#b58a52",
      weight: 4,
      opacity: 0.85
    }).addTo(map);

    map.fitBounds(routeLine.getBounds(), {
      padding: [30, 30],
      maxZoom: 16
    });
  } else {
    map.setView([52.5200, 13.4050], 13);
  }

  setTimeout(() => map.invalidateSize(), 150);
}

function startGPS() {
  if (!navigator.geolocation) {
    updateGPSStatus("GPS non supportato dal dispositivo");
    return;
  }

  if (gpsWatchId !== null) {
    updateGPSStatus("GPS già attivo");
    return;
  }

  updateGPSStatus("Ricerca della posizione...");

  gpsWatchId = navigator.geolocation.watchPosition(
    position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      const positionLatLng = [lat, lng];

      if (!userMarker) {
        userMarker = L.circleMarker(positionLatLng, {
          radius: 9,
          color: "#ffffff",
          weight: 3,
          fillColor: "#2879e0",
          fillOpacity: 1
        }).addTo(map);

        gpsCircle = L.circle(positionLatLng, {
          radius: accuracy,
          color: "#2879e0",
          fillOpacity: 0.08
        }).addTo(map);
      } else {
        userMarker.setLatLng(positionLatLng);
        gpsCircle.setLatLng(positionLatLng);
        gpsCircle.setRadius(accuracy);
      }

      updateGPSStatus(
        `Posizione aggiornata · precisione ${Math.round(accuracy)} m`
      );
    },
    error => {
      const messages = {
        1: "Permesso di localizzazione negato",
        2: "Posizione non disponibile",
        3: "Tempo di attesa GPS scaduto"
      };

      updateGPSStatus(
        messages[error.code] || "Errore GPS"
      );

      stopGPS();
    },
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000
    }
  );
}

function stopGPS() {
  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
  }

  updateGPSStatus("GPS fermato");
}

function updateGPSStatus(message) {
  const element = document.getElementById("gpsStatus");

  if (element) {
    element.textContent = message;
  }
}
