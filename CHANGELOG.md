# Changelog

Alle wesentlichen Änderungen des Projekts. Die jeweils aktuelle Version steht an erster Stelle.

## 🛠️ Patch in 1.36.6
* Fehlende Electron-API wird im Debug-Fenster erklärt.

## 🛠️ Patch in 1.36.5
* Debug-Button zeigt nun Pfad-Informationen an.

## 🛠️ Patch in 1.36.4
* Start-Skripte löschen automatisch Dateien, die nicht mehr im Repository vorhanden sind. `web/sounds` und `web/backups` bleiben erhalten.

## 🛠️ Patch in 1.36.3
* Desktop-Version erkennt nun `web/Sounds` und `web/Backups`

## 🛠️ Patch in 1.36.2
* Start-Skripte bewahren nun auch `web/backups/` bei `git reset`

## 🛠️ Patch in 1.36.1
* `.gitignore` ignoriert nun `web/sounds/`, `web/backups/` und `web/Download/`

## 🛠️ Strukturänderung in 1.36.0
* Web-Dateien befinden sich nun im Ordner `web/`

## 🛠️ Verbesserung in 1.35.7
* `.env.example` als Vorlage für `.env.local`

## 🛠️ Aufräumarbeiten in 1.35.5

* Überflüssige TypeScript-Dateien entfernt

## ✨ Neue Features in 1.35.0

* Backup-Dateien lassen sich im Browser hochladen und sofort wiederherstellen

## 🛠️ Bugfix in 1.35.1

* DevTools-Button wird wieder dauerhaft angezeigt

## 🛠️ Verbesserung in 1.35.2

* Dev-Button öffnet nun zusätzlich die Debug-Konsole

## 🛠️ Bugfix in 1.35.3

* Browser-Version erkennt den Ordner `sounds` jetzt automatisch

## 🛠️ Verbesserung in 1.35.4

* Dev-Button zeigt nun JavaScript-Fehler im Debug-Bereich an


## ✨ Neue Features in 1.34.0

* Neue Spalte "Dub-Status" mit farbigen Punkten
* Klick auf gelben Punkt öffnet erneut das Studio

## ✨ Neue Features in 1.34.1

* Pfade basieren nun auf `path.resolve(projectRoot, 'sounds/DE', …)`
* Fehlermeldung bei `dubbing_not_found` ersetzt durch "Spur manuell generieren oder Beta freischalten"
* Nach dem Verschieben wird die Datei im Download-Ordner entfernt

## ✨ Neue Features in 1.34.2

* Fehlendes `chokidar`-Modul in der Desktop-Version ergänzt

## ✨ Neue Features in 1.34.3

* Start-Skripte installieren automatisch die Haupt-Abhängigkeiten

## ✨ Neue Features in 1.34.4

* Backup-Ordner lässt sich jetzt auch im Browser öffnen
* Fallback auf Standardordner `sounds`, falls kein Directory Picker vorhanden ist

## 🛠️ Bugfix in 1.34.5

* Backups aus dem alten Ordner `backups` werden wieder erkannt

## 🛠️ Bugfix in 1.34.6

* DevTools-Button wird im Browser ausgeblendet

## ✨ Neue Features in 1.33.0

* Ordnerüberwachung für manuell heruntergeladene Audios

## ✨ Neue Features in 1.31.0

* Neuer Ordner `Download` für manuelle Audios
* Konstante `DL_WATCH_PATH` sorgt beim Start für die Ordner-Erstellung

## ✨ Neue Features in 1.32.0

* Automatischer Download über die Resource-API (Beta)

## ✨ Neue Features in 1.30.0

* Fehler-Toast bei fehlgeschlagenem Dubbing
* Automatische Status-Prüfung alle 60 s
* Gewählte Stimme im Dubbing-Dialog sichtbar

## ✨ Neue Features in 1.29.0

* Neues Protokoll-Menü listet alle API-Aufrufe mit Zeitstempel und Statuscode

## ✨ Neue Features in 1.28.0

* Farbige Status-Punkte zeigen den Fortschritt jedes Dubbings direkt in der Tabelle

## ✨ Neue Features in 1.27.0

