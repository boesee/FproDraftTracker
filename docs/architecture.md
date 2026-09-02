# Architecture: FproDraftTracker

Dieses Dokument hält die grundlegenden technischen Entscheidungen für den
Rebuild fest, abgeleitet aus den Constraints in [`vision.md`](./vision.md).

## Stack

- **Frontend:** Vanilla JavaScript (ES-Module), kein Framework, kein
  Build-Step.
- **Styling:** [Pico CSS](https://picocss.com/) (klassenloses, lightweight
  CSS-Framework) — bereits im Vorgängerprodukt im Einsatz.
- **Hosting:** GitHub Pages (rein statisches Deployment, kein eigener
  Server zur Laufzeit).

## Datenbeschaffung (FantasyPros ECR-Rankings)

Die FantasyPros-API ist CORS-geschützt und kann nicht direkt aus dem Browser
aufgerufen werden. Zudem ist sie auf 500 Requests/Tag limitiert. Statt eines
Laufzeit-Proxys (z. B. Cloudflare Worker) wird die Datenbeschaffung daher
außerhalb des Frontends, zeitgesteuert per **GitHub Actions Workflow**
gelöst:

- Ein Cron-Workflow ruft die FantasyPros-API mit dem API-Key als
  GitHub-Actions-Secret auf.
- Zeitplan: **halbstündlich, von 07:00 bis 23:00 Uhr** (≈ 33 Aufrufe/Tag —
  deutlich innerhalb des 500er-Limits, mit Puffer für manuelle/zusätzliche
  Läufe).
- Das Ergebnis wird als JSON-Datei (Nachfolger von `data/ecrData.json`) im
  Repository committet und von der statischen Seite ausgeliefert.
- Der API-Key verlässt zu keinem Zeitpunkt die Actions-Umgebung und landet
  nie im Frontend-Code oder im Klartext im Repository.

Dieser Workflow ersetzt das bisherige, manuell auszuführende
Puppeteer-Scraping (`scrape-fantasypros.js`) durch einen automatisierten,
auf der offiziellen API basierenden Prozess.

### Konkrete Umsetzung (UC-007)

- **Workflow:** [`.github/workflows/update-rankings.yml`](../.github/workflows/update-rankings.yml)
- **Skript:** [`scripts/update-rankings.mjs`](../scripts/update-rankings.mjs) orchestriert nur;
  die eigentliche Logik liegt modular in [`scripts/lib/`](../scripts/lib/)
  (`config.mjs`, `nflSchedule.mjs`, `fantasyProsRankings.mjs`,
  `espnOpponents.mjs`, `matchupRatings.mjs`, `injuries.mjs`) — analog zur
  Modul-Aufteilung im Frontend (`js/filters.js`, `js/stats.js`, etc.).
- **Endpoint:** `GET https://api.fantasypros.com/public/v2/json/nfl/{season}/rankings?week={week}&range=true`
  (Auth über Header `x-api-key`). Die Antwort liefert pro Spieler alle
  Scoring-Formate und Positionsgruppen verschachtelt unter
  `rank.ECR.{scoring}.{position}` (bestätigt durch eine reale
  Beispiel-Antwort); das Mapping wählt clientseitig `PPR`/`OP` (Full-PPR,
  wochenspezifisch, Superflex-Gesamtrang) aus, mit Fallback auf
  `ROS-PPR`/`OP`, falls für einen Spieler in der aktuellen Woche gar kein
  `PPR`-Bucket existiert (siehe Sicherheitsnetz-Punkt unten). Superflex/OP
  wurde bewusst gewählt (statt reiner Positions-Ranglisten), weil es
  Cross-Positions-Vergleiche ermöglicht (z. B. "OP55 vs. OP54" sagt
  eindeutig, wer overall besser geranked ist — bei getrennten
  Positions-Rängen wie "RB12" vs. "WR15" wäre das nicht möglich).
  `{season}` und `{week}` werden beide zur Laufzeit berechnet, damit
  keiner der beiden Parameter je manuell nachgeführt werden muss:
  - `{season}`: ab März gilt das laufende Kalenderjahr als Saison, sonst
    das Vorjahr.
  - `{week}`: immer 1–18, kein separater Preseason-Wert 0. Vor dem
    rechnerischen Beginn von Woche 1 (Dienstag vor dem Donnerstags-Kickoff,
    der auf den ersten Montag im September/Labor Day folgt) wird auf 1
    geklemmt, da Drafts und FantasyPros' "Week 1"-Rankings bereits Tage
    vorher stattfinden bzw. verfügbar sind. Danach Rollover jeweils am
    Dienstag; nach Woche 18 bleibt der Wert auf 18 stehen, bis mit dem
    neuen Kalenderjahr auch die Saison umspringt.
