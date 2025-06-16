# hla_translation_tool
# 🎮 Half‑Life: Alyx Translation Tool

![Half‑Life: Alyx Translation Tool](https://img.shields.io/badge/Version-1.40.27-green?style=for-the-badge)
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
* **Level-Kapitel** zur besseren Gruppierung und ein-/ausklappbaren Bereichen
* **Kapitel bearbeiten:** Name, Farbe und Löschung im Projekt möglich
* **Kapitelwahl beim Erstellen:** Neue oder bestehende Kapitel direkt auswählen
* **Intelligenter Ordner‑Scan** mit Duplikat‑Prävention und Auto‑Normalisierung
* **Eingebettete Audio‑Wiedergabe** (MP3 / WAV / OGG) direkt im Browser
* **Automatische MP3-Konvertierung** beim Start (Originale in `Backups/mp3`)
* **Automatische Prüfung geänderter Endungen** passt Datenbank und Projekte an
* **Live‑Statistiken:** EN‑%, DE‑%, Completion‑%, Globale Textzahlen (EN/DE/BEIDE/∑)
* **Vollständig offline** – keine Server, keine externen Abhängigkeiten

### 📊 Fortschritts‑Tracking

* **Globale Dashboard‑Kacheln:** Gesamt, Übersetzt, Ordner komplett, **EN/DE/BEIDE/∑**
* **Level‑Statistik‑Panel** (aufklappbar im Ordner‑Browser)
* **Projekt‑übergreifende Fortschrittsanzeige:** Dateien und Dashboard zeigen Status über alle Projekte
* **Visuelle Gesamtbalken** im Toolbar zeigen den Fortschritt aller Projekte
* **Grüne Rahmen** für **100 %**‑Projekte & vollständig übersetzte Ordner
* **Grüne Haken** für abgeschlossene Kapitel
* **Dateizeilen‑Badges:** Übersetzt / Ignoriert / Offen

### 📁 Ordner‑Management

* **Folder‑Browser** mit Icons, Such‑ & Filter‑Funktionen
* **Pfad‑Anzeige:** Jede Datei zeigt aufgelösten Pfad mit Status
* **Ignorieren‑Toggle** für unnötige Audios (🚫 Ignorieren / ↩ Wieder aufnehmen)
* **Datenbank‑Bereinigung:** Korrigiert falsche Ordnernamen automatisch
* **Ordner‑Löschfunktion:** Sichere Entfernung ganzer Ordner aus der DB
* **Live‑Filter:** *„Übersetzt / Ignoriert / Offen"*
* **Ordner‑Anpassung:** Icons und Farben pro Ordner
* **Live‑Suche im Ordner** analog zur globalen Suche (Cursor bleibt beim Tippen an der richtigen Position) – unterstützt jetzt mehrere Suchbegriffe mit Leerzeichen

### 🖋️ Texteingabe & Navigation

* **Auto‑Resize‑Textfelder** (EN & DE bleiben höhengleich)
* **Sofort‑Speicherung** nach 1 s Inaktivität
* **Tab/Shift+Tab Navigation** zwischen Textfeldern und Zeilen
* **Ctrl+Leertaste:** Audio‑Playback direkt im Textfeld
* **Copy‑Buttons:** 📋 neben jedem Textfeld für direktes Kopieren
* **Automatische Übersetzungsvorschau** unter jedem DE-Feld via *Argos Translate*
* **Umlaute korrekt anzeigen:** Die automatischen Übersetzungen nutzen nun immer UTF‑8
* **Gespeicherte Übersetzungen:** einmal erzeugte Vorschläge werden im Projekt abgelegt und nur bei Änderungen neu berechnet
* **Fortschrittsanzeige** beim automatischen Übersetzen aller fehlenden Texte
* **Projekt-Playback:** ▶/⏸/⏹ spielt verfügbare DE-Dateien nacheinander ab
* **Feste Reihenfolge:** Beim Projekt-Playback wird die Dateiliste strikt von oben nach unten abgespielt, unabhängig vom Dateityp
* **Stabileres Audio-Playback:** Unterbrochene Wiedergabe erzeugt keine Fehlermeldungen mehr
* **Automatischer History-Eintrag:** Beim Lautstärkeabgleich wird das Original gespeichert
* **Funkgeräte-Effekt:** Alle Parameter (Bandpass, Sättigung, Rauschen, Knackser, Wet) lassen sich bequem per Regler einstellen und werden dauerhaft gespeichert.
* **Schneller Zugriff:** Die Funktionen Lautstärke angleichen – ⚡ und Funkgerät-Effekt – 📻 besitzen nun eigene Buttons mit Symbolen. Der Button **⟳ Standardwerte** befindet sich direkt daneben.
* **Verbessertes Speichern:** Nach dem Anwenden von Lautstärke angleichen oder Funkgerät‑Effekt bleiben die Änderungen nun zuverlässig erhalten.
* **Fehlerhinweise beim Speichern:** Tritt ein Problem auf, erscheint eine rote Toast-Meldung statt eines stummen Abbruchs.
* **Neue Meldung:** Scheitert das Anlegen einer History-Version, wird "Fehler beim Anlegen der History-Version" ausgegeben.

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

1. **`web/hla_translation_tool.html`** herunterladen
2. **Datei lokal öffnen** (Doppelklick) – fertig!

> **💡 Tipp:** Desktop‑Verknüpfung erstellen ⇒ Ein‑Klick‑Start

### Systemanforderungen

* **Moderner Browser:** Chrome, Firefox, Edge, Safari
* **JavaScript aktiviert**
* **Lokaler Dateizugriff** für Audio‑Wiedergabe
* **Empfohlener Speicher:** 2+ GB freier RAM für große Projekte
* **Node.js 18–22** wird benötigt (u.a. für ElevenLabs-Dubbing; nutzt `fetch` und `FormData`)

### Desktop-Version (Electron)
1. Im Hauptverzeichnis `npm ci` ausführen, damit benötigte Pakete wie `chokidar` vorhanden sind
2. In das Verzeichnis `electron/` wechseln und `npm ci` ausführen. Fehlt npm (z.B. bei Node 22), `npm install -g npm` oder `corepack enable` nutzen
3. Mit `npm start` startet die Desktop-App ohne Browserdialog
4. Alternativ kann `start_tool.bat` (Windows), `start_tool.js` (plattformunabhängig) oder `start_tool.py` (Python-Version) aus jedem Verzeichnis ausgeführt werden. Fehlt das Repository, wird es automatisch geklont; andernfalls werden die neuesten Änderungen geladen und die Desktop-App gestartet. `start_tool.py` erkennt dabei automatisch, ob es im Repository oder davor gestartet wurde.
5. Beim Start werden die Ordner `web/sounds/EN` und `web/sounds/DE` automatisch erstellt und eingelesen. Liegen die Ordner außerhalb des `web`-Verzeichnisses, erkennt das Tool sie nun ebenfalls.
6. Kopieren Sie Ihre Originaldateien in `web/sounds/EN` (oder den gefundenen Ordner) und legen Sie Übersetzungen in `web/sounds/DE` ab
7. Während des Setups erzeugen alle Skripte (`start_tool.bat`, `start_tool.js` und `start_tool.py`) die Logdatei `setup.log`, in der alle Schritte gespeichert werden. Bei Fehlern weist die Konsole nun explizit auf diese Datei hin. Die Logdatei wird vom Repository ausgeschlossen (`.gitignore`).
8. Die Skripte verwerfen lokale Änderungen, **ohne** den Ordner `web/sounds` anzutasten – Projektdaten bleiben somit erhalten
9. `node check_environment.js` prueft Node- und npm-Version, installiert Abhaengigkeiten und startet einen kurzen Electron-Test. Mit `--tool-check` fuehrt das Skript zusaetzlich `python start_tool.py --check` aus, um die Desktop-App kurz zu testen. Ergebnisse stehen in `setup.log`.
10. Alle Start-Skripte kontrollieren nun die installierte Node-Version und brechen bei Abweichungen ab.
11. `reset_repo.py` setzt das Repository nun komplett zurück, installiert alle Abhängigkeiten in beiden Ordnern und startet anschließend automatisch die Desktop-App.
12. `start_tool.py` installiert nun zusätzlich alle Python-Abhängigkeiten aus `requirements.txt`. `translate_text.py` geht daher davon aus, dass `argostranslate` bereits vorhanden ist.

### ElevenLabs-Dubbing

1. API-Schlüssel bei [ElevenLabs](https://elevenlabs.io) erstellen.
2. Den Schlüssel als Umgebungsvariable `ELEVEN_API_KEY` setzen oder beim Aufruf der Funktionen eingeben.
3. Kopieren Sie `.env.example` zu `.env.local` und tragen Sie Ihren Schlüssel in `ELEVEN_API_KEY=` ein.
4. Beispielhafte Nutzung (neue Reihenfolge):

```javascript
const { createDubbing, isDubReady } = require('./elevenlabs.js');
const apiKey = process.env.ELEVEN_API_KEY;
const job = await createDubbing({
    audioFile: 'web/sounds/EN/beispiel.wav',
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

Ein Klick auf **Dubbing** öffnet zunächst ein Einstellungsfenster. Danach fragt das Tool,
ob die **Beta-API** genutzt oder der **halbautomatische Modus** verwendet werden soll.
Im halbautomatischen Modus werden Audiodatei und Texte lediglich an ElevenLabs gesendet.
Anschließend erscheint ein Hinweis, die fertig gerenderte Datei in den projektspezifischen Ordner `web/Download` (oder `web/Downloads`) zu legen.
Sobald dort eine passende Datei auftaucht, zeigt das Tool „Datei gefunden" mit Namen an und
wartet auf eine Bestätigung. Das Fenster zeigt nun zusätzlich Ordnername sowie englischen und deutschen Text der aktuellen Zeile an, damit klar ist, für welche Übersetzung die Datei erwartet wird.
Im Einstellungsfenster lassen sich folgende Parameter anpassen:

* **Stability** – Ausgeglichenheit vs. Lebendigkeit
* **Similarity-Boost** – Nähe zum Original
* **Style** – Überzeichnung des Sprechstils
* **Speed** – Tempo-Faktor
* **Speaker-Boost** – zusätzliche Ähnlichkeit
* Die angezeigten Werte aktualisieren sich sofort beim Verschieben der Regler

Seit dem neuen Layout werden alle Werte über komfortable Slider eingestellt. Ein Info-Icon erklärt jeden Parameter in einfachen Worten. Fortgeschrittene Optionen wie `disable_voice_cloning`, `num_speakers` und `seed` lassen sich über ein ausklappbares Menü anpassen. Eine **Probe abspielen**-Funktion spielt ein kurzes Beispiel mit den gewählten Einstellungen ab.
Über ein Dropdown stehen zudem Presets wie **Neutral**, **Podcast** oder **Drama** bereit.

Die Standardwerte werden über `getDefaultVoiceSettings` geladen und nach dem Speichern dauerhaft im Browser hinterlegt.

Beim Öffnen des Dubbing-Dialogs werden gespeicherte Werte automatisch geladen.
Im Dialog **🔊 ElevenLabs API** gibt es nun einen Bereich, der die aktuell gespeicherten Standardwerte anzeigt.
Über den Button **Reset** lassen sich diese wieder auf die API-Defaults zurücksetzen.

Nach erfolgreichem Download merkt sich das Projekt die zugehörige **Dubbing-ID** in der jeweiligen Datei (`dubbingId`).
So können Sie das Ergebnis später erneut herunterladen oder neu generieren.
Beim erneuten Download fragt das Tool nun ebenfalls, ob die Beta-API oder der halbautomatische Modus genutzt werden soll.

Ein Watcher überwacht automatisch den Ordner `web/Download` bzw. `web/Downloads` im Projekt. Taucht dort eine fertig gerenderte Datei auf, meldet das Tool „Datei gefunden“ und verschiebt sie nach `web/sounds/DE`. Seit Version 1.40.5 klappt das auch nach einem Neustart: Legen Sie die Datei einfach in den Ordner, sie wird anhand der Dubbing‑ID automatisch der richtigen Zeile zugeordnet. Der Status springt anschließend auf *fertig*. Alle 15 Sekunden erfolgt zusätzlich eine Status-Abfrage der offenen Jobs, allerdings nur im Beta-Modus. Beta-Jobs werden nun automatisch aus dieser Liste entfernt, sobald sie fertig sind. Der halbautomatische Modus verzichtet auf diese Abfrage. Der Download-Ordner wird zu Beginn jedes neuen Dubbings und nach dem Import automatisch geleert. Seit Version 1.40.17 findet der Watcher auch Dateien mit leicht verändertem Namen und warnt bei fehlender Zuordnung im Terminal.
Seit Patch 1.40.7 merkt sich das Tool außerdem den fertigen Status dauerhaft. Auch nach einem erneuten Download bleibt der grüne Haken erhalten.
Seit Patch 1.40.8 werden Dateien auch dann korrekt verschoben, wenn sich Download- und Projektordner auf unterschiedlichen Laufwerken befinden.
Seit Patch 1.40.9 merkt sich der Level-Dialog die zuletzt genutzten fünf Farben und bietet eine Schnellwahl unter dem Farbpicker.
Seit Patch 1.40.10 sortiert sich die Kapitel-Liste in der Projekt-Ansicht sofort korrekt.
Seit Patch 1.40.11 sind die Kapitel-Auswahllisten in den Projekt- und Level-Dialogen ebenfalls nach der Nummer sortiert.
Seit Patch 1.40.12 ist auch die Level-Auswahl im Projekt-Dialog nach der Level-Nummer sortiert.
Seit Patch 1.40.13 springt die Projekt-Wiedergabe nach einer Datei automatisch zur nächsten.
Seit Patch 1.40.14 werden halbautomatisch importierte Dateien korrekt nach `web/sounds/DE` verschoben, auch wenn der gespeicherte Pfad mit `sounds` beginnt.
Seit Patch 1.40.15 werden diese Dateien zusätzlich wie ein manueller Upload behandelt: Ein History-Eintrag entsteht und der Status springt sofort auf *fertig*.
Seit Patch 1.40.16 validiert das Tool CSV-Dateien auch dann korrekt, wenn die Übersetzung Kommata enthält.
Seit Patch 1.40.17 verknüpft der Dateiwächter heruntergeladene Dubbing-Dateien auch bei kleinen Namensabweichungen korrekt und meldet fehlende Zuordnungen im Terminal.
Seit Patch 1.40.18 verschiebt der Dateiwächter halbautomatisch heruntergeladene Dateien nun in den dynamisch erkannten Sounds-Ordner.
Seit Patch 1.40.19 korrigiert er zudem die Ordnerstruktur beim halbautomatischen Import, sodass der "sounds"-Unterordner erhalten bleibt.
Seit Patch 1.40.20 prüft der Dateiwächter im halbautomatischen Modus die Audiodatei vor dem Verschieben auf Gültigkeit.
Seit Patch 1.40.21 zeigt das Dubbing-Protokoll beim halbautomatischen Import, welche Datei gefunden wurde, wohin sie kopiert wurde und ob die Prüfung vor und nach dem Kopieren erfolgreich war.
Seit Patch 1.40.22 protokolliert das Tool zusätzlich den vollständigen Original- und Zielpfad der Datei.
Seit Patch 1.40.23 benennt der Dateiwächter gefundene Dateien zunächst korrekt um und verschiebt sie erst danach.
Seit Patch 1.40.24 entfernt der halbautomatische Import auch vorgestellte "EN"- oder "DE"-Ordnernamen, sodass keine unnötigen Unterordner mehr entstehen.
Seit Patch 1.40.25 bereinigt das Tool beim Start fehlerhafte Einträge im DE-Cache und erkennt Zielpfade von Dubbings nun unabhängig von der Großschreibung.
Seit Patch 1.40.26 wiederholt der manuelle Import das Verschieben mehrmals und wartet kurze Zeit, falls die Datei noch gesperrt ist. Dadurch verschwinden Fehler wie "resource busy or locked".
Seit Patch 1.40.27 werden Änderungen am DE-Audio nach dem Bearbeiten sofort im Projekt gespeichert.
Seit Patch 1.40.28 speichert applyDeEdit DE-Audios im Cache über den bereinigten Pfad und aktualisiert so konsistent die History.
Seit Patch 1.40.29 lädt das Tool das MP3-Modul lamejs automatisch von einem CDN, falls es nicht lokal verfügbar ist.
Seit Patch 1.40.30 nutzt das Tool cdnjs anstelle von jsDelivr, da dies durch die Content Security Policy erlaubt ist.


Beispiel einer gültigen CSV:

```csv
speaker,start_time,end_time,transcription,translation
0,0.000,1.000,"Hello","Hallo"
```
*Hinweis:* Die Datei schließt mit CRLF (`\r\n`). Vor dem Upload prüft das Tool, dass ein Zeilenumbruch vorhanden ist und alle Felder korrekt in Anführungszeichen stehen. Seit Version 1.40.6 werden auch Zeilenumbrüche innerhalb der Übersetzung unterstützt.

### Dubbing-Protokoll

Nach jedem Start eines Dubbing-Vorgangs öffnet sich automatisch das Fenster **Dubbing-Protokoll**. Dort sind jetzt ausführliche Fehlermeldungen sichtbar, inklusive HTTP-Code und Server-Antwort. Das Protokoll lässt sich jederzeit über den Schließen-Button beenden oder kopieren.
Bei einem Upload-Fehler mit Status 400 wird zusätzlich ein Ausschnitt der erzeugten CSV angezeigt. So lässt sich schnell prüfen, ob die Daten korrekt formatiert sind.

### Python-Übersetzungsskript

`translate_text.py` übersetzt kurze Texte offline mit Argos Translate. Die benötigten Pakete werden durch `start_tool.py` automatisch installiert. Fehlende Sprachpakete lädt das Skript beim ersten Aufruf automatisch herunter. Seit Version 1.40.13 wird dabei korrekt erkannt, ob ein Paket bereits vorhanden ist. Anschließend kann der gewünschte Text per `echo "Hello" | python translate_text.py` übersetzt werden.

### Version aktualisieren

1. In `package.json` die neue Versionsnummer eintragen.
2. Danach `npm run update-version` ausführen. Das Skript aktualisiert `electron/package.json` und ersetzt alle `1.40.3`-Platzhalter in `README.md`, `web/src/main.js` und `web/hla_translation_tool.html` durch die aktuelle Nummer.

---

## 🏁 Erste Schritte

### 1. 📁 Programm starten
* Beim Start liest die App automatisch alle Audio‑Dateien aus `web/sounds/EN` und vorhandene Übersetzungen aus `web/sounds/DE` ein

### 2. 📂 Neues Projekt erstellen
* Klicken Sie auf **„+ Neues Projekt"**
* Vergeben Sie einen Namen
* Optional: Level‑Name und Teil‑Nummer angeben
* Optional: Kapitel auswählen oder neu anlegen
* Icon und Farbe werden automatisch zugewiesen

### 3. 📄 Dateien hinzufügen
* **Über Suche:** Live‑Suche nach Dateinamen oder Textinhalten
* **Über Browser:** „📁 Ordner durchsuchen" für visuelles Browsen mit Live-Suche im aktuellen Ordner – unterstützt jetzt Suchbegriffe mit Leerzeichen
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
| **Kapitel anpassen**      | ⚙️ neben Kapitel‑Titel → Name, Farbe, Löschen |
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

|  Aktion                    |  Bedienung |
| -------------------------- | ----------------------------------------------- |
| **Audio abspielen**       | ▶ Button oder Leertaste (bei ausgewaehlter Zeile) |
| **Projekt-Playback**      | ▶/⏸/⏹ spielt vorhandene DE-Dateien der Reihe nach |
| **Audio im Textfeld**     | `Ctrl + Leertaste` |
| **Text kopieren**         | 📋 Button neben Textfeld |
| **Zwischen Feldern**      | `Tab` / `Shift + Tab` |
| **Auto-Resize aktiviert** | Textfelder passen sich automatisch an |
* Beim Speichern eines DE-Audios verhindert das Tool nun ungültige Schnittbereiche und zeigt einen Fehler an.
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
* **🔍 Ordner-Textsuche:** Filtert Dateien nach EN- oder DE-Texten

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
* **🎵 Audio-Duplikate prüfen:** Gleiche Dateinamen mit unterschiedlichem Format zusammenführen
* **🔄 Projekte bereinigen:** Entfernt veraltete Pfad‑Referenzen und passt Dateiendungen automatisch an
* **🔧 Ordner reparieren:** Aktualisiert Ordnernamen in allen Projekten

Diese Wartungsfunktionen findest du nun gesammelt im neuen **⚙️ Einstellungen**‑Knopf oben rechts.

---

## 🔧 Erweiterte Funktionen

### Auto‑Scan‑System

* **🔄 Universeller Auto‑Scan:** Alle Funktionen lösen bei Bedarf automatisch Ordner‑Scan aus
* **⚡ Berechtigung‑Erkennung:** Browser‑Berechtigungen werden automatisch geprüft
* **🤖 Automatische Berechtigungs-Erneuerung:** Fehlende Ordnerzugriffe können nach Bestätigung erneut abgefragt werden
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

**💾 Fehler beim Speichern des DE-Audios**
* ▶ **Hinweis:** Ordnerzugriff erneut erlauben oder Pfad prüfen. Das Tool zeigt die genaue Ursache im Toast an.
* ▶ **Pfad prüfen:** Beim Speichern wird `sounds/DE/` nun automatisch entfernt, falls der Pfad doppelt vorkommt.
* ▶ **Neu:** Jede Fehlermeldung beim Speichern wird nun als Toast eingeblendet.
* ▶ **Update:** MP3-Dateien werden jetzt korrekt gespeichert.
* ▶ **Neu:** Beim Programmstart werden vorhandene MP3-Dateien automatisch in WAV umgewandelt und im Ordner `Backups/mp3` gesichert.
* ▶ **Fix:** Das Backup funktioniert jetzt auch über Laufwerksgrenzen hinweg, da beim Verschieben auf Kopieren mit anschließendem Löschen umgestellt wird.
* ▶ **Neu:** Geänderte Dateiendungen werden erkannt und automatisch korrigiert.

#### Häufige Crash-Stellen

| Typischer Fehler | Ursache | Kurzlösung |
| --- | --- | --- |
| `ReferenceError: require is not defined` | `sandbox:true` verbogen oder `contextIsolation` unsauber verdreht | `main.js`: `webPreferences:{ contextIsolation:true, sandbox:false, nodeIntegration:false, preload:path.join(__dirname,'preload.cjs') }` |
| `Cannot find module 'fs'` o. Ä. | Preload als ESM geschrieben (import …) statt CommonJS | Komplett auf `require()` umstellen oder `filename.mjs` + "type":"module" vermeiden. |
| Zugriff auf `window`/`document` | DOM im Preload nicht verfügbar | Alles DOM-abhängige in ein Renderer-Script verschieben. |

### Debug‑Tools

* **🔍 Debug‑Spalte:** Zeigt aufgelöste Pfade und Status
* **📊 Datenquellen‑Analyse:** Console‑Logs für Entwickler
* **🎯 Access‑Status:** Echtzeit‑Anzeige der Dateiberechtigungen
* **🔧 Debug-Konsole:** Über das Dropdown "Debug-Konsole" können Sie Logs einsehen. In der Desktop-Version öffnen sich die DevTools jetzt automatisch in einem separaten Fenster oder per `Ctrl+Shift+I`.
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
* **📂 Kapitel:** Mehrere Level zu Kapiteln gruppieren, bearbeiten und zusammenklappen

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


## 🧪 Tests

Diese Repository nutzt **Jest** als Test Runner. Um die Tests auszuführen:
Ein neuer GitHub-Workflow (`node-test.yml`) führt nach jedem Push oder Pull Request automatisch `npm ci` und `npm test` mit Node 18 bis 22 aus.

`npm test` installiert dank eines `pretest`-Skripts automatisch alle Abhängigkeiten per `npm ci`.

1. Tests starten
   ```bash
   npm test
   ```

Die wichtigsten Tests befinden sich im Ordner `tests/` und prüfen die Funktionen `calculateProjectStats`, die ElevenLabs‑Anbindung und den Datei‑Watcher. Ein GitHub‑Workflow führt sie automatisch mit Node 18–22 aus.

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
* **`saveDeHistoryBuffer(relPath, data)`** – legt einen Buffer als neue History-Version ab.
* **`copyDubbedFile(originalPath, tempDubPath)`** – verschiebt eine heruntergeladene Dub-Datei in den deutschen Ordnerbaum.
* **`calculateProjectStats(project)`** – ermittelt pro Projekt den Übersetzungs‑ und Audio‑Fortschritt. Diese Funktion wird auch in den Tests ausführlich geprüft.
* **`ipcContracts.ts`** – definiert Typen für die IPC-Kommunikation zwischen Preload und Hauptprozess.
* **`syncProjectData(projects, filePathDatabase, textDatabase)`** – gleicht Projekte mit der Datenbank ab, korrigiert Dateiendungen und überträgt Texte.
