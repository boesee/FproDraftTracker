# FantasyPros Data Extractor

Ein leistungsstarkes Tool zur schnellen und komfortablen Extraktion von FantasyPros-Spielerdaten für deinen Fantasy Football Draft Tracker.

## Funktionen

- **Automatische Extraktion:** Hole mit einem Klick alle relevanten Spielerinformationen von FantasyPros-Ranking-Seiten.
- **JSON-Export:** Lade die extrahierten Daten direkt als JSON-Datei herunter und importiere sie in deinen Draft Tracker.
- **Clipboard-Support:** Die Daten werden nach der Extraktion zusätzlich automatisch in die Zwischenablage kopiert (sofern vom Browser unterstützt).
- **Filter und Sortierung:** Importierte Daten können im Draft Tracker gefiltert, durchsucht und sortiert werden.
- **Integration mit Sleeper API:** Optionales Matching mit deinem Sleeper-Draft.

## Installation

### ECR Daten Laden (Empfohlen)

1. Lade die ECR Daten aus der App mittels Button
2. Die Datei wird stündlich aktualisiert und kann einfach überschrieben werden

### Browser Extension (Alternative)

1. Klone oder lade dieses Repository herunter.
2. Öffne deinen Browser:
   - **Chrome:** Gehe zu `chrome://extensions/`, aktiviere den Entwicklermodus, wähle "Entpackte Erweiterung laden" und öffne den Ordner dieses Repos.
   - **Firefox:** Gehe zu `about:debugging`, klicke auf "Temporäres Add-on laden" und wähle die `manifest.json` Datei.
3. Folge den Anweisungen im Popup, um Daten zu extrahieren.

### Bookmarklet (Alternative)

1. Kopiere den bereitgestellten Bookmarklet-Code aus der App.
2. Lege ein neues Lesezeichen in deinem Browser an und füge den Code als URL ein.
3. Klicke das Lesezeichen auf einer FantasyPros-Rankings-Seite.

## Anleitung

1. Starte den Tracker
2. Klicke auf Spielerdaten laden
3. Importiere die Spielerdaten in den Draft Tracker
4. Optional: gleiche die Spielerdaten mit deinem Sleeper ab

## Unterstützte Datenfelder

- Rang (`rank`)
- Spielername (`player_name`)
- Position (`position`)
- Team (`team`)
- Gegner (`opponent`)
- Matchup (`matchup`)
- Draft-Status (optional durch Integration mit Sleeper)

## Sicherheit & Datenschutz

- Die Erweiterung läuft **ausschließlich lokal** in deinem Browser.
- Es werden keine Daten an externe Server übertragen.

## Mitwirken

Du hast Ideen oder möchtest Fehler melden?  
Erstelle ein Issue oder einen Pull Request!

---

**Viel Erfolg beim Draft!**