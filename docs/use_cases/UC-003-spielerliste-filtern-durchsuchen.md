# UC-003: Spielerliste filtern/durchsuchen

## Overview

- **Use Case ID:** UC-003
- **Primary Actor:** Fantasy-Football-Manager
- **Goal:** Der Fantasy-Football-Manager schränkt die angezeigte
  Spielerliste über Filter- und Suchkriterien ein, um sich auf die für
  seinen nächsten Pick relevanten Spieler zu konzentrieren.
- **Status:** Draft
- **Bezug:** FR-003, FR-004, FR-005, FR-006; Entität `PLAYER`.

## Preconditions

- UC-001 wurde bereits ausgeführt; die Rankings-Liste ist geladen und
  angezeigt.

## Main Success Scenario

1. Der Fantasy-Football-Manager wählt in der Pills-Wrap-Navigation über der
   Tabelle eine Position ("Overall", "QB", "RB", "WR" oder "Flex";
   "Overall" ist beim Laden aktiv).
2. Das System filtert die angezeigte Tabelle auf Spieler, deren Position
   der Auswahl entspricht (siehe BR-003 für "Flex"), und sortiert sie neu
   (siehe BR-006).
3. Das System behält die Statistik-Badges unverändert bei, da diese sich
   stets auf die Gesamtliste beziehen (siehe UC-004).
4. Der Fantasy-Football-Manager sieht in der Tabelle nur noch Spieler der
   gewählten Position, nach der dafür jeweils passenden Rangliste sortiert.

## Alternative Flows

### AF-1: Nach Draft-Status filtern

- **Trigger:** (step 1) Der Fantasy-Football-Manager wählt zusätzlich oder
  stattdessen den Draft-Status "Verfügbar" oder "Gedraftet".
1. Das System zeigt in der Tabelle nur Spieler mit dem gewählten
   Draft-Status.

Use case continues at step 4.

### AF-2: Volltextsuche verwenden

- **Trigger:** (step 1) Der Fantasy-Football-Manager gibt zusätzlich oder
  stattdessen einen Suchbegriff ein.
1. Erkennt das System die Syntax `spalte:wert` (siehe BR-002), filtert es
   gezielt auf die angegebene Spalte — inklusive des maximalen Rangs
   (`rank:wert`, siehe BR-005) und des Verletzungsstatus
   (`injury:wert`, siehe BR-002).
2. Andernfalls durchsucht das System alle Spaltenwerte jedes Spielers nach
   dem Suchbegriff (siehe BR-001).

Use case ends.

## Postconditions

### Success

- Die angezeigte Tabelle enthält nur Spieler, die allen aktiven
  Filterkriterien entsprechen (siehe BR-004).
- Aktive Filterkriterien bleiben sichtbar eingestellt, bis der Manager sie
  ändert. Eine dedizierte Rücksetzen-Aktion ("Filter zurücksetzen")
  existiert bewusst nicht mehr: mit dem Wegfall der Position als
  Dropdown-Filter (jetzt Pills-Wrap-Navigation) und des Rang-Filters als
  eigenständiges Feld (jetzt `rank:`-Suchtoken) lässt sich jedes
  verbleibende Kriterium einzeln und direkt zurücksetzen (Positions-Pill
  "Overall" anklicken, Draft-Status auf "Alle Spieler", Suchfeld leeren)
  — ein separater Button dafür wäre überflüssig.

### Failure

- Ein ungültiger Wert bei `rank:` (z. B. nicht-numerisch, "rank:abc") wird
  ignoriert und bleibt wirkungslos, ohne dass eine Fehlermeldung erscheint
  (siehe BR-005); der Manager erhält dadurch kein Feedback, warum dieses
  Kriterium nicht greift.

## Business Rules

- **BR-001:** Ist keine `spalte:wert`-Syntax erkannt, wird der Suchbegriff
  (case-insensitive) gegen die String-Repräsentation aller Felder eines
  Spielers geprüft; ein Treffer in einem beliebigen Feld genügt.
- **BR-002:** Ein Suchbegriff der Form `spalte:wert` (z. B. "team:phi")
  filtert ausschließlich auf das benannte Feld. Existiert dieses Feld bei
  einem Spieler nicht, gilt der Spieler für diese Suche als nicht
  passend (kein Treffer) — es erfolgt kein Rückfall auf die
  Volltextsuche. Einige Spaltennamen sind lesbarer benannt als das
  zugrunde liegende `PLAYER`-Feld: `injury:` durchsucht
  `injuryStatusShort` (z. B. "injury:q" für alle mit Status
  "Questionable"). Unterstützte Spalten (nicht abschliessend, jede
  weitere `PLAYER`-Eigenschaft funktioniert ebenfalls): `team`,
  `position`, `opponent`, `rank` (siehe BR-005, abweichende Semantik),
  `injury`.
- **BR-003:** Die Positions-Pill "Flex" schließt alle Spieler ein, deren
  Position RB, WR oder TE enthält (auch bei Mehrfachpositionen wie
  "RB/WR").
- **BR-004:** Alle aktiven Filterkriterien (Positions-Pill, Draft-Status,
  Suche) werden mit logischem UND kombiniert.
- **BR-005:** `rank:wert` ist kein Substring-Abgleich wie die übrigen
  `spalte:wert`-Suchen (BR-002), sondern filtert numerisch auf Spieler mit
  `rank` kleiner oder gleich dem angegebenen Wert ("maximaler Rang") — er
  bezieht sich dabei stets auf den Overall-Rang, unabhängig von der
  aktiven Positions-Pill. Ein nicht-numerischer Wert (z. B. "rank:abc")
  wird ignoriert; dieses Kriterium bleibt dann wirkungslos, ohne die
  übrigen Filter zu beeinflussen.
- **BR-006:** Bei aktiver "QB"-, "RB"- oder "WR"-Pill zeigt und sortiert
  das System nach dem positionsspezifischen Rang dieser Position (z. B.
  "QB1", "QB2", ... statt des Overall-Rangs); bei "Overall" und "Flex"
  bleiben Anzeige und Sortierung beim Overall-Rang (`rank`), da für "Flex"
  keine eigene, positionsübergreifende Rangliste vorliegt — die
  FantasyPros-API liefert nur einzelne Positionsränge (QB/RB/WR/TE) sowie
  den Overall-Rang (OP), keinen dedizierten Flex-Rang.