* Neue Spalte mit "Download DE"-Button in der Datei-Tabelle

## ✨ Neue Features in 1.26.0

* Öffnet nach dem Starten des Dubbings automatisch das ElevenLabs Studio
* Neues Overlay hält den Vorgang an, bis der Benutzer "OK" klickt

## ✨ Neue Features in 1.25.0

* API-Modul nutzt ausschließlich `/dubbing/{id}`
* `renderLanguage` und Studio-Endpunkte entfernt

## ✨ Neue Features in 1.24.0

* Halb-manueller Studio-Workflow ohne `renderLanguage`
* Neue Funktion `isDubReady` prüft den Status eines Dubbings

## ✨ Neue Features in 1.23.1

* `renderLanguage` und `waitForDubbing` verwenden nun `/dubbing/resource/...`.

## ✨ Neue Features in 1.23.0

* Ausführlicheres Logging aller API-Aufrufe

## ✨ Neue Features in 1.22.13

* Changelog ausgelagert in eigene Datei.

## ✨ Neue Features in 1.22.12

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Dokumentation** | Neuer Abschnitt "E2E-Test" beschreibt den kompletten Testablauf. |

## ✨ Neue Features in 1.22.11

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Workflow** | Nach `createDubbing` wird automatisch `renderLanguage('de')`, `waitForDubbing(id, 'de')` und `downloadDubbingAudio(id, 'de')` ausgeführt. |

## ✨ Neue Features in 1.22.10

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Bugfix** | `waitForDubbing` berücksichtigt jetzt den übergebenen `targetLang`-Parameter. |

## ✨ Neue Features in 1.22.8

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **API** | Neue Funktion `renderLanguage` rendert eine Sprache mit gewünschtem Format. |

## ✨ Neue Features in 1.22.7

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Deutsches Dubbing** | `target_lang` und `target_languages` sind nun immer `de`. |

## ✨ Neue Features in 1.22.6

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Konfiguration** | `.env.example` als Vorlage für `.env.local` nutzen. |

## ✨ Neue Features in 1.22.5

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Deutsches Dubbing** | `disable_voice_cloning` wird gesetzt, wenn keine Voice-ID gewählt ist. |

## ✨ Neue Features in 1.22.4

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Cache-Fix** | Session-Daten werden nun im Ordner `.hla_translation_tool/SessionData` gespeichert, um Cache-Fehler unter Windows zu verhindern. |

## ✨ Neue Features in 1.22.3

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **ElevenLabs-Fix** | Stabileres Polling bis `status="complete"` und bis zu 10 Download-Versuche. |
| **Dokumentation** | Anleitung gegen 404-Fehler beim Dubbing ergänzt. |

## ✨ Neue Features in 1.22.2

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Browser-Dubbing**        | Neue Datei `src/elevenlabs.js` stellt die Dubbing-Funktionen im Browser bereit. |

## ✨ Neue Features in 1.22.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **CLI-Update**             | `cliRedownload.js` akzeptiert jetzt optional einen Sprachparameter. |

## ✨ Neue Features in 1.21.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ---------------------------------------------- |
| **Gemeinsame Funktion**    | `waitForDubbing` liegt jetzt in `elevenlabs.js` und wird überall genutzt. |

## ✨ Neue Features in 1.20.3

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Polling vereinfacht**    | `waitForDubbing` prüft nur noch `status` und ignoriert `progress`. |

## ✨ Neue Features in 1.20.2

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Fehler-Protokoll**       | Detaillierte Meldungen aus `detail.message` und `error` werden angezeigt. |

## ✨ Neue Features in 1.20.1

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Konstante API**          | Alle API-Aufrufe nutzen nun die zentrale Variable `API`. |


## ✨ Neue Features in 1.19.4

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Neue Funktion**        | StartDubbing akzeptiert jetzt eine frei wählbare Sprache. |

## ✨ Neue Features in 1.19.2

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Bugfix**                | Verwendet nur noch `/v1/dubbing`-Endpunkte und behebt `no_dubbing_api_access`. |

## ✨ Neue Features in 1.19.1

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Fehlerbehebung**        | API-Aufruf übergibt jetzt `segments` und `languages`. |

