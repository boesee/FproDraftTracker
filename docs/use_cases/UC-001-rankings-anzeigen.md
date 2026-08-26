# UC-001: Rankings anzeigen

## Overview

- **Use Case ID:** UC-001
- **Primary Actor:** Fantasy-Football-Manager
- **Goal:** Der Fantasy-Football-Manager sieht beim Öffnen der Anwendung die
  aktuelle FantasyPros-ECR-Spielerliste inklusive eines Hinweises, wann
  diese zuletzt synchronisiert wurde.
- **Status:** Draft
- **Bezug:** FR-001, FR-010 (via UC-006, `<<include>>`), NFR-001, NFR-002,
  NFR-003, C-001, C-002, C-004; Entitäten `RANKINGS_SNAPSHOT`, `PLAYER`.

## Preconditions

- Die statische Website ist über GitHub Pages erreichbar.
- Im Repository liegt eine von UC-007 erzeugte Rankings-Datei
  (`RANKINGS_SNAPSHOT`-JSON) vor — auch wenn deren Inhalt veraltet sein
  könnte.

## Main Success Scenario

1. Der Fantasy-Football-Manager öffnet die FproDraftTracker-Website.
2. Das System lädt die zuletzt committete Rankings-Datei
   (`RANKINGS_SNAPSHOT`).
3. Das System stellt die Spielerliste aufsteigend nach FantasyPros-Rang
   dar (Rang, Spielername, Position, Team, Gegner).
4. Das System zeigt in einem Info-Banner an, wann diese Rankings zuletzt
   mit der FantasyPros-API synchronisiert wurden (`generatedAt`).
5. Der Fantasy-Football-Manager sieht die vollständige, aktuelle
   Spielerliste inklusive Aktualitätsangabe.

## Alternative Flows

### AF-1: Keine Rankings-Datei vorhanden

- **Trigger:** (step 2) Das System findet keine Rankings-Datei (z. B. vor
  dem allerersten erfolgreichen Lauf von UC-007).
1. Das System zeigt eine Fehlermeldung an, dass aktuell keine Rankings
   verfügbar sind.
2. Die Spielerliste bleibt leer.

Use case ends.

### AF-2: Rankings sind veraltet

- **Trigger:** (step 4) Das Alter der Rankings (`generatedAt`) überschreitet
  den in NFR-001 definierten Schwellenwert.
1. Das System hebt den Info-Banner optisch als "veraltet" hervor.
2. Das System zeigt weiterhin die zuletzt erfolgreich geladenen Rankings an
   (siehe NFR-003, BR-003).

Use case continues at step 5.

## Postconditions

### Success

- Die vollständige, aktuelle Spielerliste ist sichtbar, sortiert nach Rang.
- Der Info-Banner zeigt den korrekten `generatedAt`-Zeitstempel des
  angezeigten `RANKINGS_SNAPSHOT`.

### Failure

- Es konnte keine Rankings-Datei geladen werden; dem Manager wird eine
  Fehlermeldung angezeigt, die Spielerliste bleibt leer.

## Business Rules

- **BR-001:** Die Spielerliste wird standardmäßig aufsteigend nach `rank`
  sortiert.
- **BR-002:** Rankings gelten als veraltet, wenn `generatedAt` mehr als 30
  Minuten zurückliegt und die aktuelle Uhrzeit innerhalb des
  Betriebsfensters 07:00–23:00 Uhr liegt (siehe NFR-001).
- **BR-003:** Bei fehlgeschlagener Pipeline-Aktualisierung bleibt der
  zuletzt erfolgreich erzeugte `RANKINGS_SNAPSHOT` die einzige
  Datengrundlage; es gibt keinen Live-Fallback auf die FantasyPros-API im
  Browser (siehe C-002).