- **Ausgabe:** `data/rankings.json` (Nachfolger von `data/ecrData.json`),
  Format gemäß `RANKINGS_SNAPSHOT`/`PLAYER` in `entity_model.md`. Das
  Feld `position` kombiniert `position_id` mit dem positionsspezifischen
  Rang aus derselben Scoring-Bucket wie der Gesamt-Rang (`PPR` oder im
  Fallback-Fall `ROS-PPR`) unter `rank.ECR.{scoring}[position_id]`
  (z. B. "RB81"), analog zum `pos_rank`-Feld des Vorgängerprodukts.
- **Fallback bei fehlenden Wochendaten:** Manche Spieler (typischerweise
  Backups/tiefe Bankspieler) haben in einer gegebenen Woche gar keinen
  `PPR`-Bucket (nicht nur kein `OP` darin, sondern `STD`/`PPR`/`HALF`
  fehlen komplett) — z. B. Zach Charbonnet, der nur `ROS-*`/`DYN` hatte,
  obwohl er ein regulär rosterbarer RB ist. Für solche Fälle fällt das
  Skript auf `ROS-PPR`/`OP` zurück (gleiche Skala, nur anderer
  Zeithorizont), statt den Spieler komplett zu verwerfen. Gibt es auch
  dort keinen `OP`-Wert (wie bei Jayden Higgins, der nur `DYN` hatte),
  wird der Spieler ausgeschlossen — ein Rückfall auf `DYN` (Dynasty)
  würde Langfrist-/Rookie-Wert zeigen, was in einem Redraft-Kontext
  irreführend wäre. Das deckt sich mit der FantasyPros-Website: dort
  fehlte Higgins ebenfalls im wöchentlichen Ranking.
  Hinweis: Die auf der Website sichtbaren Werte für Bankspieler wie
  Charbonnet (z. B. "RB180, Overall 682") stimmen nicht zwangsläufig mit
  den API-Werten überein — die Website scheint für solche Fälle eine
  andere Berechnung/Datenquelle zu verwenden. Der Fallback approximiert
  dies bewusst, statt eine exakte 1:1-Parität mit der Website
  anzustreben.
- **Zeitplan:** Cron `*/30 5-21 * * *` (UTC) ≙ 07:00–23:30 Uhr CEST
  (Europe/Zurich, Sommerzeit). Bewusst als fixer UTC-Cron ohne
  Zeitzonen-Umrechnung umgesetzt: Draften findet laut Vision überwiegend im
  August/September statt (Sommerzeit), daher deckt dieses Fenster den
  Hauptnutzungszeitraum korrekt ab; während der Winterzeit (CET, UTC+1)
  verschiebt sich das reale Fenster auf 06:00–22:30 Uhr. Diese Drift wurde
  bewusst in Kauf genommen, statt mit zwei Cron-Ausdrücken oder
  Zeitzonen-Logik im Skript zu arbeiten.
