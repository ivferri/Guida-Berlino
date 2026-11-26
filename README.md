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
- `data/day-1.json` … `data/day-4.json`: dati delle giornate e relativi POI.
- `pois/`: modello vuoto per preparare le schede dei punti d'interesse.
- `backup/index-v1.html`: copia della pagina precedente, se presente nel repository.

## Formato dei dati di una giornata

Ogni file `data/day-N.json` contiene un array `pois`. Ogni elemento dell'array rappresenta una tappa e può utilizzare questi campi:

| Campo | Tipo | Uso |
|---|---|---|
| `id` | stringa | Identificativo univoco della tappa |
| `name` | stringa | Nome mostrato nell'app |
| `category` | stringa | Categoria del luogo |
| `shortDescription` | stringa | Testo breve nella lista delle tappe |
| `lat`, `lng` | numero | Coordinate WGS84 usate da mappa e navigazione |
| `description` | stringa | Descrizione completa mostrata nella scheda |
| `audioText` | stringa | Testo letto dalla sintesi vocale; se vuoto viene usata la descrizione |
| `audio` | stringa | Percorso del file audio, ad esempio un MP3 nel repository |
| `audioLanguage` | stringa | Lingua della sintesi vocale, ad esempio `it-IT` |
| `audioSpeed` | numero | Velocità della sintesi vocale; valore predefinito 0.9 |
| `image` | stringa | Percorso di un'immagine, se prevista |
| `visitDuration`, `notes` | stringa | Informazioni aggiuntive per la preparazione della visita |

I campi non ancora disponibili possono restare vuoti; le coordinate possono restare `null`. Senza coordinate valide il POI resta visibile nell'elenco, ma non genera un marcatore e non può essere aperto nella navigazione esterna. Le tappe vuote o non valide vengono ignorate in fase di visualizzazione.

Il campo `description` può essere una stringa. Il codice mantiene anche compatibilità con un oggetto descrizione che contenga `text`, `audioText` o `audioFile`, ma per i nuovi dati è preferibile usare i campi principali descritti nella tabella.

## Pubblicazione

Il progetto è predisposto per GitHub Pages dalla cartella principale del repository. La pagina iniziale è `index.html`. Dopo modifiche a file JavaScript o CSS, il Service Worker aggiorna la cache tramite il nome versione in `service-worker.js`.
