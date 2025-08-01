# Changelog
## ✨ Neue Features in 1.40.0
* GitHub-Workflow `node-test.yml` führt automatisch `npm ci` und `npm test` für Node 18–22 bei jedem Push und Pull Request aus.

## 🛠️ Patch in 1.40.1
* Abhängigkeit `glob` auf Version `^9.0.0` aktualisiert.
## 🛠️ Patch in 1.40.2
* `updateVersion.js` aktualisiert jetzt zusätzlich `electron/package.json`.
## 🛠️ Patch in 1.40.3
* Pfad zur Konfiguration wird in der Desktop-Version nun dynamisch ermittelt.
## 🛠️ Patch in 1.40.4
* Preload-Skript fängt nun unbehandelte Fehler ab und meldet "erfolgreich geladen".
* Renderer prüft die Verfügbarkeit der Electron-API über `window.electronAPI`.
## 🛠️ Patch in 1.40.5
* Manuell heruntergeladene Dateien werden nun auch nach einem Neustart automatisch erkannt und importiert.
## 🛠️ Patch in 1.40.6
* `validateCsv` kommt jetzt mit Zeilenumbrüchen in Übersetzungen zurecht.
## 🛠️ Patch in 1.40.7
* Der fertige Dubbing-Status wird jetzt dauerhaft im Projekt gespeichert.
## 🛠️ Patch in 1.40.8
* Verschieben heruntergeladener Dateien klappt nun auch über Laufwerksgrenzen hinweg.
## 🛠️ Patch in 1.40.9
* Level-Dialog zeigt die letzten fünf gewählten Farben zur schnellen Auswahl.
## 🛠️ Patch in 1.40.10
* Kapitel-Liste sortiert sich in der Projekt-Ansicht sofort korrekt.
## 🛠️ Patch in 1.40.11
* Kapitel-Auswahllisten sind jetzt nach der Kapitelnummer sortiert.
## 🛠️ Patch in 1.40.12
* Level-Auswahlliste in den Projekt-Einstellungen folgt nun der Level-Nummer.
## 🛠️ Patch in 1.40.13
* Offline-Übersetzung erkennt installierte Sprachpakete jetzt korrekt.
## 🛠️ Patch in 1.40.14
* Halbautomatisch importierte Dateien werden korrekt nach `web/sounds/DE` verschoben.
## 🛠️ Patch in 1.40.15
* Importierte Dateien erzeugen sofort einen History-Eintrag und gelten als fertig.
## 🛠️ Patch in 1.40.16
* `validateCsv` erhält nun Anführungszeichen, sodass Kommata in Übersetzungen keinen Fehler mehr auslösen.
## 🛠️ Patch in 1.40.17
* Dateiwächter findet nun auch Dateien mit leicht verändertem Namen und gibt bei fehlender Zuordnung eine Warnung aus.
## 🛠️ Patch in 1.40.18
* Halbautomatisch heruntergeladene Dateien wandern jetzt in den dynamisch erkannten Sounds-Ordner.
## 🛠️ Patch in 1.40.19
* Korrigiert die Ordnerstruktur beim halbautomatischen Import: Der "sounds"-Unterordner wird nun korrekt angelegt.
## 🛠️ Patch in 1.40.20
* Neuer Button setzt die Funk-Effektparameter auf Standardwerte zurück.
## 🛠️ Patch in 1.40.21
* Typdefinitionen für die IPC-Kommunikation ergänzen `ipcContracts.ts`.
## 🛠️ Patch in 1.40.22
* Entfernt die ungenutzte Datei `web/src/watcher.js`.
## 🛠️ Patch in 1.40.23
* Entfernt die Startskripte `start_tool.js` und `start_tool.bat`. `start_tool.py` bleibt als einzige Einstiegsmöglichkeit erhalten.
## 🛠️ Patch in 1.40.24
* MP3-Encoding entfernt: `bufferToMp3` und die Abhängigkeit `lamejs` wurden gestrichen.
## 🛠️ Patch in 1.40.25
* Die Untertitel-Suche bewertet nur noch ganze Wörter, wodurch keine falschen 100-%-Treffer mehr erscheinen.
## 🛠️ Patch in 1.40.26
* Die Content Security Policy lässt nun Bilder von `i.ytimg.com` zu, damit der YouTube-Player ohne Fehlermeldung startet.
## 🛠️ Patch in 1.40.27
* Problem behoben, bei dem der YouTube-Player nach erneutem Öffnen den `videoPlayerFrame` nicht fand.
## 🛠️ Patch in 1.40.28
* Der YouTube-Player bleibt sichtbar, wenn man dasselbe Video erneut auswählt.
## 🛠️ Patch in 1.40.29
* Neues Skript `verify_environment.py` prüft Python-, Node- und npm-Version und meldet fehlende Pakete.
## 🛠️ Patch in 1.40.30
* `verify_environment.py` gibt nun alle Prüfungen mit Häkchen aus und warnt bei fehlenden Dateien oder lokalen Änderungen.
## 🛠️ Patch in 1.40.31
* ResizeObserver im Video-Manager reagiert nur noch einmal pro Frame und vermeidet so "loop limit exceeded"-Fehler.
## 🛠️ Patch in 1.40.32
* Neues Wörterbuch speichert englische Begriffe mit deutscher Lautschrift.
## 🛠️ Patch in 1.40.33
* Ein kleines 📝 zeigt in der Tabelle an, wenn der DE-Text einen Eintrag aus dem Wörterbuch enthält.
## 🛠️ Patch in 1.40.34
* Dateiwächter wartet auf stabile Dateigröße und löscht nur noch die importierte Datei.
## 🛠️ Patch in 1.40.35
* Der Dateiwächter importiert Dateien jetzt nur automatisch, wenn eine passende Dubbing-ID vorhanden ist. Unbekannte Dateien öffnen stattdessen den manuellen Import-Dialog.
## 🛠️ Patch in 1.40.36
* Fehler behoben: Beim Einfügen von GPT-Ergebnissen erschien teilweise "applyEvaluationResults is not a function".
## 🛠️ Patch in 1.40.37
* "Emotionen kopieren" zeigt nun vor jedem Eintrag die Laufzeit der EN-Datei an, z.B. `[8,57sec]`.
## 🛠️ Patch in 1.40.38
* Neuer Button „Anpassen-Kürzen“ unter dem Emotional-Text passt den Inhalt automatisch an die Länge der EN-Datei an.
## 🛠️ Patch in 1.40.39
* Der Erklärungstext nach "Anpassen-Kürzen" nennt jetzt, wie der Text gekürzt wurde und verweist auf die Länge der EN-Datei.
## 🛠️ Patch in 1.40.108
* Preset-Verwaltung für den Funkgeräte-Effekt. Einstellungen lassen sich speichern und löschen.
## 🛠️ Patch in 1.40.109
* Speichern eines Funkgeräte-Presets öffnet nun einen eigenen Dialog, da `prompt()` in Electron nicht unterstützt wird.
## 🛠️ Patch in 1.40.110
* Der 📋-Knopf unter dem Emotional-Text kopiert jetzt zusätzlich die Laufzeit der EN-Datei im Format `[8,57sec]`.
## 🛠️ Patch in 1.40.111
* Hall-Effekt wird beim Dubbing jetzt ebenfalls zurückgesetzt.
## 🛠️ Patch in 1.40.112
* Neues Skript `update_repo.py` aktualisiert das Repository und zeigt die eingespielten Commits an.
## 🛠️ Patch in 1.40.113
* Beim Speichern leert der DE-Editor nun automatisch die Ignorier-Liste. Automatisch erkannte Pausen landen damit nicht mehr im Projekt.
## 🛠️ Patch in 1.40.114
* Neuer Puffer-Knopf verschiebt alle Ignorier-Bereiche in 50-ms-Schritten nach innen oder außen.
## 🛠️ Patch in 1.40.115
* Alt-Drag fügt nun Stille-Bereiche ein, um Audios zeitlich zu verschieben.
## 🛠️ Patch in 1.40.116
* Uploads ersetzen nun die Sicherungsdatei in `DE-Backup`, sodass "Zurücksetzen" die zuletzt geladene Version wiederherstellt.
## 🛠️ Patch in 1.40.117
* Beim Speichern wird die Sicherung nicht mehr überschrieben, damit stets die ursprünglich hochgeladene Datei wiederhergestellt werden kann.
## 🛠️ Patch in 1.40.118
* Fehler behoben: Die Projekt-Wiedergabe hält jetzt immer die Positionsreihenfolge ein.
## 🛠️ Patch in 1.40.119
* Sortierung bleibt bei der Projekt-Wiedergabe unverändert, dadurch werden keine Zeilen mehr übersprungen.
## 🛠️ Patch in 1.40.120
* Vor der Projekt-Wiedergabe wird die Reihenfolge der Dateien geprüft und bei Bedarf korrigiert.
## 🛠️ Patch in 1.40.121
* Wiedergabeliste zeigt während der Projekt-Wiedergabe alle Dateinamen in korrekter Reihenfolge an.
## 🛠️ Patch in 1.40.122
* Wiedergabeliste zeigt nun die Positionsnummern statt fortlaufender Zählung.
## 🛠 Patch in 1.40.123
* Wiedergabeliste zeigt nun zusätzliche Pfadinformationen zu jeder Datei.
## 🛠 Patch in 1.40.124
* Wiedergabeliste prüft jede Datei und zeigt Icons für Existenz, Abspielstatus und korrekte Reihenfolge.
## 🛠 Patch in 1.40.125
* Wiedergabeliste erzeugt nun ein Protokoll der erwarteten und der tatsächlichen Abspielreihenfolge.
## 🛠 Patch in 1.40.126
* Beim Kürzen eines Emotional-Texts darf die Übersetzung nun leicht verändert werden, um sehr kurze EN-Zeilen besser abzudecken.
## 🛠 Patch in 1.40.127
* DE-Audio-Editor mit verbesserten Buttons und erläuternden Tooltips.
## 🛠 Patch in 1.40.128
* Tabelle vereint EN- und DE-Spalte sowie alle Aktionen in zwei übersichtlichen Feldern.
## 🛠 Patch in 1.40.129
* Spaltenbreiten korrigiert: Ordnertext überlappt nicht mehr und Aktions-Symbole sind gruppiert.
## 🛠 Patch in 1.40.130
* Aktions-Symbole besitzen nun Tooltips mit kurzen Erklärungen.
## 🛠 Patch in 1.40.131
* Versions- und Score-Spalte sind nun schmaler: Überschrift und Werte werden untereinander dargestellt.
## 🛠 Patch in 1.40.132
* Neue Aktionsleiste mit runden Symbolknöpfen, die alle Funktionen übersichtlich in Zeilen gruppiert.
## 🛠 Patch in 1.40.133
* Einheitliche Icon-Größen, dunkler Hintergrund und klare Abstände machen die Aktionsspalte übersichtlicher.
## 🛠 Patch in 1.40.134
* Dezente Trennlinien strukturieren die Aktionszeile in Upload-, Dubbing-, Bearbeitungs- und Löschbereich.
## 🛠 Patch in 1.40.135
* Zusätzliche Kommentare im Code erläutern den kompakten Tabellenaufbau und die vertikal gruppierten Aktionen.
## 🛠 Patch in 1.40.136
* Jede Aktionsgruppe steckt nun in einem eigenen Block mit Abstand; der Löschknopf ist deutlich nach unten versetzt.
## 🛠 Patch in 1.40.137
* Aktionsknöpfe besitzen nun abgerundete Ecken und passen optisch zu den anderen Buttons.
## 🛠 Patch in 1.40.138
* Beim Hochladen einer DE-Audiodatei wird der Tempo-Faktor wieder auf 1,0 gesetzt.
## 🛠 Patch in 1.40.139
* Beim Kürzen eines Emotional-Texts bleiben abgebrochene Sätze und Fülllaute aus dem Original erhalten.
## 🛠 Patch in 1.40.140
* ZIP-Import ersetzt nun ebenfalls die Sicherungsdatei in `DE-Backup`, sodass der "Zurücksetzen"-Knopf die importierte Version wiederherstellt.
## 🛠 Patch in 1.40.141
* Entfernt die komplette OCR-Funktion samt `easyocr`-Abhängigkeiten.
## 🛠 Patch in 1.40.142
* Neuer Button "Verbessern" unter dem Emotional-Text zeigt drei alternative Übersetzungen mit Begründung an.
## 🛠 Patch in 1.40.143
* "Verbessern" berücksichtigt nun den gesamten Kontext, zeigt eine Ladeanimation am Knopf und der Dialog besitzt ein überarbeitetes Layout.
## 🛠 Patch in 1.40.144
* Anpassen-Kürzen sorgt nun dafür, dass die deutsche Variante die Länge der EN-Aufnahme nie unterschreitet.
## 🛠 Patch in 1.40.145
* ZIP-Import setzt den Tempo-Regler jeder importierten Zeile wieder auf 1,0.
## 🛠 Patch in 1.40.146
* Button "Verbesserungsvorschläge" öffnet einen Dialog mit drei Alternativen, die Länge und Sprechzeit des englischen Originals berücksichtigen.
## ✨ Neue Features in 1.38.0
* Neues Skript `check_environment.js` prueft Node-Version, installiert Abhaengigkeiten und startet einen Electron-Testlauf.