## ✨ Neue Features in 1.19.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Studio-Workflow**        | Entfernt: Ab 1.19.2 genügt `POST/GET /v1/dubbing` zum Dubben. |

## ✨ Neue Features in 1.18.8

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Besseres Fehlerlogging** | Hinweis bei `dubbing_not_found` im Download. |

## ✨ Neue Features in 1.18.7

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Frisches Dubbing-Log** | Log wird bei jedem Start automatisch geleert. |

## ✨ Neue Features in 1.18.6

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Versionsplatzhalter** | HTML und JavaScript nutzen nun `1.18.6` statt fester Zahlen. |
| **Update-Skript** | `npm run update-version` ersetzt alle Platzhalter automatisch. |
| **cliRedownload.js** | Neues Node-Skript lädt eine vorhandene Dub-Datei erneut herunter. |
| **CSV prüfen** | `validateCsv()` stellt sicher, dass die CSV korrekt aufgebaut ist. |
| **Fehlerprotokoll** | Bei fehlgeschlagenen Git-, Node- oder npm-Aufrufen wird nun der genaue Fehler in `setup.log` gespeichert. |
| **Fehlerdetails** | `detail.message` aus der API-Antwort wird separat geloggt. |
| **Sekundenformat** | `createDubbingCSV()` nutzt nun Sekundenwerte statt `HH:MM:SS.mmm`. |

## ✨ Neue Features in 1.16.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Log löschen** | Neuer Button im Dubbing-Protokoll leert das Log bei Bedarf. |

## ✨ Neue Features in 1.15.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Zeilenende wählbar** | Neues Dropdown im Backup-Dialog legt LF oder CRLF fest. |

## ✨ Neue Features in 1.14.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **CSV-Ausschnitt bei Fehler** | Upload schlägt mit Status 400 fehl? Im Dubbing-Protokoll erscheinen nun die ersten 200 Zeichen der CSV. |

## ✨ Neue Features in 1.12.7

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **HH:MM:SS Zeitformat**   | `createDubbingCSV()` liefert Start- und Endzeiten nun als `HH:MM:SS.mmm`. |
|                           | Ab Version 1.18.6 werden wieder Sekundenwerte genutzt. |

## ✨ Neue Features in 1.12.6

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Retry-Download**        | Nach einem Fehler wird der Audiodownload bis zu drei Mal wiederholt. |

## ✨ Neue Features in 1.12.5

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Komplette Antwort**     | POST-Antwort im Dubbing-Protokoll inklusive `target_languages`. |

## ✨ Neue Features in 1.12.4

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **CSV-Header**            | `createDubbingCSV()` fügt nun eine Kopfzeile ein. |
| **Neuer Test**            | `manualDub.test.js` kontrolliert den CSV-Inhalt. |
| **GET-Test**              | `elevenlabs.test.js` simuliert `getDubbingStatus`. |

## ✨ Neue Features in 1.11.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Schneller Dialog**      | Dubbing-Einstellungsfenster öffnet sich nun sofort. |
| **Manual Dub**            | Eigener DE-Text wird zusammen mit Start- und Endzeiten \*als CSV\* an die API geschickt. |
## ✨ Neue Features in 1.10.3

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Voice-Settings**        | Dubbing-Einstellungen werden im Browser gespeichert, lassen sich per `getDefaultVoiceSettings` zurücksetzen und zeigen jetzt ein Einstellungsfenster vor dem Start. |

## ✨ Neue Features in 1.8.0

