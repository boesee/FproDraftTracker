# UC-006: Aktualität der Rankings einsehen

## Overview

- **Use Case ID:** UC-006
- **Primary Actor:** Fantasy-Football-Manager
- **Goal:** Der Fantasy-Football-Manager sieht auf einen Blick, wie aktuell
  die angezeigten Rankings sind, um deren Vertrauenswürdigkeit
  einzuschätzen.
- **Status:** Draft
- **Bezug:** FR-010; `<<include>>` von UC-001 (fester Bestandteil jeder
  Rankings-Anzeige); NFR-001, NFR-003; C-004.

## Preconditions

- UC-001 wird ausgeführt; ein `RANKINGS_SNAPSHOT` ist geladen.

## Main Success Scenario

1. Das System liest den `generatedAt`-Zeitstempel aus dem geladenen
   `RANKINGS_SNAPSHOT`.
2. Das System berechnet das Alter der Rankings relativ zur aktuellen
   Uhrzeit.
3. Das System zeigt in der Aktualitäts-Zeile den Zeitpunkt der letzten
   Synchronisation in einem für Menschen lesbaren Format an (siehe
   BR-001).
4. Der Fantasy-Football-Manager sieht, wie aktuell die Rankings sind.

## Alternative Flows

### AF-1: Aktuelle Uhrzeit liegt außerhalb des Betriebsfensters

- **Trigger:** (step 2) Die aktuelle Uhrzeit liegt außerhalb von
  07:00–23:00 Uhr, in dem laut C-004 keine automatischen Aktualisierungen
  stattfinden.
1. Das System wertet das Alter der Rankings nicht als "veraltet", auch
   wenn seit der letzten Aktualisierung mehr als 30 Minuten vergangen sind
   (siehe BR-002).

Use case continues at step 3.

### AF-2: Rankings sind innerhalb des Betriebsfensters veraltet

- **Trigger:** (step 2) Das Alter der Rankings überschreitet innerhalb des
  Betriebsfensters den in NFR-001 definierten Schwellenwert.
1. Das System hebt nur den Rankings-Teil der Aktualitäts-Zeile farblich
   hervor (siehe UC-001, AF-2, für das Anzeigeverhalten der zugrunde
   liegenden Rankings-Liste) — nicht die ganze Zeile, da diese auch die
   unabhängig davon zu bewertende Matchup-Ratings-Aktualität enthält
   (eigener Abschnitt in architecture.md).

Use case continues at step 3.

## Postconditions

### Success

- Die Aktualitäts-Zeile zeigt einen korrekten, für Menschen lesbaren
  Zeitpunkt bzw. Zeitabstand der letzten Synchronisation.

### Failure

- Der `generatedAt`-Zeitstempel fehlt oder ist im geladenen Snapshot
  ungültig; das System kann keine verlässliche Aussage zur Aktualität
  treffen (siehe BR-003).

## Business Rules

- **BR-001:** Der Zeitpunkt wird als kompakte, absolute Uhrzeit dargestellt
  (z. B. "Rankings: 02.09. 14:30 Uhr", ohne Jahr, da die Aktualität hier
  stets in Minuten/Stunden/Tagen gemessen wird — das Jahr wäre nie die
  informative Angabe). Steht in derselben Zeile wie die
  Matchup-Ratings-Aktualität (durch "·" getrennt, siehe architecture.md),
  nicht mehr als eigener, umrandeter Banner — eine Zeitangabe ist kein
  Alarm und soll auch optisch nicht wie einer aussehen.
- **BR-002:** Das "veraltet"-Kriterium (mehr als 30 Minuten, siehe NFR-001)
  wird nur innerhalb des Betriebsfensters 07:00–23:00 Uhr angewendet;
  außerhalb dieses Fensters gilt der letzte Snapshot als aktuell, auch
  wenn er älter als 30 Minuten ist.
- **BR-003:** Fehlt `generatedAt` im geladenen Snapshot, zeigt das System
  stattdessen einen neutralen Hinweis ("Rankings: Aktualität unbekannt")
  anstelle eines falschen oder leeren Zeitwerts.
