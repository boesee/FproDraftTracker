# FproDraftTracker

**Fantasy Football Draft Tracker**
Tracke deinen Fantasy Football Draft mit aktuellen FantasyPros-Rankings und Sleeper API-Integration.

---

## Features

- **Automatisches Laden** der aktuellen Rankings aus `data/rankings.json`
- **Aktualitäts-Banner**, der anzeigt, wann die Rankings zuletzt mit der FantasyPros-API synchronisiert wurden
- **Draft-Abgleich** über die Sleeper-API anhand einer Draft-ID
- **Filter & Suche**: Position, maximaler Rang, Draft-Status, Volltextsuche (inkl. `spalte:wert`-Syntax)
- **Statistik-Übersicht**: Spieler gesamt / verfügbar / gedraftet
- Responsive UI auf Basis von [Pico CSS](https://picocss.com/)

Die Rankings werden nicht mehr gescraped, sondern über einen GitHub-Actions-Workflow
([`update-rankings.yml`](.github/workflows/update-rankings.yml)) periodisch direkt von der
offiziellen FantasyPros-API bezogen. Details dazu und zur restlichen Architektur stehen in
[`docs/architecture.md`](docs/architecture.md).

---

## Nutzung

1. **Seite öffnen:** Die Datei `data/rankings.json` wird automatisch geladen und angezeigt.
2. **Draft abgleichen:** Sleeper-Draft-ID eingeben und auf „Draft-Daten laden“ klicken, um gedraftete
   Spieler zu markieren. Ist in `config.json` eine `draftId` hinterlegt, geschieht das automatisch
   beim Laden der Seite (siehe unten).
3. **Filtern/Suchen:** Über den Filterbereich nach Position, Rang oder Draft-Status einschränken, oder
   die Suche nutzen (z. B. `team:phi`).

### `config.json`

Optionale, von Hand gepflegte Konfiguration im Repository-Root:

```json
{
  "draftId": "1265036873886076928",
  "season": null,
  "week": null
}
```

- `draftId`: wird beim Laden vorbefüllt und löst den Draft-Abgleich automatisch aus. Praktisch, wenn
  du wöchentlich dieselbe Draft-ID verwendest.
- `season`/`week`: überschreiben bei Bedarf die von der Pipeline automatisch berechneten Werte;
  `null` heisst "automatisch berechnen" (Standard). Details siehe
  [`docs/architecture.md`](docs/architecture.md#konfiguration-configjson).

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

3. **Dateien in `/js/`, `/css/` und `index.html` nach Bedarf anpassen.**

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
