# hla_translation_tool
# 🎮 Half‑Life: Alyx Translation Tool

![Half‑Life: Alyx Translation Tool](https://img.shields.io/badge/Version-1.34.5-green?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Offline](https://img.shields.io/badge/Offline-Ready-green?style=for-the-badge)

Eine vollständige **Offline‑Web‑App** zum Verwalten und Übersetzen aller Audio‑Zeilen aus *Half‑Life: Alyx*.

---

## 📋 Inhaltsverzeichnis
* [Changelog](CHANGELOG.md)
* [🚀 Features (komplett)](#-features-komplett)
* [🛠️ Installation](#-installation)
* [ElevenLabs-Dubbing](#elevenlabs-dubbing)
* [🏁 Erste Schritte](#-erste-schritte)
* [🎮 Bedienung](#-bedienung)
* [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
* [📥 Import](#-import)
* [📁 Ordner-Management](#-ordner-management)
* [🔧 Erweiterte Funktionen](#-erweiterte-funktionen)
* [🐛 Troubleshooting](#-troubleshooting)
---

## 🚀 Features (komplett)

### 🎯 Kernfunktionen

* **Mehrere Projekte** mit Icon, Farbe, Level‑Namen & Teil‑Nummer
* **Intelligenter Ordner‑Scan** mit Duplikat‑Prävention und Auto‑Normalisierung
* **Eingebettete Audio‑Wiedergabe** (MP3 / WAV / OGG) direkt im Browser
* **Live‑Statistiken:** EN‑%, DE‑%, Completion‑%, Globale Textzahlen (EN/DE/BEIDE/∑)
* **Vollständig offline** – keine Server, keine externen Abhängigkeiten

### 📊 Fortschritts‑Tracking

* **Globale Dashboard‑Kacheln:** Gesamt, Übersetzt, Ordner komplett, **EN/DE/BEIDE/∑**
* **Level‑Statistik‑Panel** (aufklappbar im Ordner‑Browser)
* **Projekt‑übergreifende Fortschrittsanzeige:** Dateien und Dashboard zeigen Status über alle Projekte
* **Grüne Rahmen** für **100 %**‑Projekte & vollständig übersetzte Ordner
* **Dateizeilen‑Badges:** Übersetzt / Ignoriert / Offen

### 📁 Ordner‑Management

* **Folder‑Browser** mit Icons, Such‑ & Filter‑Funktionen
* **Pfad‑Anzeige:** Jede Datei zeigt aufgelösten Pfad mit Status
* **Ignorieren‑Toggle** für unnötige Audios (🚫 Ignorieren / ↩ Wieder aufnehmen)
* **Datenbank‑Bereinigung:** Korrigiert falsche Ordnernamen automatisch
* **Ordner‑Löschfunktion:** Sichere Entfernung ganzer Ordner aus der DB
* **Live‑Filter:** *„Übersetzt / Ignoriert / Offen"*
* **Ordner‑Anpassung:** Icons und Farben pro Ordner

### 🖋️ Texteingabe & Navigation

* **Auto‑Resize‑Textfelder** (EN & DE bleiben höhengleich)
* **Sofort‑Speicherung** nach 1 s Inaktivität
* **Tab/Shift+Tab Navigation** zwischen Textfeldern und Zeilen
* **Ctrl+Leertaste:** Audio‑Playback direkt im Textfeld
* **Copy‑Buttons:** 📋 neben jedem Textfeld für direktes Kopieren

### 🔍 Suche & Import

* **Erweiterte Ähnlichkeitssuche** (ignoriert Groß‑/Kleinschreibung, Punkte)
* **Intelligenter Import** mit automatischer Spalten‑Erkennung
* **Multi‑Ordner‑Auswahl** bei mehrdeutigen Dateien
* **Live‑Highlighting** von Suchbegriffen

### ⌨️ Keyboard & Maus

* **Keyboard‑Navigation:** Pfeiltasten, Tab, Leertaste für Audio, Enter für Texteingabe
* **Context‑Menu** (Rechtsklick): Audio, Kopieren, Einfügen, Ordner öffnen, Löschen
* **Drag & Drop:** Projekte und Dateien sortieren
* **Doppelklick:** Zeilennummer ändern, Projekt umbenennen

---

## 🛠️ Installation

1. **`hla_translation_tool.html`** herunterladen
2. **Datei lokal öffnen** (Doppelklick) – fertig!

> **💡 Tipp:** Desktop‑Verknüpfung erstellen ⇒ Ein‑Klick‑Start

### Systemanforderungen

* **Moderner Browser:** Chrome, Firefox, Edge, Safari
* **JavaScript aktiviert**
* **Lokaler Dateizugriff** für Audio‑Wiedergabe
* **Empfohlener Speicher:** 2+ GB freier RAM für große Projekte
* **Node.js ≥18** wird benötigt (u.a. für ElevenLabs-Dubbing; nutzt `fetch` und `FormData`)

### Desktop-Version (Electron)
1. Im Hauptverzeichnis `npm install` ausführen, damit benötigte Pakete wie `chokidar` vorhanden sind
2. In das Verzeichnis `electron/` wechseln und `npm install` ausführen. Fehlt npm (z.B. bei Node 22), `npm install -g npm` oder `corepack enable` nutzen
3. Mit `npm start` startet die Desktop-App ohne Browserdialog
4. Alternativ kann `start_tool.bat` (Windows), `start_tool.js` (plattformunabhängig) oder `start_tool.py` (Python-Version) aus jedem Verzeichnis ausgeführt werden. Fehlt das Repository, wird es automatisch geklont; andernfalls werden die neuesten Änderungen geladen und die Desktop-App gestartet
> **Hinweis:** Diese Skripte sollten **nicht** im Repository‑Ordner selbst ausgeführt werden, da sonst innerhalb dieses Ordners ein Unterordner geklont wird. Am besten legt man ein leeres Verzeichnis an und startet sie dort.
5. Beim Start werden die Ordner `sounds/EN` und `sounds/DE` automatisch erstellt und eingelesen
6. Kopieren Sie Ihre Originaldateien in `sounds/EN` und legen Sie Übersetzungen in `sounds/DE` ab
7. Während des Setups erzeugen alle Skripte (`start_tool.bat`, `start_tool.js` und `start_tool.py`) die Logdatei `setup.log`, in der alle Schritte gespeichert werden. Bei Fehlern weist die Konsole nun explizit auf diese Datei hin.
8. Die Skripte verwerfen lokale Änderungen, **ohne** den Ordner `sounds` anzutasten – Projektdaten bleiben somit erhalten

### ElevenLabs-Dubbing

1. API-Schlüssel bei [ElevenLabs](https://elevenlabs.io) erstellen.
2. Den Schlüssel als Umgebungsvariable `ELEVEN_API_KEY` setzen oder beim Aufruf der Funktionen eingeben.
3. Alternativ die Datei `.env.local` mit `ELEVEN_API_KEY=<dein-Key>` anlegen.
4. Beispielhafte Nutzung (neue Reihenfolge):

```javascript
const { createDubbing, isDubReady } = require('./elevenlabs.js');
const apiKey = process.env.ELEVEN_API_KEY;
const job = await createDubbing({
    audioFile: 'sounds/EN/beispiel.wav',
    csvContent: csvData,
    voiceId: '',
    apiKey
});
const url = `https://elevenlabs.io/studio/dubbing/${job.dubbing_id}`;
console.log('Im Studio öffnen:', url);
if (await isDubReady(job.dubbing_id, 'de', apiKey)) {
    const blob = await fetch(`${API}/dubbing/${job.dubbing_id}/audio/de`, { headers: { 'xi-api-key': apiKey } }).then(r => r.blob());
    // blob speichern ...
}
```

Ein Klick auf **Dubbing** öffnet zunächst ein Einstellungsfenster. Dort lassen sich folgende Parameter anpassen:

* **Stability** – Ausgeglichenheit vs. Lebendigkeit
* **Similarity-Boost** – Nähe zum Original
* **Style** – Überzeichnung des Sprechstils
* **Speed** – Tempo-Faktor
* **Speaker-Boost** – zusätzliche Ähnlichkeit

Die Standardwerte werden über `getDefaultVoiceSettings` geladen und nach dem Speichern dauerhaft im Browser hinterlegt.

Beim Öffnen des Dubbing-Dialogs werden gespeicherte Werte automatisch geladen.
Über den Button **Reset** lassen sich diese wieder auf die API-Defaults zurücksetzen.

Nach erfolgreichem Download merkt sich das Projekt die zugehörige **Dubbing-ID** in der jeweiligen Datei (`dubbingId`).
So können Sie das Ergebnis später erneut herunterladen oder neu generieren.

Ab Version 1.27.0 gibt es zusätzlich in der Dateitabelle einen Button **Download DE**.
Ist das Dubbing fertig, lässt sich damit die deutsche Audiodatei direkt speichern.
Ab Version 1.28.0 zeigt jede Zeile einen farbigen Punkt für den Dubbing‑Status (grau/gelb/grün).
Ab Version 1.29.0 gibt es ein erweitertes Protokoll aller API-Aufrufe.
Ab Version 1.30.0 werden Fehler beim Starten des Dubbings als roter Toast angezeigt und der Status wird alle 60 Sekunden automatisch aktualisiert.
Ab Version 1.31.0 speichert das Tool manuell heruntergeladene Audios im neuen Ordner `Download`.
Ab Version 1.32.0 versucht das Tool automatisch, die gerenderte Datei über die Resource-API herunterzuladen.
Ab Version 1.33.0 überwacht das Tool den Download-Ordner und importiert Dateien automatisch.
Ab Version 1.34.1 verwendet das Tool `path.resolve` für alle Pfade und meldet "Spur manuell generieren oder Beta freischalten" bei fehlendem Download.
Ab Version 1.34.2 behebt die Desktop-Version ein fehlendes `chokidar`-Modul.
Ab Version 1.34.3 installieren die Start-Skripte automatisch die Haupt-Abhängigkeiten.
Ab Version 1.34.4 öffnet der Button "Ordner öffnen" den Backup-Ordner auch im Browser.
Ab Version 1.34.5 erkennt das Tool auch Backups im alten Ordner `backups`.

Für diesen Zweck gibt es das Node-Skript `cliRedownload.js`.
Es wird so aufgerufen:

```bash
node cliRedownload.js <API-Key> <Dubbing-ID> <Ausgabedatei> [Sprache]
```

Intern nutzt es `downloadDubbingAudio()` aus `elevenlabs.js`.

Über das **API-Menü** lässt sich zudem pro Ordner eine feste ElevenLabs-Stimme wählen. Ist eine Voice-ID hinterlegt, wird sie beim Dubbing automatisch genutzt und Voice Cloning abgeschaltet. Ohne Voice-ID bleibt Voice Cloning aktiv.

Ab Version 1.10.3 wird beim Dubbing der selbst eingetragene deutsche Text genutzt. Das Tool erzeugt dazu eine CSV-Datei mit dem Format `speaker,start_time,end_time,transcription,translation`. Die Felder `start_time` und `end_time` enthalten seit Version 1.18.6 Sekundenwerte mit drei Nachkommastellen und leiten sich aus `trimStartMs` bzw. `trimEndMs` ab. Diese CSV wird zusammen mit `mode=manual` und `dubbing_studio=true` an die API übermittelt.

Bis Version 1.19.1 nutzte das Tool den Studio-Workflow über `resource/dub` und `resource/render`. Ab Version 1.19.2 erfolgt das Dubbing ausschließlich über die Standard-Endpunkte: Nach `POST /v1/dubbing` wird regelmäßig `GET /v1/dubbing/<ID>` aufgerufen und das Ergebnis anschließend via `GET /v1/dubbing/<ID>/audio/<sprache>` heruntergeladen.

Ab Version 1.20.3 wertet `waitForDubbing` nur noch `status` aus. Angaben in `progress.langs` oder `state` werden ignoriert.

Ab Version 1.24.0 entfällt `renderLanguage`. Erzeugte Projekte werden im Studio manuell gerendert. `isDubReady(id)` prüft dabei, ob die deutsche Spur bereitsteht.

Beispiel einer gültigen CSV:

```csv
speaker,start_time,end_time,transcription,translation
0,0.000,1.000,"Hello","Hallo"
```
*Hinweis:* Die Datei schließt mit CRLF (`\r\n`). Vor dem Upload prüft das Tool, dass ein Zeilenumbruch vorhanden ist und alle Felder korrekt in Anführungszeichen stehen.

### Dubbing-Protokoll

Nach jedem Start eines Dubbing-Vorgangs öffnet sich automatisch das Fenster **Dubbing-Protokoll**. Dort sind jetzt ausführliche Fehlermeldungen sichtbar, inklusive HTTP-Code und Server-Antwort. Das Protokoll lässt sich jederzeit über den Schließen-Button beenden oder kopieren.
Bei einem Upload-Fehler mit Status 400 wird zusätzlich ein Ausschnitt der erzeugten CSV angezeigt. So lässt sich schnell prüfen, ob die Daten korrekt formatiert sind.
Ab Version 1.20.2 protokolliert das Fenster zudem `detail.message` und `error` aus der Server-Antwort.

### Version aktualisieren

1. Nach jeder Änderung `package.json` anpassen.
2. Mit `npm run update-version` werden alle `1.18.6`-Platzhalter automatisch durch die Versionsnummer ersetzt.

---

## 🏁 Erste Schritte

### 1. 📁 Programm starten
* Beim Start liest die App automatisch alle Audio‑Dateien aus `sounds/EN` und vorhandene Übersetzungen aus `sounds/DE` ein

### 2. 📂 Neues Projekt erstellen
* Klicken Sie auf **„+ Neues Projekt"**
* Vergeben Sie einen Namen
* Optional: Level‑Name und Teil‑Nummer angeben
* Icon und Farbe werden automatisch zugewiesen

### 3. 📄 Dateien hinzufügen
* **Über Suche:** Live‑Suche nach Dateinamen oder Textinhalten
* **Über Browser:** „📁 Ordner durchsuchen" für visuelles Browsen
* **Direct‑Input:** Dateinamen direkt ins Eingabefeld

### 4. ✏️ Übersetzen
* Englische Texte werden automatisch erkannt
* Deutsche Übersetzung in das DE‑Feld eingeben
* **✓ Fertig‑Checkbox** setzen für Completion‑Tracking
* Auto‑Save speichert alle 1 Sekunde

---

## 🎮 Bedienung

### Projekt‑Management

|  Aktion                    |  Bedienung                                          |
| -------------------------- | --------------------------------------------------- |
| **Projekt erstellen**     | `+ Neues Projekt` Button                          |
| **Projekt auswählen**     | Klick auf Projekt‑Kachel                          |
| **Projekt anpassen**      | ⚙️ auf Projekt‑Kachel → Icon, Farbe, Level        |
| **Projekt löschen**       | × auf Projekt‑Kachel                              |
| **Projekt umbenennen**    | Doppelklick auf Projekt‑Name                      |
| **Projekt sortieren**     | Drag & Drop der Projekt‑Kacheln                   |
| **Level‑Name kopieren**   | ⧉‑Button in Meta‑Leiste                           |

### Datei‑Management

|  Aktion                    |  Bedienung                                          |
| -------------------------- | --------------------------------------------------- |
| **Dateien suchen**        | Live‑Suchfeld (mind. 2 Zeichen)                   |
| **Dateien hinzufügen**    | Direct‑Input, Suchresultat‑Klick, Browser         |
| **Datei als fertig**      | ✓ Completion‑Checkbox                             |
| **Datei ignorieren**      | 🚫 Ignorieren‑Button (im Ordner‑Browser)          |
| **Position ändern**       | Doppelklick auf Zeilennummer (#)                  |
| **Sortierung ändern**     | Klick auf Spalten‑Header                          |
| **Datei löschen**         | × am Zeilenende oder Context‑Menu                 |

### Audio & Text

|  Aktion                    |  Bedienung                                          |
| -------------------------- | --------------------------------------------------- |
| **Audio abspielen**       | ▶ Button oder Leertaste (bei ausgewählter Zeile)  |
| **Audio im Textfeld**     | `Ctrl + Leertaste`                                |
| **Text kopieren**         | 📋 Button neben Textfeld                          |
| **Zwischen Feldern**      | `Tab` / `Shift + Tab`                             |
| **Auto‑Resize aktiviert** | Textfelder passen sich automatisch an            |

---

## ⌨️ Keyboard Shortcuts

### Globale Shortcuts

|  Tastenkombination         |  Funktion                                           |
| -------------------------- | --------------------------------------------------- |
| **`Ctrl + S`**            | Projekt manuell speichern                         |
| **`Ctrl + I`**            | Import‑Dialog öffnen                              |
| **`Escape`**              | Dialoge schließen / Context‑Menu schließen        |

### Tabellen‑Navigation

|  Taste                     |  Funktion                                           |
| -------------------------- | --------------------------------------------------- |
| **`↑` / `↓`**             | Zeile nach oben/unten                             |
| **`Tab` / `Shift+Tab`**   | Zwischen Textfeldern wechseln                     |
| **`Enter`**               | Erstes Textfeld der ausgewählten Zeile fokussieren |
| **`Leertaste`**           | Audio der ausgewählten Zeile abspielen            |
| **`Delete`**              | Ausgewählte Zeile löschen                         |

### Text‑Shortcuts

|  Tastenkombination         |  Funktion                                           |
| -------------------------- | --------------------------------------------------- |
| **`Ctrl + Leertaste`**    | Audio abspielen (im Textfeld)                     |
| **`Tab`**                 | Nächstes Textfeld                                 |
| **`Shift + Tab`**         | Vorheriges Textfeld                               |

---

## 📥 Import

### Import‑Funktionen

* **📥 Daten importieren**
  * **Wiki‑Tabellen:** Automatische Spalten‑Erkennung
  * **Pipe‑Format:** `Dateiname|EN Text|DE Text`
  * **Intelligente Zuordnung:** Dateinamen‑Spalte wird automatisch erkannt
  * **Multi‑Ordner‑Support:** Auswahl bei mehrdeutigen Dateien
  * **Database‑Matching:** Vergleich mit vorhandenen Audiodateien

---

## 📁 Ordner‑Management

### Ordner‑Browser Features

* **📊 Globale Statistiken:** Übersetzungsfortschritt über alle Projekte
* **📈 Level‑Statistiken:** Aufklappbares Panel mit Details pro Level
* **🎨 Ordner‑Anpassung:** Icons und Farben individuell einstellbar
* **🔍 Pfad‑Anzeige:** Status und aufgelöster Pfad für jede Datei
* **✅ Completion‑Status:** Visuelle Markierung übersetzter Dateien

### Ordner‑Aktionen

|  Aktion                    |  Beschreibung                                       |
| -------------------------- | --------------------------------------------------- |
| **🚫 Ignorieren**         | Datei als „nicht benötigt" markieren              |
| **↩ Wieder aufnehmen**    | Ignorierte Datei wieder aktivieren                |
| **+ Hinzufügen**          | Datei zum aktuellen Projekt hinzufügen            |
| **▶ Audio abspielen**     | Direkte Wiedergabe im Browser                     |
| **⚙️ Ordner anpassen**    | Icon und Farbe des Ordners ändern                 |
| **❌ Ordner löschen**     | Kompletten Ordner aus Datenbank entfernen         |

### Datenbank‑Wartung

* **🧹 Ordnernamen bereinigen:** Korrigiert falsche Pfade automatisch
* **🧹 Duplikate bereinigen:** Intelligente Zusammenführung ähnlicher Einträge
* **🔄 Projekte bereinigen:** Entfernt veraltete Pfad‑Referenzen
* **🔧 Ordner reparieren:** Aktualisiert Ordnernamen in allen Projekten

Diese Wartungsfunktionen findest du nun gesammelt im neuen **⚙️ Einstellungen**‑Knopf oben rechts.

---

## 🔧 Erweiterte Funktionen

### Auto‑Scan‑System

* **🔄 Universeller Auto‑Scan:** Alle Funktionen lösen bei Bedarf automatisch Ordner‑Scan aus
* **⚡ Berechtigung‑Erkennung:** Browser‑Berechtigungen werden automatisch geprüft
* **🎯 Intelligente Pfad‑Auflösung:** Dynamisches Matching zwischen Projekten und Datenbank

### Erweiterte Suche

* **🔍 Ähnlichkeitssuche:** Ignoriert Groß‑/Kleinschreibung, Punkte, Kommas
* **📊 Relevanz‑Scoring:** Beste Treffer werden priorisiert
* **🎯 Multi‑Kriterien:** Dateiname, EN‑Text, DE‑Text werden durchsucht
* **📋 Live‑Highlighting:** Suchbegriffe werden in Ergebnissen hervorgehoben

### Intelligente Features

* **🧠 Smart Folder Detection:** Erkennt Half‑Life Charaktere automatisch
* **📏 Auto‑Height Textboxen:** EN/DE Felder bleiben höhengleich
* **🎨 Theme‑System:** Automatische Icon‑ und Farb‑Zuweisungen
* **💡 Context‑Awareness:** Funktionen passen sich dem aktuellen Kontext an

---

## 🐛 Troubleshooting

### Häufige Probleme

**🎵 Audio spielt nicht ab**
* ▶ **Lösung:** Audiodateien erneut einlesen, falls Berechtigungen fehlen
* ▶ **Automatisch:** Tool prüft beim Start, ob Dateien verfügbar sind

**📁 Dateien nicht gefunden**
* ▶ **Lösung:** Haupt‑Audio‑Ordner erneut einlesen
* ▶ **Prüfung:** Debug‑Spalte zeigt Pfad‑Status

**⚠️ Spur manuell generieren oder Beta freischalten**
* ▶ **Ursache:** Die gewählte Sprachspur konnte nicht automatisch heruntergeladen werden.
* ▶ **Lösung:** Spur im Studio manuell generieren oder Beta-Zugang für den Auto-Download freischalten.

**❓ target_lang nicht gesetzt?**
* ▶ **Hinweis:** Diese Meldung erscheint, wenn `waitForDubbing` im Fortschritt keine Zielsprache findet.


**🔄 Duplikate in Datenbank**
* ▶ **Lösung:** „🧹 Duplikate bereinigen" verwenden
* ▶ **Intelligente Bereinigung:** Behält beste Versionen automatisch

### Debug‑Tools

* **🔍 Debug‑Spalte:** Zeigt aufgelöste Pfade und Status
* **📊 Datenquellen‑Analyse:** Console‑Logs für Entwickler
* **🎯 Access‑Status:** Echtzeit‑Anzeige der Dateiberechtigungen
* **🔧 Debug-Konsole:** Über das Dropdown "Debug-Konsole" können Sie Logs einsehen. In der Desktop-Version öffnen Sie mit `npm start -- --debug` oder per `Ctrl+Shift+I` die DevTools.
* **📝 Ausführliche API-Logs:** Alle Anfragen und Antworten werden im Dubbing-Log protokolliert

### Performance‑Tipps

* **📂 Ordner‑Struktur:** Verwenden Sie sinnvolle Ordner‑Hierarchien
* **🧹 Regelmäßige Bereinigung:** Duplikate und veraltete Einträge entfernen
* **💾 Backup‑Strategie:** Regelmäßige Datensicherung vor größeren Änderungen

---
## 📝 Changelog

Der komplette Verlauf steht in [CHANGELOG.md](CHANGELOG.md).

## 💡 Tipps & Best Practices

### Projekt‑Organisation

* **📋 Level‑Namen verwenden:** Strukturieren Sie Projekte nach Spiel‑Leveln
* **🔢 Teil‑Nummern vergeben:** Für große Level mehrere Teile erstellen
* **🎨 Farb‑Coding:** Ähnliche Level mit gleichen Farben markieren

### Übersetzungs‑Workflow

1. **📁 Dateien werden beim Start geladen** – kein manuelles Scannen nötig
2. **🔍 Suche verwenden** statt manueller Datei‑Eingabe
3. **🎵 Audio anhören** vor Übersetzung
4. **✓ Fertig‑Status setzen** für Fortschritts‑Tracking
5. **💾 Regelmäßige Backups** erstellen

### Performance‑Optimierung

* **🧹 Duplikate bereinigen** bei großen Datenbanken
* **🚫 Unnötige Dateien ignorieren** für bessere Übersicht
* **📊 Level‑Statistiken nutzen** für Fortschritts‑Übersicht

---

© 2025 Half‑Life: Alyx Translation Tool – Alle Rechte vorbehalten.

**Version 1.27.0 - Download-Button**
Neue Spalte mit "Download DE" ermöglicht schnellen Zugriff auf fertige Dubbings.

**Version 1.28.0 - Dubbing-Status**
Jede Dateizeile enthält nun einen farbigen Punkt für den aktuellen Dubbing-Status.

**Version 1.29.0 - Protokoll-Menü**
Neues Protokoll-Menü zeigt alle API-Aufrufe mit Statuscode an.

**Version 1.30.0 - Fehler- und UX-Feinschliff**
Dubbing-Fehler erscheinen sofort in einem roten Toast. Gelbe Status-Icons werden alle 60 Sekunden automatisch geprüft.

**Version 1.31.0 - Doppel-Workflow**
Neuer Ordner `Download` für manuelle Audios, der beim Start erstellt wird.
**Version 1.32.0 - Beta-Auto-Download**
Automatisches Herunterladen über die Resource-API, sofern freigeschaltet.
**Version 1.33.0 - Ordnerüberwachung**
Automatisches Erkennen und Importieren manuell gespeicherter Audios.
**Version 1.34.0 - Neuer Dub-Status**
Status-Spalte zeigt nun graue, gelbe oder grüne Punkte. Ein Klick auf Gelb öffnet das Studio erneut.
**Version 1.34.1 - Pfad-Fixes & Clean-Up**
Alle Pfade nutzen nun `path.resolve`. Bei fehlenden Dubbings erscheint die Meldung „Spur manuell generieren oder Beta freischalten“. Nach dem Import wird die Quelldatei entfernt.
**Version 1.34.2 - Chokidar-Fix**
Behebt ein fehlendes `chokidar`-Modul in der Desktop-Version.
**Version 1.34.3 - Auto-Install**
Start-Skripte führen nun `npm install` im Hauptordner aus.
**Version 1.34.4 - Backup-Fallback**
Der Backup-Button öffnet nun auch im Browser den `backups`-Ordner.
**Version 1.34.5 - Backup-Kompatibilität**
Backups aus dem alten Ordner `backups` werden wieder erkannt.
**Version 1.26.0 - Studio-Workflow**
Öffnet nach jedem Dubbing automatisch das ElevenLabs Studio und zeigt einen Hinweis mit OK-Button an.


**Version 1.25.0 - API-Bereinigung
🎮 Speziell entwickelt für Half‑Life: Alyx Übersetzungsprojekte

## 🧪 Tests

Diese Repository nutzt **Jest** als Test Runner. Um die Tests auszuführen:

`npm test` installiert dank eines `pretest`-Skripts automatisch alle Abhängigkeiten.

1. Tests starten
   ```bash
   npm test
   ```

Die wichtigsten Tests befinden sich im Ordner `tests/` und prüfen unter
anderem die Funktion `calculateProjectStats`. Neu sind Tests für die
ElevenLabs‑Anbindung (z. B. `getDubbingStatus`) und `manualDub.test.js`, der `csv_file` und `voice_id` überprüft. Zudem prüft ein Test `showDubbingSettings`, ob der Dialog im DOM erscheint.

## ▶️ E2E-Test

1. **Entwicklungsserver starten**
   ```bash
   npm start
   ```
2. **Audiodatei hochladen** – im geöff­neten Tool eine WAV‑ oder MP3‑Datei auswählen.
3. **Logs prüfen** – in der Konsole erscheinen Meldungen zu Upload und Dubbing.
4. **Audio anhören** – nach Abschluss wird die generierte Sprachausgabe abgespielt.

**Erfolgskriterien**

* Ausgabe erfolgt auf Deutsch.
* Timing der Sprachausgabe passt zum Original.

## 🧩 Wichtige Funktionen

* **`readAudioFiles(dir)`** – liest alle Audiodateien eines Ordners rekursiv ein und gibt ihre Pfade im POSIX‑Format zurück.
* **`createWindow()`** – öffnet das Hauptfenster der Electron‑App und richtet einen Shortcut zum Ein‑/Ausblenden der DevTools ein.
* **`backup-de-file(relPath)`** – kopiert eine vorhandene deutsche Audiodatei nach `DE-Backup`, sofern dort noch keine Sicherung existiert.
* **`delete-de-backup-file(relPath)`** – löscht eine Sicherung aus `DE-Backup` und entfernt leere Unterordner.
* **`restore-de-file(relPath)`** – stellt eine deutsche Audiodatei aus dem Backup wieder her.
* **`calculateProjectStats(project)`** – ermittelt pro Projekt den Übersetzungs‑ und Audio‑Fortschritt. Diese Funktion wird auch in den Tests ausführlich geprüft.
