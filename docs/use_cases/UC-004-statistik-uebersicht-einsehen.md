# UC-004: Statistik-Übersicht einsehen

## Overview

- **Use Case ID:** UC-004
- **Primary Actor:** Fantasy-Football-Manager
- **Goal:** Der Fantasy-Football-Manager erkennt auf einen Blick, wie viele
  Spieler insgesamt geladen, aktuell verfügbar und bereits gedraftet sind.
- **Status:** Draft
- **Bezug:** FR-008; Entität `PLAYER` (aggregiert).

## Preconditions

- UC-001 wurde bereits ausgeführt; die Rankings-Liste ist geladen.

## Main Success Scenario

1. Der Fantasy-Football-Manager hat die Anwendung mit geladenen Rankings
   geöffnet.
2. Das System berechnet die Gesamtzahl der geladenen Spieler.
3. Das System berechnet die Anzahl der aktuell verfügbaren Spieler (nicht
   gedraftet).
4. Das System berechnet die Anzahl der aktuell gedrafteten Spieler.
5. Der Fantasy-Football-Manager sieht die drei Kennzahlen in den
   Statistik-Badges und erkennt den Draft-Fortschritt auf einen Blick.

## Alternative Flows

### AF-1: Draft noch nicht abgeglichen

- **Trigger:** (step 4) UC-002 wurde noch nicht ausgeführt; es liegen
  keine Sleeper-Draft-Picks vor.
1. Das System zeigt 0 gedraftete Spieler und die Gesamtzahl als Anzahl
   verfügbarer Spieler an.

Use case continues at step 5.

### AF-2: Filter sind aktiv

- **Trigger:** (step 1) Der Fantasy-Football-Manager hat zuvor
  Filterkriterien gesetzt (UC-003).
1. Das System berechnet die Statistik-Badges weiterhin auf Basis aller
   geladenen Spieler, unabhängig von aktiven Filtern (siehe BR-001).

Use case continues at step 5.

## Postconditions

### Success

- Die drei Statistik-Badges (Gesamt, Verfügbar, Gedraftet) spiegeln
  korrekt den aktuellen Zustand der vollständigen, geladenen Spielerliste
  wider.
- Es gilt: Verfügbar + Gedraftet = Gesamt.

### Failure

- Es konnten keine Rankings geladen werden (siehe UC-001, AF-1); es werden
  keine sinnvollen Statistik-Badges angezeigt (0/0/0).

## Business Rules

- **BR-001:** Die Statistik-Badges basieren stets auf der vollständigen
  geladenen Spielerliste, nicht auf der durch UC-003 gefilterten
  Teilmenge.
- **BR-002:** "Verfügbar" ergibt sich als Gesamtzahl minus "Gedraftet"; ein
  Spieler gilt genau dann als "Gedraftet", wenn ihm in UC-002 ein
  Sleeper-Pick eindeutig zugeordnet wurde.
