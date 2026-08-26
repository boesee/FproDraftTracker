# Vision: FproDraftTracker

## Mission

Fantasy-Football-Manager sollen während eines laufenden Live-Drafts (z. B. auf
Sleeper) jederzeit sehen, welche Spieler gemäß den aktuellen FantasyPros
Expert Consensus Rankings (ECR) noch verfügbar sind, um bessere
Draft-Entscheidungen zu treffen. Die bisherige, instabile Datenbeschaffung per
Web-Scraping (Puppeteer gegen die FantasyPros-Website) entfällt: Rankings
werden künftig über die offizielle FantasyPros-API bezogen, wodurch die App
robuster, aktueller und wartungsärmer wird.

## Target users

- **Fantasy-Football-Manager** während eines Live-Drafts, die aktuelle
  Experten-Rankings mit dem Draft-Fortschritt abgleichen wollen, um zu sehen,
  wer noch verfügbar ist.
- **Liga-Commissioners / Co-Manager**, die parallel mehrere Teams oder den
  Gesamtverlauf eines Drafts im Blick behalten wollen.

## Goals

- Die bisherige Puppeteer-Scraping-Pipeline wird vollständig durch die
  offizielle FantasyPros-API ersetzt (keine Skripte mehr, die HTML-Seiten
  parsen).
- Rankings lassen sich jederzeit auf Knopfdruck neu laden, statt nur aus einer
  statisch im Repository eingecheckten JSON-Datei.
- Der Wartungsaufwand sinkt, da Änderungen am FantasyPros-Frontend die App
  nicht mehr betreffen (kein HTML-Scraping mehr, das brechen kann).
- Die bestehende Kernfunktionalität (Draft-Abgleich über Sleeper, Filter,
  Suche) bleibt für Nutzer mindestens gleichwertig erhalten.

## Scope

### In scope

- Laden der aktuellen ECR-Rankings (z. B. PPR/Superflex) über die
  FantasyPros-API.
- Abgleich der Rankings mit dem Draft-Fortschritt über die Sleeper-API anhand
  einer Draft-ID.
- Filter- und Suchfunktionen wie im Vorgängerprodukt: Position, maximaler
  Rang, Draft-Status (verfügbar/gedraftet), Volltextsuche inkl.
  Spalten-Syntax (`spalte:wert`).
- Übersichtstabelle mit Live-Statistiken (Spieler gesamt / verfügbar /
  gedraftet).
- Manueller JSON-Upload als Fallback, falls die API nicht erreichbar ist.

### Out of scope

- Unterstützung anderer Draft-Plattformen als Sleeper (vorerst).
- Eigene Nutzerkonten oder Login-System.
- Native Mobile-App (nur responsives Web).
- Automatisierte Pick-Empfehlungen oder KI-gestützte Draftstrategie
  (mögliche spätere Ausbaustufe, nicht Teil dieses Rebuilds).

## Constraints

- Die FantasyPros-API erfordert eine gültige Zugangsberechtigung (API-Key
  bzw. Abonnement); genaue Anforderungen werden in der Requirements-Phase
  geklärt.
- Erlaubt die FantasyPros-API keinen direkten Browser-Zugriff (CORS), ist ein
  minimaler Backend-/Proxy-Baustein zur Weiterleitung der Anfragen
  erforderlich; andernfalls bleibt die App wie bisher rein clientseitig.
- Die Sleeper-API bleibt öffentlich und ohne Authentifizierung nutzbar wie im
  bisherigen Produkt.
- Die Benutzeroberfläche bleibt deutschsprachig, analog zum bisherigen
  Produkt.
- API-Zugangsdaten dürfen nicht im Frontend-Code oder im Repository landen.

## Success measures

- Während eines laufenden Drafts kann ein Nutzer aktuelle Rankings laden,
  ohne eine Datei manuell hochladen zu müssen.
- Es ist kein manueller Scraping-Lauf mehr nötig, um die Ranking-Daten aktuell
  zu halten.
- Die bisherige Kernfunktionalität (Filter, Suche, Draft-Abgleich über
  Sleeper) ist nach dem Rebuild vollständig nutzbar.