## 🛠️ Patch in 1.38.1
* Start-Skripte nutzen nun `git reset --hard HEAD`, da `web/sounds` und `web/backups` durch `.gitignore` geschuetzt sind.

## 🛠️ Patch in 1.38.2
* Start-Skripte pruefen nach `npm ci`, ob das Electron-Modul vorhanden ist. Fehlt es, wird `npm install electron` ausgefuehrt. Scheitert auch dieser Versuch, bricht das Skript mit einem Fehler ab.

## 🛠️ Patch in 1.38.3
* `start_tool.bat` prueft nun die installierte Node-Version und verlangt Node 18 bis 22.

## 🛠️ Patch in 1.38.6
* Debug-Fenster zeigt nun ausfuehrliche System- und Pfadinformationen sowie die letzten Zeilen aus `setup.log`.

## 🛠️ Patch in 1.38.7
* Debug-Fenster meldet jetzt, ob das Programm mit Administratorrechten gestartet wurde.

## 🛠️ Patch in 1.38.8
* Debug-Fenster zeigt nun die App-, Node-, Electron- und Chrome-Version an.

## ✨ Neue Features in 1.39.0
* Neues Skript `reset_repo.py` setzt das Repository per Doppelklick zurueck und holt Updates.

Alle wesentlichen Änderungen des Projekts. Die jeweils aktuelle Version steht an erster Stelle.