- **Sicherheitsnetz (UC-007 AF-2):** Das Skript committet nur, wenn
  mindestens 100 Spieler erfolgreich gemappt werden konnten; andernfalls
  bricht es ohne Commit ab und der letzte erfolgreiche Snapshot bleibt
  bestehen. Es gibt bewusst **keine** Prozent-Schwelle relativ zur Anzahl
  Rohdaten-Einträge: D/ST, Kicker und viele tiefe Bankspieler haben
  grundsätzlich keinen "OP"-Rang (Superflex) und werden beim Mapping
  regulär aussortiert — ein realer Lauf lieferte z. B. 579 von 1589
  Rohdaten-Einträgen als gültig gemappte Spieler.
- **Verifiziert:** Die Struktur von `player.rank.ECR.{scoring}.{position}`
  sowie das Mapping wurden anhand echter API-Antworten bestätigt
  (inklusive eines vollständigen Laufs über alle NFL-Spieler).

## Positions-Rankings (Pills-Wrap)

Angelehnt an FantasyPros' eigene "pills-wrap"-Navigation über deren
Rankings-Tabelle: eine feste Navigationsleiste
(`<nav class="pills-wrap">`, `index.html`) über der Tabelle löst die
frühere Position-Dropdown-Filterung ab.

- **Pills:** "Overall" (Standard, aktiv beim Laden), "QB", "RB", "WR",
  "Flex". Bewusst kein eigenes "TE"-Pill (anders als bei FantasyPros) —
  TE-Spieler sind über "Flex" erreichbar; "Superflex" heisst hier
  "Overall", da das ohnehin die einzige im Superflex-Format berechnete
  Ranking-Sicht dieser App ist (siehe Datenbeschaffung oben).
- **QB/RB/WR:** filtert auf die Position UND sortiert nach deren
  eigenem positionsspezifischen Rang (aus dem `position`-Feld
  extrahiert, z. B. "QB12" → 12; `js/rankings.js`,
  `extractPositionRank`/`sortPlayersByPositionRank`) statt nach dem
  Overall-Rang (`rank`). Die "#"-Spalte zeigt dabei ebenfalls diesen
  positionsspezifischen Rang (`js/main.js`, `getDisplayRank`) — analog
  zu FantasyPros' eigenem Verhalten beim Wechsel auf einen Positions-Tab.
- **Flex:** filtert auf RB/WR/TE (identisch zur früheren "FLEX"-Dropdown-
  Option, `filters.js` BR-003), sortiert aber weiterhin nach dem
  Overall-Rang. Ein eigener, positionsübergreifender "Flex-Rang" existiert
  in den FantasyPros-Daten nicht (nur einzelne Positionsränge QB/RB/WR/TE
  sowie der Overall-Rang OP) — der Overall-Rang ist damit die einzig
  sinnvolle Sortierbasis für eine gemischte RB/WR/TE-Liste.
- **`rank:`-Suchtoken (ex-Maximaler-Rang-Filter):** bezieht sich bewusst
  immer auf den Overall-Rang, unabhängig von der aktiven Pill — eine
  Umstellung auf den jeweiligen Positions-Rang wurde nicht umgesetzt, um
  die Filterlogik nicht zusätzlich zu verzweigen; ließe sich bei Bedarf
  nachrüsten.
- **Stabile Spaltenbreiten (`table-layout: fixed`):** Mit
  `table-layout: auto` (Default) berechnet der Browser jede
  Spaltenbreite aus dem aktuell gerenderten Inhalt neu — beim
  Pill-Wechsel änderte sich dadurch sowohl die Ziffernbreite der
  "#"-Spalte (Overall- vs. Positions-Rang) als auch die Namenslängen in
  "Spieler" (andere Teilmenge sichtbar), wodurch alle nachfolgenden
  Spalten sichtbar nach links/rechts sprangen (gemeldet: Overall→QB liess
  alle Spalten springen, da sich "#" selbst änderte; Overall→RB nur die
  Spalten ab "Pos.", da "#" gleich breit blieb, aber "Spieler" nicht).
  Derselbe Mechanismus erklärte auch inkonsistentes Zeilenumbrechen in
  "Geg." auf schmalen Bildschirmen (z. B. "vs NO" auf zwei Zeilen,
  "vs LV" nicht) — die auto-berechnete Breite lag zufällig genau an der
  Umbruchgrenze für manche Team-Kürzel. Fix: `<colgroup>` mit festen
  Prozent-Breiten pro Spalte (`index.html`) plus `table-layout: fixed`
  (`style.css`) — Spaltenbreiten hängen dadurch nur noch von der
  Konfiguration ab, nie vom gerade sichtbaren Inhalt. Die
  Status-Spalte (siehe UC-002) bekommt ihre `<col>` ebenfalls über die
  `status-column`-Klasse ausgeblendet/eingeblendet und kollabiert dabei
  korrekt auf 0 Breite, statt eine leere Lücke zu hinterlassen.

