# BERLIN – La città raccontata (versione 2)

Guida turistica PWA per quattro giornate a Berlino.

## Struttura
- `index.html`: pagina principale dell'app.
- `css/style.css`: grafica.
- `js/app.js`: caricamento degli itinerari e gestione delle schermate.
- `js/map.js`: mappa Leaflet/OpenStreetMap e localizzazione GPS.
- `js/audio.js`: sintesi vocale e riproduzione di file audio.
- `js/navigation.js`: apertura delle destinazioni in Google Maps e Locus Map.
- `data/itineraries.json`: indice delle quattro giornate.
- `data/day-1.json` … `data/day-4.json`: dati delle giornate.
- `pois/`: modello per le schede dei punti d'interesse.
- `backup/index-v1.html`: copia della pagina precedente.

## Inserimento dei POI
Ogni file `data/day-N.json` contiene un array `pois`. Per ogni tappa utilizzare i campi `id`, `name`, `shortDescription`, `lat`, `lng`, `description`, `audioText` e `audio`. Le coordinate sono numeriche; finché non vengono inserite, il POI non appare sulla mappa e i pulsanti di navigazione segnalano che la destinazione non è disponibile.

## Pubblicazione
Il progetto è predisposto per GitHub Pages dalla cartella principale del repository. La pagina iniziale è `index.html`.