|  Kategorie                 |  Beschreibung
| -------------------------- | ------------------------------------------------- |
| **API-Menü**            | Einstellungsdialog jetzt mit Kategorien, Dropdowns und Live-Validierung des Keys. |
| **Alle zurücksetzen**   | Ein Klick leert sämtliche Voice-IDs. |
| **Voice-IDs testen**    | Prüft alle gewählten Stimmen auf Erreichbarkeit. |
| **API-Key testen**      | Getrennter Button prüft den Key und färbt sich grün bei Erfolg. |
| **Sichtbarer API-Key**  | Augen-Button zeigt/versteckt den eingegebenen Schlüssel. |
| **Eigene IDs**          | Neue Voice-IDs können über einen Dialog hinzugefügt werden. |
| **Fortschrittsanzeige** | Projektübergreifender Fortschritt mit Farbkennzeichnung im Dashboard. |
| **Automatische Version** | Versionsnummer wird nun bei jedem Build aktualisiert. |
| **Stimmenverwaltung**  | Benutzerdefinierte IDs umbenennen, löschen und Name abrufen. |
| **CSP-Fix**          | API-Tests im Browser funktionieren jetzt dank angepasster Content Security Policy. |
| **Fehlende Ordner**  | Neues Tool sucht in der Datenbank nach Ordnern ohne Dateien und bietet deren Löschung an. |
| **Ordnerliste**      | Zweite Liste zeigt alle Ordner mit Pfad aus der Datenbank. |
| **Bereinigung**      | API-Menü und Ordner-Browser verwenden jetzt dieselbe Liste. |
| **Dubbing-Knopf**    | Automatische Vertonung jeder Datei per ElevenLabs. |
| **Dubbing-Protokoll**| Neues Fenster zeigt jeden Schritt beim Dubbing an und bleibt offen, bis es manuell geschlossen wird. |
| **Dubbing-Einstellungen** | Vor dem Start lassen sich Stabilität, Tempo und mehr anpassen. |
---
### 1.8.0 - Automatische Versionsverwaltung

**✨ Neue Features:**
* Versionsnummer wird nun automatisch aus `package.json` in HTML und JS eingetragen.

### 3.22.0 - Dubbing-Feinjustierung

**✨ Neue Features:**
* Dialog fragt vor dem Vertonen nach Stabilität, Ähnlichkeit, Stil, Geschwindigkeit und Speaker-Boost.

### 3.21.1 - Ordnerlisten bereinigt

**🛠️ Bugfix:**
* API-Menü zeigt jetzt nur Ordner aus der Datenbank an.
* Verwaiste Ordner-Anpassungen werden automatisch entfernt.

### 3.21.0 - Fehlende Ordner

**✨ Neue Features:**
* Benutzerdefinierte Stimmen lassen sich jetzt bearbeiten und löschen.
* Voice-Namen können per API abgerufen werden.
* Test-Button für den API-Key mit grüner Erfolgsanzeige.
* Fehler beim "Neue Stimme"-Knopf behoben; neuer Dialog zum Hinzufügen.
* Neues Tool listet fehlende Ordner auf und erlaubt deren Löschung.
* Zusätzlich zeigt eine zweite Liste alle Ordner mit Pfad aus der Datenbank an.

### 3.15.0 - Überarbeitetes API-Menü

**✨ Neue Features:**
* Gruppierte Voice-IDs, Dropdown-Auswahl und Key-Prüfung.

### 3.13.3 - GPU-Cache-Fehler behoben

**🛠️ Bugfix:**
* Fehlerhafte GPU-Cache-Erstellung führte zu Fehlermeldungen; der Shader-Cache wird nun deaktiviert.

### 3.13.2 - Verbesserte Backup-Funktion

**✨ Neue Features:**
* Backups enthalten nun Level-Farben, Reihenfolgen, Icons, ignorierte Dateien, Auto-Backup-Einstellungen und den API-Key.

### 3.13.1 - Ordnerübergreifende Voice-IDs

**✨ Neue Features:**
* API-Dialog listet jetzt alle Ordner aus der Datenbank.

### 3.13.0 - API-Menü & Voice-IDs

**✨ Neue Features:**
* **ElevenLabs-Dubbing**: Audiodateien lassen sich jetzt direkt per API vertonen.
* **API-Menü**: API-Key eingeben und Stimmen für Ordner hinterlegen.

### 3.11.0 - Icon-Auswahl & Haken-Fix

**✨ Neue Features:**
* **Icon-Auswahl**: Im Level-Dialog steht nun eine Liste gängiger Icons zur Verfügung.
* **Haken unter dem Icon**: Der grüne Fertig-Haken wird unter dem Icon angezeigt.

### 3.10.0 - Gemeinsame Projekt-Icons

