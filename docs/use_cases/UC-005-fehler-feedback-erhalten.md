# UC-005: Fehler-Feedback erhalten

## Overview

- **Use Case ID:** UC-005
- **Primary Actor:** Fantasy-Football-Manager
- **Goal:** Der Fantasy-Football-Manager erhält eine verständliche
  Fehlermeldung, wenn der Draft-Abgleich (UC-002) nicht wie erwartet
  ausgeführt werden kann, damit er weiß, welche Korrektur nötig ist.
- **Status:** Draft
- **Bezug:** FR-009; `<<extend>>` von UC-002 (Erweiterungspunkte: AF-1
  "Rankings noch nicht geladen", AF-2 "Ungültige oder unbekannte
  Draft-ID").

## Preconditions

- UC-002 wird ausgeführt und erreicht einen seiner Erweiterungspunkte, an
  dem eine Fehlerbedingung vorliegt.

## Main Success Scenario

1. Das System erkennt, dass ein Erweiterungspunkt in UC-002 erreicht wurde
   (z. B. fehlende Rankings oder ungültige Draft-ID).
2. Das System zeigt eine für den Fehlerfall spezifische, verständliche
   Fehlermeldung an (siehe BR-001).
3. Das System blendet die Fehlermeldung nach einer definierten
   Anzeigedauer automatisch wieder aus (siehe BR-002).
4. Der Fantasy-Football-Manager liest die Fehlermeldung und versteht,
   welche Aktion notwendig ist, um fortzufahren.

## Alternative Flows

### AF-1: Neuer Fehler während eine vorherige Meldung noch sichtbar ist

- **Trigger:** (step 2) Eine vorherige Fehlermeldung ist noch sichtbar, als
  ein neuer Fehler auftritt.
1. Das System blendet die vorherige Fehlermeldung sofort aus und zeigt
   stattdessen die neue Fehlermeldung an (siehe BR-003).

Use case continues at step 3.

### AF-2: Erfolgsmeldung tritt auf, während eine Fehlermeldung sichtbar ist

- **Trigger:** (step 3) Ein anderer Vorgang (z. B. ein erfolgreicher
  Rankings-Ladevorgang, UC-001) meldet währenddessen einen Erfolg.
1. Das System blendet die Fehlermeldung sofort aus und zeigt stattdessen
   die Erfolgsmeldung an (siehe BR-003).

Use case ends.

## Postconditions

### Success

- Der Fantasy-Football-Manager hat eine klare, kontextspezifische
  Fehlermeldung gesehen und weiß, welche Korrektur nötig ist (z. B. zuerst
  die Rankings laden oder eine gültige Draft-ID eingeben).

### Failure

- Die Fehlermeldung blendet sich aus, bevor der Manager sie lesen konnte
  (z. B. weil die Anzeigedauer gemäß BR-002 zu kurz für den Lesevorgang
  ist); der Manager bleibt über die Ursache im Unklaren.

## Business Rules

- **BR-001:** Jede Fehlermeldung enthält eine für Menschen verständliche
  Ursachenbeschreibung (z. B. "Bitte geben Sie eine gültige Draft-ID ein.")
  statt eines technischen Fehlercodes.
- **BR-002:** Eine Fehlermeldung wird nach 5 Sekunden automatisch
  ausgeblendet, eine Erfolgsmeldung nach 3 Sekunden.
- **BR-003:** Fehler- und Erfolgsmeldung schließen sich gegenseitig aus;
  das Anzeigen der einen blendet die jeweils andere sofort aus.
