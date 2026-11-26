# BERLIN – La città raccontata (versione 2)

Guida turistica PWA per quattro giornate a Berlino.

## Struttura
- `index.html`: pagina principale dell'app.
- `css/style.css`: grafica.
- `js/app.js`: caricamento degli itinerari e gestione delle schermate e delle schede POI.
- `js/map.js`: mappa Leaflet/OpenStreetMap e localizzazione GPS.
- `js/audio.js`: sintesi vocale e riproduzione di file audio.
- `js/navigation.js`: apertura delle destinazioni in Google Maps e Locus Map.
- `data/itineraries.json`: indice delle quattro giornate.
- `data/day-1.json` … `data/day-4.json`: dati delle giornate e relativi POI.
- `pois/poi-template.json`: modello vuoto ufficiale da duplicare per preparare una tappa.
- `pois/poi-001.json`: esempio vuoto mantenuto come riferimento.
- `backup/index-v1.html`: copia della pagina precedente, se presente nel repository.

## Formato dei dati di una giornata

Ogni file `data/day-N.json` contiene un array `pois`. Ogni elemento dell'array è un oggetto POI completo, basato sul modello `pois/poi-template.json`. Quando prepari una nuova tappa, copia l'oggetto nel relativo array `pois` del giorno desiderato. Il file modello non viene caricato automaticamente dall'app.

## Campi del POI

| Campo | Tipo | Uso |
|---|---|---|
| `id` | stringa | Identificativo univoco della tappa |
| `name` | stringa | Nome mostrato nell'app e nel marcatore |
| `category` | stringa | Categoria, ad esempio museo o monumento |
| `shortDescription` | stringa | Testo breve nella lista delle tappe |
| `lat`, `lng` | numero o `null` | Coordinate WGS84 usate da mappa e navigazione |
| `image` | stringa | Percorso relativo o URL HTTP/HTTPS dell'immagine |
| `description` | stringa | Descrizione completa mostrata nella scheda |
| `audioText` | stringa | Testo letto dalla sintesi vocale; se vuoto viene usata la descrizione |
| `audio` | stringa | Percorso relativo o URL HTTP/HTTPS del file audio |
| `audioLanguage` | stringa | Lingua della sintesi vocale, ad esempio `it-IT` |
| `audioSpeed` | numero | Velocità della sintesi vocale; valore predefinito 1 |
| `curiosities` | stringa | Sezione facoltativa dedicata alle curiosità |
| `childrenCuriosity` | stringa | Sezione facoltativa “Curiosità per bambini” |\n| `childrenCuriosity` | stringa | Sezione facoltativa “Curiosità per bambini” |
| `childrenText` | stringa | Sezione facoltativa con contenuto per i più piccoli |
| `visitDuration` | stringa | Durata indicativa della visita |
| `notes` | stringa | Informazioni aggiuntive e note |

I campi testuali facoltativi possono restare vuoti e le coordinate possono restare `null`. Le sezioni non compilate non vengono mostrate. Senza coordinate valide il POI resta visibile nell'elenco e nella scheda, ma non genera un marcatore e non può essere aperto nella navigazione esterna.

La descrizione può essere una stringa oppure, per compatibilità con dati precedenti, un oggetto contenente `text`, `audioText` e/o `audioFile`. Per i nuovi POI usa preferibilmente i campi principali del modello.

## Mappa, audio e navigazione

- La mappa usa `lat` e `lng` per i marcatori e per tracciare il collegamento tra le tappe.
- Google Maps e Locus Map usano le stesse coordinate.
- Il pulsante di sintesi vocale legge `audioText`; se è vuoto, legge `description`.
- Il pulsante di registrazione compare solo quando `audio` contiene un percorso.
- Le immagini e i file audio possono essere conservati nel repository e richiamati con il loro percorso relativo.

## Pubblicazione e cache

Il progetto è predisposto per GitHub Pages dalla cartella principale del repository. La pagina iniziale è `index.html`. Dopo modifiche a file JavaScript, CSS, HTML o ai dati precaricati, aggiorna il nome della cache in `service-worker.js` per forzare i dispositivi a scaricare la nuova versione. Le librerie Leaflet e le mappe OpenStreetMap richiedono connessione Internet.
