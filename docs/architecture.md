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
