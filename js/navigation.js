/* Collegamenti a servizi di navigazione esterni. */
const BerlinNavigation = {
  getDestination(poi) {
    if (!poi) {
      alert('Nessuna tappa selezionata.');
      return null;
    }
    const lat = Number(poi.lat);
    const lng = Number(poi.lng);
    if (poi.lat === null || poi.lng === null || poi.lat === '' || poi.lng === '' ||
        !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Le coordinate di questa tappa non sono ancora disponibili.');
      return null;
    }
    return { lat, lng, name: poi.name || 'Destinazione BERLIN' };
  },
  googleMaps(poi) {
    const destination = this.getDestination(poi);
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=walking`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },
  locusMap(poi) {
    const destination = this.getDestination(poi);
    if (!destination) return;
    const query = encodeURIComponent(`${destination.lat},${destination.lng}(${destination.name})`);
    window.location.href = `geo:${destination.lat},${destination.lng}?q=${query}`;
  }
};
function navigateGoogle() { BerlinNavigation.googleMaps(currentPOI); }
function navigateLocus() { BerlinNavigation.locusMap(currentPOI); }
