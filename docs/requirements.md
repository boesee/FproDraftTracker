# Requirements: FproDraftTracker

Abgeleitet aus [`vision.md`](./vision.md) und [`architecture.md`](./architecture.md).
Alle Anforderungen sind eindeutig identifiziert, messbar/testbar formuliert und
nicht mehrfach vergeben.

## Functional Requirements (FR)

| ID | Title | User Story | Priority | Status |
|----|-------|-------------|----------|--------|
| FR-001 | Rankings anzeigen | As a Fantasy-Football-Manager, I want to see the current FantasyPros ECR rankings when I open the app, so that I know each player's expert consensus rank without any manual step. | High | Draft |
| FR-002 | Draft-Fortschritt abgleichen | As a Fantasy-Football-Manager, I want to enter my Sleeper Draft-ID and load the current picks, so that I can see which players are already drafted. | High | Draft |
| FR-003 | Nach Position filtern | As a Fantasy-Football-Manager, I want to switch between an Overall (Superflex) ranking and position-specific rankings (QB/RB/WR/Flex) via a pills-style navigation, so that I can focus on the players relevant to my current pick and see them ranked the way that position is actually drafted. | High | Draft |
| FR-004 | Nach maximalem Rang filtern | As a Fantasy-Football-Manager, I want to limit the player list to a maximum rank, so that I only see players within my relevant draft range. | Medium | Draft |
| FR-005 | Nach Draft-Status filtern | As a Fantasy-Football-Manager, I want to filter players by draft status (available/drafted), so that I can quickly see who is still available. | High | Draft |
| FR-006 | Spieler durchsuchen | As a Fantasy-Football-Manager, I want to search across all player columns, including a targeted `column:value` syntax, so that I can quickly find specific players or attributes. | Medium | Draft |
| FR-007 | Filter zurücksetzen | As a Fantasy-Football-Manager, I want to reset all active filters with one action, so that I can quickly return to the full player list. | Low | Draft |
| FR-008 | Statistik-Übersicht einsehen | As a Fantasy-Football-Manager, I want to see a live count of total, available, and drafted players, so that I can gauge draft progress at a glance. | Medium | Draft |
| FR-009 | Feedback bei Fehlern | As a Fantasy-Football-Manager, I want to see a clear message when an invalid Draft-ID is entered or the Sleeper data cannot be loaded, so that I understand why the draft sync failed. | Medium | Draft |
| FR-010 | Aktualität der Rankings einsehen | As a Fantasy-Football-Manager, I want to see an info banner stating when the rankings were last synced with the FantasyPros API, so that I can judge how current the data is, especially if a scheduled update has failed. | High | Draft |
| FR-011 | Ranking-Art einsehen | As a Fantasy-Football-Manager, I want to see what kind of ranking I'm looking at (in-season weekly, which week/season, and the scoring format), so that I don't mistake it for a Rest-of-Season or Dynasty view or a different scoring format. | Medium | Draft |

## Non-Functional Requirements (NFR)

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Datenaktualität | Während der Betriebszeit (07:00–23:00 Uhr) dürfen die ausgelieferten Ranking-Daten nicht älter als 30 Minuten sein. | Performance | High | Draft |
| NFR-002 | Ladezeit | Die Spielerliste muss nach dem Laden der Seite innerhalb von 2 Sekunden vollständig gerendert sein (gemessen ohne Sleeper-Abgleich, bei Rankings-JSON < 500 KB). | Performance | Medium | Draft |
| NFR-003 | Ausfallsicherheit der Datenpipeline | Schlägt ein geplanter GitHub-Actions-Lauf fehl, muss die App weiterhin die zuletzt erfolgreich abgerufenen Rankings anzeigen (statt vollständig auszufallen) und deren Zeitstempel sichtbar machen (siehe FR-010). | Availability | High | Draft |
| NFR-004 | Geheimhaltung des API-Keys | Der FantasyPros-API-Key darf zu keinem Zeitpunkt im ausgelieferten Frontend-Code, im Browser-Netzwerkverkehr oder im Git-Verlauf des Repositories sichtbar sein. | Security | High | Draft |
| NFR-005 | Responsives Layout | Die Anwendung muss auf gängigen Desktop- und mobilen Bildschirmgrößen (ab 360 px Breite) ohne horizontales Scrollen der Seite bedienbar sein. | Usability | Medium | Draft |

## Constraints (C)

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Kein Backend zur Laufzeit | Die App wird ausschließlich als statische Website auf GitHub Pages betrieben; es gibt kein eigenes Backend zur Laufzeit. | Technical | High | Draft |
| C-002 | FantasyPros-API ist CORS-geschützt | Die FantasyPros-API kann nicht direkt aus dem Browser aufgerufen werden (verifiziert); der API-Aufruf muss außerhalb des Frontends erfolgen. | Technical | High | Draft |
| C-003 | Tageslimit der FantasyPros-API | Die FantasyPros-API ist auf 500 Requests pro Tag limitiert. | Technical | High | Draft |
| C-004 | Zeitplan der Datenpipeline | Die Aktualisierung der Rankings erfolgt per GitHub-Actions-Workflow halbstündlich im Fenster 07:00–23:00 Uhr. | Schedule | Medium | Draft |
| C-005 | API-Zugangsdaten bereits vorhanden | API-URL und API-Key für die FantasyPros-API sind bereits vorhanden und als GitHub-Actions-Secret zu hinterlegen. | Technical | Medium | Draft |
| C-006 | Sleeper-Zugriff bleibt clientseitig | Die Sleeper-API ist öffentlich und unauthentifiziert und wird weiterhin direkt aus dem Browser aufgerufen. | Technical | Low | Draft |
| C-007 | Deutschsprachige Oberfläche | Die Benutzeroberfläche bleibt durchgehend deutschsprachig, analog zum bisherigen Produkt. | Business | Low | Draft |