**✨ Neue Features:**
* **Gemeinsame Icons**: Projekte eines Levels verwenden automatisch das Icon des Levels.
* **Haken-Layout**: Der grüne Fertig-Haken verdeckt das Icon nicht mehr.

### 3.7.1 - Level‑Nummern-Fix

**✨ Neue Features:**
* **Level-Reihenfolge sichtbar**: Dropdowns und Level-Kopfzeilen zeigen jetzt die zugehörige Zahl, z.B. `1.Levelname`.
* **Level-Nummern bis 9999**: Reihenfolge und Teil-Nummern akzeptieren vierstellige Werte.

### 3.6.0 - Level‑Management & Datenbank‑Tools

**✨ Neue Features:**
* **Level‑System:** Projekte erhalten Level‑Name + Teil‑Nummer
* **Projekt‑Meta‑Leiste:** Anzeige von Projekt • Level • Teil mit Kopier‑Button
* **Globale Text‑Statistik:** EN / DE / BEIDE / ∑ Kachel mit Live‑Update
* **Level‑Statistik‑Panel:** Aufklappbare Übersicht pro Level
* **Dateien‑Ignorieren:** 🚫 Ignorieren / ↩ Wieder aufnehmen Toggle
* **Pfad‑Anzeige:** Debug‑Info für jeden Ordner‑Browser‑Eintrag
* **Datenbank‑Bereinigung:** Korrigiert falsche Ordnernamen automatisch
* **Ordner‑Löschfunktion:** Sichere Entfernung ganzer Ordner

**🔧 Verbesserungen:**
* **Auto‑Cleanup:** Fehlende Dateien ohne Texte werden entfernt
* **UI‑Polish:** Schließen‑Button (×) oben rechts, grüne Rahmen für 100%
* **Dark‑Theme:** Optimierte Kontraste und Animationen

### 3.5.0 - Global Completion Tracking

**✨ Neue Features:**
* **Projekt‑übergreifende Verfolgung:** Globale Completion‑Statistiken
* **Grüne Rahmen:** Vollständig übersetzte Ordner und Projekte
* **Datei‑Markierungen:** Übersetzungsstatus pro Datei sichtbar
* **Erweiterte Ordner‑Stats:** Detaillierte Fortschritts‑Prozentsätze

### 3.4.0 - Enhanced User Experience

**✨ Neue Features:**
* **Copy‑Buttons:** Direkte Kopierfunktion neben Textfeldern
* **Context‑Menu:** Rechtsklick für erweiterte Optionen
* **Keyboard‑Navigation:** Vollständige Tastatur‑Unterstützung
* **Auto‑Height Textboxen:** Synchronisierte Höhen für EN/DE

### 3.3.0 - Smart Import & Search

**✨ Neue Features:**
* **Intelligenter Import:** Automatische Spalten‑Erkennung
* **Ähnlichkeitssuche:** Normalisierte Suche mit Scoring
* **Multi‑Ordner‑Auswahl:** Lösung für mehrdeutige Dateien

### 3.2.0 - Audio & Visual Enhancements

**✨ Neue Features:**
* **Audio‑System:** Vollständig im Browser, Auto‑Scan‑Integration
* **Projekt‑Anpassung:** Icons und Farben für Projekte
* **Ordner‑Anpassung:** Icons und Farben für Ordner
* **Responsive Design:** Optimiert für verschiedene Bildschirmgrößen

### 3.1.0 - Advanced Management

**✨ Neue Features:**
* **Ordner‑Browser:** Visuelles Durchsuchen der Audio‑Datenbank
* **Fortschritts‑Tracking:** Completion‑Status und Statistiken
* **Drag & Drop:** Sortierung von Projekten und Dateien
* **Auto‑Save:** Kontinuierliche Speicherung

### 3.0.0 - Foundation Release

**✨ Neue Features:**
* **Multi‑Projekt‑Support:** Verwaltung mehrerer Übersetzungsprojekte
* **Intelligenter Ordner‑Scan:** Automatische Audio‑Datei‑Erkennung
* **Text‑Datenbank:** Globale Speicherung aller Übersetzungen
* **Import:** Wiki‑Tabellen
* **Offline‑Fähigkeit:** Vollständig lokale Web‑App

---
