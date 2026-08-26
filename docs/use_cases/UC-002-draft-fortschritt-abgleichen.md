# UC-002: Draft-Fortschritt abgleichen

## Overview

- **Use Case ID:** UC-002
- **Primary Actor:** Fantasy-Football-Manager
- **Goal:** Der Fantasy-Football-Manager gibt seine Sleeper-Draft-ID ein und
  sieht anschließend, welche Spieler aus der Rankings-Liste bereits
  gedraftet wurden.
- **Status:** Draft
- **Bezug:** FR-002, FR-009 (via UC-005, `<<extend>>`), NFR-002; C-006;
  Entitäten `DRAFT`, `DRAFT_PICK`, `PLAYER` (abgeleitete Match-Beziehung,
  siehe entity_model.md).

## Preconditions

- UC-001 wurde bereits erfolgreich ausgeführt; die Rankings-Liste ist
  geladen.
- Der Fantasy-Football-Manager kennt seine Sleeper-Draft-ID.

## Main Success Scenario

1. Der Fantasy-Football-Manager gibt seine Sleeper-Draft-ID ein.
2. Der Fantasy-Football-Manager löst den Abgleich aus.
3. Das System ruft die Draft-Picks dieser Draft-ID über die Sleeper-API ab.
4. Das System gleicht jeden Pick anhand des normalisierten Spielernamens
   (Vor- und Nachname) mit den Spielern der Rankings-Liste ab (siehe
   BR-001 bis BR-005).
5. Das System markiert jeden eindeutig zugeordneten Spieler als
   "gedraftet" und aktualisiert Statusanzeige und Statistik (siehe
   UC-004).
6. Der Fantasy-Football-Manager sieht, welche Spieler aus der
   Rankings-Liste bereits gedraftet und welche noch verfügbar sind.

## Alternative Flows

### AF-1: Rankings noch nicht geladen

- **Trigger:** (step 2) Es sind noch keine Spielerdaten aus UC-001
  geladen.
1. Das System zeigt einen Hinweis, dass zuerst die Rankings geladen
   werden müssen (siehe UC-005).

Use case ends.

### AF-2: Ungültige oder unbekannte Draft-ID

- **Trigger:** (step 3) Die Sleeper-API liefert für die eingegebene
  Draft-ID keine gültige Liste von Picks (z. B. Fehlerstatus oder
  unerwartetes Antwortformat).
1. Das System zeigt eine Fehlermeldung, dass die Draft-ID ungültig ist
   oder keine Daten gefunden wurden (siehe UC-005).

Use case ends.

### AF-3: Name kann nicht eindeutig zugeordnet werden

- **Trigger:** (step 4) Für einen Draft-Pick findet sich nach Anwendung
  von BR-001 bis BR-004 kein eindeutig übereinstimmender Spieler in der
  Rankings-Liste (z. B. abweichende Schreibweise über die definierten
  Normalisierungsregeln hinaus).
1. Das System lässt diesen Pick unberücksichtigt; der betroffene Spieler
   bleibt in der Rankings-Liste als "verfügbar" markiert (siehe BR-005).

Use case continues at step 5.

## Postconditions

### Success

- Jeder Sleeper-Pick, für den ein eindeutiger Namens-Treffer gefunden
  wurde, ist in der Rankings-Liste als "gedraftet" markiert.
- Die Statistik (UC-004) spiegelt die aktualisierte Anzahl verfügbarer und
  gedrafteter Spieler wider.

### Failure

- Es konnten keine Draft-Picks geladen werden; der Draft-Status aller
  Spieler bleibt unverändert (weiterhin "verfügbar").

## Business Rules

- **BR-001:** Zum Namensabgleich werden Vor- und Nachname beider Quellen
  (FantasyPros: `first_name`/`last_name`; Sleeper: `first_name`/
  `last_name`) getrennt normalisiert und verglichen; ein Treffer liegt vor,
  wenn normalisierter Vor- UND Nachname übereinstimmen, oder alternativ der
  vollständig normalisierte Gesamtname übereinstimmt.
- **BR-002:** Die Normalisierung entfernt Groß-/Kleinschreibungsunterschiede,
  führende/folgende Leerzeichen sowie Satzzeichen (z. B. Punkte,
  Apostrophe).
- **BR-003:** Generationssuffixe ("Jr.", "Sr.", "II", "III", "IV", "V")
  werden vor dem Vergleich aus dem Nachnamen entfernt, sodass z. B.
  "Marvin Harrison Jr." und "Marvin Harrison" als derselbe Spieler erkannt
  werden.
- **BR-004:** Bindestrich-Nachnamen (z. B. "Smith-Njigba") werden nach
  Entfernen aller Nicht-Wortzeichen verglichen, sodass Schreibweisen mit
  und ohne Bindestrich bzw. mit Leerzeichen statt Bindestrich (z. B.
  "Smith Njigba") als gleich erkannt werden.
- **BR-005:** Führt die Normalisierung gemäß BR-001 bis BR-004 zu keinem
  eindeutigen Treffer, gilt der betroffene Spieler weiterhin als
  "verfügbar"; es findet kein darüber hinausgehendes Fuzzy-Matching statt
  (siehe AF-3).