### "Mein Team"-Pill

Eine sechste Pill neben Overall/QB/RB/WR/Flex: filtert auf die vom Manager
selbst gedrafteten Spieler und gruppiert sie nach Position statt sie nach
Rang zu sortieren — UC-002-Erweiterung, dokumentiert in UC-003 AF-3/BR-007.

- **Identifikation "meiner" Picks — `picked_by`, nicht `roster_id`:** Ein
  Sleeper-Pick trägt sowohl `roster_id` als auch `picked_by` (Sleeper
  `user_id`). Naheliegend wäre `roster_id` gewesen, da es direkter nach
  "Team-Zugehörigkeit" klingt — aber in dieser Liga wird `roster_id` pro
  Draft neu vergeben (`slot_to_roster_id` im Draft-Objekt selbst variiert
  wöchentlich, bestätigt anhand einer echten API-Antwort), während
  `picked_by`/`user_id` an den Sleeper-Account gebunden und damit über
  alle 15 wöchentlichen Drafts hinweg konstant bleibt. `js/filters.js`
  (BR-007) vergleicht daher `player.draftInfo.picked_by` gegen die in
  `config/app.json` hinterlegte `sleeperUserId` — keine zusätzliche
  API-Anfrage nötig, da `draftInfo` bereits das vollständige, rohe
  Pick-Objekt aus `matchDraftedPlayers` (`js/sleeperDraft.js`) enthält.
- **Sortierung (`sortPlayersByMyTeam`, `js/rankings.js`):** Gruppiert nach
  Position (Reihenfolge QB, RB, WR, TE; andere Positionen zuletzt),
  innerhalb einer Gruppe nach `draftInfo.pick_no` (Pick-Reihenfolge) — der
  Rang wird hier bewusst nicht mehr als Sortierkriterium verwendet, da er
  für bereits gedraftete eigene Spieler nicht mehr die relevante
  Information ist.
- **Bewusst kein Slot-Mapping:** Es wird nicht versucht, einzelne Picks
  exakt auf Roster-Slots (z. B. "3. RB-Pick → FLEX statt RB2") abzubilden,
  obwohl das Draft-Objekt die Slot-Konfiguration der Liga kennt
  (`settings.slots_qb/rb/wr/te/flex`) — das wäre eine nicht-triviale
  Zuordnungslogik mit Grenzfällen (z. B. Superflex-Slots, mehrdeutige
  Flex-Zuordnung), für die keine Anforderung vorliegt. Stattdessen reine
  Positions-Gruppierung; ein exaktes Slot-Mapping bliebe eine mögliche
  spätere Erweiterung.
- **Voraussetzungen für die Pill:** deaktiviert (mit erklärendem Tooltip),
  solange UC-002 noch nicht erfolgreich ausgeführt wurde oder
  `sleeperUserId` in `config/app.json` fehlt (`updateDraftDependentUI`,
  `js/main.js`) — ein `disabled`-Button feuert keine Click-Events, daher
  ist kein zusätzlicher Guard beim Pill-Wechsel selbst nötig.

## Ranking-Art-Transparenz

