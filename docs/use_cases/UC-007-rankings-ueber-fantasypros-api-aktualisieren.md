# UC-007: Rankings über FantasyPros-API aktualisieren

## Overview

- **Use Case ID:** UC-007
- **Primary Actor:** GitHub Actions Scheduler
- **Goal:** Ein aktueller `RANKINGS_SNAPSHOT` wird über die offizielle
  FantasyPros-API erzeugt und im Repository committet, damit UC-001/UC-006
  aktuelle Daten anzeigen können.
- **Status:** Draft
- **Bezug:** C-002, C-003, C-004, C-005; NFR-001, NFR-003, NFR-004;
  Entitäten `RANKINGS_SNAPSHOT`, `PLAYER`.

## Preconditions

- Der GitHub-Actions-Workflow ist gemäß Zeitplan (C-004) eingerichtet.
- API-URL und API-Key sind als GitHub-Actions-Secret hinterlegt (C-005).

## Main Success Scenario

1. Der GitHub Actions Scheduler löst den Workflow gemäß Zeitplan aus
   (halbstündlich, 07:00–23:00 Uhr).
2. Das System ruft die FantasyPros-API mit dem hinterlegten API-Key auf.
3. Das System empfängt die aktuellen ECR-Rankingdaten.
4. Das System erzeugt daraus einen neuen `RANKINGS_SNAPSHOT` mit aktuellem
   `generatedAt`-Zeitstempel.
5. Das System committet die neue Rankings-Datei ins Repository.
6. Die über GitHub Pages ausgelieferte Anwendung stellt ab diesem
   Zeitpunkt den neuen Snapshot bereit.

## Alternative Flows

### AF-1: FantasyPros-API antwortet mit Fehler

- **Trigger:** (step 2) Die FantasyPros-API liefert einen Fehlerstatus
  oder ist nicht erreichbar (z. B. Netzwerkproblem oder überschrittenes
  Tageslimit, siehe C-003).
1. Das System bricht den Workflow-Lauf ab, ohne einen neuen Snapshot zu
   committen.
2. Der zuletzt erfolgreich committete `RANKINGS_SNAPSHOT` bleibt
   unverändert bestehen (siehe NFR-003, BR-003).

Use case ends.

### AF-2: Empfangene Daten sind unvollständig oder fehlerhaft

- **Trigger:** (step 3) Die API-Antwort enthält keine gültige
  Spielerliste (z. B. leeres oder fehlerhaft strukturiertes Ergebnis).
1. Das System verwirft die Antwort und committet keinen neuen Snapshot.
2. Der zuletzt erfolgreich committete `RANKINGS_SNAPSHOT` bleibt
   unverändert bestehen (siehe NFR-003, BR-003).

Use case ends.

## Postconditions

### Success

- Ein neuer `RANKINGS_SNAPSHOT` mit aktuellem `generatedAt`-Zeitstempel
  ist im Repository committet und wird über GitHub Pages ausgeliefert.
- Der Tagesverbrauch des FantasyPros-API-Kontingents bleibt innerhalb der
  in C-003 definierten Grenze.

### Failure

- Der Workflow-Lauf ist fehlgeschlagen (API-Fehler oder unvollständige
  Daten); es existiert weiterhin nur der zuletzt erfolgreich erzeugte
  Snapshot. Nutzer werden nicht aktiv benachrichtigt — die Auswirkung wird
  ihnen indirekt über den in UC-006 gezeigten Zeitstempel sichtbar.

## Business Rules

- **BR-001:** Der Workflow läuft ausschließlich innerhalb des Zeitfensters
  07:00–23:00 Uhr im 30-Minuten-Takt (siehe C-004); das ergibt ca. 33
  Aufrufe pro Tag, deutlich innerhalb des 500er-Limits aus C-003.
- **BR-002:** Der API-Key wird ausschließlich als verschlüsseltes
  GitHub-Actions-Secret verwendet und ist zu keinem Zeitpunkt im
  committeten Code oder in Workflow-Logs sichtbar (siehe NFR-004).
- **BR-003:** Ein fehlgeschlagener Workflow-Lauf committet keinen neuen
  Snapshot; der vorherige Snapshot bleibt maßgeblich, bis ein
  nachfolgender Lauf erfolgreich ist.
