# FproDraftTracker

**Fantasy Football Draft Tracker**  
Tracke deinen Fantasy Football Draft mit aktuellen FantasyPros-Daten und Sleeper API-Integration.

---

## Features

- **Automatisches Laden** von `data/ecrData.json` beim Start der Applikation
- **Manuelles Hochladen** einer eigenen JSON-Datei als Notfall-Lösung (über "JSON manuell hochladen"-Button)
- Integration von FantasyPros und Sleeper API für Draft-Daten
- Responsive UI für deinen Draft

---

## Nutzung

1. **Starte die Applikation:**  
   Die Datei `data/ecrData.json` wird automatisch geladen.

2. **JSON manuell hochladen:**  
   Klicke auf den Button „JSON manuell hochladen“.  
   Wähle deine eigene JSON-Datei aus.  
   Die Daten werden sofort übernommen.

---

## Entwicklung & Setup

1. **Clone das Repository:**
   ```sh
   git clone https://github.com/boesee/FproDraftTracker.git
   ```
2. **Starte einen lokalen Webserver (z. B. mit Python):**
   ```sh
   python -m http.server
   ```
   und öffne `http://localhost:8000` im Browser.

3. **Bearbeite die Dateien in `/js/`, `/data/` und `/css/` nach Bedarf.**

---

## Lizenz

MIT