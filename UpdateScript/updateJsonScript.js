/**
 * UpdateScript: "upside" und "bust" aus Tracker-Daten (data1) auf FPro-Daten (data2) übertragen
 * 
 * Workflow:
 * 1. Extrahiere data1 aus deinem Tracker im Browser (window.draftTracker.allPlayers)
 * 2. Kopiere dein FPro-JSON als Text in die Variable data2Text unten (inkl. eckiger Klammern!)
 * 3. Führe dieses Script in der Konsole aus
 * 4. Das aktualisierte JSON ist in der Zwischenablage
 */

// === Schritt 1: Füge hier dein FPro-JSON ein ===
const data2Text = `PASTE_HIER_DEIN_DATA2_JSON_TEXT`;

// === Schritt 2: Tracker-Daten übernehmen ===
const data1 = window.draftTracker.allPlayers;

// === Schritt 3: data1 bereinigen (unerwünschte Properties entfernen) ===
function removeUnwantedProperties(players) {
  return players.map(({ drafted, draftInfo, matchReason, ...rest }) => rest);
}
const cleanedData1 = removeUnwantedProperties(data1);

// === Schritt 4: Index für schnellen Zugriff auf data1 nach Spielername ===
const data1Map = Object.fromEntries(cleanedData1.map(player => [player.player_name, player]));

// === Schritt 5: data2 als Array parsen ===
let data2;
try {
  data2 = JSON.parse(data2Text);
} catch (e) {
  alert("Fehler beim Parsen von data2Text: " + e.message);
  throw e;
}

// === Schritt 6: data2 mit "upside" und "bust" aus data1 updaten ===
const updatedData2 = data2.map(player => ({
  ...player,
  upside: data1Map[player.player_name]?.upside ?? player.upside,
  bust: data1Map[player.player_name]?.bust ?? player.bust
}));

// === Schritt 7: Ergebnis in die Zwischenablage kopieren ===
copy(JSON.stringify(updatedData2, null, 2));

/**
 * Hinweise:
 * - "allow paste" muss ggf. aktiviert werden in der Konsole
 * - Kopiere dein FPro-JSON komplett (inklusive [ ... ]) in data2Text.
 * - "player_name" muss in beiden Datensätzen eindeutig und identisch sein!
 * - Das aktualisierte JSON befindet sich nach Ausführung in deiner Zwischenablage.
 */