Ergänzt um `season`/`week` im `RANKINGS_SNAPSHOT` (vom Pipeline-Skript
berechnet/übernommen, siehe oben). Statt eines reinen Info-Banners sind
"Ranking" und "Scoring" (UC-008) als eigene `<select>`-Felder im
Filterbereich (`index.html`, `#rankingTypeSelect`/`#scoringFormatSelect`)
umgesetzt — macht **explizit als Auswahlmöglichkeit** sichtbar, dass es
sich aktuell um ein **Wochen-Ranking** mit **PPR**-Scoring handelt, und
ist bewusst so angelegt, dass später weitere `<option>`-Werte ergänzt
werden können, sobald die Pipeline sie tatsächlich unterstützt (z. B.
Dynasty-/ROS-/Draft-Rankings, Half-PPR-Scoring) — aktuell hat jedes
Select nur den einen tatsächlich verfügbaren Wert, ohne deaktivierte
Platzhalter-Optionen für Ungebautes vorzutäuschen. Die konkrete Woche/
Saison (die Selects allein sagen nur "Wochen-Ranking", nicht "welche
Woche") steht als kleiner Hinweistext darunter
(`js/rankings.js`, `describeRankingPeriod`) — leer, wenn `season`/`week`
im Snapshot fehlen (älterer Snapshot vor Einführung dieser Felder),
statt eines falschen Werts. Macht insgesamt sichtbar, dass dies **kein**
Rest-of-Season- oder Dynasty-Ranking ist (auch wenn einzelne Spieler
intern auf den ROS-PPR-Fallback zurückgreifen, siehe `rankIsEstimated`
oben).

## Gegner-Anreicherung (ESPN Scoreboard API)

Das ursprüngliche Vorgängerprodukt zeigte pro Spieler den Gegner sowie ein
proprietäres FantasyPros-"Matchup"-Rating (Sterne-Bewertung, wie günstig
der Gegner für diesen Spieler ist). Die FantasyPros-API bietet **keinen**
Spielplan/Matchup-Endpoint (per vollständiger OpenAPI-Spezifikation
verifiziert — kein Treffer für "matchup", "opponent" oder "star_rating" in
der gesamten Spec); dieser Datenpunkt war ausschliesslich über die
Website selbst verfügbar. Ein automatisierter Website-Scrape würde genau
die Fragilität zurückbringen, die dieser Rebuild beseitigen sollte — daher
wird das Matchup-Rating **nicht** automatisiert bezogen (siehe eigener
Abschnitt weiter unten für die stattdessen gewählte manuelle Lösung).

Der reine Gegner (ohne Bewertung) lässt sich aber über eine zweite,
unauthentifizierte öffentliche API beziehen: ESPNs (nicht offiziell
dokumentierte, aber weit verbreitete) Scoreboard-API:

```
GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week={week}&seasontype=2&year={season}
```

- Liefert alle Spiele der Woche mit Heim-/Auswärts-Team; daraus wird pro
  Team ein Label erzeugt ("vs XXX" bei Heimspiel, "at XXX" auswärts).
- Zwei Team-Kürzel weichen von FantasyPros ab und werden zurückübersetzt
  (gegen eine echte Antwort verifiziert): ESPN `JAX` → FantasyPros `JAC`
  (Jacksonville), ESPN `WSH` → FantasyPros `WAS` (Washington).
- Schlägt der ESPN-Abruf fehl, wird das geloggt und die Pipeline läuft
  ohne Gegner-Daten weiter (`opponent: null` für alle Spieler) — im
  Gegensatz zum Sicherheitsnetz der Rankings selbst (UC-007 AF-2) ist der
  Gegner ein Nice-to-have, kein Grund, den ganzen Lauf abzubrechen.
- Damit hat die Pipeline zwei externe Datenquellen (FantasyPros +
  zusätzlich ESPN), beide unauthentifiziert bzw. mit API-Key, beide
  serverseitig in der Actions-Umgebung aufgerufen.

## Matchup-Rating (manuell gepflegte Ausnahme)

Das FantasyPros-Matchup-Rating (0–5, wie günstig der Gegner für einen
Spieler ist) steckt clientseitig in `window.advancedMetrics` auf
[`ppr-superflex.php`](https://www.fantasypros.com/nfl/rankings/ppr-superflex.php)
— aber **nur für eingeloggte Nutzer**; ohne Login liefert die Seite dort
lediglich ein leeres Array. Eine Automatisierung des Logins wurde bewusst
verworfen:

- Das FantasyPros-Passwort müsste als GitHub-Actions-Secret hinterlegt
  und alle 30 Minuten für einen automatisierten Login verwendet werden —
  ein unverhältnismässiges Sicherheitsrisiko für ein Nice-to-have-Feld.
- Automatisierter Login verstösst bei den meisten Diensten gegen die ToS.
- Login-Flows sind fragiler als reine Seitenstruktur (CAPTCHA, 2FA,
  Session-Handling, mögliches Risiko einer Account-Sperrung durch
  ungewöhnliches automatisiertes Zugriffsmuster).

**Gewählte Lösung:** eine manuell gepflegte Momentaufnahme,
[`config/matchup-ratings.json`](../config/matchup-ratings.json), analog zu
`config/app.json`. Der Repo-Owner öffnet die Seite eingeloggt,
führt in der Browser-Konsole `copy(JSON.stringify(advancedMetrics))` aus
und fügt das Ergebnis ab Zeile 2 der Datei ein (Zeile 1 bleibt ein
`//`-Kommentar mit genau diesem Befehl als Reminder). Damit läuft **kein
eigener Code** gegen die FantasyPros-Website — kein Scraping, keine
Login-Automatisierung, kein Puppeteer/Headless-Browser in der Pipeline.

- `scripts/lib/matchupRatings.mjs` (`loadMatchupRatings`) liest die Datei,
  überspringt alle führenden Kommentarzeilen (nicht nur eine — ein reales
  Paste hat den Reminder schon auf 3 Zeilen umgebrochen, siehe
  `parseMatchupRatings`) und mapped pro FantasyPros-`player_id` den Wert
  aus `matchup_rating.rating` (als `matchupRating` auf `PLAYER`).
- Fehlt die Datei, ist sie leer/veraltet oder nicht mehr parsebar (z. B.
  weil FantasyPros die interne Struktur ändert), wird das geloggt und die
  Pipeline läuft ohne Matchup-Ratings weiter (`matchupRating: null`) —
  wie beim ESPN-Gegner kein Grund, den Lauf abzubrechen. `config/` enthält
  damit ausschliesslich von Hand gepflegte Dateien; `data/` bleibt rein
  für maschinell erzeugten Pipeline-Output (`rankings.json`) reserviert.
- Frontend: Der Wert wird auf die nächste ganze Zahl gerundet und als
  0–5 blaue/graue Sterne dargestellt (z. B. 2.7 → 3 gefüllte + 2 leere
  Sterne), mit dem Rohwert als Tooltip.
- **Aktualität:** Die Datei trägt selbst keine Woche/Saison (reines
  Copy-Paste von `advancedMetrics`). Statt eines manuellen Tags liest
  `getMatchupRatingsUpdatedAt` (`scripts/lib/matchupRatings.mjs`) den
  letzten Git-Commit-Zeitpunkt der Datei via `git log -1 --format=%cI --
  config/matchup-ratings.json` und schreibt ihn als
  `matchupRatingsUpdatedAt` in den Snapshot. Das erfordert die volle
  Commit-Historie statt des GitHub-Actions-Standard-Shallow-Checkouts,
  daher `fetch-depth: 0` im Workflow. Das Banner ist immer sichtbar
  (`describeMatchupRatingsFreshness`, `js/rankings.js`), analog zum
  Rankings-Aktualitäts-Banner (UC-006); nur die orange Warnfarbe hängt
  daran, ob der Commit älter als 1 Tag ist.
- Bewusster Nachteil: Die Datei veraltet, sobald sich die Rankings ändern,
  bis sie manuell neu eingefügt wird — akzeptiert, da es sich um ein
  Nice-to-have-Attribut handelt, nicht um die Kern-Rankings.

## Verletzungsstatus (FantasyPros Injuries API)

Anders als das Matchup-Rating ist der Verletzungsstatus über eine reguläre,
mit demselben `x-api-key` authentifizierte FantasyPros-API verfügbar —
keine Ausnahme vom "kein Scraping"-Grundsatz nötig.

- **Endpoint:** `GET https://api.fantasypros.com/public/v2/json/nfl/injuries?year={season}&week={week}`
  (`scripts/lib/injuries.mjs`, `fetchInjuries`). Läuft parallel zu
  Rankings-Abruf, ESPN-Gegner und Matchup-Ratings (`Promise.all`,
  `scripts/update-rankings.mjs`).
- **Mapping:** Antwort liefert pro verletztem Spieler `player_id`,
  `status` (Klartext, z. B. "Questionable"), `status_short` und
  `probability_of_playing` (Dezimalstring, z. B. "0.88797"). Gemappt auf
  eine `player_id -> {status, statusShort, probability}`-Map
  (`mapInjuries`, testbar ohne Netzwerkzugriff, analog zu
  `parseMatchupRatings`), anschliessend pro Spieler in `mapPlayers`
  eingereichert (`fantasyProsRankings.mjs`) — die meisten Spieler haben
  keinen Eintrag (nicht verletzt), `injuryStatus`/`injuryStatusShort`/
  `injuryProbability` bleiben dann `null`.
- **Korrektur eines API-Fehlers:** `status_short` der API ist für
  "Questionable" nachweislich falsch (liefert "O" statt "Q", bestätigt
  anhand einer echten Antwort) — `mapInjuries` überschreibt das gezielt
  für bekannte Fehlerfälle (`STATUS_SHORT_OVERRIDES`), statt der API
  blind zu vertrauen oder eine komplette eigene Status-Tabelle zu raten.
- **`probability_of_playing` bewusst nicht immer angezeigt:** Bei "Out"
  und "Injured Reserve" impliziert der Status bereits, dass der Spieler
  nicht spielt — eine zusätzliche, praktisch immer nahe 0 % liegende
  Prozentzahl wäre redundant, nicht informativ. `mapInjuries` liefert für
  diese beiden Status bewusst `probability: null`.
- **Ausfallsicherheit:** Wie ESPN-Gegner und Matchup-Rating ein
  Nice-to-have, kein Kern-Feature — ein Fetch-Fehler wird geloggt, die
  Pipeline läuft mit einer leeren Injuries-Map weiter (kein Spieler zeigt
  einen Verletzungs-Tag), statt den gesamten Lauf abzubrechen.
- **Frontend:** Ein farbiges Kurz-Tag direkt hinter dem Spielernamen
  (`js/main.js`, `createInjuryTag`) — Q (gelb), D (orange), O (rot), IR
  (dunkelrot), unbekannte Status grau. Tooltip zeigt den vollen
  Klartext-Status plus Prozentzahl (wenn vorhanden). Feste, gesättigte
  Farben mit weisser Schrift statt Picos theme-abhängiger Variablen —
  dadurch automatisch in Light und Dark Mode lesbar, ohne eigene
  Dark-Mode-Anpassung (anders als die pastellfarbenen Banner an anderer
  Stelle in dieser Datei).

## Sleeper-Draft-Abgleich

Die Sleeper-API ist öffentlich, unauthentifiziert und CORS-offen. Der
Abgleich des Draft-Fortschritts (Draft-ID → gedraftete Spieler) erfolgt
daher weiterhin direkt im Browser zur Laufzeit, unverändert zum
Vorgängerprodukt.

## Konfiguration (`config/app.json`)

Eine committete, von Hand gepflegte `config/app.json` enthält optionale
Overrides. `season`/`week` werden sowohl vom Frontend (`js/config.js`,
nur zum Anzeigen) als auch von der Pipeline (`scripts/lib/config.mjs`,
für den API-Abruf) gelesen; `draftIds` ist reine Frontend-Konfiguration —
die Pipeline liest oder benötigt es nicht (Sleeper-Zugriff bleibt
clientseitig, siehe unten).

```json
{
  "draftIds": {
    "1": "1265036873886076928",
    "2": "1265036873886076929"
  },
  "season": null,
  "week": null
}
```

- `draftIds`: pro Woche eine eigene Sleeper-Draft-ID (Schlüssel =
  Wochennummer als String, z. B. "1") — für Ligen, die jede Woche neu
  drafteten (z. B. wöchentliche Redraft-Ligen), statt einer über die
  ganze Saison fixen Draft-ID. Beim Laden befüllt das Frontend
  (`js/main.js`, `init`) das Draft-ID-Feld automatisch vor — mit dem
  Eintrag für die Woche, für die der gerade geladene
  `RANKINGS_SNAPSHOT` tatsächlich gilt (`snapshot.week`), nicht mit
  einer separat im Frontend berechneten Woche; so bleibt es auch
  korrekt, falls sich `config/app.json`'s `week`/`season`-Override und
  der Snapshot-Inhalt einmal auseinander entwickeln sollten. Fehlt für
  die aktuelle Woche ein Eintrag (oder `season`/`week` fehlen im
  Snapshot — älterer Snapshot vor Einführung dieser Felder), bleibt das
  Feld leer, kein Fehler. Der Sleeper-Abgleich (UC-002) selbst wird
  dadurch bewusst **nicht** ausgelöst; das bleibt ein expliziter Klick
  auf "Draft-Daten laden". Ein automatischer Sync bei jedem
  Seitenaufruf hätte den Sleeper-Endpunkt ungefragt bei jedem Laden
  getroffen und die Statusspalte (an den Sync-Zustand gekoppelt, siehe
  UC-002/UC-004) von Anfang an bedeutungslos gemacht, statt bis zum
  ersten echten Abgleich ausgeblendet zu bleiben.
- `season`/`week`: Überschreiben die automatisch berechneten Werte aus
  `currentNflSeason()`/`currentNflWeek()` (`scripts/lib/nflSchedule.mjs`).
  `null` bedeutet: automatische Berechnung wird verwendet
  (Standardverhalten, siehe oben). Gedacht als Absicherung/manuelle
  Korrektur, falls die Automatik in einem Randfall doch einmal daneben
  liegen sollte — nicht als Ersatz für die automatische Berechnung.

Fehlt `config/app.json` ganz oder sind Felder nicht gesetzt, verhält sich
die App genau wie ohne diese Datei (reine Fallback-Defaults, keine
Pflicht).

## Repository-Struktur (Übersicht)

- `config/` — von Hand gepflegte, committete Konfiguration
  (`app.json`, `matchup-ratings.json`).
- `data/` — ausschliesslich maschinell erzeugter Pipeline-Output
  (`rankings.json`), nie von Hand editiert.
- `docs/` — AIUP-Artefakte (`vision.md`, `architecture.md`,
  `requirements.md`, `entity_model.md`, `use_cases.puml`,
  `use_cases/*.md`).
- `js/` — Frontend, ein Modul pro Belang (`rankings.js`, `filters.js`,
  `stats.js`, `sleeperDraft.js`, `messages.js`, `config.js`, `logger.js`,
  `main.js` als Orchestrator).
- `scripts/` — Node-Pipeline (`update-rankings.mjs` als Orchestrator,
  Logik modular in `scripts/lib/`).
- `.github/workflows/` — GitHub-Actions-Workflow.

## Verworfene Alternative

Ein Laufzeit-Proxy (z. B. Cloudflare Worker) für On-Demand-Live-Rankings
wurde verworfen: er würde einen zusätzlichen Hosting-Baustein außerhalb von
GitHub Pages einführen, ohne für Rankings, die sich nicht minütlich ändern,
einen relevanten Mehrwert gegenüber dem halbstündlichen Cron-Ansatz zu
bieten.
