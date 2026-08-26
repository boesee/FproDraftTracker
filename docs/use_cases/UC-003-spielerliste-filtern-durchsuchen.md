# UC-003: Spielerliste filtern/durchsuchen

## Overview

- **Use Case ID:** UC-003
- **Primary Actor:** Fantasy-Football-Manager
- **Goal:** Der Fantasy-Football-Manager schränkt die angezeigte
  Spielerliste über Filter- und Suchkriterien ein, um sich auf die für
  seinen nächsten Pick relevanten Spieler zu konzentrieren.
- **Status:** Draft
- **Bezug:** FR-003, FR-004, FR-005, FR-006, FR-007; Entität `PLAYER`.

## Preconditions

- UC-001 wurde bereits ausgeführt; die Rankings-Liste ist geladen und
  angezeigt.

## Main Success Scenario

1. Der Fantasy-Football-Manager wählt im Filterbereich eine Position
   (z. B. "RB").
2. Das System filtert die angezeigte Tabelle auf Spieler, deren Position
   der Auswahl entspricht (siehe BR-003 für "FLEX").
3. Das System behält die Statistik-Badges unverändert bei, da diese sich
   stets auf die Gesamtliste beziehen (siehe UC-004).
4. Der Fantasy-Football-Manager sieht in der Tabelle nur noch Spieler der
   gewählten Position.

## Alternative Flows

### AF-1: Nach maximalem Rang filtern

- **Trigger:** (step 1) Der Fantasy-Football-Manager gibt zusätzlich oder
  stattdessen einen maximalen Rang ein.
1. Das System zeigt in der Tabelle nur Spieler mit `rank` kleiner oder
   gleich dem eingegebenen Wert.

Use case continues at step 4.

### AF-2: Nach Draft-Status filtern

- **Trigger:** (step 1) Der Fantasy-Football-Manager wählt zusätzlich oder
  stattdessen den Draft-Status "Verfügbar" oder "Gedraftet".
1. Das System zeigt in der Tabelle nur Spieler mit dem gewählten
   Draft-Status.

Use case continues at step 4.

### AF-3: Volltextsuche verwenden

- **Trigger:** (step 1) Der Fantasy-Football-Manager gibt zusätzlich oder
  stattdessen einen Suchbegriff ein.
1. Erkennt das System die Syntax `spalte:wert` (siehe BR-002), filtert es
   gezielt auf die angegebene Spalte.
2. Andernfalls durchsucht das System alle Spaltenwerte jedes Spielers nach
   dem Suchbegriff (siehe BR-001).

Use case continues at step 4.

### AF-4: Filter zurücksetzen

- **Trigger:** (step 4) Mindestens ein Filter- oder Suchkriterium ist
  aktiv.
1. Der Fantasy-Football-Manager löst "Filter zurücksetzen" aus.
2. Das System setzt Position, maximalen Rang, Draft-Status und Suchfeld
   zurück und zeigt wieder die vollständige Spielerliste.

Use case ends.

## Postconditions

### Success

- Die angezeigte Tabelle enthält nur Spieler, die allen aktiven
  Filterkriterien entsprechen (siehe BR-004).
- Aktive Filterkriterien bleiben sichtbar eingestellt, bis der Manager sie
  ändert oder zurücksetzt (AF-4).

### Failure

- Ein ungültiger Wert im Rang-Filter (z. B. nicht-numerisch) wird ignoriert
  und bleibt wirkungslos, ohne dass eine Fehlermeldung erscheint (siehe
  BR-005); der Manager erhält dadurch kein Feedback, warum dieses Kriterium
  nicht greift.

## Business Rules

- **BR-001:** Ist keine `spalte:wert`-Syntax erkannt, wird der Suchbegriff
  (case-insensitive) gegen die String-Repräsentation aller Felder eines
  Spielers geprüft; ein Treffer in einem beliebigen Feld genügt.
- **BR-002:** Ein Suchbegriff der Form `spalte:wert` (z. B. "team:phi")
  filtert ausschließlich auf das benannte Feld. Existiert dieses Feld bei
  einem Spieler nicht, gilt der Spieler für diese Suche als nicht
  passend (kein Treffer) — es erfolgt kein Rückfall auf die
  Volltextsuche.
- **BR-003:** Die Positionsauswahl "FLEX" schließt alle Spieler ein, deren
  Position RB, WR oder TE enthält (auch bei Mehrfachpositionen wie
  "RB/WR").
- **BR-004:** Alle aktiven Filterkriterien (Position, maximaler Rang,
  Draft-Status, Suche) werden mit logischem UND kombiniert.
- **BR-005:** Ein nicht-numerischer Wert im Rang-Filter wird ignoriert;
  dieses Kriterium bleibt dann wirkungslos, ohne die übrigen Filter zu
  beeinflussen.