## 🛠️ Patch in 1.37.6
* Start-Skripte verwenden nun `npm ci` anstelle von `npm install`.

## 🛠️ Patch in 1.37.5
* Nach einem erfolgreichen `npm install` im `electron`-Ordner pruefen die Start-Skripte, ob das Electron-Modul fehlt und installieren es gegebenenfalls nach.

## 🛠️ Patch in 1.37.4
* Node 22 wird jetzt unterstuetzt. `start_tool.py` und `start_tool.js` akzeptieren diese Version.

## 🛠️ Patch in 1.37.3
* `package.json` verlangt jetzt Node 18–21.

## 🛠️ Patch in 1.37.2
* `start_tool.py` und `start_tool.js` pruefen die installierte Node-Version und erwarten Node 18–21.

## 🛠️ Patch in 1.37.1
* `start_tool.py` erkennt nun automatisch, ob es im Repository oder davor gestartet wurde.

## 🛠️ Patch in 1.37.0
* Debug-Fenster zeigt nun weitere Systeminformationen wie Fenster- und Bildschirmgröße sowie den Sandbox-Status.

## 🛠️ Patch in 1.36.12
* Start-Skripte protokollieren UID und melden den Sandbox-Modus von Electron.

## 🛠️ Patch in 1.36.11
* Fehlermeldungen beim Starten der Anwendung werden verständlich angezeigt und im Log festgehalten.

## 🛠️ Patch in 1.36.10
* Python-Startskript hält das Fenster offen, damit Fehlermeldungen sichtbar bleiben.

## 🛠️ Patch in 1.36.9
* Debug-Fenster zeigt zusätzliche Browser- und Prozessinformationen.

## 🛠️ Patch in 1.36.8
* Electron startet jetzt garantiert mit aktivierter `contextIsolation`.

## 🛠️ Patch in 1.36.7
* Debug-Fenster besitzt nun einen Kopierknopf.

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
