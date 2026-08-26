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
- **Skript:** [`scripts/update-rankings.mjs`](../scripts/update-rankings.mjs)
- **Endpoint:** `GET https://api.fantasypros.com/public/v2/json/nfl/{season}/rankings?week=0&range=true&scoring=PPR&position=OP`
  (Auth über Header `x-api-key`). `{season}` wird zur Laufzeit berechnet
  (ab März gilt das laufende Kalenderjahr als Saison, sonst das
  Vorjahr).
- **Ausgabe:** `data/rankings.json` (Nachfolger von `data/ecrData.json`),
  Format gemäß `RANKINGS_SNAPSHOT`/`PLAYER` in `entity_model.md`.
- **Zeitplan:** Cron `*/30 5-21 * * *` (UTC) ≙ 07:00–23:30 Uhr CEST
  (Europe/Zurich, Sommerzeit). Bewusst als fixer UTC-Cron ohne
  Zeitzonen-Umrechnung umgesetzt: Draften findet laut Vision überwiegend im
  August/September statt (Sommerzeit), daher deckt dieses Fenster den
  Hauptnutzungszeitraum korrekt ab; während der Winterzeit (CET, UTC+1)
  verschiebt sich das reale Fenster auf 06:00–22:30 Uhr. Diese Drift wurde
  bewusst in Kauf genommen, statt mit zwei Cron-Ausdrücken oder
  Zeitzonen-Logik im Skript zu arbeiten.
- **Sicherheitsnetz (UC-007 AF-2):** Das Skript committet nur, wenn
  mindestens 50 Spieler und mindestens 50 % der Rohdaten erfolgreich
  gemappt werden konnten; andernfalls bricht es ohne Commit ab und der
  letzte erfolgreiche Snapshot bleibt bestehen.
- **Offene Annahme:** Die genaue Struktur von `player.rank` sowie die
  Query-Parameter `scoring=PPR&position=OP` sind aus der API-Dokumentation
  abgeleitet, aber noch nicht gegen eine echte Antwort verifiziert. Ein
  manueller Lauf über `workflow_dispatch` sollte vor der Aktivierung des
  Zeitplans die Werte in `data/rankings.json` gegenprüfen.

## Sleeper-Draft-Abgleich

Die Sleeper-API ist öffentlich, unauthentifiziert und CORS-offen. Der
Abgleich des Draft-Fortschritts (Draft-ID → gedraftete Spieler) erfolgt
daher weiterhin direkt im Browser zur Laufzeit, unverändert zum
Vorgängerprodukt.

## Verworfene Alternative

Ein Laufzeit-Proxy (z. B. Cloudflare Worker) für On-Demand-Live-Rankings
wurde verworfen: er würde einen zusätzlichen Hosting-Baustein außerhalb von
GitHub Pages einführen, ohne für Rankings, die sich nicht minütlich ändern,
einen relevanten Mehrwert gegenüber dem halbstündlichen Cron-Ansatz zu
bieten.
