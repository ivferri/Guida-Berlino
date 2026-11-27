# BERLIN – La città raccontata (versione 2)

Guida turistica PWA per quattro giornate a Berlino.

## Struttura
- \`index.html\`: pagina principale dell'app.
- \`css/style.css\`: grafica.
- \`js/app.js\`: caricamento degli itinerari, gestione delle schede POI e download offline.
- \`js/map.js\`: mappa Leaflet/OpenStreetMap e localizzazione GPS.
- \`js/audio.js\`: sintesi vocale e riproduzione di file audio.
- \`js/navigation.js\`: apertura delle destinazioni in Google Maps e Locus Map.
- \`data/itineraries.json\`: indice delle quattro giornate.
- \`data/day-1.json\` … \`data/day-4.json\`: dati delle giornate e relativi POI.
- \`pois/poi-template.json\`: modello vuoto ufficiale da duplicare per preparare una tappa.
- \`audio/\`: file MP3 delle audioguide, aggiunti man mano che vengono prodotti.

## Formato dei dati di una giornata

Ogni file \`data/day-N.json\` contiene un array \`pois\`. Ogni elemento dell'array è un oggetto POI basato sul modello \`pois/poi-template.json\`. Quando prepari una nuova tappa, copia l'oggetto nel relativo array \`pois\` del giorno desiderato.

## Campi del POI

| Campo | Tipo | Uso |
|---|---|---|
| \`id\` | stringa | Identificativo univoco della tappa |
| \`name\` | stringa | Nome mostrato nell'app e nel marcatore |
| \`category\` | stringa | Categoria, ad esempio museo o monumento |
| \`shortDescription\` | stringa | Testo breve nella lista delle tappe |
| \`lat\`, \`lng\` | numero o \`null\` | Coordinate WGS84 usate da mappa e navigazione |
| \`description\` | stringa | Descrizione completa mostrata nella scheda |
| \`audioText\` | stringa | Testo letto dalla sintesi vocale; se vuoto viene usata la descrizione |
| \`audio\` | stringa | Percorso relativo del file audio, ad esempio \`audio/reichstag.mp3\` |
| \`audioLanguage\` | stringa | Lingua della sintesi vocale, ad esempio \`it-IT\` |
| \`audioSpeed\` | numero | Velocità della sintesi vocale; valore predefinito 1 |
| \`curiosities\` | stringa | Sezione facoltativa dedicata alle curiosità |
| \`childrenCuriosity\` | stringa | Sezione facoltativa “Curiosità per bambini” |
| \`childrenText\` | stringa | Sezione facoltativa con contenuto per i più piccoli |
| \`visitDuration\` | stringa | Durata indicativa della visita |
| \`notes\` | stringa | Informazioni aggiuntive e note |

I campi testuali facoltativi possono restare vuoti e le coordinate possono restare \`null\`. Le sezioni non compilate non vengono mostrate. Senza coordinate valide il POI resta visibile nell'elenco e nella scheda, ma non genera un marcatore e non può essere aperto nella navigazione esterna.

## Audio e uso offline

- I file audio vanno salvati nella cartella \`audio/\` e indicati nel campo \`audio\` con un percorso relativo, ad esempio \`audio/reichstag.mp3\`.
- Il pulsante di registrazione compare solo quando \`audio\` contiene un percorso.
- Nella schermata di ogni giornata è disponibile **Scarica contenuti per uso offline**: il comando memorizza il JSON della giornata e tutti i file audio locali associati ai POI.
- Il download va eseguito con una connessione attiva, prima della visita. I file già scaricati restano disponibili offline finché i dati del sito non vengono aggiornati o la cache del browser non viene cancellata.
- Gli audio ospitati su server esterni non vengono scaricati. Per affidabilità, usa file audio presenti nel repository.
- La cache aggiorna i file JSON dalla rete quando disponibile e usa l'ultima copia salvata quando si è offline.
- L'app gestisce anche le richieste audio parziali (byte range), necessarie ad alcuni browser durante la riproduzione offline.

La sintesi vocale del telefono resta disponibile quando supportata dal browser, ma non richiede un file audio.

## Mappa e navigazione

- La mappa usa \`lat\` e \`lng\` per i marcatori e per tracciare il collegamento tra le tappe.
- Google Maps e Locus Map usano le stesse coordinate.
- La cartografia OpenStreetMap e il caricamento iniziale della libreria Leaflet richiedono connessione Internet. Il download offline riguarda testi e audioguide, non le mappe.

## Pubblicazione e aggiornamenti

Il progetto è pubblicato con GitHub Pages dalla cartella principale del repository. Quando si modificano HTML, CSS, JavaScript o la strategia di cache, incrementare la versione \`CACHE_NAME\` in \`service-worker.js\`: il nuovo Service Worker scarica il guscio aggiornato dell'app e rimuove la vecchia cache. I JSON vengono aggiornati dalla rete quando disponibile e mantenuti in cache per l'uso offline.

### Raggruppamento geografico dei POI

Ogni POI può includere il campo `area` (ad esempio `Mitte – Centro storico` o `Friedrichshain`). L'app usa questo valore per mostrare intestazioni di gruppo nella lista delle tappe. Le schede possono rimanere vuote: nome, categoria e coordinate sono sufficienti per predisporre l'itinerario prima di aggiungere descrizioni, curiosità e audio.

### Mappa senza percorso predefinito

La mappa mostra i segnaposto dei POI senza numerazione e senza tracciare una linea di itinerario. Selezionando un segnaposto si apre direttamente la scheda del relativo POI. L'ordine della lista non impone un percorso di visita.

## Caccia al tesoro

- La sezione **Caccia al tesoro** è facoltativa e separata da mappa e itinerario: non impone un ordine di visita e non aggiunge numeri o linee alla cartografia.
- Le missioni sono definite in `data/treasure-hunt.json`; la logica dell'interfaccia è in `js/treasure-hunt.js`.
- I progressi delle sfide completate vengono salvati sul dispositivo tramite `localStorage`, senza richiedere un account o una connessione.
- Le sfide possono collegarsi a un POI tramite il suo identificativo `poiId`; il collegamento compare solo se quel POI è presente nella giornata.
- Le sfide sono una semplice checklist: si spuntano quando completate. Non esistono punti, classifiche, premi o penalità.
- Per aggiornare la cache dell'app, incrementare `CACHE_NAME` in `service-worker.js` e includere i nuovi file in `APP_FILES`.
