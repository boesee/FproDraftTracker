# FproDraftTracker

**Fantasy Football Draft Tracker**
Tracke deinen Fantasy Football Draft mit aktuellen FantasyPros-Rankings und Sleeper API-Integration.

---

## Features

- **Automatisches Laden** der aktuellen Rankings aus `data/rankings.json`
- **Aktualitäts-Banner**, der anzeigt, wann die Rankings zuletzt mit der FantasyPros-API synchronisiert wurden
- **Ranking/Scoring-Auswahl**: macht transparent, dass es sich aktuell um ein Wochen-Ranking mit PPR-Scoring handelt (Woche/Saison als Hinweistext); als Auswahlfelder angelegt, erweiterbar auf weitere Ranking-Typen/Scoring-Formate
- **Positions-Pills** (Overall/QB/RB/WR/Flex, FantasyPros-Style): wechseln zwischen der Overall- und den positionsspezifischen Ranglisten
- **"Mein Team"-Pill**: zeigt nur die eigenen gedrafteten Spieler, nach Position gruppiert statt nach Rang sortiert (erfordert Draft-Abgleich und `sleeperUserId` in `config/app.json`)
- **Draft-Abgleich** über die Sleeper-API anhand einer Draft-ID
- **Filter & Suche**: maximaler Rang, Draft-Status (erst nach Draft-Abgleich verfügbar), Volltextsuche (inkl. `spalte:wert`-Syntax)
- **Statistik-Übersicht**: Spieler gesamt / gematched / ROS-Fallback / verfügbar / gedraftet
- **Gegner** pro Spieler (ESPN Scoreboard API), optional ein **Matchup-Rating** (Sterne), und ein **Verletzungsstatus-Tag** (FantasyPros Injuries API)
- Responsive UI auf Basis von [Pico CSS](https://picocss.com/)

Die Rankings werden nicht mehr gescraped, sondern über einen GitHub-Actions-Workflow
([`update-rankings.yml`](.github/workflows/update-rankings.yml)) periodisch direkt von der
offiziellen FantasyPros-API bezogen. Details dazu und zur restlichen Architektur stehen in
[`docs/architecture.md`](docs/architecture.md).

---

## Nutzung

1. **Seite öffnen:** Die Datei `data/rankings.json` wird automatisch geladen und angezeigt.
2. **Draft abgleichen:** Sleeper-Draft-ID eingeben und auf „Draft-Daten laden“ klicken, um gedraftete
   Spieler zu markieren. Ist in `config/app.json` unter `draftIds` ein Eintrag für die aktuell
   geladene Woche hinterlegt, wird das Feld beim Laden der Seite vorbefüllt (siehe unten) - der
   Abgleich selbst erfolgt weiterhin erst per Klick.
3. **Ranking wechseln:** Über die Pills-Navigation ("Overall", "QB", "RB", "WR", "Flex", "Mein Team")
   über der Tabelle zwischen Overall-, positionsspezifischer Rangliste und der eigenen gedrafteten
   Mannschaft wechseln. "Mein Team" ist erst nach dem Draft-Abgleich (Schritt 2) und nur mit
   konfigurierter `sleeperUserId` (siehe unten) verfügbar.
4. **Filtern/Suchen:** Über den Filterbereich nach Rang oder Draft-Status einschränken, oder die Suche
   nutzen (z. B. `team:phi`).

### `config/app.json`

Optionale, von Hand gepflegte Konfiguration:

```json
{
  "draftIds": {
    "1": "1265036873886076928",
    "2": "1265036873886076929"
  },
  "sleeperUsername": "dein-sleeper-username",
  "sleeperUserId": "555361572189896704",
  "season": null,
  "week": null
}
```

- `draftIds`: pro Woche eine eigene Sleeper-Draft-ID (Schlüssel = Wochennummer als String) - praktisch
  bei einer wöchentlichen Redraft-Liga mit jede Woche neuem Draft. Beim Laden wird die ID für die
  Woche vorbefüllt, für die die gerade geladenen Rankings tatsächlich gelten (`data/rankings.json`,
  Feld `week`) - nicht irgendeine separat berechnete Woche. Fehlt für die aktuelle Woche ein Eintrag,
  bleibt das Feld leer. Der Draft-Abgleich selbst löst dadurch **nicht** automatisch aus -
  "Draft-Daten laden" muss weiterhin manuell geklickt werden.
- `sleeperUserId`: deine Sleeper `user_id`, Grundlage der "Mein Team"-Pill (vergleicht sie gegen
  `picked_by` in den Draft-Picks - bewusst nicht `roster_id`, die in dieser Liga pro Draft neu vergeben
  wird). `sleeperUsername` wird vom Code nicht verwendet, steht nur als lesbare Referenz daneben.
- `season`/`week`: überschreiben bei Bedarf die von der Pipeline automatisch berechneten Werte;
  `null` heisst "automatisch berechnen" (Standard). Details siehe
  [`docs/architecture.md`](docs/architecture.md#konfiguration-configappjson).

### `config/matchup-ratings.json` (optional)

FantasyPros' Matchup-Rating erfordert einen eingeloggten Account und ist über keine API verfügbar
(siehe [`docs/architecture.md`](docs/architecture.md#matchup-rating-manuell-gepflegte-ausnahme)).
Um es trotzdem nutzen zu können, ohne Zugangsdaten zu automatisieren, wird es manuell gepflegt:

1. [`ppr-superflex.php`](https://www.fantasypros.com/nfl/rankings/ppr-superflex.php) eingeloggt öffnen.
2. Browser-Konsole öffnen und ausführen: `copy(JSON.stringify(advancedMetrics))`
3. Ergebnis in `config/matchup-ratings.json` ab Zeile 2 einfügen (Zeile 1 ist ein Kommentar mit genau
   diesem Befehl) und committen.

Fehlt die Datei oder ist sie veraltet, bleibt das Matchup-Rating in der App einfach leer.

---

## Entwicklung & Setup

1. **Repository klonen:**
   ```sh
   git clone https://github.com/boesee/FproDraftTracker.git
   ```
2. **Lokalen Webserver starten** (z. B. mit Python):
   ```sh
   python -m http.server
   ```
   und `http://localhost:8000` im Browser öffnen.

   Für die lokale Entwicklung wird eine `data/rankings.json` benötigt (siehe
   [`docs/entity_model.md`](docs/entity_model.md) für das Format); ohne diese Datei zeigt die App den
   entsprechenden Fehlerzustand.

3. **Dateien in `/js/`, `/css/` und `index.html` nach Bedarf anpassen.** Ein Überblick über die
   Repository-Struktur (inkl. `config/`, `data/`, `scripts/lib/`) steht in
   [`docs/architecture.md`](docs/architecture.md#repository-struktur-übersicht).

### Tests

Unit-Tests (Node's eingebauter Test-Runner, keine Abhängigkeiten) für die reine Logik in `js/` und
`scripts/lib/` (Filter/Suche, Statistik, Freshness-Berechnung, Namensabgleich, FantasyPros-Mapping,
ESPN-Gegner-Mapping, Verletzungsstatus-Mapping, HTML-Entity-Decoding):

```sh
npm test
```

### Rankings-Pipeline (GitHub Actions)

Der Workflow [`update-rankings.yml`](.github/workflows/update-rankings.yml) benötigt zwei
Repository-Secrets (Settings → Secrets and variables → Actions):

- `FANTASYPROS_API_KEY` – API-Key für die FantasyPros-API
- `GH_TOKEN` – Personal Access Token mit Schreibrechten, um `data/rankings.json` zu committen

---

## Projektdokumentation

Der Rebuild folgt dem [AI Unified Process](https://unifiedprocess.ai/) (AIUP); die Artefakte liegen in
[`docs/`](docs/): [`vision.md`](docs/vision.md), [`architecture.md`](docs/architecture.md),
[`requirements.md`](docs/requirements.md), [`entity_model.md`](docs/entity_model.md),
[`use_cases.puml`](docs/use_cases.puml) und die Detail-Specs in [`docs/use_cases/`](docs/use_cases/).

---

## Lizenz

MIT
