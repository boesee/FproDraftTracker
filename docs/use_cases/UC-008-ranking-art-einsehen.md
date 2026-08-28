# UC-008: Ranking-Art einsehen

## Overview

- **Use Case ID:** UC-008
- **Primary Actor:** Fantasy-Football-Manager
- **Goal:** Der Fantasy-Football-Manager sieht auf einen Blick, welche Art
  von Ranking angezeigt wird (In-Season Wochen-Ranking, welche Woche/
  Saison, welches Scoring-Format), um es nicht mit einer Rest-of-Season-,
  Dynasty- oder anders skalierten Ansicht zu verwechseln.
- **Status:** Draft
- **Bezug:** FR-011; `<<include>>` von UC-001 (fester Bestandteil jeder
  Rankings-Anzeige); Entität `RANKINGS_SNAPSHOT` (Felder `season`, `week`).

## Preconditions

- UC-001 wird ausgeführt; ein `RANKINGS_SNAPSHOT` ist geladen.

## Main Success Scenario

1. Das System liest `season` und `week` aus dem geladenen
   `RANKINGS_SNAPSHOT`.
2. Das System zeigt einen Info-Banner mit der Ranking-Art
   ("In-Season Wochen-Ranking"), Woche, Saison und Scoring-Format ("PPR")
   an (siehe BR-001).
3. Der Fantasy-Football-Manager sieht, welche Art von Ranking und für
   welche Woche/Saison er gerade betrachtet.

## Alternative Flows

### AF-1: `season`/`week` fehlen im Snapshot

- **Trigger:** (step 1) Der geladene Snapshot stammt aus einer Version der
  Pipeline, die `season`/`week` noch nicht schrieb, oder die Felder sind
  aus einem anderen Grund nicht gesetzt.
1. Das System zeigt den Banner trotzdem an, jedoch ohne Woche/Saison,
   nur mit Ranking-Art und Scoring-Format (siehe BR-002).

Use case ends.

## Postconditions

### Success

- Der Info-Banner benennt sichtbar Ranking-Art, Woche, Saison und
  Scoring-Format.

### Failure

- `season`/`week` fehlen; der Banner zeigt einen reduzierten Hinweis ohne
  Woche/Saison an, statt gar nichts oder einen fehlerhaften Wert (AF-1).

## Business Rules

- **BR-001:** Der Banner benennt explizit, dass es sich um ein
  In-Season-Wochen-Ranking handelt (nicht Rest-of-Season oder Dynasty) und
  nennt Woche, Saison sowie das Scoring-Format ("PPR"), z. B.
  "In-Season Wochen-Ranking – Woche 1, Saison 2026 – PPR-Scoring".
- **BR-002:** Fehlen `season`/`week`, zeigt das System einen reduzierten
  Text ("In-Season Wochen-Ranking – PPR-Scoring") statt eines falschen
  oder leeren Werts.
