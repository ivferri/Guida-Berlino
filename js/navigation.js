/*
 BERLIN 2.0
 Modulo navigazione esterna
 Google Maps e Locus Map
*/

const BerlinNavigation = {

  getDestination(poi) {
    if (!poi) {
      alert("Nessuna tappa selezionata.");
      return null;
    }

    const lat = Number(poi.lat);
    const lng = Number(poi.lng);

    if (
      poi.lat === null ||
      poi.lng === null ||
      poi.lat === "" ||
      poi.lng === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      alert("Le coordinate di questa tappa non sono ancora disponibili.");
      return null;
    }

    return {
      lat,
      lng,
      name: poi.name || "Destinazione BERLIN"
    };
  },

  googleMaps(poi) {
    const destination = this.getDestination(poi);
    if (!destination) return;

    const url =
      "https://www.google.com/maps/dir/?api=1" +
      "&destination=" +
      encodeURIComponent(
        `${destination.lat},${destination.lng}`
      ) +
      "&travelmode=walking";

    window.open(url, "_blank");
  },

  locusMap(poi) {
    const destination = this.getDestination(poi);
    if (!destination) return;

    const url =
      "geo:" +
      destination.lat + "," +
      destination.lng +
      "?q=" +
      encodeURIComponent(
        `${destination.lat},${destination.lng}(${destination.name})`
      );

    window.location.href = url;
  }
};

// Collegamento con i pulsanti dell'applicazione

function navigateGoogle() {
  BerlinNavigation.googleMaps(currentPOI);
}

function navigateLocus() {
  BerlinNavigation.locusMap(currentPOI);
}
