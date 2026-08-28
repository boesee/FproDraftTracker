# UC-008: Ranking-Art einsehen

## Overview

- **Use Case ID:** UC-008
- **Primary Actor:** Fantasy-Football-Manager
- **Goal:** Der Fantasy-Football-Manager sieht auf einen Blick, welche Art
  von Ranking angezeigt wird (Ranking-Typ, Scoring-Format, konkrete Woche/
  Saison), um es nicht mit einer Rest-of-Season-, Dynasty- oder anders
  skalierten Ansicht zu verwechseln — dargestellt als Auswahlfelder, die
  erkennbar machen, dass hier künftig weitere Ranking-Typen/Scoring-Formate
  wählbar sein werden, sobald die Pipeline sie unterstützt.
- **Status:** Draft
- **Bezug:** FR-011; `<<include>>` von UC-001 (fester Bestandteil jeder
  Rankings-Anzeige); Entität `RANKINGS_SNAPSHOT` (Felder `season`, `week`).

## Preconditions

- UC-001 wird ausgeführt; ein `RANKINGS_SNAPSHOT` ist geladen.

## Main Success Scenario

1. Das System zeigt im Filterbereich die Felder "Ranking" und "Scoring"
   als Auswahlfelder (siehe BR-001).
2. Das System liest `season` und `week` aus dem geladenen
   `RANKINGS_SNAPSHOT` und zeigt sie als Hinweistext unter "Ranking" an
   (siehe BR-002).
3. Der Fantasy-Football-Manager sieht, welche Art von Ranking (aktuell:
   Wochen-Ranking), welches Scoring-Format (aktuell: PPR) und für welche
   Woche/Saison er gerade betrachtet.

## Alternative Flows

### AF-1: `season`/`week` fehlen im Snapshot

- **Trigger:** (step 2) Der geladene Snapshot stammt aus einer Version der
  Pipeline, die `season`/`week` noch nicht schrieb, oder die Felder sind
  aus einem anderen Grund nicht gesetzt.
1. Das System zeigt keinen Hinweistext an (leer), statt eines
   fehlerhaften oder irreführenden Werts (siehe BR-003).

Use case continues at step 3.

## Postconditions

### Success

- Die Felder "Ranking" und "Scoring" benennen sichtbar die aktuelle
  Ranking-Art bzw. das Scoring-Format; der Hinweistext benennt Woche und
  Saison.

### Failure

- `season`/`week` fehlen; kein Hinweistext wird angezeigt, statt eines
  fehlerhaften Werts (AF-1).

## Business Rules

- **BR-001:** "Ranking" und "Scoring" sind eigenständige Auswahlfelder
  (nicht nur Anzeigetext), da beide erweiterbar sind — die Pipeline
  liefert aktuell ausschließlich In-Season-Wochen-Rankings mit
  PPR-Scoring, könnte aber künftig um weitere Ranking-Typen (z. B.
  Dynasty, Rest-of-Season, Draft) oder Scoring-Formate (z. B. Half-PPR)
  erweitert werden. Jedes Feld zeigt nur die tatsächlich von der Pipeline
  unterstützten Werte an (aktuell je ein einzelner) — keine deaktivierten
  Platzhalter-Optionen für noch nicht gebaute Funktionalität.
- **BR-002:** Der Hinweistext benennt Woche und Saison, z. B.
  "Woche 1, Saison 2026" — die Auswahlfelder allein sagen nur, dass es
  sich um ein Wochen-Ranking handelt, nicht für welche konkrete Woche.
- **BR-003:** Fehlen `season`/`week` im Snapshot, bleibt der Hinweistext
  leer, statt einen falschen oder unvollständigen Wert anzuzeigen.
