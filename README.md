# 🎮 Half‑Life: Alyx Translation Tool
*(Projektname: `hla_translation_tool`)*

![Half‑Life: Alyx Translation Tool](https://img.shields.io/badge/Version-1.40.377-green?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Offline](https://img.shields.io/badge/Offline-Ready-green?style=for-the-badge)

Eine vollständige **Offline‑Web‑App** zum Verwalten und Übersetzen aller Audio‑Zeilen aus *Half‑Life: Alyx*.

🎥 **Projekt in Aktion:** Auf dem YouTube-Kanal [Half-Life Alyx DE](https://www.youtube.com/@Half-LifeAlyxDE) siehst du, wie das Übersetzungstool im Einsatz ist und wie die deutsche Fassung Schritt für Schritt entsteht.

---

## 🔍 Schnellüberblick
* Komplettes Übersetzungs-Ökosystem für Half-Life: Alyx mit Browser-Oberfläche und Desktop-App (Electron).
* Automatisiertes Projekt-Handling inklusive GPT-Bewertungen, Emotionstexten und ElevenLabs-Dubbing.
* Leistungsfähige Import-, Ordner- und Backup-Werkzeuge inklusive History, Statistik-Dashboards und Audio-Editor.
* Umfangreiche Debug-, Test- und Troubleshooting-Hilfen für stabile Produktions-Workflows.

## 🧭 Inhaltsnavigator
* [🏆 Funktionsarchiv (komplett)](#-funktionsarchiv-komplett)
  * [🎯 Kernfunktionen](#-kernfunktionen)
  * [📊 Fortschritts‑Tracking](#-fortschritts-tracking)
  * [📁 Ordner‑Management](#-ordner-management)
  * [🔍 Suche & Import](#-suche--import)
  * [⌨️ Keyboard & Maus](#-keyboard--maus)
* [🛠️ Installation](#-installation)
  * [Systemanforderungen](#systemanforderungen)
  * [Desktop-Version (Electron)](#desktop-version-electron)
  * [ElevenLabs-Dubbing](#elevenlabs-dubbing)
  * [Emotionales Dubbing (v3)](#emotionales-dubbing-v3)
  * [Python-Übersetzungsskript](#python-übersetzungsskript)
  * [Version aktualisieren](#version-aktualisieren)
* [🏁 Erste Schritte](#-erste-schritte)
* [🎮 Bedienung](#-bedienung)
* [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
* [📥 Import](#-import)
* [📁 Ordner‑Management (Dialog)](#-ordner-management-1)
* [💾 Backup](#-backup)
* [🗃️ Speichersysteme](#-speichersysteme)
* [🗄️ Datenlayout & Dateiverwaltung](#-datenlayout--dateiverwaltung)
* [🗂️ Projektstruktur](#-projektstruktur)
* [🔧 Erweiterte Funktionen](#-erweiterte-funktionen)
* [🐛 Troubleshooting](#-troubleshooting)
* [🧪 Tests](#-tests)
* [🧩 Wichtige Funktionen](#-wichtige-funktionen)
* [💡 Tipps & Best Practices](#-tipps--best-practices)
* [📝 Changelog](#-changelog)
* [CHANGELOG.md](CHANGELOG.md)

---

## 🏆 Funktionsarchiv (komplett)

> 💡 Tipp: Klappe die folgenden Kapitel bei Bedarf ein, um dich schneller zurechtzufinden.

<details open>
<summary>🎯 Kernfunktionen</summary>

### 🎯 Kernfunktionen

* **Asynchrones Speichern:** Beim Start werden Level- und Kapitel-Daten jetzt korrekt geladen, auch wenn das neue IndexedDB-System verwendet wird.
* **Bereinigte Abschluss-Logik:** Die früheren UI-Helfer `toggleFileCompletion`, `toggleCompletionAll`, `toggleFileSelection` und `toggleSelectAll` wurden entfernt, weil der Fertig-Status nun vollständig automatisch aus den Projekt- und Dateidaten berechnet wird.
* **Live-Speichern:** Änderungen an Dateien oder Texten werden nach kurzer Pause automatisch gesichert.
* **Hintergrund-Übersetzungswarteschlange:** Automatische Übersetzungen laufen projektübergreifend weiter; beim Wechsel landen neue Projekte hinten in der Warteschlange und starten, sobald die aktuelle Übersetzung abgeschlossen ist.
* **Abbruchfeste Übersetzungswarteschlange:** Globale Resets und Projektwechsel stoppen laufende Jobs sofort, leeren alle Warteschlangen und blockieren verspätete Rückläufer, damit keine leeren Projektlisten gespeichert werden.
* **Reset-Flag für Übersetzungen:** Während `resetGlobalState()` aktiv ist, verhindert ein globales Flag jede Projektspeicherung und verwirft späte Worker-Rückläufer nach dem Auflösen ihrer Promises, damit keine alten Antworten mehr in der Projektliste landen.
* **Sauberer Warteschlangen-Abbruch:** Manuelle Abbrüche speichern keine unveränderten Projekte und entfernen Abschlussmeldungen unmittelbar, damit das UI den Stopp klar widerspiegelt.
* **Fehlerfreie Auto-Übersetzungen nach Projektwechsel:** Die Warteschlange schreibt erkannte Ergebnisse jetzt sofort ins passende Projekt, sodass fertige Texte auch nach einem Wechsel oder Neustart zuverlässig in der Tabelle auftauchen. Verspätete Rückläufer landen zunächst in einem sicheren Zwischenspeicher und werden erst nach dem erneuten Laden geschrieben, damit keine leeren Projektlisten mehr überschrieben werden.
* **Sofortspeichern nach GPT- und Emotions-Einträgen:** Übernommene Bewertungen landen weiterhin sofort im Projekt; Sammelläufe der Emotionstexte bündeln ihre Änderungen und lösen danach ein gemeinsames Speichern aus.
* **Gemeinsame Projektliste:** `window.projects` stellt sicher, dass alle Module auf dieselbe Projektreferenz zugreifen.
* **Überarbeitete Lade-Mechanik:** Projekte werden wieder zuverlässig geöffnet und laufende Ladevorgänge blockieren sich nicht mehr gegenseitig.
* **Bereinigter Textvergleich:** Der Helfer `calculateTextSimilarity` verzichtet auf eine ungenutzte Wortmenge und behält alle Funktionen bei.
* **Stabiles Projektladen:** Fehler beim Lesen aus dem Speicher werden abgefangen und als Hinweis angezeigt.
* **Fehlerresistente Projektliste:** Tritt beim Laden ein Speicherfehler auf, bleibt die vorhandene Projektliste unverändert und es erscheint ausschließlich ein Hinweisdialog.
* **Bugfix:** Nach dem Laden eines Projekts reagierte die Oberfläche nicht mehr auf Klicks.
* **Bugfix:** Nach einem Projektwechsel funktionieren alle Toolbar‑Schaltflächen wieder zuverlässig.
* **Automatische Projektreparatur:** Wird ein Projekt nicht gefunden, legt das Tool eine leere Struktur an, ergänzt die Projektliste und lädt alles direkt erneut.
* **Integritätsprüfung beim Start:** Alle gespeicherten Projektschlüssel werden mit der Liste abgeglichen und fehlende Einträge ergänzt.
* **Verzögerte Fehlermeldungen:** Warnhinweise erscheinen erst, wenn ein Reparaturversuch scheitert.
* **Kompatible Projektschlüssel:** Das Tool erkennt das Schema `project:<id>:meta` und lädt vorhandene Projekte korrekt.
* **Schonende Altlasten-Bereinigung:** Die LocalStorage-Reinigung entfernt `hla_projects` nur, wenn keine neuen Projektschlüssel vorhanden sind.
* **Überarbeitete Hilfsskripte:** Python-Tools nutzen jetzt `subprocess.run` mit `check=True` ohne `shell=True` und schließen Dateien konsequent über `with`-Blöcke.
* **Robuster npm-Test:** Fehlt `npm` (z. B. bei Node 22), bricht das Startskript nicht mehr ab, sondern weist auf `corepack enable` oder eine separate Installation hin.
* **Automatische npm-Aktivierung:** `reset_repo.py` versucht bei fehlendem `npm`, es über `corepack` einzurichten, bevor das Tool startet.
* **Automatische Python-Wahl:** `start_tool.py` und `verify_environment.py` suchen bei mehreren Installationen nach einer passenden 64‑Bit‑Python-Version (3.9–3.12) und starten sich bei Bedarf neu.
* **Zuverlässige Python-Abhängigkeiten:** `start_tool.py` prüft Pakete durch Import und `reset_repo.py` installiert `requirements.txt` automatisch.
* **Saubere Einheiten:** Prozentwerte nutzen nun ein geschütztes Leerzeichen und deutsches Dezimaltrennzeichen.
* **Verbessertes Scrollen in der Dateitabelle:** Nach dem Rendern springt die Tabelle nur zur gemerkten Zeile, wenn keine neue Datei markiert wird; andernfalls wird nach der Auswahl gescrollt.
* **Auto-Scroll blockiert Zeilennummer-Aktualisierung:** Der Fallback in `selectRow` setzt kurzzeitig `isAutoScrolling`, damit `updateNumberFromScroll` nicht dazwischenfunkt.
* **Tabellenzentrierte Scroll-Erkennung:** `updateNumberFromScroll` richtet sich nach der Mitte des Tabellencontainers statt nach der Fensterhöhe, wodurch Pfeilnavigation, Buttons und manuelles Scrollen dieselbe Zeile zuverlässig halten.
* **Übersichtliche Auswahlzeile:** Die gewählte Zeile wird mit kleinem Abstand unter dem Tabellenkopf positioniert, bleibt vollständig sichtbar und zeigt noch einen Teil der vorherigen Zeile.
* **Tabellenkopf mit vollem Sichtfenster:** Das Scroll-Padding der Tabelle entspricht jetzt der Höhe des sticky Kopfbereichs, sodass die erste Zeile nicht mehr teilweise verdeckt wird.
* **Überarbeitetes Timing-Layout:** Der Abschnitt „Timing & Bereiche“ nutzt ein zweispaltiges Kartenraster, das bei schmaler Breite automatisch auf eine Spalte umbricht.
* **Adaptive DE-Audio-Ansicht:** Wellenformen, Kopierbereich und Effektgruppen nutzen jetzt ein konsistentes Zweispalten-Raster, das auf kleinen Displays automatisch auf eine Spalte reduziert wird und dem Einfügebereich Luft nach oben lässt.
* **Waveform-Werkzeugleiste für große Monitore:** Zoom- und Höhenregler, synchronisiertes Scrollen sowie Zeitmarken-Lineale sorgen dafür, dass lange Takes auch auf Ultrawide-Displays komfortabel editierbar bleiben.
* **Feinjustierte Waveform-Werkzeugleiste:** Ein enges Grid mit kleineren Buttons und geringem Padding hält Zoom-, Höhen- und Sync-Regler auch bei kleiner Breite dicht beieinander.
* **Dynamische DE-Wellenformbreite:** Die DE-Wellenform übernimmt die echte Laufzeit als Pixelbreite, wodurch Scrollleisten, Lineale und Zoom exakt zur Audiodauer passen und lange Takes nachvollziehbar länger bleiben als die EN-Spur.
* **Frische EN- und DE-Vorschau nach dem Speichern:** Nach dem Speichern lädt der Editor beide Spuren komplett neu, wodurch die EN-Originalspur wieder in voller Länge sichtbar bleibt und nicht mehr zur Miniatur zusammenschrumpft. Gleichzeitig steht die frisch gespeicherte DE-Fassung sofort als neue Arbeitsbasis bereit.
* **Deckelung der Trim-Eingaben:** Die Start- und Endfelder im DE-Audio-Editor begrenzen sich jetzt strikt auf die reale Laufzeit. Auto-Trim, Tempoabgleich und anschließendes Speichern lassen die Markierung sichtbar und gültig, weil `validateDeSelection()` nur noch mit sicheren Werten arbeitet.
* **Stabile Trim-Markierung trotz Längenänderungen:** Sobald Auto-Tempo, Pausenentfernung oder Speichern die Gesamtdauer verändern, klemmt der Editor Start- und End-Trim jetzt automatisch auf gültige Werte, synchronisiert die Eingabefelder und hält die grüne Auswahlmarkierung dauerhaft sichtbar.
* **Aktive DE-Markierung nach dem Speichern:** `applyDeEdit()` setzt Start- und End-Trim nach dem Speichern über `normalizeDeTrim()` auf gültige Werte zurück, lässt `deSelectionActive` bestehen und setzt die Eingabefelder auf die echte Laufzeit statt auf `0`, sodass die Markierung den kompletten Clip weiterhin abbildet.
* **Master-Timeline entfernt:** Die frühere Zeitleiste oberhalb der Wellen entfällt; Zoom-Tasten, Positions-Slider und Sprungknöpfe sitzen jetzt direkt in der Wave-Toolbar.
* **Dichteres Waveform-Raster:** Kleinere Gitterabstände, schmalere Blockabstände und reduziertes Scroll-Padding rücken Original- und DE-Wellenform noch näher zusammen und verkürzen die Wege zu den Buttons.
* **Schlankere Standard-Wellenform:** Neu geöffnete Sitzungen starten mit 80 px hohen Wellenformen, der Höhen-Slider zeigt denselben Startwert und die kompakten Buttons bleiben voll erreichbar.
* **Straffer EN-Übernahmebereich:** Die Übernahmeleiste übernimmt kleinere Margins und Gaps, damit sich der Einfügebereich bündig in das Wellenraster einfügt.
* **Tabbasiertes Effekt-Panel:** Die rechte Seitenleiste bündelt Lautstärke- und Funkgerät-Steuerung als „Kernfunktionen“ und verschiebt Hall-, EM-Störungs- sowie Nebenraum-Regler unter „Erweiterte Optionen“ mit klaren Abschnittstiteln.
* **Detailliertes Fehlerfenster:** Fehlende oder beschädigte Projekte melden sich mit einer genauen Ursache und einem Reparaturhinweis.
* **Debug-Bericht bei Fehlern:** Nach jeder Fehlermeldung kann ein Fenster mit auswählbaren Berichten samt Umgebung geöffnet werden.
* **Zufallsprojekt-Knopf:** Lädt ein zufälliges Projekt und speichert ein Protokoll als Datei oder in die Zwischenablage.
* **Zusätzliche Debug-Ausgaben:** `selectProject` meldet Start und Ende, `loadProjectData` protokolliert den Aufruf von `finalize()`.
* **Aktualisierte Nutzeragent-Erkennung:** Der Debug-Bericht nutzt jetzt `navigator.userAgentData` mit Rückfall.
* **Abgesicherte Ordnerauswahl:** Verweigert der Browser den Dateisystem-Zugriff, erscheint eine verständliche Fehlermeldung.
* **Robustes Datei-Laden:** Beim Import werden Lese- und JSON-Fehler abgefangen; danach prüft das Tool Pflichtfelder und entfernt unbekannte Datei-IDs.
* **Mehrere Projekte** mit Icon, Farbe, Level‑Namen & Teil‑Nummer
* **Ladebalken beim Projektwechsel:** blockiert weitere Wechsel, bis das Projekt vollständig geladen ist
* **Vollständig asynchroner Projektwechsel:** Wartet auf `selectProject`, bevor Folgearbeiten starten
* **Sicherer Projektwechsel:** `pauseAutosave`, `flushPendingWrites` und weitere Helfer räumen Speicher und Listener auf
* **Direktes Speichern bei Texteingaben:** Änderungen in Textfeldern werden ohne Verzögerung automatisch gesichert
* **Sauberer GPT-Reset beim Projektwechsel:** Beendet laufende Bewertungen, entfernt Vorschlagsboxen und verhindert dadurch Fehlermeldungen
* **Abbrechbare GPT-Bewertungen:** Beim Projekt- oder Speicherwechsel werden laufende und wartende Jobs verworfen und im Log vermerkt
* **Sicherer Projektwechsel für GPT:** Projektkarten rufen jetzt `switchProjectSafe` auf und `selectProject` leert den GPT-Zustand vorsorglich
* **Automatischer Neustart bei fehlenden Projekten:** Schlägt das Laden mit „Projekt nicht gefunden“ fehl, lädt `switchProjectSafe` die Liste neu und versucht den Wechsel erneut
* **Reparatur vor erneutem Laden:** Fehlt ein Projekt, führt `switchProjectSafe` zuerst `repairProjectIntegrity` aus und legt fehlende Strukturen automatisch an
* **Fehlende Projekte werden als Platzhalter geladen:** Bleibt ein Projekt auch danach unauffindbar, lädt `switchProjectSafe` einen leeren Platzhalter und setzt den Wechsel fort
* **Fehlendes Ausgangsprojekt blockiert den Wechsel nicht mehr:** Ist das vorherige Projekt verschwunden, gibt `switchProjectSafe` nur eine Warnung aus und `reloadProjectList` indiziert die Liste neu
* **Englische Fehlermeldung erkannt:** Meldungen wie „Project not found“ werden ebenfalls erkannt und die Projektliste neu geladen
* **Robuster Projektaufruf:** Doppelklicks werden ignoriert, fehlende Listen werden nachgeladen und nicht gefundene Projekte melden einen klaren Fehler
* **Einziger Click-Listener für Projektkarten:** Ereignisdelegation verhindert doppelte `selectProject`-Aufrufe beim Neurendern
* **Listener nach Reset neu gesetzt:** `resetGlobalState` setzt den Merker zurück und `renderProjects` bindet den Klick-Listener erneut, damit Projekte weiterhin auswählbar bleiben
* **Projektliste ohne Referenzbruch:** `resetGlobalState` leert `projects` jetzt in-place, sodass `loadProjectData` direkt einen frischen Reload anstößt und Fenster-Referenzen erhalten bleiben.
* **Live-Suche nach Projektwechsel funktionsfähig:** `switchProjectSafe` ruft `initializeEventListeners` erneut auf
* **Fallback ohne `switchProjectSafe`:** Sollte das Skript fehlen, öffnen Klicks Projekte direkt über `selectProject`
* **Synchronisierte Projektreparatur:** `repairProjectIntegrity` wartet auf alle Speicherzugriffe und aktualisiert den In-Memory-Cache sofort
* **Gemeinsame Projektlisten-Aktualisierung:** Der neue Helfer `replaceProjectList` hält `projects` und `window.projects` identisch, sodass Reparaturläufe keine Platzhalter verlieren und `selectProject` sofort wieder funktioniert
* **Projektliste ohne Auto-Auswahl:** `loadProjects` nimmt optional `skipSelect` entgegen; `reloadProjectList` lädt dadurch nur die Liste und öffnet kein altes Projekt
* **Fehlerfreier Projektwechsel:** `switchProjectSafe` lädt vor dem Öffnen die Projektliste neu und vermeidet so die Meldung „Projekte konnten nicht geladen werden“
* **Zentrierter Projektfokus:** Nach einem Projektwechsel scrollt die linke Projektleiste automatisch zum aktiven Eintrag und zentriert ihn
* **Proaktive Listen-Synchronisierung:** Beim Start und nach einem Speichermodus-Wechsel gleicht `reloadProjectList` alle `project:<id>`-Schlüssel mit `hla_projects` ab und ergänzt fehlende Projekte automatisch
* **Gesicherte Dateien vor GPT-Reset:** Beim Projektwechsel werden Dateien zuerst gespeichert und erst danach der GPT-Zustand bereinigt
* **Leere Zeilenreihenfolge beim Projektwechsel:** Neben den GPT-Daten wird auch die Anzeige-Reihenfolge gelöscht
* **Automatischer Ordnerscan beim Projektwechsel:** Nach dem Laden werden Audio-Ordner durchsucht, damit Dateien sofort verfügbar sind
* **Level-Kapitel** zur besseren Gruppierung und ein-/ausklappbaren Bereichen
* **Kapitel bearbeiten:** Name, Farbe und Löschung im Projekt möglich
* **Kapitelwahl beim Erstellen:** Neue oder bestehende Kapitel direkt auswählen
* **Intelligenter Ordner‑Scan** mit Duplikat‑Prävention und Auto‑Normalisierung
* **Eingebettete Audio‑Wiedergabe** (MP3 / WAV / OGG) direkt im Browser
* **EN-Review-Überblick:** Der 🇬🇧-Dialog bietet jetzt eine eigene Wiedergabe mit Fortschrittsanzeige, zeigt EN/DE-Text der aktuellen Zeile, blendet zwei vergangene und zwei kommende Dateien ein und scrollt sowohl bei der automatischen Wiedergabe als auch beim manuellen Zurück/Weiter-Schritt direkt zur passenden Tabellenzeile.
* **EN/DE-Audio-Umschalter im Review:** Im 🇬🇧-Dialog wählst du per Radiogruppe zwischen EN- und DE-Audio; EN ist voreingestellt und DE wird automatisch deaktiviert, wenn für die Datei kein deutsches Audio existiert.
* **Projekt-Player entfernt:** Die frühere Projekt-Wiedergabeliste samt Play/Pause/Stop-Schaltflächen ist gestrichen; die Nummern-Navigation sitzt nun direkt neben dem 🇬🇧-Review-Knopf, der als zentrale Kontrollstelle dient.
* **Stabile EN-Review-Läufe:** Der Audio-Player entfernt alte Review-Handler vor dem nächsten Start, erhöht den Index nach jedem Track nur einmal und setzt danach entweder automatisch zur nächsten Datei über oder stoppt die Wiedergabe sauber am Ende der Liste.
* **Automatische MP3-Konvertierung** beim Start (Originale in `Backups/mp3`)
* **Automatische Prüfung geänderter Endungen** passt Datenbank und Projekte an
* **Live‑Statistiken:** EN‑%, DE‑%, Completion‑%, Globale Textzahlen (EN/DE/BEIDE/∑)
* **Notiz-Übersicht pro Level:** 📊‑Symbol zeigt alle Notizen eines Levels und deren Häufigkeit im gesamten Projekt
* **Vollständig offline** – keine Server, keine externen Abhängigkeiten
* **Direkter Spielstart:** Über eine zentrale Start-Leiste lässt sich das Spiel oder der Workshop in der gewünschten Sprache starten. Der Steam-Pfad wird automatisch aus der Windows‑Registry ermittelt.
* **Schnellstart mit Cheats:** Im Dropdown lassen sich Godmode, unendliche Munition und die Entwicklerkonsole einzeln auswählen. Das Spiel startet nach Klick auf **Starten** mit allen markierten Optionen. Die Voreinstellungen liegen gebündelt in `launch_hla.py` als Konstante, sodass beide Startpfade identische Argumente nutzen.
* **Eigene Video-Links:** Über den Video-Manager lassen sich mehrere URLs speichern und per Knopfdruck öffnen. Fehlt die Desktop-App, werden die Links im Browser gespeichert.
* **Wählbarer Speichermodus:** Beim ersten Start kann zwischen klassischem LocalStorage und einem IndexedDB-System gewählt werden; alle Zugriffe erfolgen über einen Speicher-Adapter.
* **Daten migrieren:** Ein zusätzlicher Knopf kopiert alle LocalStorage-Einträge in das neue Speicher-System.
* **Speichermodus-Anzeige:** In der Werkzeugleiste zeigt ein Indikator das aktive System und ermöglicht den direkten Wechsel ohne automatische Datenübernahme.
* **Eigenes Wörterbuch:** Der 📚-Knopf speichert nun sowohl englisch‑deutsche Übersetzungen als auch Lautschrift.
* **Wörterbuch im Datei-Modus:** Nach einem Speichermodus-Wechsel werden gespeicherte Wörter automatisch geladen.
* **Audio-Datei zuordnen:** Lange Aufnahmen lassen sich automatisch in Segmente teilen, per Klick auswählen, farblich passenden Textzeilen zuweisen und direkt ins Projekt importieren. Über den 🚫‑Knopf markierte Bereiche werden dauerhaft übersprungen und in der Liste grau hinterlegt. Fehlhafte Eingaben löschen die Zuordnung automatisch, laufende Wiedergaben stoppen beim Neu‑Upload. Die gewählte Datei und alle Zuordnungen werden im Projekt gespeichert und sind Teil des Backups. In der Desktop‑Version landet die Originaldatei zusätzlich im Ordner `Sounds/Segments` und trägt die ID des Projekts. Beim Klicken werden ausgewählte Segmente sofort abgespielt. Die Segmentierungslogik ist fest im Hauptskript verankert. Der Datei‑Input besitzt zusätzlich ein `onchange`-Attribut und der Listener wird beim Öffnen des Dialogs neu gesetzt, sodass der Upload immer reagiert. Der Dialog setzt die HTML‑Elemente `segmentFileInput` und `segmentWaveform` voraus.
* **Segment-Zuordnungen behalten:** Beim Neustart lädt der Segment-Dialog automatisch die gespeicherte Audiodatei und zeigt alle zuvor getroffenen Zuordnungen.
* **Kopierhilfe für Emotionen:** Beim Öffnen kopiert der Assistent nun den aktuellen Schritt, ohne schon weiterzuschalten. Mit jedem Klick auf „Weiter“ folgt erst der Emotionstext und anschließend der nächste Name.
* **Zurück‑Knopf und Fortschritts‑Speicherung:** Die Kopierhilfe merkt sich nun auch den aktuellen Schritt und bietet einen neuen „Zurück“-Button zum erneuten Kopieren vorangegangener Einträge.
* **Aufgeräumte Filter-Leiste:** GPT-, Emotions- und Kopierhilfe-Knöpfe stehen jetzt direkt neben der Suche in einer Zeile.
* **Automatischer Voice-Abgleich:** Beim Öffnen der Kopierhilfe lädt das Tool die verfügbaren ElevenLabs-Stimmen und zeigt Namen und IDs korrekt an.
* **Zusätzliche Zwischenablage-Prüfung:** Die Kopierhilfe stellt sicher, dass im ersten Schritt der Name und im zweiten der Emotionstext in der Zwischenablage liegt.
* **Zweite Kopierhilfe:** Ein neuer Dialog blättert durch alle Einträge und zeigt Ordnernamen, deutschen Text und Emotionstext an. Ein Seitenzähler informiert über die aktuelle Position.
* **Alle Emotionstexte kopieren:** Der Button sammelt alle Emotionstexte, entfernt Zeilenumbrüche und trennt die Blöcke mit einer Leerzeile. Optional stellt er die Laufzeit der EN‑Datei im Format `[8,57sec]` voran und/oder hängt `---` ans Ende.
* **Stabile Base64-Kodierung:** Große Audiodateien werden beim Hochladen in handlichen Blöcken verarbeitet, sodass kein "Maximum call stack size exceeded" mehr auftritt.
* **Warteschlange für GPT-Anfragen:** Mehrere Emotionstexte werden nacheinander an OpenAI geschickt, um HTTP‑429‑Fehler zu vermeiden.
* **Vorberechnete Emotionstext-Läufe:** Die Massen-Generierung erstellt eine gemeinsame Zeilenliste samt Positions-Lookup und reicht beides an jeden Worker weiter, wodurch redundante `map`- und Index-Suchen entfallen.
* **ZIP-Import mit Vorschau:** Die gewählte ZIP-Datei wird in einen temporären Ordner entpackt. Scheitert "unzipper", greift automatisch 7‑Zip als Fallback. Anschließend werden die Audios nach führender Nummer sortiert angezeigt und bei Übereinstimmung direkt zugeordnet.
* **Projektkarten mit Rahmen:** Jede Karte besitzt einen grauen Rand und nutzt nun die volle Breite. Im geöffneten Level wird der Rand grün. Das aktuell gewählte Projekt hebt sich mit einem blauen Balken, leicht transparentem Hintergrund (rgba(33,150,243,0.2)) und weißer Schrift deutlich ab.
* **Überarbeitete Seitenleiste:** Jede Projektkarte besteht aus zwei Zeilen mit einheitlich breiten Badges für EN, DE und Audio.
* **Breitere Projektleiste:** Die Sidebar ist jetzt 320 px breit, damit lange Einträge korrekt angezeigt werden.
* **Aktiver Level hervorgehoben:** Geöffnete Level-Gruppen besitzen jetzt einen grünen Rahmen und einen leicht abgedunkelten Hintergrund.
* **Dezente Level-Gruppen:** Geschlossene Level zeigen einen ganz leichten Hintergrund und nur beim Überfahren einen feinen Rahmen.
* **Abgesetzte Level-Blöcke:** Zwischen den Levels erscheint ein grauer Trennstrich und die Level-ID wird kleiner in Grau angezeigt.
* **Abgegrenzte Level-Container:** Jede Level-Gruppe steckt in einer grauen Box mit dezentem Hintergrund, Rundungen und Abstand nach unten.
* **Technische Level-Zeilen:** Level-Namen erscheinen in Monospace mit dezentem Hintergrund; beim Überfahren ändert sich der Pfeil kurz nach unten.
* **Schlichte Kapitelüberschriften:** Jeder Abschnitt beginnt mit einer hellen Zeile samt Sternwertung, ohne Hover-Effekt oder Hintergrund.
* **Optimierte Titelzeile:** Projektnummer und Name erscheinen ohne Kürzung direkt nebeneinander.
* **Einheitliche Fortschritts-Badges:** EN, DE und Audio sind nun 64×24 px groß und zentriert dargestellt.
* **Projekte in allen Leveln:** Nur geöffnete Level zeigen ihre Projekte in einer zweizeiligen Liste aus `<li>`‑Elementen. Gibt es keine Einträge, erscheint „– Keine Projekte vorhanden –“.
* **Hinweis-Symbol bei Übersetzungen:** Unter der Lupe erscheint ein kleines 📝, wenn der DE-Text ein Wort aus dem Wörterbuch enthält.
* **GPT-Bewertungen:** Zeilen lassen sich per ChatGPT bewerten. Bei großen Szenen erscheint ein Fortschrittsdialog, Fehler zeigt ein rotes Banner mit "Erneut versuchen". Beim Überfahren oder Anklicken des Scores erscheint nur der Kommentar. Den vorgeschlagenen Text übernimmst du jetzt durch Klick auf die farbige Box über dem DE-Feld
* **Reste-Modus:** Ein pro Projekt speicherbarer Haken informiert GPT, dass die Zeilen nicht chronologisch sind und unabhängig bewertet oder mit Emotionen versehen werden müssen.
* **Debug-Ausgabe für GPT:** Ist der Debug-Modus aktiv, erscheinen gesendete Daten und Antworten der GPT-API in der Konsole
* **GPT-Konsole:** Beim Klick auf "Bewerten (GPT)" öffnet sich ein Fenster mit einem Log aller gesendeten Prompts und Antworten
* **Prompt-Vorschau:** Vor dem eigentlichen Versand zeigt ein Dialog den kompletten Prompt an. Erst nach Klick auf "Senden" wird die Anfrage gestellt und die Antwort im selben Fenster angezeigt
* **Bewertung per Einfügen-Knopf:** Nach dem Versand erscheint ein zusätzlicher Knopf, der Score, Kommentar und Vorschlag in die Tabelle übernimmt
* **Vorab-Dialog für GPT:** Vor dem Start zeigt ein Fenster, wie viele Zeilen und Sprecher enthalten sind
* **Unbewertete Zeilen:** Noch nicht bewertete Zeilen zeigen eine graue 0
* **Score-Spalte nach Version:** Die farbige Bewertung steht direkt vor dem EN-Text
* **Anpassbarer Bewertungs-Prompt:** Der Text liegt in `prompts/gpt_score.txt`; jede Bewertung liefert nun immer auch einen Verbesserungsvorschlag
* **Auswahl des GPT-Modells:** Im ChatGPT-Dialog lässt sich das Modell wählen. Die Liste wird auf Wunsch vom Server geladen und für 24&nbsp;Stunden gespeichert
* **Automatisch geladene GPT-Einstellungen:** Gespeicherter Key und gewähltes Modell stehen nach dem Start sofort zur Verfügung
* **Robuste GPT-Antworten:** Entfernt ```json-Blöcke``` automatisch und verhindert so Parsefehler
* **Automatische Wiederholung bei 429:** Nutzt jetzt den `Retry-After`-Header und versucht es bis zu fünf Mal erneut
* **Charaktername im GPT-Prompt:** Das Feld `character` nutzt nun den Ordnernamen
* **Bugfix:** Scores werden korrekt eingefügt, auch wenn ID und Score als Zeichenketten geliefert werden
* **Robustere Zuordnung:** GPT-Ergebnisse finden jetzt auch dann die richtige Zeile, wenn die ID leicht abweicht
* **String-Vergleich der IDs:** Datei-IDs werden als Strings abgeglichen, sodass auch Gleitkomma-IDs eindeutig zugeordnet werden
* **Lückenlose GPT-Bewertung:** Teilantworten werden per ID zugeordnet, fehlende Zeilen automatisch nachgefordert und der Dialog hält den Fortschritt fest, bis alle Zeilen bewertet sind.
* **Eigenständige Score-Komponente:** Tooltip und Klick sind in `web/src/scoreColumn.js` gekapselt
* **Einheitliche Score-Klassen:** Die Funktion `scoreClass` vergibt überall die gleichen Farbstufen
* **Feineres Bewertungsschema:** Ab 95 % wird der Score grün, zwischen 85 % und 94 % gelb
* **Score in Prozent:** Die Bewertung wird in der Tabelle mit Prozentzeichen dargestellt
* **Aktive Score-Events:** Nach jedem Rendern bindet `attachScoreHandlers` Tooltip und Klick
* **Bereinigte Score-Aktionen:** Die Score-Spalte verzichtet auf den früheren Helfer `applySuggestion` und konzentriert sich auf die Kommentar-Anzeige
* **Bugfix:** Verwaiste Vorschlagsfelder lösen beim Laden kein Fehlerereignis mehr aus
* **Validierte Vorschlagsfelder:** Fehlt die zugehörige Datei, wird der Eintrag entfernt und eine Meldung weist darauf hin
* **Debug-Bericht bei fehlender Vorschlagsdatei:** Nach dem Entfernen öffnet sich ein Fenster zum Speichern einzelner Berichte
* **Kommentar-Anzeige auf ganzer Fläche:** Der Tooltip reagiert jetzt auf das gesamte Score-Feld
* **Direkter Daten-Refresh:** Nach jeder Bewertung wird die Tabelle mit den aktualisierten Dateien neu gerendert
* **Farbiger GPT-Vorschlag:** Der empfohlene DE-Text erscheint nun oberhalb des Textfelds und nutzt die Score-Farbe
* **Feste Schriftfarben:** Gelber Score nutzt schwarze Schrift, rot und gruen weiss
* **Verbesserungsvorschläge berücksichtigen Länge:** Der Knopf "Verbesserungsvorschläge" öffnet einen Dialog mit drei Alternativen, die sich an Länge und geschätzter Sprechzeit des englischen Originals orientieren
* **Bereinigte Vorschau-Anzeige:** Leere GPT-Vorschläge lassen keinen zusätzlichen Abstand mehr
* **Kommentar über dem Vorschlag:** Ist ein Kommentar vorhanden, erscheint er in weißer Schrift direkt über der farbigen Box
* **Einheitliche GPT-Vorschau:** Der farbige Vorschlagsbalken ist nun direkt klickbar und es gibt nur noch einen Tooltip
* **Niedrigster GPT-Score pro Projekt:** Die Projektübersicht zeigt nun die schlechteste Bewertung aller Zeilen an
* **Automatische Übernahme von GPT-Vorschlägen:** Eine neue Option setzt empfohlene Texte sofort in das DE-Feld
* **Einfüge-Knopf versteht JSON:** Manuell in den GPT-Test kopierte Antworten können direkt übernommen werden
* **Zuverlässiges Einfügen:** Der Einfüge-Knopf lädt fehlende Module nach, überträgt Score und Vorschlag in die Daten und zeichnet die Tabelle neu
* **Kompatible Nachladung:** Beim Einfügen erkennt das Tool nun auch CommonJS-Exporte und verhindert so Fehler
* **Fehlerbehebung beim Einfügen:** Der Button funktioniert nun auch, wenn `applyEvaluationResults` nur global definiert war
* **Projektgebundene GPT-Ergebnisse:** Bewertungsdaten tragen eine `projectId` und werden nur im passenden Projekt eingetragen
* **Dritte Spalte im GPT-Test als Tabelle:** Rechts zeigt jetzt eine übersichtliche Tabelle mit ID, Dateiname, Ordner, Bewertung, Vorschlag und Kommentar alle Ergebnisse an
* **Speicherfunktion für GPT-Test:** Jeder Versand erzeugt einen neuen Tab mit Prompt, Antwort und Tabelle. Tabs lassen sich wechseln und löschen.
* **GPT-Tabs pro Projekt:** Geöffnete Tests bleiben gespeichert und erscheinen beim nächsten Öffnen wieder.
* **GPT-Knopf direkt neben der Suche:** Ein Klick öffnet die gespeicherten GPT-Tabs des aktuellen Projekts.
* **Einfüge-Knopf für gespeicherte Tests:** Beim Wechsel des Tabs wird der Button aktiviert und übernimmt Score und Vorschlag korrekt.
* **Feste Buttons im GPT-Test:** Das Fenster hat nun eine begrenzte Höhe, Prompt- und Ergebnis-Spalten scrollen separat.
* **Visualisierter GPT-Fortschritt:** Der GPT-Testdialog zeigt jetzt klar getrennte Bereiche für Prompt, Fortschritt und Antwort. Eine neue Schrittanzeige, ein Live-Log und ein Fortschrittsbalken machen sichtbar, wie weit die Bewertung ist und welche Phase gerade läuft.
* **Kompakter GPT-Versand:** Doppelte Zeilen werden zusammengefasst. Der Startdialog zeigt an, wie viele Zeilen wirklich übertragen werden.
* **Schlanker Video-Bereich:** Gespeicherte Links öffnen sich im Browser. Interner Player und OCR wurden entfernt.
* **Bereinigte Electron-Brücke:** Die frühere `ocrApi` entfällt vollständig; der Preload stellt nur noch die tatsächlich genutzten Schnittstellen bereit.
* **Video-Bookmarks:** Speichert Links für einen schnellen Zugriff.
* **Gemeinsamer Zeitstempel-Helfer:** Hauptoberfläche und Video-Manager nutzen `utils/videoFrameUtils.js` für identische Startzeiten.
* **Löschen per Desktop-API:** Einzelne Bookmarks lassen sich über einen IPC-Kanal entfernen.
* **Tests für Video-Bookmarks:** Überprüfen Laden, Sortierung sowie Hinzufügen und Entfernen von Einträgen.
* **Tests für Segment-Dialog:** Stellt sicher, dass analysierte Segmente gespeichert und wieder geladen werden.
* **Prüfung von Video-Links:** Eingaben müssen mit `https://` beginnen und dürfen keine Leerzeichen enthalten.
* **Duplikat-Prüfung & dauerhafte Speicherung im Nutzerordner**
* **Automatische YouTube-Titel:** Beim Hinzufügen lädt das Tool den Videotitel per oEmbed und sortiert die Liste alphabetisch. Schlägt dies fehl, wird die eingegebene URL als Titel gespeichert.
* **Überarbeitete Video-Manager-Oberfläche:** Neue Farbakzente und deutliche Aktions-Icons erleichtern die Bedienung.
* **Stabiles Sortieren:** Nach Filterung oder Sortierung funktionieren die Video-Buttons dank Originalindex weiterhin korrekt.
* **Thumbnail-Ansicht:** Die Tabelle zeigt Vorschaubilder, ein Klick auf Titel oder Bild öffnet das Video im Browser.
* **Vorschaubilder direkt per ffmpeg:** Das Storyboard wird nicht mehr verwendet. Die Desktop-App erstellt das Bild sofort über `get-video-frame` im Ordner `videoFrames` und benötigt keinen Storyboard-Fallback mehr.
* **Direkte URL via yt-dlp:** Ist `yt-dlp` installiert, nutzt das Tool diese Methode automatisch. `ytdl-core` und `play-dl` dienen nur noch als Fallback.
* **Hilfsfunktion `previewFor`:** Ruft direkt `get-video-frame` auf und zeigt bei Fehlern das normale YouTube-Thumbnail.
* **Neu initialisierter Video-Manager:** DOM-Knoten und Listener werden über `initVideoManager` gesammelt, sodass ein Projektwechsel alle Buttons, Filter und das Grid zuverlässig neu verdrahtet.
* **Moderne Rasteransicht:** Gespeicherte Videos erscheinen jetzt in einem übersichtlichen Grid mit großem Thumbnail und direktem "Aktualisieren"-Knopf.
* **Storyboards entfernt:** Der frühere ⟳-Knopf sowie sämtliche Storyboard-Fallbacks wurden entfernt; Vorschaubilder stammen ausschließlich aus dem ffmpeg-Aufruf `get-video-frame`.
* **Intuitiver Hinzufügen-Button:** Der +‑Button sitzt nun direkt neben dem URL-Feld und speichert den Link auf Knopfdruck.
* **Fixer Dialog-Abstand:** Der Video-Manager steht nun stets mit 10 % Rand im Fenster. Die Funktion `adjustVideoDialogHeight` wurde entfernt.
* **Behobenes Resize-Problem:** Nach einer Verkleinerung wächst der Videoplayer jetzt korrekt mit, sobald das Fenster wieder größer wird.
* **Stabiler Startzustand:** CSS-Duplikate entfernt; `video-dialog` startet immer mit 10 % Abstand.
* **Bereinigtes Stylesheet:** `style.css` enthält `video-dialog` und `wb-grid` nur noch einmal am Dateiende.
* **Finale Stylesheet-Overrides:** Am Dateiende erzwingen `!important`-Angaben die korrekte Größe des Video-Managers.
* **Korrektes Skalieren nach erneutem Öffnen:** Der Player passt sich nach dem Wiedereinblenden automatisch an die aktuelle Fenstergröße an.
* **Aktualisierung im Hintergrund:** Selbst bei geschlossenem Player wird die Größe im Hintergrund neu berechnet und beim nächsten Öffnen korrekt übernommen.
* **Verbesserte Thumbnail-Ladefunktion:** Vorschaubilder werden über `i.ytimg.com` geladen und die gesamte Zeile ist zum Öffnen des Videos anklickbar.
* **Angepasste Content Security Policy:** `connect-src` erlaubt nun zusätzlich `i.ytimg.com` und `api.openai.com`, damit YouTube-Thumbnails und die GPT-API funktionieren.
* **Fehlerhinweis bei fehlender YouTube-API:** Lädt der Player nicht, erscheint eine Meldung statt eines schwarzen Fensters.
* **Fallback ohne YouTube-API:** Kann das Script nicht geladen werden, öffnet sich der Link automatisch im Browser.
* **Toast bei gesperrten Videos:** Tritt ein YouTube-Fehler auf, informiert ein roter Hinweis über mögliche Proxy-Pflicht.
* **Strg+Umschalt+V** liest eine YouTube-URL aus der Zwischenablage und fügt sie automatisch ein.
* **Hilfsfunktion `extractYoutubeId`:** Einheitliche Erkennung der Video-ID aus YouTube-Links.
* **Schlankerer Video-Manager:** URL-Eingabefeld unter den Buttons und eine klar beschriftete Aktions-Spalte. Der Player behält auf allen Monitoren sein 16:9-Format, ohne seitlichen Beschnitt, und die Steuerleiste bleibt sichtbar.
* **Maximierte Listenbreite:** Die gespeicherten Videos beanspruchen nun maximal 480 px Breite. Titelspalte und Vorschaubild bleiben schlank und das Thumbnail hält stets das Seitenverhältnis 16:9.
* **Automatische Dialogbreite:** Ohne geöffneten Player richtet sich die Breite des Video-Managers nach der Liste.
* **Konstante Dialoggröße:** Dank `clamp()` bleibt das Fenster jetzt auch ohne geladenes Video angenehm breit und bietet Platz für künftige Erweiterungen.
* **Flexibles Fenster für gespeicherte Videos:** Höhe passt sich jetzt automatisch an Videoplayer und Liste an.
* **Voll ausgenutzte Video-Liste:** Das Tabellenfeld wächst bis zum unteren Rand des Dialogs und lässt keinen Leerraum unter dem Schließen-Button.
* **Breitenbegrenzter Player:** Die Breite richtet sich nach der verfügbaren Höhe und überschreitet nie das Format 16:9.
* **Verbesserte Player-Anpassung:** Die Höhe des IFrames ergibt sich jetzt aus der Dialogbreite und wird auf 90 % der Fensterhöhe begrenzt. Zwei `requestAnimationFrame`-Aufrufe sorgen nach jedem Öffnen oder Resize für korrekte Maße.
* **Fehlerfreies Skalieren nach Schließen:** Ändert man die Fenstergröße bei geschlossenem Dialog, berechnet das IFrame seine Breite beim nächsten Öffnen korrekt neu.
* **Stabilerer ResizeObserver:** Die Dialog-Anpassung läuft jetzt nur noch einmal pro Frame und vermeidet die Fehlermeldung "ResizeObserver loop limit exceeded".
* **Gethrottleter Video-ResizeObserver:** `adjustVideoPlayerSize` und `positionOverlay` werden pro Frame gebündelt ausgeführt und umgehen so Endlos-Schleifen.
* **Dynamische Größenberechnung:** `calcLayout()` ermittelt Breite und Höhe des Players aus Dialog- und Panelgröße und wird per `ResizeObserver` automatisch aufgerufen.
* **Exportfunktion für Video-Bookmarks:** Gespeicherte Links lassen sich als `videoBookmarks.json` herunterladen.
* **Leeres Suchfeld beim Öffnen:** Der Filter im Video-Manager wird jedes Mal zurückgesetzt, damit alle gespeicherten Links sofort sichtbar sind.
* **Responsiver Video-Manager:** Fester Dialog-Abstand, flexible Toolbar mit Min-Buttons und kompaktem ❌-Icon bei schmaler Breite. Tabellenzeilen besitzen gleichmäßiges Padding und einen Hover-Effekt.
* **Robuster Video-Dialog:** Das Flex-Layout verhindert Überlappungen und lässt jede Sektion dynamisch wachsen.
* **Stabileres Grid-Layout im Video-Manager:** Die Aufteilung nutzt jetzt CSS-Grid und die Anzeige aller Dialoge wird komplett über die Klasse `.hidden` gesteuert.
* **Bereinigte CSS-Regeln:** Alte, starre Blöcke gelöscht; `video-dialog` und `wb-grid` stehen jetzt einmalig am Ende.
* **Vereinfachtes Dialoglayout:** Grundwerte und geöffnete Variante wurden zu einem Grid-Block zusammengeführt.
* **Entschlacktes Video-Dialog-Raster:** Kopf, Inhalt und Steuerleiste passen sich automatisch an und der Rahmen zeigt keine Scrollbalken mehr.
* **Klar kommentierte CSS-Blöcke:** `video-dialog` und `wb-grid` besitzen jetzt eindeutige Abschnittsüberschriften.
* **Verbesserter Schließen-Button:** Das kleine ❌ sitzt fest oben rechts im Dialog.
* **Aufgeräumtes Drei-Leisten-Layout** für Projektsteuerung, Spielstart und Dateifilter.
* **Flexible Player-Steuerleiste:** Bei schmalen Fenstern rutscht der Slider in eine zweite Zeile. Icons und Zeitangaben verkleinern sich automatisch.
* **Steuerleiste unter dem Video:** Die Buttons sitzen jetzt statisch unter dem Player, nutzen die volle Breite und bleiben in einer Zeile.
* **Scrollbarer Videobereich:** Wird das Video höher als der Dialog, lässt sich der Player innerhalb des Fensters scrollen und die Buttons bleiben sichtbar.
* **Verbesserte Scroll-Performance:** Der Wheel-Handler ist nun passiv und reagiert flüssiger auf Mausbewegungen.
* **Beobachter pausieren beim Schließen:** Der ResizeObserver meldet sich ab, sobald der Dialog verborgen wird, und startet erst beim erneuten Öffnen. Dank zusätzlicher Prüfungen entstehen keine Endlos-Schleifen mehr.
* **Kompatibles Öffnen des Video-Managers:** Erkennt fehlendes `showModal()` und zeigt den Dialog trotzdem an.
* **Reaktivierter Klick-Listener:** Der "Videos"-Button öffnet den Manager nun zuverlässig.
* **Sicheres Öffnen des Video-Managers:** `showModal()` wird nur noch aufgerufen, wenn der Dialog geschlossen ist.
* **Fehlerfreies Mehrfach-Öffnen:** Beide Klick-Handler prüfen jetzt das `open`-Attribut und vermeiden so eine DOMException.
* **Player zeigt sich zuverlässig:** Beim Anklicken eines gespeicherten Videos wird der Player sichtbar und das Dialogfenster nur bei Bedarf neu geöffnet.
* **Schnellerer Dialog-Aufruf:** Die `open`-Prüfung passiert vor dem Neuladen der Tabelle und spart so unnötige Arbeit.
* **Startet geschlossen:** Beim Laden der Anwendung bleibt der Video-Manager nun verborgen und öffnet sich erst nach Klick auf den "Videos"-Button.
* **Mindestgröße für den Video-Dialog:** Beim Öffnen passt sich der Dialog an die Fenstergröße an, bleibt aber mindestens 600×400 px groß. Alle ❌-Buttons rufen jetzt sicher `videoDlg.close()` auf.
* **Dialog startet bei 80 % Fenstergröße:** Direkt nach `showModal()` setzt das Skript Breite und Höhe auf 80 % des Browserfensters. Ein `DOMContentLoaded`-Listener im IFrame stellt diese Werte nach dem Laden von YouTube erneut ein.
* **Optimal genutzter Player-Bereich:** Breite und Höhe orientieren sich jetzt an der größeren freien Dimension. Die Player-Sektion schrumpft exakt auf die IFrame-Höhe und vermeidet so schwarze Balken.
* **Einheitliche Größenberechnung:** Auch `adjustVideoPlayerSize()` prüft nun freie Breite und Höhe und wählt automatisch das größere Maß.
* **Immer sichtbarer Player:** Eine Mindestgröße von 320×180 verhindert, dass der eingebettete Player verschwindet.
* **Screenshot per IPC:** Der Kanal `capture-frame` liefert einen sofortigen Screenshot des Hauptfensters.
* **Video-API im Preload:** Über `window.videoApi` stehen `loadBookmarks`, `saveBookmarks`, `deleteBookmark` und `getFrame` sicher im Renderer zur Verfügung.
* **Desktop-Capturer entfernt:** Die API `desktopCapturer.getSources` steht nicht mehr zur Verfügung.
</details>

<details>
<summary>📊 Fortschritts‑Tracking</summary>

### 📊 Fortschritts‑Tracking

* **Globale Dashboard‑Kacheln:** Gesamt, Übersetzt, Ordner komplett, **EN/DE/BEIDE/∑**
* **Level‑Statistik‑Panel** (aufklappbar im Ordner‑Browser)
* **Projekt‑übergreifende Fortschrittsanzeige:** Dateien und Dashboard zeigen Status über alle Projekte
* **Case-insensitiver Audio-Abgleich:** Fortschrittsbalken erkennen `.WAV`- und `.MP3`-Dateien jetzt unabhängig von der Groß-/Kleinschreibung der Endung.
* **Optimierter Audio-Index:** Fehlende DE-Audios greifen zuerst auf den gepflegten Index zu; nur bei Bedarf wird einmalig eine geschützte Reindizierung ausgelöst, wodurch große Projekte ohne wiederholte Vollscans flott bleiben.
* **Visuelle Gesamtbalken** in der Filter-Leiste zeigen den Fortschritt aller Projekte
* **Emo-Status-Anzeige:** Ein violettes Feld zählt gefüllte, leere und fehlerhafte Emotional-Texte. Ein Klick darauf generiert fehlende oder fehlerhafte Einträge neu.
* **Grüne Rahmen** für **100 %**‑Projekte & vollständig übersetzte Ordner
* **Grüne Haken** für abgeschlossene Kapitel
* **Dateizeilen‑Badges:** Übersetzt / Ignoriert / Offen

</details>

<details>
<summary>📁 Ordner‑Management</summary>

### 📁 Ordner‑Management

* **Folder‑Browser** mit Icons, Such‑ & Filter‑Funktionen
* **Pfad‑Anzeige:** Jede Datei zeigt aufgelösten Pfad mit Status
* **Ignorieren‑Toggle** für unnötige Audios (🚫 Ignorieren / ↩ Wieder aufnehmen)
* **Datenbank‑Bereinigung:** Korrigiert falsche Ordnernamen automatisch
* **Ordner‑Löschfunktion:** Sichere Entfernung ganzer Ordner aus der DB
* **Live‑Filter:** *„Übersetzt / Ignoriert / Offen"*
* **Ordner‑Anpassung:** Icons und Farben pro Ordner
* **Live‑Suche im Ordner** analog zur globalen Suche (Cursor bleibt beim Tippen an der richtigen Position) – unterstützt jetzt mehrere Suchbegriffe mit Leerzeichen
* **Projekt aus fehlenden Dateien:** Über den Knopf „Projekt erstellen mit fehlenden Dateien“ sammelt der Ordner-Browser alle Dateien ohne deutsche Audios. Beim ersten Gebrauch wird automatisch das Kapitel "Offene" (Nr. 9999) angelegt und pro Ordner ein gleichnamiges Level verwendet. Enthält ein Projekt mehr als 50 offene Dateien, wird es automatisch in mehrere Projekte mit jeweils höchstens 50 Dateien aufgeteilt.

### 🖋️ Texteingabe & Navigation

* **Verbessertes Auto‑Resize** – Textfelder schneiden keine Zeilen mehr ab und bleiben zwischen EN & DE höhengleich
* **Automatische Anpassung beim Laden** der Textfelder beim Projektstart
* **Sofort‑Speicherung** nach 1 s Inaktivität
* **Tab/Shift+Tab Navigation** zwischen Textfeldern und Zeilen
* **Ctrl+Leertaste:** Audio‑Playback direkt im Textfeld
* **Copy‑Buttons:** 📋 neben jedem Textfeld für direktes Kopieren
* **Emotionaler DE‑Text:** Unter jedem deutschen Textfeld befindet sich ein eigenes Feld mit violettem Hintergrund. Der Button „Emotional-Text (DE) generieren“ erstellt den Inhalt nun stets neu; ein 📋‑Knopf kopiert ihn.
* **Emotionen (DE) generieren:** Der Button oberhalb der Tabelle erstellt jetzt für alle Zeilen neue Emotional-Text-Felder – vorhandene Inhalte werden überschrieben.
* **Gebündeltes Speichern bei Sammelläufen:** Wenn du den Sammel-Button nutzt, landen alle frisch generierten Emotionstexte nach Abschluss in einem einzigen Speicherdurchlauf; der gewohnte Autosave-Timer bleibt dennoch aktiv.
* **Anpassen‑Kürzen:** Direkt neben dem Generieren-Knopf passt ein weiterer Button den Emotional-Text auf die Länge der englischen Originalaufnahme an. Bei sehr kurzen EN-Zeilen darf der deutsche Text nun kreativ gekürzt und leicht umformuliert werden, unterschreitet dabei aber nie die Länge des Originals. Die Begründung unter dem violetten Feld erklärt weiterhin kurz, wie der Text auf z. B. "8,57 s" gebracht wurde.
* **Verbessern:** Ein zusätzlicher Button bewertet die gesamte Übersetzung, zeigt drei verbesserte Fassungen des Emotional-Texts samt Begründung und blendet während der Analyse eine Lade-Animation ein.
* **Eigenheiten bewahren:** Abgebrochene Sätze oder Fülllaute wie "äh" oder "mh" bleiben auch in gekürzten Emotional-Texten sinngemäß erhalten.
* **Laufzeit vor Emotional-Text:** Der 📋-Knopf schreibt beim Kopieren jetzt die Dauer der EN-Datei im Format `[8,57sec]` vor den Text.
* **Schnellsprech-Häkchen:** Beim Button „Emotionen kopieren“ ergänzt ein optionales Häkchen in der ersten Klammer „extrem schnell reden“ direkt nach dem ersten Emotionstag.
* **Kontextvolle Emotionstags:** Beim Generieren eines Emotional-Texts wird nun der komplette Dialog des Levels an ChatGPT gesendet, damit der Tonfall korrekt erkannt wird.
* **Tags mitten im Satz:** Die erzeugten Emotionstags stehen jetzt direkt vor der jeweiligen Textstelle und nicht mehr am Ende der Zeile.
* **Tags auf Deutsch:** In den eckigen Klammern sind die Emotionstags nun auf Deutsch, der eigentliche Dialog bleibt weiterhin Deutsch.
* **Begründung für Emotionstags:** Unter dem violetten Textfeld erscheint eine kurze Erklärung, warum diese Emotion gewählt wurde.
* **Nie zwei Emotionstags hintereinander:** Die generierten Texte setzen maximal einen Tag auf einmal; aufeinanderfolgende Tags werden vermieden.
* **Automatische Übersetzungsvorschau** unter jedem DE-Feld via *Argos Translate*
* **Kompakter Auto-Übersetzungstext:** Vorschläge unter dem DE-Feld werden nun
  mit kleiner Schrift (0.8 rem) angezeigt
* **Umlaute korrekt anzeigen:** Die automatischen Übersetzungen nutzen nun immer UTF‑8
* **Gespeicherte Übersetzungen:** einmal erzeugte Vorschläge werden im Projekt abgelegt und nur bei Änderungen neu berechnet
* **Fortschrittsanzeige** beim automatischen Übersetzen aller fehlenden Texte
* **Lade-Indikator für Übersetzungen:** Jede Anfrage zeigt nun einen Spinner und das Ergebnis kommt über das IPC-Event `translate-finished`
* **Fehlerhinweis bei Übersetzungsproblemen:** Schlägt die automatische Übersetzung fehl, erscheint eine Meldung mit dem konkreten Grund, der auch im Konsolenprotokoll steht
* **Automatischer Neustartversuch:** Nach einem Programmneustart wird beim ersten geöffneten Projekt eine fehlgeschlagene Übersetzung einmalig automatisch neu gestartet
* **Robuste Initialübersetzung:** Auch Dateien mit der numerischen ID `0` landen jetzt zuverlässig in der Warteschlange, sodass frisch importierte Projekte sofort automatisch übersetzt werden
* **Rechtsklick auf Übersetzungsvorschlag:** Ein Kontextmenü erlaubt die automatische Übersetzung der aktuellen oder aller Zeilen
* **Projekt-Playback:** ▶/⏸/⏹ spielt verfügbare DE-Dateien nacheinander ab
* **Numerische Navigation:** ▲/▼ neben den Playback-Knöpfen springen zur nächsten oder vorherigen Nummer und stellen sicher, dass Nummer, Dateiname und Ordner direkt unter dem Tabellenkopf komplett sichtbar bleiben. Beim Scrollen mit dem Mausrad wird automatisch die Zeile in Bildschirmmitte markiert, ohne die Ausrichtung zu verändern. Schnelle Klicks nach unten funktionieren jetzt ebenfalls ohne Zurückspringen
* **Aktuelle Zeile angeheftet:** Beim Scrollen bleibt die oberste Zeile direkt unter der Überschrift stehen und ist dezent markiert
* **Feste Reihenfolge:** Beim Projekt-Playback wird die Dateiliste strikt von oben nach unten abgespielt, unabhängig vom Dateityp
* **Stabileres Audio-Playback:** Unterbrochene Wiedergabe erzeugt keine Fehlermeldungen mehr
* **Fehlerhinweis bei der Bearbeitungs-Vorschau:** Schlägt das Abspielen fehl, erscheint jetzt eine Meldung
* **Automatischer History-Eintrag:** Beim Lautstärkeabgleich wird das Original gespeichert
* **Funkgeräte-Effekt:** Alle Parameter (Bandpass, Sättigung, Rauschen, Knackser, Wet) lassen sich bequem per Regler einstellen und werden dauerhaft gespeichert.
* **Hall-Effekt mit Raumgröße, Hallintensität und Verzögerung:** alle Werte lassen sich justieren und bleiben erhalten.
* **EM-Störgeräusch mit professionellem Bedienmenü:** realistische Aussetzer, Knackser und Ausreißer; Stärke, Verlauf (Anstieg, Anstieg & Abfall, Abfall, konstant), Anstiegszeit sowie Aussetzer-, Knackser- und Spike-Häufigkeit und -Amplitude sind frei wählbar.
* **Visualisierung der Störgeräusch-Hüllkurve:** Ein Canvas stellt die berechnete Hüllkurve dar und aktualisiert sich bei jeder Regleränderung.
* **Sprachdämpfung-Schalter:** Dämpft das Originalsignal synchron zu Aussetzern und Knacksern.
* **Presets für EM-Störgeräusch:** Individuelle Einstellungen lassen sich speichern und später wieder laden.
* **Nebenraum- und Hall-Effekt getrennt schaltbar:** Beide Effekte besitzen eigene Kontrollkästchen und lassen sich einzeln oder gemeinsam aktivieren.
* **Hall-Effekt im Nebenraum-Dialog separat nutzbar:** Der Hall des Nebenraums kann nun auch ohne aktivierten Nebenraum-Effekt verwendet werden.
* **Hall-Effekt wird auch ohne Nebenraum-Effekt gespeichert:** Beim Speichern bleibt der Hall erhalten, selbst wenn der Nebenraum-Effekt deaktiviert ist.
* **Telefon-auf-Tisch-Effekt:** Simuliert ein abgelegtes Mikrofon, das entfernte Gespräche im Raum aufnimmt; wählbare Raum-Presets wie Wohnzimmer, Büro oder Halle erlauben eine Feinabstimmung.
* **Presets für Funkgeräte-Effekt:** Beliebige Einstellungen lassen sich unter eigenem Namen speichern und später wieder laden.
* **Neues Dialogfeld beim Speichern eines Funkgeräte-Presets:** Die Namenseingabe erfolgt jetzt in einem eigenen Fenster.
* **Getrennte Effektbereiche:** Funkgerät-, Hall- und Störgeräusch-Einstellungen liegen nun in eigenen Abschnitten des Dialogs.
* **Verbesserte Buttons:** Die kräftig gefärbten Schalter heben sich im aktiven Zustand blau hervor.
* **Platzsparende Fußleiste:** Unterhalb der Karten sitzt nur noch eine schmale Zeile mit „Zurücksetzen“ und „Speichern“, die ohne Sticky-Verhalten auskommt und den Editor kompakt hält.
* **Buttons auch im Kopfbereich:** Die Aktionen „Zurücksetzen“, „Speichern“ und „Speichern & schließen“ stehen zusätzlich oben rechts im Dialog bereit, sodass der Zugriff unabhängig von der Scrollposition möglich ist.
* **Speichern ohne Unterbrechung:** Der reguläre „Speichern“-Knopf lässt das Bearbeitungsfenster geöffnet, aktualisiert sofort alle Puffer und Formularfelder und ermöglicht dadurch mehrere Speichervorgänge hintereinander. Nur der neue Button „Speichern & schließen“ beendet den Dialog bewusst.
* **Schneller Zugriff:** Die Schnellzugriffsleiste erscheint jetzt als kompakte Toolbar mit kurzen Labels direkt neben den Icons. Trim ✂️, Auto ⚡, Tempo ⏱️, Pegel 🔊 und Funk 📻 lassen sich dadurch schneller erfassen, rücken enger zusammen und lenken beim Klick weiterhin die passende Detailkarte in den Fokus. Unter 1000 px brechen die Buttons automatisch um und auf sehr schmalen Displays zeigen sie nur noch das Icon.
* **Responsives Layout:** Der Editor nutzt ein zweispaltiges Raster, das sich auf großen Monitoren weit öffnet und bei geringer Breite automatisch in eine Spalte wechselt. Die Effektseite besitzt eine eigene Scrollfläche, wodurch alles sichtbar bleibt.
* **Timeline & Master-Steuerung:** Eine neue Timeline oberhalb der Wellenformen zeigt Sekundenmarken, Trim-, Ignorier- und Stillenmarker farbig an. Darunter bündeln ein gemeinsamer Zoom-Regler samt +/-‑Buttons und ein Scroll-Slider beide Wellen, markieren den sichtbaren Ausschnitt und halten Zoom-Anzeige sowie Scrollprozente synchron.
* **Klare Wiedergabesteuerung:** Play- und Stop-Schaltflächen sitzen jetzt in einer durchgehenden Reihe, nutzen 18 px große Symbole und kontrastieren stärker mit dem dunklen Hintergrund.
* **Standardwerte:** Im Hall- und Störgeräusch-Bereich setzt **⟳ Standardwerte** alle Parameter beziehungsweise die Intensität auf ihre Ausgangswerte zurück. Tooltip und Code-Kommentar erklären übereinstimmend: „Setzt nur diesen Effekt zurück.“
* **Verbessertes Speichern:** Nach dem Anwenden von Lautstärke angleichen oder Funkgerät‑Effekt bleiben die Änderungen nun zuverlässig erhalten.
* **Fünf Bearbeitungssymbole:** Der Status neben der Schere zeigt nun bis zu fünf Icons in zwei Reihen für Trimmen, Lautstärkeangleichung, Funkgerät-, Hall- und Störgeräusch-Effekt an.
* **Ignorier-Bereiche im DE-Editor:** Mit gedrückter Umschalttaste lassen sich beliebige Abschnitte markieren, die beim Abspielen und Speichern übersprungen werden. Die Bereiche bleiben bearbeitbar und erscheinen in einer eigenen Liste. Vorschau und Export überspringen diese Stellen automatisch.
* **Stille einfügen:** Mit gedrückter Alt‑Taste lassen sich Bereiche markieren, an denen beim Speichern Stille eingefügt wird. So lassen sich Audios zeitlich verschieben.
* **EN-Abschnitt einfügen:** Ziehe mit der Maus im EN-Original einen Bereich auf. Über den Pfeil zwischen den beiden Wellen lässt sich der markierte Ausschnitt am Anfang, am Ende oder an der aktuellen Cursor-Position in das DE-Audio kopieren. Doppelklick oder Esc setzen Start auf `0` und Ende auf die volle Laufzeit (`Math.round(editDurationMs)`), aktivieren damit die Markierung sofort neu und halten `start < end` gültig; beim Schließen des Bearbeitungsdialogs werden Start, Ende und Einfügeposition zurückgesetzt.
* **Start/Ende verschieben:** Die Markierungsgriffe im EN-Original lassen sich mit der Maus bewegen; die Felder „Start EN" und „Ende EN" passen sich automatisch an.
* **Live-Markierung beim Ziehen:** Änderungen an Start oder Ende aktualisieren die Wellenformen nun sofort während des Verschiebens.
* **Bessere Anfasser:** Kleine Griffe oben und unten erleichtern das Verschieben von Start- und Endpunkten in EN- und DE-Wellenform.
* **Texte unter den Wellenformen:** Unter der EN-Welle erscheint der englische Text und unter der DE-Welle der emotionale deutsche Text.
* **Manuelles Zuschneiden:** Start- und Endzeit lassen sich per Millisekundenfeld oder durch Ziehen eines Bereichs direkt im DE-Wellenbild setzen; die Felder synchronisieren sich bidirektional.
* **Automatische Pausenkürzung und Time‑Stretching:** Längere Pausen erkennt das Tool auf Wunsch selbst. Mit einem Regler lässt sich das Tempo von 1,00–3,00 anpassen oder automatisch auf die EN-Länge setzen. Kleine ➖/➕‑Knöpfe erlauben präzise Schritte. Ein Button „🎯 Anpassen & Anwenden“ kombiniert beide Schritte und eine farbige Anzeige warnt bei Abweichungen.
* **Zwei Tempo‑Auto‑Knöpfe:** Der erste setzt den Wert auf 1,00 und markiert ihn gelb. Der zweite erhöht das Tempo automatisch, bis die DE-Länge ungefähr der EN-Zeit entspricht.
* **EN-Originalzeit neben DE-Zeit:** Rechts neben der DE-Dauer zeigt der Editor nun die englische Originalzeit an.
* **Sanftere Pausenkürzung:** Beim Entfernen langer Pausen bleiben jetzt 2 ms an jedem Übergang stehen, damit die Schnitte nicht zu hart wirken.
* **Längenvergleich visualisiert:** Unter der DE-Wellenform zeigt ein Tooltip die neue Dauer. Abweichungen über 5 % werden orange oder rot hervorgehoben.
* **Effektparameter speicherbar:** Trimmen, Pausenkürzung und Tempo werden im Projekt gesichert und lassen sich über "🔄 Zurücksetzen" rückgängig machen.
* **Automatisch entfernte Pausen werden nicht gespeichert:** Die Liste der Ignorier-Bereiche wird nach dem Speichern geleert.
* **Bugfix beim Ziehen:** Ein versehentlicher Drag ohne den Griff löst keine Fehlermeldung mehr aus.
* **Bugfix:** Die Tempoanpassung nutzte versehentlich "window" als Variablennamen, was einen Fehler auslöste. Jetzt funktioniert das Time‑Stretching wieder.
* **Verbessertes Time‑Stretching:** Durch Einsatz von SoundTouchJS klingt die automatische Tempoanpassung ohne Roboter-Effekt.
* **Bugfix:** Beim automatischen Time‑Stretch wird die gepolsterte Stille nun korrekt anhand des Faktors entfernt. Dadurch verschwinden am Ende keine Millisekunden mehr.
* **Bugfix:** Die zuvor automatisch angehängten 100 ms Stille wurden entfernt. Wer den Beginn kürzen möchte, kann dies nun manuell erledigen.
* **Bugfix:** Ein ganzes Sekundenpolster vor und nach dem Time‑Stretch wird nun anhand des Pegels wieder entfernt, sodass selbst hohe Tempi nichts mehr abschneiden.
* **Bugfix:** Die ausgegebene Länge wird jetzt exakt auf das Zeitmaß ohne Polster zugeschnitten, sodass auch bei manueller Tempoanpassung nichts mehr abgeschnitten wird.
* **Bugfix:** Der manuelle Tempo-Regler entfernt nun 50 ms Sicherheitsstille nach dem Stretch, wodurch weder Anfang noch Ende verloren gehen.
* **Bugfix:** Die Vorschau folgt jetzt exakt der Reihenfolge Trimmen → Pausen entfernen → Time‑Stretch. Dadurch verschwinden keine Abschnitte mehr beim Speichern.
* **Bugfix:** Beim erneuten Öffnen und Speichern wird nur noch die Differenz zum gespeicherten Tempo angewendet. Unveränderte Werte schneiden jetzt nichts mehr ab.
* **Bugfix:** Wird eine Audiodatei stärker gekürzt als ihre Länge, führt dies nicht mehr zu einer DOMException.
* **Zurücksetzen nach Upload oder Dubbing:** Sowohl beim Hochladen als auch beim erneuten Erzeugen einer deutschen Audiodatei werden Lautstärkeangleichung, Funkgerät‑, Hall‑ und Störgeräusch‑Effekt automatisch deaktiviert.
* **Tempo-Regler zurückgesetzt:** Nach einem Upload steht der Geschwindigkeitsregler wieder zuverlässig auf 1,00.
* **Tempo-Regler auch beim ZIP-Import auf 1,00:** Beim Import mehrerer Dateien per ZIP wird der Geschwindigkeitsregler jeder Zeile auf den Standardwert gesetzt.
* **Backup bleibt beim Speichern erhalten:** Nur ein neuer Upload ersetzt die Sicherung in `DE-Backup`. "🔄 Zurücksetzen" stellt dadurch stets die zuletzt geladene Originaldatei wieder her.
* **ZIP-Import aktualisiert das Backup:** Auch importierte ZIP-Dateien gelten nun als Original und lassen sich über "🔄 Zurücksetzen" wiederherstellen.
* **Hall- und Störgeräusch-Effekt werden beim Dubbing zurückgesetzt.**
* **Fehlerhinweise beim Speichern:** Tritt ein Problem auf, erscheint eine rote Toast-Meldung statt eines stummen Abbruchs.
* **Neue Meldung:** Scheitert das Anlegen einer History-Version, wird "Fehler beim Anlegen der History-Version" ausgegeben.
* **Kompaktere Dubbing-Spalte:** Der Statuspunkt und der Download-Pfeil stehen jetzt direkt neben dem Dubbing-Button in einer gemeinsamen Spalte.
* **Einheitliche Tabellenspalten:** EN- und DE-Text erscheinen untereinander, alle Aktions-Buttons bilden eine vertikale Spalte.
* **Optimierte Tabelle:** Ordnernamen sind korrekt ausgerichtet, schmale UT- und Pfad-Spalten lassen mehr Platz für die Texte und die Aktionssymbole sind gruppiert.
* **Notizen pro Ordnerzeile:** Unter dem Ordnernamen lässt sich nun eine individuelle Notiz speichern.
* **Duplikat-Hinweis für Notizen:** Gleiche Notizen werden farbig markiert und zeigen die Anzahl gleicher Einträge.
* **Kapitelweiter Notiz-Hinweis:** Unter jeder Notiz wird nun angezeigt, wie oft sie im gesamten Kapitel vorkommt.
* **Erklärende Tooltips:** In der Aktionenspalte zeigt jedes Symbol beim Überfahren mit der Maus seinen Zweck an.
* **Schmalere Versionsspalte:** "Version" und "Score" stehen im Kopf sowie in jeder Zeile untereinander, wodurch die Tabelle breiterem Text mehr Platz lässt.
* **Modernisierte Aktionsleiste:** Alle Bedienknöpfe besitzen abgerundete Ecken und sind in klaren Zeilen gruppiert.
* **Verbesserte Aktionsspalte:** Einheitliche Icon-Größe mit dunklem Hintergrund und deutlichen Abständen erleichtern die Bedienung.
* **Trennlinien teilen die Aktionszeile:** Upload, Dubbing, Bearbeitung und Löschen sind jetzt optisch getrennt.
* **Aktionsblöcke mit Abstand:** Jede Funktionsgruppe liegt in einem dunklen Kasten mit etwas Freiraum, der Papierkorb steht deutlich abgesetzt ganz unten.
* **Dokumentierte Tabelle:** Neue Kommentare im Code erläutern die kompakten Spalten und die vertikale Aktionsleiste.
* **Bugfix:** Ein Klick auf den Download-Pfeil öffnet jetzt zuverlässig die korrekte V1-Dubbing-Seite.
* **Automatik-Button für halbautomatisches Dubbing:** Per Playwright werden alle notwendigen Klicks im ElevenLabs-Studio ausgeführt.
* **Neuer Button „Dubbing (Emo)“:** Öffnet ein eigenes Fenster und erzeugt über die Text‑to‑Speech‑API (V3) eine emotionale Spur. Halbautomatik steht hier nicht zur Verfügung.
* **API-Schlüssel wie gewohnt:** Auch für Emotionen verwendet das Tool den gespeicherten ElevenLabs-Key aus den Einstellungen.
* **Eigene Dubbing‑ID für Emotionen:** Das emotionale Dubbing speichert eine separate ID, die über einen zusätzlichen Pfeil erneut geladen werden kann.
* **Neuer Button „Fertig (DE)“:** Markiert die Zeile als fertig vertont im Emotionsmodus.
* **Ordnername in Zwischenablage:** Beim halbautomatischen Dubbing kopiert das Tool nur noch den reinen Ordnernamen in die Zwischenablage, sobald auf die fertige Datei gewartet wird.
* **Bugfix:** Der Ordnername wird jetzt bereits beim Start des Halbautomatik-Dubbings automatisch kopiert.
* **Zusätzlicher 📋-Button:** Im Fenster "Alles gesendet" kopiert ein Knopf den Ordnernamen erneut in die Zwischenablage.
* **Robuster Zwischenablage-Zugriff:** Falls das Kopieren im Browser scheitert, verwendet das Tool automatisch die Electron-Clipboard-API.
* **Versionierung pro Datei:** Eine neue Spalte zwischen Ordner und EN‑Text zeigt die Version nur an, wenn eine deutsche Audiodatei existiert. Linksklick öffnet ein Menü mit Version 1–10 oder einer frei wählbaren Zahl. Der Dialog besitzt jetzt die Schaltflächen **Abbrechen**, **Übernehmen** und **Für alle übernehmen**. Letztere setzt die Nummer ohne Rückfrage für alle Dateien im selben Ordner.
* **Farbige Versionsnummern:** Der Hintergrund des Versions‑Buttons wird mit steigender Nummer zunehmend grün und ab Version 10 fast schwarzgrün.
* **Automatische Versionsanpassung:** Beim manuellen Upload, Drag & Drop oder Dubben erhöht sich die Versionsnummer automatisch, falls bereits eine deutsche Datei vorhanden ist.

</details>

<details>
<summary>🔍 Suche & Import</summary>

### 🔍 Suche & Import

* **Erweiterte Ähnlichkeitssuche** (ignoriert Groß‑/Kleinschreibung, Punkte)
* **Intelligenter Import** mit automatischer Spalten‑Erkennung
* **Multi‑Ordner‑Auswahl** bei mehrdeutigen Dateien
* **Live‑Highlighting** von Suchbegriffen

</details>

<details>
<summary>⌨️ Keyboard & Maus</summary>

### ⌨️ Keyboard & Maus

* **Keyboard‑Navigation:** Pfeiltasten, Tab, Leertaste für Audio, Enter für Texteingabe
* **Automatische Markierung:** Neue Zeilen werden nach dem Hinzufügen sofort ausgewählt
* **Context‑Menu** (Rechtsklick): Audio, Kopieren, Einfügen, Ordner öffnen, Löschen
* **Projekt-Analyse:** Rechtsklick auf ein Projekt prüft Dateien und bietet eine automatische Reparatur an
* **Schnell hinzufügen:** Rechtsklick auf Level → Schnellprojekt (vergibt die nächste freie Projekt- und Teil-Nummer), Rechtsklick auf Kapitel → Schnell‑Level
* **Debug-Bericht pro Level:** Rechtsklick auf ein Level exportiert relevante Debug-Daten
* **Drag & Drop:** Projekte und Dateien sortieren
* **Klick auf Zeilennummer:** Position über Dialog anpassen
* **Mausrad:** Markiert beim Scrollen automatisch die Zeile in der Bildschirmmitte, ohne sie neu auszurichten
* **Kein Zoom in Wellenformen:** Beim Ziehen in EN- und DE-Spuren des DE-Audio-Editors erfolgt kein automatisches Zoom mehr
* **Zeilenauswahl:** Gewählte Zeilen werden vollständig unter dem Tabellenkopf positioniert
* **Nummern-Navigation:** Pfeiltasten, Nummern-Schaltflächen und manuelles Scrollen teilen sich dieselbe Markierung ohne Sprünge
* **Doppelklick:** Projekt umbenennen

</details>

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
* **Playwright** als zusätzliche Abhängigkeit für die Schritt-für-Schritt-Automatik
* **64‑Bit Python 3.9–3.12** erforderlich; die Skripte suchen bei höheren Versionen automatisch nach einer passenden Installation. 32‑Bit wird nicht unterstuetzt

### Desktop-Version (Electron)
1. Im Hauptverzeichnis `npm ci --ignore-scripts` ausführen, damit benötigte Pakete wie `chokidar` vorhanden sind und optionale Skripte übersprungen werden
2. In das Verzeichnis `electron/` wechseln und ebenfalls `npm ci --ignore-scripts` ausführen. Fehlt npm (z.B. bei Node 22), `npm install -g npm` oder `corepack enable` nutzen
3. Für ein vollständiges Setup ohne ausgelassene Skripte in beiden Ordnern `npm ci` ausführen
4. **Eigenes App-Icon:** Legen Sie Ihr Icon unter `electron/assets/app-icon.png` ab
5. Im Ordner `electron/` `npm start` ausführen, um die Desktop-App ohne Browserdialog zu starten

   ```bash
   cd electron
   npm start
   ```
**Hinweis:** Die Desktop-App lässt sich bewusst nur einmal gleichzeitig starten. Ein weiterer Startversuch blendet einen Fehlerdialog ein und bringt das bereits laufende Fenster in den Vordergrund.
6. Das Projekt lässt sich plattformübergreifend mit `python start_tool.py` starten. Fehlt das Repository, wird es automatisch geklont; andernfalls werden die neuesten Änderungen geladen und die Desktop-App gestartet. `start_tool.py` erkennt dabei automatisch, ob es im Repository oder davor gestartet wurde.
7. Beim Start werden die Ordner `web/sounds/EN` und `web/sounds/DE` automatisch erstellt und eingelesen. Liegen die Ordner außerhalb des `web`-Verzeichnisses, erkennt das Tool sie nun ebenfalls.
8. Kopieren Sie Ihre Originaldateien in `web/sounds/EN` (oder den gefundenen Ordner) und legen Sie Übersetzungen in `web/sounds/DE` ab
9. Während des Setups erzeugt `start_tool.py` die Logdatei `setup.log`, in der alle Schritte gespeichert werden. Bei Fehlern weist die Konsole nun explizit auf diese Datei hin. Sowohl die Logdatei, `.last_head` als auch die automatisch erzeugten `.modules_hash`‑Dateien werden vom Repository ausgeschlossen (`.gitignore`).
10. Die Skripte verwerfen lokale Änderungen, **ohne** den Ordner `web/sounds` anzutasten – Projektdaten bleiben somit erhalten
11. `node check_environment.js` prueft Node- und npm-Version, installiert Abhaengigkeiten und startet einen kurzen Electron-Test. Netzwerkabfragen brechen nach fünf Sekunden mit einer verständlichen Fehlermeldung ab. Mit `--tool-check` fuehrt das Skript zusaetzlich `python start_tool.py --check` aus, um die Desktop-App kurz zu testen. Ergebnisse stehen in `setup.log`.
12. `python verify_environment.py` versucht nun fehlende Dateien oder Abhängigkeiten automatisch nachzuladen. Mit `--check-only` lässt sich dieser Reparaturmodus abschalten. Jede Prüfung wird weiterhin mit einem ✓ ausgegeben. Das Skript prüft zusätzlich die Versionsnummern aller Python‑ und Node‑Pakete, korrigiert Abweichungen auf Wunsch automatisch und hält das Terminal am Ende offen, bis eine Eingabe erfolgt. Für automatisierte Abläufe kann die Pause mit `--no-pause` deaktiviert werden. Bei Python 3.13 oder neuer suchen sowohl `verify_environment.py` als auch `start_tool.py` automatisch nach einer unterstützten Version und starten sich gegebenenfalls neu.
13. Das Startskript kontrolliert die installierte Node-Version und bricht bei Abweichungen ab.
14. `reset_repo.py` setzt das Repository nun komplett zurück, installiert alle Abhängigkeiten in beiden Ordnern und startet anschließend automatisch die Desktop-App.
15. `start_tool.py` installiert nun zusätzlich alle Python-Abhängigkeiten aus `requirements.txt`. `translate_text.py` geht daher davon aus, dass `argostranslate` bereits vorhanden ist.
16. Bereits vorhandene Python‑Pakete werden beim Start übersprungen, damit das Setup schneller abgeschlossen ist.
20. Die Vorschaubilder nutzen standardmäßig `yt-dlp`:

    ```bash
    pip install yt-dlp
    ```
21. `start_tool.py` merkt sich den letzten Git-Stand und den Hash der `package-lock.json`. Sind keine Änderungen erkennbar, werden `git reset`, `git fetch` und `npm ci` übersprungen. Fehlende Python-Pakete installiert ein einziger `pip`-Aufruf.
22. Der Hash wird in `.modules_hash` gespeichert, damit erneute `npm ci`-Aufrufe nur bei Änderungen erfolgen. Diese Datei ist ebenfalls vom Repository ausgeschlossen.
23. In `requirements.txt` gekennzeichnete Zeilen mit `# optional` werden bei `verify_environment.py` nur informativ geprüft und lassen den Test bestehen.
24. `verify_environment.py` führt Befehle jetzt direkt im Projektordner aus, wodurch besonders Git-Kommandos zuverlässiger arbeiten.
25. Sowohl `verify_environment.py` als auch `start_tool.py` prüfen nun die Python-Architektur und geben bei 32‑Bit-Versionen einen deutlichen Hinweis.
26. Die Paketprüfung berücksichtigt jetzt abweichende Importnamen (z.B. `Pillow` ↦ `PIL`). Dadurch meldet `verify_environment.py` keine Fehlalarme mehr.
27. `start_tool.py` funktioniert jetzt auch ohne konfiguriertes Remote und setzt das Repository dann nur lokal zurück.
28. `node dev_info.js` gibt alle relevanten Systemdaten sowie die Versionen von `ffmpeg`, `ytdl-core`, `play-dl` und `yt-dlp` aus.
29. Das Debug-Fenster zeigt jetzt zusätzlich den Pfad zum VideoFrame-Ordner und die installierten Versionen der Video-Abhängigkeiten.
30. Ein neuer Netztest im Debug-Fenster prüft die Erreichbarkeit von YouTube.
31. `cliSendTextV2.js` schickt Textzeilen an ElevenLabs (v2) und überspringt doppelten Inhalt.
32. Ein neuer Button `An ElevenLabs schicken` sendet alle Emotional-Texte des aktuellen Projekts ohne Duplikate an die Text-to-Speech-API (v2).
33. `update_repo.py` prüft den Git-Status und führt bei Bedarf `git pull` aus. Anschließend werden die übernommenen Commits angezeigt.

### ElevenLabs-Dubbing

1. API-Schlüssel bei [ElevenLabs](https://elevenlabs.io) erstellen.
2. Den Schlüssel als Umgebungsvariable `ELEVEN_API_KEY` setzen oder beim Aufruf der Funktionen eingeben.
3. Kopieren Sie `.env.example` zu `.env.local` und tragen Sie Ihren Schlüssel in `ELEVEN_API_KEY=` ein.
4. Beispielhafte Nutzung für bestehende Dubbings:

```javascript
const { waitForDubbing, downloadDubbingAudio } = require('./elevenlabs.js');
const apiKey = process.env.ELEVEN_API_KEY;
const dubbingId = 'abc123';

// Optional: Rendering erneut anstoßen, falls nötig
// await renderLanguage(dubbingId, 'de', apiKey);

await waitForDubbing(apiKey, dubbingId, 'de');
await downloadDubbingAudio(apiKey, dubbingId, 'de', 'web/sounds/DE/beispiel.wav');
console.log('Download abgeschlossen.');
```
Die Browser-Datei `web/src/elevenlabs.js` stellt im Browser nur noch `downloadDubbingAudio` bereit. Statusprüfungen laufen vollständig über `web/src/dubbing.js`, wo `isDubReady` im Rahmen des Frontend-Workflows gekapselt ist. `waitForDubbing` wurde entfernt, da die Browser-Oberfläche ausschließlich auf Statusprüfungen setzt. Auskommentierte Alt-Funktionen wie `dubSegments`, `renderDubbingResource` oder `getDubbingResource` sind entfernt worden. Neue Dubbings werden mittlerweile über die Web-Oberfläche oder direkte API-Aufrufe angelegt.

Das Node-Modul `elevenlabs.js` exportiert derzeit `downloadDubbingAudio`, `waitForDubbing`, `isDubReady`, `renderLanguage`, `pollRender` und `sendTextV2`. Die Hilfsfunktionen `getDubbingStatus` und `getDefaultVoiceSettings` sind entfallen, weil Statusabfragen und Standardeinstellungen inzwischen direkt in den jeweiligen Workflows gekapselt werden.
Das komplette Workflow-Skript für den Upload, die Statusabfrage und das erneute
Herunterladen befindet sich nun in `web/src/dubbing.js`.
Im Desktop-Modus wird dieses Modul beim Start dynamisch geladen und stellt seine Funktionen sowohl für Node-Tests als auch im Browser global bereit. Fehlen im Importobjekt die Funktionsreferenzen, greift `main.js` auf die globalen `window`-Varianten zurück. Zusätzlich exportiert `dubbing.js` die Variable `waitDialogFileId`, über die `main.js` erkennt, zu welcher Datei der Download-Dialog gehört.

Ein Klick auf **Dubbing** öffnet zunächst ein Einstellungsfenster. Danach fragt das Tool,
ob die **Beta-API** genutzt oder der **halbautomatische Modus** verwendet werden soll.
Im halbautomatischen Modus werden Audiodatei und Texte lediglich an ElevenLabs gesendet.
Dabei öffnet sich automatisch die entsprechende Dubbing-Seite im Browser, sodass Sie die Spur direkt erzeugen können.
Anschließend erscheint ein Hinweis, die fertig gerenderte Datei in den projektspezifischen Ordner `web/Download` (oder `web/Downloads`) zu legen.
Sobald dort eine passende Datei auftaucht, zeigt das Tool „Datei gefunden" mit Namen an und
wartet auf eine Bestätigung. Das Fenster zeigt nun zusätzlich Ordnername sowie englischen und deutschen Text der aktuellen Zeile an, damit klar ist, für welche Übersetzung die Datei erwartet wird.
Ab Version 1.40.83 kann hier auch **Automatik** gewählt werden. Dann öffnet die Desktop-App ein eingebettetes Browserfenster und klickt alle Schritte selbstständig durch. Dazu installiert die Electron-Version automatisch Playwright.
Seit Patch 1.40.84 gibt der Automatik-Modus im Terminal aus, wann der Browser startet, welche Buttons geklickt werden und wann der Vorgang beendet ist.
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

Ein Watcher überwacht automatisch den Ordner `web/Download` bzw. `web/Downloads` im Projekt. Taucht dort eine fertig gerenderte Datei auf, meldet das Tool „Datei gefunden“ und verschiebt sie nach `web/sounds/DE`. Seit Version 1.40.5 klappt das auch nach einem Neustart: Legen Sie die Datei einfach in den Ordner, sie wird anhand der Dubbing‑ID automatisch der richtigen Zeile zugeordnet. Der Status springt anschließend auf *fertig*. Alle 15 Sekunden erfolgt zusätzlich eine Status-Abfrage der offenen Jobs, allerdings nur im Beta-Modus. Beta-Jobs werden nun automatisch aus dieser Liste entfernt, sobald sie fertig sind. Der halbautomatische Modus verzichtet auf diese Abfrage. Der Download-Ordner wird zu Beginn jedes neuen Dubbings geleert. Nach dem Import entfernt der Watcher nur noch die bearbeitete Datei, damit parallel abgelegte Downloads erhalten bleiben. Seit Version 1.40.17 findet der Watcher auch Dateien mit leicht verändertem Namen und warnt bei fehlender Zuordnung im Terminal. Erkennt er keine Zuordnung, startet ein manueller Import. Die Konfiguration (`web/src/config.js`) exportiert hierfür ausschließlich die Pfade; der Ordnername selbst bleibt als internes Detail im Modul.
Der automatische Import greift also nur, wenn eine Dubbing-ID passt.
Taucht eine unbekannte Datei auf, öffnet sich stattdessen der Import-Dialog.
Persönliche Zusätze wie `_Alex` oder `-Bob` entfernt er dabei automatisch.
\n### Emotionales Dubbing (v3)
\nDie Emotionen nutzen eine eigene Version der ElevenLabs-API. Der neue Button ruft den folgenden Endpunkt auf und speichert die Antwort als WAV-Datei: Der API-Schlüssel wird dabei automatisch aus den Einstellungen übernommen:
\n```text
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream
xi-api-key: <DEIN_API_KEY>
Content-Type: application/json
Accept: audio/mpeg

{
  "text": "Deutscher Text mit Emotionen z. B. Hallo, [freudig] wie schön, dich zu sehen!",
  "model_id": "eleven_v3",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.4,
    "use_speaker_boost": true
  }
}
```

**Hinweis:** Unterstützte Tags sind z.&nbsp;B. `[flüsternd]`, `[besorgt]`, `[verzweifelt]`, `[freudig]`, `[sarkastisch]`, `[wütend]`, `[ironisch]`, `[müde]`. Sie lassen sich kombinieren, etwa `[verwirrt][leise] Das meinst du nicht ernst, oder?`

Die API liefert einen Audio-Stream. Dieser wird wie gewohnt im Projekt gespeichert und die erhaltene ID unter `emoDubbingId` abgelegt.
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
Seit Patch 1.40.30 nutzt das Tool cdnjs anstelle von jsDelivr, da dies durch die Content Security Policy erlaubt ist.
Seit Patch 1.40.31 wurde das MP3-Encoding entfernt, lamejs ist nicht mehr erforderlich.
Seit Patch 1.40.32 sortiert das Level-Statistik-Panel die Einträge nach der Levelnummer.
Seit Patch 1.40.33 erscheint der 🔍-Button zur Untertitel-Suche wieder korrekt in der Dateitabelle.
Seit Patch 1.40.34 lädt die Untertitel-Suche fehlende Untertitel automatisch nach und verhindert so Fehlermeldungen beim Klick.
Seit Patch 1.40.35 korrigiert ein Fallback das Nachladen des Untertitel-Parsers, sodass die Suche zuverlässig funktioniert.
Seit Patch 1.40.36 blendet die Untertitel-Suche Farbcodes wie `<clr:255,190,255>` aus, berücksichtigt sie nicht bei der Ähnlichkeitsberechnung und zeigt den gesuchten EN-Text im Dialog an.
Seit Patch 1.40.37 entfernt die Untertitel-Suche zusätzlich Tags wie `<HEADSET>` oder `<cr>` automatisch aus den übernommenen Texten.
Seit Patch 1.40.38 berechnet die Untertitel-Suche die Ähnlichkeit präziser und ignoriert kurze Wortfragmente.
Seit Patch 1.40.39 ersetzt sie `<sb>`- und `<br>`-Tags automatisch durch Leerzeichen und fügt fehlende Leerzeichen nach Satzzeichen ein.
Seit Patch 1.40.40 entfernt der Dateiwächter beim automatischen Import persönliche Namensendungen wie `_Alex` oder `-Bob`.
Seit Patch 1.40.41 startet die Desktop-App ohne Fehlermeldung, da `session` in `electron/main.js` korrekt eingebunden ist.
Seit Patch 1.40.42 erlaubt die Content Security Policy nun Bilder von `i.ytimg.com`, wodurch der YouTube-Player keine CSP-Fehler mehr verursacht.
Seit Patch 1.40.43 verschwindet der YouTube-Player nicht mehr, wenn man dasselbe Video erneut anklickt.
Seit Patch 1.40.44 entfällt das separate Element `ytPlayerBox`; der Player wird nun direkt im Dialog erzeugt.
Seit Patch 1.40.51 wurde die CSS-Klasse `.video-player-section` bereinigt. Jetzt gilt ein eindeutiger Block mit `overflow-x:hidden`, `overflow-y:auto` und `min-height:0`, damit die Steuerelement-Leiste nicht mehr abgeschnitten wird.
Seit Patch 1.40.52 entfernt die Content Security Policy `'unsafe-eval'` erneut und erlaubt `worker-src 'self'`. Dadurch verschwindet die Electron-Sicherheitswarnung, ohne die App-Funktionalität einzuschränken.
Seit Patch 1.40.53 nutzt die Content Security Policy eine minimale Konfiguration. Sie erlaubt Blob‑Worker für Tesseract, ohne `'unsafe-eval'` zu verwenden.
Seit Patch 1.40.54 erlaubt die Richtlinie Skripte und Frames von `youtube.com` und `youtube-nocookie.com`. Vorschaubilder von `i.ytimg.com` bleiben erlaubt.
Seit Patch 1.40.56 erlaubt die Content Security Policy zusätzlich `wasm-unsafe-eval` und `connect-src data:`, damit Tesseract im Browser ohne Fehlermeldungen startet.
Seit Patch 1.40.57 akzeptiert die Richtlinie auch `'unsafe-inline'` in `style-src`. Damit funktionieren eingebettete Style-Attribute wieder ohne CSP-Warnung.
Seit Patch 1.40.58 wird `style-src` aufgeteilt: `style-src-elem 'self'` und `style-src-attr 'self' 'unsafe-inline'`. Inline-Styles bleiben erlaubt, externe Styles müssen aber weiterhin lokal geladen werden.
Seit Patch 1.40.60 ignoriert `start_tool.py` Kommentare in `requirements.txt`, damit `pip install` unter Windows nicht mehr scheitert.
Seit Patch 1.40.61 setzt `start_tool.py` den Pfad zum Python-Interpreter in Anführungszeichen, wodurch `pip install` auch bei Leerzeichen im Pfad funktioniert.
Seit Patch 1.40.62 greift die Gestaltung des Video-Dialogs erst mit dem `open`-Attribut und das Öffnen erfolgt ohne Animation.
Seit Patch 1.40.63 vereinfacht ein gemeinsamer Grid-Block die Video-Dialog-Definition.
Seit Patch 1.40.64 erlaubt die Content Security Policy nun Verbindungen zu `api.elevenlabs.io`,
damit die Status-Abfragen beim Dubbing nicht mehr blockiert werden.
Seit Patch 1.40.65 akzeptiert die Richtlinie auch `blob:` in `media-src`.
Damit funktionieren die Audio-Vorschauen wieder ohne CSP-Fehler.
Seit Patch 1.40.66 nutzt `start_tool.py` `subprocess.check_call` mit Argumentlisten,
damit `pip install` ohne aufwendiges Quoting auch unter Windows funktioniert.
Seit Patch 1.40.67 warnt `start_tool.py` vor Python 3.13 oder neuer und ermoeglicht einen Abbruch.
Seit Patch 1.40.68 öffnet sich das Versionsmenü beim Klick auf die Nummer wieder korrekt.
Seit Patch 1.40.69 ändert die Schnellwahl (Version 1–10) nur noch die angeklickte Datei.
Seit Patch 1.40.181 bricht `start_tool.py` bei Python 3.13 oder neuer mit einem Hinweis ab.
Seit Patch 1.40.182 verwendet `start_tool.py` die gleiche Suchroutine wie `verify_environment.py` und startet sich bei Bedarf mit einer unterstuetzten Python-Version neu.
Beim Punkt "Benutzerdefiniert..." können Sie eine beliebige Nummer eingeben und entscheiden,
ob alle Dateien mit demselben Namen im Projekt angepasst werden sollen.
Seit Patch 1.40.70 wird die ausgewählte Datei beim Eintragen einer benutzerdefinierten Versionsnummer korrekt übernommen.
Seit Patch 1.40.71 ersetzt ein Dialog die veraltete Funktion `prompt()` und verhindert damit Fehler im Browser.
Seit Patch 1.40.72 bietet dieser Dialog zusätzlich die Schaltfläche **Für alle übernehmen**,
die alle Dateien im selben Ordner ohne Nachfrage aktualisiert.
Seit Patch 1.40.73 erhöht ein Upload die Versionsnummer automatisch, wenn bereits eine deutsche Datei existiert.
Seit Patch 1.40.74 funktioniert Drag & Drop korrekt: Die Versionsnummer steigt nur noch um eins.
Seit Patch 1.40.75 zeigt der blaue Download-Pfeil beim Überfahren mit der Maus die gespeicherte Dubbing-ID an.
Seit Patch 1.40.76 öffnet ein Klick auf diesen Pfeil die entsprechende V1-Dubbing-Seite bei ElevenLabs.
Seit Patch 1.40.77 startet der halbautomatische Modus automatisch die passende Dubbing-Seite im externen Browser, nicht mehr im Electron-Fenster.
Seit Patch 1.40.78 zeigt das "Alles gesendet"-Fenster die Dubbing-ID an und bietet Buttons
zum Öffnen der ElevenLabs-Seite sowie der gerade importierten Datei.
Seit Patch 1.40.79 wird beim Dubben ebenfalls die Versionsnummer erhöht, wenn bereits eine deutsche Datei vorhanden ist.
Seit Patch 1.40.80 speichert ein neuer 📓-Knopf englische Wörter zusammen mit deutscher Lautschrift.
Seit Patch 1.40.81 erscheint unter der Lupe ein kleines 📝, wenn der DE-Text ein Wort aus diesem Wörterbuch enthält.
Seit Patch 1.40.82 bewertet die Untertitel-Suche kurze Wörter strenger und vermeidet so falsche 100%-Treffer.
Seit Patch 1.40.83 führt der neue Button **Automatik** das halbautomatische Dubbing selbstständig aus. Die Desktop-Version nutzt dafür Playwright.
Seit Patch 1.40.84 zeigt der Automatik-Modus im Terminal die ausgeführten Schritte an.
Seit Patch 1.40.85 bietet das "Alles gesendet"-Fenster einen 📋-Button, um den Ordnernamen erneut zu kopieren.
Seit Patch 1.40.86 wird beim Kopieren des Ordnernamens nur noch der letzte Pfadteil übernommen.
Seit Patch 1.40.87 kopiert das Tool den Ordnernamen direkt beim Start des Halbautomatik-Dubbings.
Seit Patch 1.40.88 wartet der Dateiwächter auf eine stabile Dateigröße und löscht nach dem Import nur noch die verarbeitete Datei.
Seit Patch 1.40.89 verhindert der Dateiwchter einen Abbruch, wenn die Datei kurzzeitig fehlt.
Seit Patch 1.40.90 prüft das Tool nach dem Schließen des "Alles gesendet"-Fensters automatisch, ob neue Dub-Dateien erkannt wurden. So erscheint der grüne Haken auch dann, wenn der Dateiwächter bereits vorher reagiert hat.
Seit Patch 1.40.91 löst der Dateiwächter den manuellen Import nur noch aus, wenn keine Zuordnung zu offenen Jobs möglich ist.
Seit Patch 1.40.92 bricht der Dateiwächter nach 10 s ohne stabile Datei mit einer Fehlermeldung ab.
Seit Patch 1.40.93 schließen sich nach erfolgreichem Import das Fenster „Alles gesendet“, der Studio-Hinweis und das Dubbing-Protokoll automatisch.
Seit Patch 1.40.94 funktioniert die Untertitel-Suche über die Lupe wieder korrekt.
Seit Patch 1.40.95 lädt die OT-Suche fehlende Text-Utilities automatisch nach.
Seit Patch 1.40.96 meldet die Untertitel-Suche nun fehlende Text-Utilities.
Seit Patch 1.40.97 greift ein Fallback auf die globale Funktion, falls die Text-Utilities nicht geladen werden können.
Seit Patch 1.40.98 erlaubt die Content Security Policy nun auch Verbindungen zu `youtube.com`, damit Videotitel per oEmbed geladen werden können.
Seit Patch 1.40.99 befindet sich der Hinweis zu oEmbed nicht mehr im Meta-Tag selbst. Dadurch zeigt der Browser keine CSP-Warnung mehr an.
Seit Patch 1.40.100 erlaubt die Content Security Policy nun Verbindungen zu `api.openai.com`, damit der GPT-Key-Test im Einstellungsdialog funktioniert.
Seit Patch 1.40.102 besitzt das Wörterbuch zwei Bereiche: Englisch‑Deutsch und Englisch‑Phonetisch.
Seit Patch 1.40.102 stehen die Segmentierungsfunktionen global zur Verfügung. Dadurch funktioniert der Upload auch nach dem Auslagern in einzelne Module zuverlässig.
Seit Patch 1.40.103 prüft das Tool vor dem Öffnen des Segmentdialogs, ob ein Projekt ausgewählt wurde.
Seit Patch 1.40.104 meldet der Segmentdialog fehlende HTML-Elemente in der Konsole.
Seit Patch 1.40.105 begrenzt `mergeSegments` die Segmentgrenzen auf die Pufferlänge und verhindert so "offset out of bounds"-Fehler.
Seit Patch 1.40.106 stellt ein Auto-Knopf im DE-Audio-Editor Anfangs- und Endstille automatisch ein.
Seit Patch 1.40.114 erweitern oder verkleinern zwei neue Buttons alle Ignorier-Bereiche in 50‑ms-Schritten.
Seit Patch 1.40.115 lassen sich mit der Alt-Taste Stille-Bereiche einfügen, um Audios zeitlich zu verschieben.
Seit Patch 1.40.118 spielt die Projekt-Wiedergabe alle Dateien wieder in korrekter Reihenfolge ab.
Seit Patch 1.40.119 wird die Sortierung nicht mehr verändert und Zeilen werden nicht übersprungen.
Seit Patch 1.40.120 prüft die Projekt-Wiedergabe vor dem Start die Reihenfolge und korrigiert sie falls nötig.
Seit Patch 1.40.121 zeigt ein kleines Wiedergabe-Fenster die aktuelle Reihenfolge samt Dateinamen an.
Seit Patch 1.40.122 zeigt die Wiedergabeliste nun die Positionsnummern der Dateien.
Seit Patch 1.40.123 zeigt die Wiedergabeliste zusätzliche Pfadinformationen an.
Seit Patch 1.40.124 zeigt die Wiedergabeliste kleine Icons für Dateiexistenz, Wiedergabe-Erfolg und Reihenfolge.
Seit Patch 1.40.125 führt ein Protokoll neben der Wiedergabeliste die erwartete und die tatsächliche Reihenfolge auf.
Seit Patch 1.40.126 darf beim Anpassen-Kürzen die deutsche Übersetzung leicht verändert werden, um extrem kurze EN-Zeilen besser abzudecken.
Seit Patch 1.40.127 besitzt der DE-Audio-Editor überarbeitete Buttons mit hilfreichen Tooltips.
Seit Patch 1.40.242 zeigt der DE-Audio-Editor seine Bedienelemente in zwei Spalten, sodass kein Scrollen mehr nötig ist.
Seit Patch 1.40.243 ordnet der DE-Audio-Editor Bereiche und Effekte in drei Spalten an. Lange Listen besitzen eigene Scrollleisten, sodass nichts überlappt.
Seit Patch 1.40.244 bietet der DE-Audio-Editor eine untere Effekt-Toolbar und eigene Anwenden-Knöpfe in den Effekt-Kästen.
Neu: Nach dem Speichern bleibt der komplette DE-Bereich markiert und der Infotext zeigt direkt die aktuellen DE- und EN-Längen.
Seit Patch 1.40.245 bleibt diese Effekt-Toolbar als Sticky-Footer sichtbar, und "Speichern" erscheint als primärer Button. "Zurücksetzen" fragt jetzt nach einer Bestätigung.
Seit Patch 1.40.386 ersetzt eine kompakte Fußleiste ohne Sticky-Verhalten die separate Effekt-Toolbar; Zurücksetzen und Speichern bleiben weiterhin schnell erreichbar.
Seit Patch 1.40.391 erlaubt der Speichern-Button mehrere Durchläufe hintereinander: Die Puffer werden sofort aktualisiert und nur „Speichern & schließen“ beendet den Dialog ausdrücklich.
Seit Patch 1.40.382 fällt der Kopfbereich des DE-Audio-Editors kompakter aus: Überschrift, Toolbar und Wave-Raster rücken enger zusammen und verlieren übergroße Abstände auf Ultra-Wide-Monitoren.
Seit Patch 1.40.250 lassen sich Bereiche in EN- und DE-Wellenformen direkt per Ziehen markieren; Start- und Endfelder synchronisieren sich und ungültige Eingaben werden rot hervorgehoben.
Seit Patch 1.40.194 durchsucht ein neuer Knopf das gesamte Projekt nach passenden Untertiteln und fügt eindeutige Treffer automatisch ein.

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

`translate_text.py` übersetzt kurze Texte offline mit Argos Translate. Fehlt das Paket, versucht das Skript eine automatische Installation über `pip`. Die benötigten Pakete werden ansonsten durch `start_tool.py` automatisch installiert. Fehlende Sprachpakete lädt das Skript beim ersten Aufruf automatisch herunter. Über `--no-download` lässt sich dieser Schritt verhindern. Findet es kein passendes Paket im Index, gibt das Skript eine verständliche Fehlermeldung aus und beendet sich mit Status 1. Für eine komplett Offline-Nutzung müssen die Pakete vorher mit `argos-translate-cli` installiert werden. Seit Version 1.40.13 wird korrekt erkannt, ob ein Paket bereits vorhanden ist. Anschließend kann der gewünschte Text per `echo "Hello" | python translate_text.py` übersetzt werden.
Neu ist der Servermodus `python translate_text.py --server`: Er lädt Argos einmalig, liest zeilenweise JSON-Aufträge (`{"id": ..., "text": ...}`) von `stdin` und liefert die Ergebnisse inklusive Fehlerhinweis als JSON nach `stdout` zurück.
In der Desktop-App läuft dieser Server dauerhaft. `electron/main.js` startet beim Programmstart einen Übersetzungs-Worker und verteilt alle IPC-Anfragen (`translate-text`) auf diesen Prozess. Jede Antwort erreicht den Renderer weiterhin als Event `translate-finished` und enthält neben dem Text auch eine mögliche Fehlermeldung. Stürzt der Worker ab, startet er automatisch neu und wiederholt offene Aufträge.
Tritt ein Fehler auf, zeigt die Oberfläche nun den konkreten Fehltext als Hinweis an.
Fehlt eine Abhängigkeit wie PyTorch oder das VC++‑Laufzeitpaket, bricht das Skript mit einem klaren Hinweis ab.

### Version aktualisieren

1. In `package.json` die neue Versionsnummer eintragen.
2. Danach `npm run update-version` ausführen. Das Skript aktualisiert `electron/package.json` und ersetzt alle `1.40.3`-Platzhalter in `README.md`, `web/src/main.js` und `web/hla_translation_tool.html` durch die aktuelle Nummer.

---

## 🏁 Erste Schritte

### 1. 📁 Programm starten
* Beim Start liest die App automatisch alle Audio‑Dateien aus `web/sounds/EN` und vorhandene Übersetzungen aus `web/sounds/DE` ein

### 2. 📂 Neues Projekt erstellen
| **Schnellprojekt**        | Rechtsklick auf Level → Schnellprojekt (vergibt die nächste freie Projektnummer) |
* Klicken Sie auf **„+ Neues Projekt"**
* Vergeben Sie einen Namen
* Optional: Level‑Name und Teil‑Nummer angeben
* Optional: Kapitel auswählen oder neu anlegen
* Icon und Farbe werden automatisch zugewiesen

### 3. 📄 Dateien hinzufügen
* **Über Suche:** Live‑Suche nach Dateinamen oder Textinhalten
* **Über Browser:** „📁 Ordner durchsuchen" für visuelles Browsen mit Live-Suche im aktuellen Ordner – unterstützt jetzt Suchbegriffe mit Leerzeichen
* **Bericht:** Im Ordner-Browser erstellt der Knopf **„Bericht“** eine Übersicht aller Ordner samt Übersetzungsfortschritt und kopiert sie in die Zwischenablage
* **Direct‑Input:** Dateinamen direkt ins Eingabefeld

### 4. ✏️ Übersetzen
* Englische Texte werden automatisch erkannt
* Deutsche Übersetzung in das DE‑Feld eingeben
* **✓ Fertig‑Checkbox** setzen für Completion‑Tracking
* Auto‑Save speichert alle 1 Sekunde

---

## 🎮 Bedienung

### Arbeitsbereich-Header

Der Kopfbereich der Weboberfläche ist jetzt als kompakte Werkzeugzeile mit klar getrennten Sektionen aufgebaut:

* **Projekt:** Import, Untertitel und Ordner-Browser liegen direkt neben dem Eingabefeld, das nun in einer schmalen Inline-Zeile mit dem „Hinzufügen“-Knopf sitzt.
* **Werkzeuge:** GPT-Bewertung, Zufallsprojekt, Wörterliste, Emotionstools und sämtliche Spezialhelfer (Kopierhilfen, ZIP-Import, Audio-Zuordnung, Debug-Bericht usw.) stehen als direkte Buttons nebeneinander bereit – nur die Einstellungen liegen weiterhin im Dropdown.
* **Medien:** Video-Manager und Half-Life: Alyx-Launcher teilen sich einen schlanken Block, in dem Modus, Sprache, optionales `+map`-Feld und Cheat-Dropdown direkt neben dem Startknopf angeordnet sind.
* **System:** Alle Speicher-Anzeigen inklusive Wechsel-Schalter, Ordner-Öffner und Aufräumen sitzen im neuen „Verwaltung“-Dropdown – gemeinsam mit den Migrationsbefehlen und dem Statusmonitor.
* **Suche & Verlauf:** Live-Suche, UT-Suche-Button, Kopieroptionen, Sortierungen, Fortschrittsstatistiken und Projekt-Playback laufen in einem durchgehenden Abschlusssegment zusammen.

Unter 1200 px ziehen sich die Gruppen enger zusammen, unter 900 px stapeln sich die Abschnitte automatisch untereinander. Dropdowns folgen dem vereinheitlichten Designschema und schließen nach jeder Aktion automatisch.

### Projekt‑Management

|  Aktion                    |  Bedienung                                          |
| -------------------------- | --------------------------------------------------- |
| **Projekt erstellen**     | `+ Neues Projekt` Button                          |
| **Schnellprojekt**        | Rechtsklick auf Level → Schnellprojekt (vergibt die nächste freie Projektnummer) |
| **Projekt auswählen**     | Klick auf Projekt‑Kachel                          |
| **Projekt anpassen**      | Rechtsklick auf Projekt → ⚙️ bearbeiten |
| **Projekt löschen**       | Rechtsklick auf Projekt → 🗑️ löschen |
| **Projekt umbenennen**    | Doppelklick auf Projekt‑Name                      |
| **Projekt sortieren**     | Drag & Drop der Projekt‑Kacheln                   |
| **Kapitel anpassen**      | Rechtsklick auf Kapitel-Titel → Bearbeiten/Löschen |
| **Schnell-Level**         | Rechtsklick auf Kapitel → Schnell-Level |
| **Level anpassen**        | Rechtsklick auf Level-Titel → Bearbeiten/Löschen |
| **Level‑Name kopieren**   | ⧉‑Button in Meta‑Leiste                           |
| **Half-Life: Alyx starten** | Medienblock im Header mit Modus- und Sprachauswahl, optionalem +map-Parameter und Cheat-Dropdown |

Beim Rechtsklick auf eine Projekt‑Kachel erscheint ein kleines Menü zum Bearbeiten (⚙️) oder Löschen (🗑️) des Projekts.
Auch Kapitel und Level bieten dieses Rechtsklick-Menü.

### Datei‑Management

|  Aktion                    |  Bedienung                                          |
| -------------------------- | --------------------------------------------------- |
| **Dateien suchen**        | Live‑Suchfeld (mind. 2 Zeichen)                   |
| **Dateien hinzufügen**    | Direct‑Input, Suchresultat‑Klick, Browser         |
| **Datei als fertig**      | ✓ Completion‑Checkbox                             |
| **Datei ignorieren**      | 🚫 Ignorieren‑Button (im Ordner‑Browser)          |
| **Position ändern**       | Klick auf Zeilennummer (#)                  |
| **Sortierung ändern**     | Klick auf Spalten‑Header                          |
| **Datei löschen**         | × am Zeilenende oder Context‑Menu                 |

Ignorierte Einträge merkt sich der Ordner-Browser jetzt dauerhaft – unabhängig davon, ob LocalStorage oder der Datei-Modus aktiv ist. In der Desktop-Version landet die Liste zusätzlich als `ignoredFiles.json` im Nutzerverzeichnis (`AppData/Roaming/Half-Life Alyx Translation Tool`), sodass die Markierungen auch nach einem kompletten Neustart garantiert bestehen bleiben.

### Audio & Text

|  Aktion                    |  Bedienung |
| -------------------------- | ----------------------------------------------- |
| **Audio abspielen**       | ▶ Button oder Leertaste (bei ausgewaehlter Zeile) |
| **Projekt-Playback**      | ▶/⏸/⏹ spielt vorhandene DE-Dateien der Reihe nach |
| **Review-Sprache wechseln** | 🇬🇧 Review öffnen → Umschalter EN-Audio / DE-Audio nutzen (DE deaktiviert sich bei fehlender Datei) |
| **Zur nächsten Nummer**   | ▲/▼ neben ▶/⏹ springen eine Zeile weiter oder zurück und halten Nummer, Dateiname und Ordner direkt unter dem Tabellenkopf sichtbar; das Mausrad markiert nur die Zeile in der Bildschirmmitte, ohne die Position zu verändern. Schnelle Klicks funktionieren weiterhin zuverlässig |
| **Audio im Textfeld**     | `Ctrl + Leertaste` |
| **Text kopieren**         | 📋 Button neben Textfeld |
| **Zwischen Feldern**      | `Tab` / `Shift + Tab` |
| **Auto-Resize verbessert** | Textfelder passen sich sauber an und schneiden keine Zeilen mehr ab; beim Projektstart wird die korrekte Höhe jetzt sofort gesetzt |
* Beim Speichern eines DE-Audios verhindert das Tool nun ungültige Schnittbereiche und zeigt einen Fehler an.
* Nach dem Speichern springt "Start (ms)" und "Ende (ms)" automatisch wieder auf 0.

#### Lange Aufnahmen aufteilen
Über den Button „🔊 Audio-Datei zuordnen“ lässt sich eine lange Aufnahme hochladen. Das Tool erkennt leise Pausen und zeichnet die Segmente farbig in der Waveform ein. Unterhalb stehen alle deutschen Textzeilen des Projekts bereit. Segmente lassen sich nun direkt in der Grafik anklicken – mit gedrückter Umschalttaste auch mehrere nebeneinander. Jede Auswahl wird sofort abgespielt, sodass man die Passagen leicht zuordnen kann. Ein Klick auf die gewünschte Zeile ordnet die Auswahl zu und füllt das Eingabefeld automatisch. Die aktuell gewählte Auswahl wird dabei stets neu gezeichnet, sodass keine Überlagerungen entstehen. Mit „Importieren“ schneidet das Tool die markierten Bereiche zurecht und verknüpft sie mit den Zeilen. Bei längerer Analyse erscheint ein Fortschrittsbalken. Ein immer sichtbarer Button „Neu hochladen“ erlaubt es, jederzeit eine andere Datei einzulesen; laufende Wiedergaben stoppen dabei automatisch. Datei, Segmentliste und Zuordnung werden im Projekt gespeichert und landen zusammen mit den Sounds im Backup. Beim erneuten Öffnen ist alles sofort verfügbar. Die Segmentierung ist nun direkt im Hauptskript eingebunden und funktioniert zuverlässiger. Über "🚫 Ignorieren" lassen sich Bereiche ausblenden und zugehörige Zeilen werden grau markiert.

Der Datei-Input besitzt sowohl ein `onchange`-Attribut als auch einen Listener, der beim Öffnen des Dialogs erneut gesetzt wird. So reagiert der Upload auch dann, wenn der Dialog dynamisch erzeugt wurde oder der Listener zuvor verloren ging.
Die Waveform passt ihre Breite nun automatisch an den Dialog an, damit Segmentmarkierungen exakt übereinstimmen.
Ungültige Segmentnummern werden abgefangen, rot markiert und die Zuordnung gelöscht. Nach erfolgreichem Analysieren erscheint die Meldung „Fertig“. Tritt ein Fehler auf, wird der Fortschrittsbalken beendet, der Dialog geleert und die Fehlermeldung bleibt sichtbar.
Beim Laden neuer Dateien schließt das Tool den verwendeten AudioContext sofort wieder, damit der Browser nicht zu viele offene Instanzen ansammelt.
Beim Zurücksetzen springt die Statusanzeige wieder auf „Analysiere…“, damit neue Uploads korrekt starten. Schließt man den Dialog, stoppt das Tool laufende Wiedergaben und gibt die erzeugten Object‑URLs frei.
Gespeicherte Segmente werden nun projektweise automatisch geladen; jede Änderung sichert das Projekt sofort, damit die Zuordnung nach einem Neustart erhalten bleibt.
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
### Player im Video-Manager

|  Taste             |  Funktion |
| ------------------ | ----------------------------- |
| **`Escape`**       | Player schließen |
| **`Leertaste`**    | Wiedergabe starten/pausieren |
| **`←` / `→`**      | 10 s zurück/vor |

---

## 📥 Import

### Import‑Funktionen

* **📥 Daten importieren**
  * **Wiki‑Tabellen:** Automatische Spalten‑Erkennung
  * **Pipe‑Format:** `Dateiname|EN Text|DE Text`
  * **Intelligente Zuordnung:** Dateinamen‑Spalte wird automatisch erkannt
  * **Multi‑Ordner‑Support:** Auswahl bei mehrdeutigen Dateien
  * **Database‑Matching:** Vergleich mit vorhandenen Audiodateien
  * **Untertitel-Import:** liest `closecaption_english.txt` und `closecaption_german.txt`, verknüpft Zeilen per ID und gleicht sie automatisch ab; zeigt bei Mehrdeutigkeit die vorhandenen Datenbank-Texte an
  * **Untertitel-Suche:** neuer 🔍-Button neben jeder Datei sucht ähnliche EN-Texte in den Untertiteln und übernimmt den passenden DE-Text; der gesuchte EN-Text wird angezeigt, `<clr:...>`-Farbcodes werden entfernt, `<HEADSET>`, `<cr>` sowie `<sb>`-Markierungen werden durch Leerzeichen ersetzt
  * **Globale Untertitel-Suche:** ein zusätzlicher Knopf durchsucht das gesamte Projekt nach fehlenden DE-Texten und fügt eindeutige 100%-Treffer automatisch ein; bei mehreren Treffern wird nachgefragt

---

### Untertitel-Import

Mit diesem Import liest das Tool die Dateien `closecaption_english.txt` und `closecaption_german.txt` aus dem Ordner `closecaption/` ein. Eine Utility-Funktion `loadClosecaptions()` verarbeitet beide Dateien und liefert ein Array aller Zeilen. Die Einträge werden über ihre ID zusammengeführt und mit der Datenbank abgeglichen. Bei eindeutiger Übereinstimmung wird der deutsche Text automatisch zugeordnet. Sind mehrere Dateien möglich, erscheint eine Auswahl, um den passenden Ordner festzulegen oder den Eintrag zu überspringen.
Ab sofort zeigt diese Auswahl zusätzlich die vorhandenen EN- und DE-Texte des jeweiligen Ordners an. Die gleiche Funktion wird auch für die neue Untertitel-Suche verwendet.

## 📁 Ordner‑Management

### Ordner‑Browser Features

* **📊 Globale Statistiken:** Übersetzungsfortschritt über alle Projekte
* **📈 Level‑Statistiken:** Aufklappbares Panel mit Details pro Level
* **🎨 Ordner‑Anpassung:** Icons und Farben individuell einstellbar
* **📄 Datei‑Zähler:** Zeigt pro Ordner Gesamt‑, fertige und offene Dateien an
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
Dort gibt es jetzt auch einen Bereich **ChatGPT API**. Der Schlüssel wird lokal AES‑verschlüsselt im Nutzerordner gespeichert und lässt sich über einen Test-Knopf prüfen. Der verwendete Verschlüsselungsschlüssel stammt aus der Umgebungsvariable `HLA_ENC_KEY`; pro Speicherung wird ein zufälliger IV erzeugt und zusammen mit dem Ciphertext abgelegt. Nach erfolgreichem Test kannst du die Liste der verfügbaren Modelle abrufen (↻) und eines auswählen. Die Modell-Liste wird 24&nbsp;Stunden zwischengespeichert. Vor dem Senden wird die geschätzte Tokenzahl angezeigt, ab 75k folgt ein Warnhinweis. Der Bewertungs‑Prompt liegt in `prompts/gpt_score.txt`. Beim Start der Bewertung öffnet sich zusätzlich eine Konsole, die alle GPT-Nachrichten anzeigt.

Neu hinzugekommen ist eine automatische Erkennung der modernen **Responses-API** von OpenAI. Modelle wie `gpt-4.1` oder `gpt-5.0` funktionieren jetzt ohne Anpassungen; das Tool wählt intern den passenden Endpunkt und interpretiert die Antworten korrekt als JSON. Dadurch lassen sich auch kommende GPT‑Generationen verwenden, ohne dass Konfigurationsdateien angepasst werden müssen. Zusätzlich zeigen Fehlermeldungen bei Problemen mit GPT‑5 jetzt den Originaltext aus der OpenAI-Antwort an. So lassen sich Konfigurationsfehler (z. B. veraltete Modellnamen oder Limits) deutlich schneller erkennen, statt nur den Statuscode `HTTP 400` zu sehen.

Seit Patch 1.40.371 filtert der Bewertungsdienst außerdem die neuen **Reasoning-Blöcke** von `gpt-5-chat-latest` heraus. Das Modell sendet dabei häufig zuerst interne Gedanken, bevor der eigentliche JSON-Block folgt. Die Anwendung ignoriert diese Zwischenschritte automatisch und übernimmt ausschließlich den tatsächlichen Antworttext. Dadurch bleiben die Bewertungen stabil, selbst wenn das Modell ausführliche Denkprozesse mitsendet.

---

## 💾 Backup

Mit dem Backup-Dialog lassen sich alle Projekt-Daten als JSON speichern. Neu ist die Option, die Ordner **Sounds/DE**, **DE-Backup** und **DE-History** als ZIP-Archiv zu sichern. Die ZIP-Dateien liegen im Benutzerordner unter `Backups/sounds`. Das Tool behält automatisch nur die fünf neuesten ZIP-Backups. Die Liste der Backups zeigt nun Datum und Uhrzeit an, sortiert mit dem aktuellsten Eintrag oben. Beim Erstellen eines Sound-Backups erscheint jetzt ein Fortschrittsbalken und die Liste zeigt Datum sowie Dateigröße jeder ZIP-Datei an.


## 🗃️ Speichersysteme

Beim ersten Start erscheint ein Dialog zur Wahl des Speichersystems. Zur Auswahl stehen der klassische `localStorage` und ein neues `IndexedDB`-Backend. Alle Zugriffe erfolgen über einen gemeinsamen Adapter, der die gewählte Variante kapselt.

### Auswahl

Der Startdialog fragt einmalig nach dem bevorzugten Modus und merkt sich die Entscheidung. Ein späterer Wechsel ist jederzeit möglich.

### Migration

Über den Knopf **Daten migrieren** werden sämtliche Einträge vom bisherigen Backend in das neue System kopiert. Anschließend wird der alte Speicher geleert, sodass keine veralteten Schlüssel zurückbleiben.

### Anzeige und Wechsel

In der Werkzeugleiste informiert ein Indikator über den aktuell genutzten Speicher. Ein danebenliegender Knopf wechselt auf Wunsch das System, ohne dabei Daten zu kopieren. Für eine Übernahme steht weiterhin **Daten migrieren** bereit. Beim Wechsel erscheinen kurze Hinweise, und die Statusleiste nennt beim Speichern das aktive System. Dabei werden alle internen Caches geleert, damit keine Daten aus dem zuvor aktiven Backend sichtbar bleiben. Zusätzlich werden sämtliche alten LocalStorage-Einträge entfernt; der gewählte Modus und bestehende Projekt-Locks bleiben erhalten.
Ein weiterer Knopf öffnet den Ordner, in dem das neue Speichersystem seine Daten ablegt.
Startet das Werkzeug bereits im Datei-Modus, wird der LocalStorage auf alte Projekt- oder Datei-Schlüssel geprüft und bei Bedarf automatisch bereinigt.

### Fallback ohne OPFS-Unterstützung

Wird der Zugriff auf das Origin Private File System blockiert – etwa im `file://`-Kontext mit strengen `worker-src`-Richtlinien –, speichert das IndexedDB-Backend große Dateien automatisch als Base64-Datenblöcke direkt in der Datenbank. Der Indikator zeigt dann **„Datei-Modus (Base64)“** an. Alle Inhalte bleiben damit trotz fehlender OPFS-Rechte zwischen Sitzungen erhalten und der lästige Konsolenfehler verschwindet.

### Schlüssel-Kompatibilität

Das IndexedDB-Backend rekonstruiert Schlüssel aus dem Fallback-Store unverändert und liefert z. B. `project:7:meta` wieder exakt so zurück. Reguläre `misc:`-Einträge behalten weiterhin ihr Präfix, sodass bestehende Aufrufer keine Änderungen benötigen. Die Startprüfung `syncProjectListWithStorage` erkennt dadurch auch nach einer Migration alle Projekt-IDs zuverlässig und ergänzt fehlende Listenplätze.

### Kontrolle

Über `visualizeFileStorage('schlüssel')` lässt sich prüfen, ob ein bestimmter Eintrag ausschließlich im neuen Speichersystem liegt. Das Ergebnis wird im Statusbereich angezeigt.

### Visualisierung pro Datei

In der Dateiliste markiert eine zusätzliche Spalte mit 🆕 oder 📦, ob eine Datei im neuen Speichersystem oder noch im LocalStorage gespeichert ist. Beim Wechsel des Systems aktualisiert sich die Anzeige automatisch.

## 🗄️ Datenlayout & Dateiverwaltung

Der bisher dokumentierte Node-Speicherlayer (`utils/dataLayout.js`) wurde entfernt, weil keine Module mehr darauf zugreifen.
Die Browser-Helfer aus `web/src/fileStorage.js` übernehmen weiterhin Journal-Wiederherstellungen und sichere Schreibvorgänge.
Content-Addressed Storage, Kapitel-Shards und das `cache:<typ>:<hash>`-Schema sind damit aus dem aktiven Code verschwunden und
werden vorerst nicht mehr bereitgestellt.

## 🗂️ Projektstruktur

Die wichtigsten JavaScript-Dateien sind nun thematisch gegliedert:
* **web/src/main.js** – Initialisierung der App
* **web/src/fileUtils.js** – Text-Funktionen wie `calculateTextSimilarity`
* **web/src/colorUtils.js** – Farb-Hilfsfunktionen wie `getVersionColor`
* **web/src/fileUtils.mjs** – Wrapper, der die Textfunktionen sowohl im Browser als auch unter Node bereitstellt
* **web/src/gptService.js** – Anbindung an die ChatGPT-API. Stellt `evaluateScene`, `testKey`, `fetchModels`, `getSystemPrompt`, `generateEmotionText`, `adjustEmotionText`, `improveEmotionText`, `sanitizeJSONResponse`, `fetchWithRetry`, `queuedFetch`, `cancelGptRequests` und `setRestMode` bereit; der frühere Helfer `getEmotionPrompt` entfällt und das Emotion-Prompt bleibt intern verwaltet.
* **web/src/actions/projectEvaluate.js** – Bewertet sichtbare Zeilen und aktualisiert die Tabelle

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
* **🛡️ HTML-Schutz:** Suchbegriffe werden vor Ausfuehrung von Code gesichert
* **Bugfix:** Das Live-Suchfeld zeigt Hervorhebungen jetzt korrekt an und blendet HTML-Tags nicht mehr ein
* **Bugfix:** Ordnerauswahl erscheint wieder korrekt, wenn eine Datei in mehreren Ordnern gefunden wird
* **Neu:** Im Auswahlfenster gibt es nun den Button "Alle hinzufügen", der sämtliche gefundenen Pfade auf einmal zum Projekt hinzufügt
* **Update:** Beim Klick auf "Alle hinzufügen" werden nur noch Dateien übernommen, deren englischer Text mit dem ausgewählten Ergebnis identisch ist

### Intelligente Features

* **🧠 Smart Folder Detection:** Erkennt Half‑Life Charaktere automatisch
* **📏 Auto‑Height Textboxen:** EN/DE Felder bleiben höhengleich
* **📐 Längen-Vergleich:** Zwei farbige Symbole zeigen, ob die ursprüngliche und die bearbeitete deutsche Audiodatei kürzer (grün), länger (rot) oder gleich lang wie das englische Original sind
* **🎨 Theme‑System:** Automatische Icon‑ und Farb‑Zuweisungen
* **💡 Context‑Awareness:** Funktionen passen sich dem aktuellen Kontext an
* **🔄 Dateinamen-Prüfung:** Klick auf den Dateinamen öffnet einen Dialog mit passenden Endungen
* **📋 Strg+Klick auf Dateiname:** kopiert den Namen ohne Endung in die Zwischenablage

### Gemeinsame Auswertungen

* **📊 Geteilte Statistiklogik:** Browser und Node-Tests verwenden jetzt gemeinsam `web/src/calculateProjectStats.js`, sodass Projektauswertungen überall auf demselben Stand bleiben.

---

## 🐛 Troubleshooting

### Häufige Probleme

**🎵 Audio spielt nicht ab**
* ▶ **Lösung:** Audiodateien erneut einlesen, falls Berechtigungen fehlen
* ▶ **Automatisch:** Tool prüft beim Start, ob Dateien verfügbar sind

**📁 Dateien nicht gefunden**
* ▶ **Lösung:** Haupt‑Audio‑Ordner erneut einlesen
* ▶ **Prüfung:** Debug‑Spalte zeigt Pfad‑Status

**🐢 Oberfläche wird nach langer Laufzeit träge**
* ▶ **Ursache:** Vor Version 1.40.361 legte jede Aktualisierung der Dateitabelle einen weiteren globalen Klick-Listener auf dem Dokument ab. Mit zunehmender Laufzeit sammelten sich dadurch hunderte Handler an und jeder Klick prüfte alle Pfad-Zellen erneut.
* ▶ **Fix:** Die Pfad-Spalte markiert gebundene Zellen jetzt mit `data-path-menu-bound` und registriert den Dokument-Listener nur einmal. Damit bleibt die Oberfläche auch nach vielen Stunden responsiv.

**⚠️ Spur manuell generieren oder Beta freischalten**
* ▶ **Ursache:** Die gewählte Sprachspur konnte nicht automatisch heruntergeladen werden.
* ▶ **Lösung:** Spur im Studio manuell generieren oder Beta-Zugang für den Auto-Download freischalten.

**❓ target_lang nicht gesetzt?**
* ▶ **Hinweis:** Diese Warnung stammt aus älteren Automatisierungen mit `waitForDubbing`. Die Browser-Variante setzt stattdessen auf `isDubReady` und blendet den Hinweis nicht mehr ein.

**⚙️ Fehlerhafter Permissions-Policy-Header**
* ▶ **Lösung:** Das Desktop-Tool entfernt nun automatisch den Header-Eintrag `ch-ua-form-factors`.


**🔄 Duplikate in Datenbank**
* ▶ **Lösung:** „🧹 Duplikate bereinigen" verwenden
* ▶ **Intelligente Bereinigung:** Behält beste Versionen automatisch

**💾 Fehler beim Speichern des DE-Audios**
* ▶ **Hinweis:** Ordnerzugriff erneut erlauben oder Pfad prüfen. Das Tool zeigt die genaue Ursache im Toast an.
* ▶ **Pfad prüfen:** Beim Speichern wird `sounds/DE/` nun automatisch entfernt, falls der Pfad doppelt vorkommt.
* ▶ **Neu:** Jede Fehlermeldung beim Speichern wird nun als Toast eingeblendet.
* ▶ **Entfernt:** MP3-Encoding ist nicht länger möglich, alle Dateien werden als WAV gespeichert.
* ▶ **Neu:** Beim Programmstart werden vorhandene MP3-Dateien automatisch in WAV umgewandelt und im Ordner `Backups/mp3` gesichert.
* ▶ **Fix:** Das Backup funktioniert jetzt auch über Laufwerksgrenzen hinweg, da beim Verschieben auf Kopieren mit anschließendem Löschen umgestellt wird.
* ▶ **Neu:** Geänderte Dateiendungen werden erkannt und automatisch korrigiert.
* ▶ **Fix:** Der 📋-Button kopiert den Text nun zuverlässig; das zugehörige Event wird korrekt verarbeitet.
* ▶ **Neu:** Segment-Import ohne Ordnerauswahl – in der Desktop-Version landen zugeschnittene Segmente jetzt direkt per `saveDeFile` am richtigen Ort.
* ▶ **Fix:** Importierte Segmente setzen alle Bearbeitungs-Symbole zurück.
* ▶ **Neu:** Zuordnungen im Segment-Dialog bleiben nach einem Neustart erhalten.

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
* **🔧 Debug-Konsole:** Diese Konsole ist standardmäßig verborgen und erscheint nur bei Entwickleraktionen (z. B. Dev-Button). In der Desktop-Version öffnen sich die DevTools automatisch in einem separaten Fenster oder per `F12` bzw. `Ctrl+Shift+I`. Der zugehörige Knopf reagiert wieder wie erwartet und blendet zusätzlich die Debug-Infos ein.
* **💡 Neues Debug-Fenster:** Gruppiert System- und Pfadinformationen übersichtlich und bietet eine Kopierfunktion.
* **📦 Modul-Status:** Neue Spalte im Debug-Fenster zeigt, ob alle Module korrekt geladen wurden und aus welcher Quelle sie stammen.
* **🖥️ Erweiterte Systemdaten:** Das Debug-Fenster zeigt jetzt Betriebssystem, CPU-Modell und freien Arbeitsspeicher an.
* **🧠 Laufzeit-Infos:** Zusätzlich werden Prozesslaufzeit und RAM-Verbrauch angezeigt.
* **🐞 Fehlerbehebung:** Das Debug-Fenster nutzt eine interne `showModal`-Funktion und vermeidet so den Fehler „ui.showModal ist keine Funktion“.
* **📸 VideoFrame-Details:** Zusätzlich werden der Pfad zum Frame-Ordner und die Versionen der Video-Abhängigkeiten angezeigt.
* **📝 Ausführliche API-Logs:** Alle Anfragen und Antworten werden im Dubbing-Log protokolliert
* **📋 Debug-Bericht exportieren:** Ein Knopf öffnet ein Fenster mit einzelnen Debug-Berichten samt Dateigröße in MB; jede Datei kann separat exportiert werden. Fehlt die Dateisystem-API oder scheitert das Speichern, wandern die Inhalte automatisch in die Zwischenablage. Der Button funktioniert nach einer internen Umstellung wieder zuverlässig.
* **🛠 Debug-Logging aktivieren:** Setze `localStorage.setItem('hla_debug_mode','true')` im Browser, um zusätzliche Konsolen-Ausgaben zu erhalten
* **🐞 Ausführliche Fehlerprotokolle:** Im Debug-Modus erscheinen unbehandelte Promise-Ablehnungen sowie Datei-, Zeilen- und Stack-Informationen

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
* **🪟 Virtuelle Listen** für sehr lange Tabellen
* **🔎 Lokale Suchindizes** je Projekt
* **💽 Speicher‑Monitor** mit Aufräumen‑Knopf
* **🛈 Klare Anzeige des Speichermodus** in Toolbar und Statusleiste

---


## 🧪 Tests

Diese Repository nutzt **Jest** als Test Runner. Um die Tests auszuführen:
Ein neuer GitHub-Workflow (`node-test.yml`) führt nach jedem Push oder Pull Request automatisch `npm ci` und `npm test` mit Node 18 bis 22 aus.

`npm test` installiert dank eines `pretest`-Skripts automatisch alle Abhängigkeiten per `npm ci --ignore-scripts`.
Wer alle optionalen Skripte ausführen möchte, startet vorher manuell `npm ci`.
Ab Node.js 22 werden unbehandelte Promises standardmäßig als Fehler gewertet und würden die Tests abbrechen.
Das Test-Skript ruft deshalb Jest mit `node --unhandled-rejections=warn` auf, sodass solche Fälle nur eine Warnung auslösen.

1. Tests starten
   ```bash
   npm test
   ```

   Zur Fehlersuche bei offenen Handles kann Jest auch so gestartet werden:
   ```bash
   npm test -- tests/saveFormats.test.js --detectOpenHandles
   ```

Die wichtigsten Tests befinden sich im Ordner `tests/` und prüfen die Funktionen `calculateProjectStats`, die ElevenLabs‑Anbindung und den Datei‑Watcher. Ein GitHub‑Workflow führt sie automatisch mit Node 18–22 aus. Der Regressionstest `translationCallbackDuringReset.test.js` stellt zusätzlich sicher, dass verspätete Übersetzungsantworten während eines globalen Resets keine Projektdaten mehr speichern.

1. **Entwicklungsserver starten**
   ```bash
   cd electron
   npm start
   ```
2. **Audiodatei hochladen** – im geöff­neten Tool eine WAV‑ oder MP3‑Datei auswählen.
3. **Logs prüfen** – in der Konsole erscheinen Meldungen zu Upload und Dubbing.
4. **Audio anhören** – nach Abschluss wird die generierte Sprachausgabe abgespielt.

### Manuelle QA: Übersetzungs-Worker

1. **Electron-App starten**
   ```bash
   cd electron
   npm start
   ```
2. **Testprojekt öffnen** – eine beliebige Zeile auswählen und die automatische Übersetzung starten (z. B. über das Kontextmenü).
3. **Worker-Start prüfen** – in der Hauptprozess-Konsole erscheint `TranslateWorker`, sobald der Python-Server bereit ist.
4. **Neustart simulieren** – in einem zweiten Terminal den laufenden Prozess beenden:
   ```bash
   pkill -f "translate_text.py --server"
   ```
   Der Hauptprozess protokolliert nun einen automatischen Neustart.
5. **Antworten verifizieren** – die zuvor gestartete Übersetzung wird nach dem Neustart fertiggestellt und im UI angezeigt. Neue Übersetzungsaufträge laufen ohne manuellen Eingriff weiter.

### Tests ausführen

Für die automatischen Tests sind neben Node auch einige Python‑Pakete notwendig,
die in `requirements.txt` aufgeführt sind. Bei fehlender Internetverbindung
schlagen `npm ci` und `pip install` daher meist fehl. Als Workaround können die
benötigten Wheels vorab lokal zwischengespeichert und `npm ci --ignore-scripts`
verwendet werden, um optionale Downloads zu überspringen.

**Erfolgskriterien**

* Ausgabe erfolgt auf Deutsch.
* Timing der Sprachausgabe passt zum Original.

### Manuelle Prüfung

* **Auto-Trim + Tempo** – Im DE-Audio-Editor zuerst „Auto-Trim“ auslösen, danach „Tempo automatisch anpassen“.
* **Werte kontrollieren** – Prüfen, dass Start- und Endfelder die Laufzeit nicht überschreiten.
* **Speichern** – Mit „Speichern“ bestätigen und sicherstellen, dass die grüne Markierung (`deSelectionActive`) sichtbar bleibt.

## 🧩 Wichtige Funktionen

* **`readAudioFiles(dir)`** – liest alle Audiodateien eines Ordners rekursiv ein und gibt ihre Pfade im POSIX‑Format zurück.
* **`createWindow()`** – öffnet das Hauptfenster der Electron‑App und richtet einen Shortcut zum Ein‑/Ausblenden der DevTools ein.
* **`backup-de-file(relPath)`** – kopiert eine vorhandene deutsche Audiodatei nach `DE-Backup`, sofern dort noch keine Sicherung existiert.
* **`delete-de-backup-file(relPath)`** – löscht eine Sicherung aus `DE-Backup` und entfernt leere Unterordner.
* **`restore-de-file(relPath)`** – stellt eine deutsche Audiodatei aus dem Backup wieder her.
* **`create-sound-backup()`** – packt `Sounds/DE`, `DE-Backup` und `DE-History` als ZIP in `Backups/sounds`.
* **`list-sound-backups()`** – listet vorhandene ZIP-Sicherungen auf.
* **`delete-sound-backup(name)`** – entfernt ein ZIP-Backup.
* **`saveDeHistoryBuffer(relPath, data)`** – legt einen Buffer als neue History-Version ab.
* **`switchVersion(historyRoot, relPath, name, targetRoot, limit)`** – stellt eine gespeicherte Version im Zielordner bereit, verschiebt vorher die aktuelle Datei in die Historie und entfernt den genutzten Eintrag.
* **Entfernt:** Der frühere Helfer `restoreVersion` entfällt zugunsten von `switchVersion`.
* **`chooseExisting(base, names)`** – liefert den ersten existierenden Ordnernamen und wirft einen Fehler bei leerer Liste.
* **`copyDubbedFile(originalPath, tempDubPath)`** – verschiebt eine heruntergeladene Dub-Datei in den deutschen Ordnerbaum.
* **`extractRelevantFolder(parts)`** – gibt den relevanten Abschnitt eines Dateipfades ab "vo" oder ohne führendes "sounds" zurück (siehe `web/src/pathUtils.js`). Der frühere zweite Parameter mit dem vollständigen Pfad entfällt; das Array der Ordnerteile reicht aus.
* **`calculateProjectStats(project)`** – ermittelt pro Projekt den Übersetzungs‑ und Audio‑Fortschritt. Diese Funktion wird auch in den Tests ausführlich geprüft.
* **`addFileToProject(filename, folder)`** – fügt eine neue Datei anhand von Dateiname und Ordner in das aktuell geladene Projekt ein; weitere Metadaten wie Texte werden direkt aus den globalen Datenbanken abgerufen, daher ist kein dritter Parameter mehr nötig.
* **`ipcContracts.ts`** – definiert Typen für die IPC-Kommunikation zwischen Preload und Hauptprozess.
* **`repairFileExtensions(projects, filePathDatabase, textDatabase)`** – aktualisiert veraltete Dateiendungen in Projekten und verschiebt vorhandene Texte.
  Die Funktion steht im Browser direkt unter `window` zur Verfügung und kann ohne Import genutzt werden.
  * **`safeCopy(text)`** – kopiert Text in die Zwischenablage und greift bei Fehlern auf Electron zurück.
  * **`saveProjectToFile(data)`** – speichert das übergebene Objekt per File System Access API als JSON auf der Festplatte.
  * **`loadProjectFromFile()`** – öffnet eine zuvor gesicherte JSON-Datei, prüft Pflichtfelder und entfernt Einträge mit unbekannter Datei-ID.
  * **`exportLocalStorageToFile()`** – exportiert alle LocalStorage-Einträge in eine Datei im gewählten Ordner und gibt den Speicherort zurück, ohne die Originaldaten zu löschen; prüft die Verfügbarkeit der File-System-API, nutzt bei verweigertem Zugriff den internen Browser-Speicher (OPFS) als Fallback und liefert nur bei fehlendem Support eine verständliche Fehlermeldung. Der frühere Funktionsname `migrateLocalStorageToFile` bleibt als Alias erhalten.
  * **`startMigration()`** – startet den Export, zeigt alte und neue Eintragsanzahl sowie den Zielordner in der Oberfläche an.
  * **`importLocalStorageFromOpfs()`** – liest die Datei `hla_daten.json` aus dem OPFS, ersetzt den aktuellen LocalStorage und gibt die Anzahl der geladenen Einträge zurück.
  * **`loadMigration()`** – UI-Helfer, der den Import startet und Statusmeldungen anzeigt.
  * **Entfernt:** Der frühere UI-Helfer `switchStorageDirection` entfällt; Speichermodus-Wechsel erfolgen direkt über `switchStorage`.
  * **`cleanupProject.js`** – nutzt `removeUnknownFileIds`, um Datei-IDs mit einer Liste aus der Oberfläche abzugleichen und unbekannte Einträge zu entfernen. Aufruf: `node utils/cleanupProject.js <projekt.json> <ids.json>`.
  * **`removeUnknownFileIds(project, ids, logFn)`** – Hilfsfunktion, die alle Dateien mit unbekannter ID entfernt und jede Entfernung protokolliert.
  * **Entfernt:** Die frühere Hilfsfunktion `syncProjectData` steht nicht mehr zur Verfügung, da ihre Aufgaben vollständig von `repairFileExtensions` abgedeckt werden.
  * **`createStorage(type)`** – liefert je nach Typ ein Speicher-Backend; neben `localStorage` steht nun `indexedDB` zur Verfügung, das Daten je Objekt in eigenen Stores ablegt, große Dateien vorzugsweise im OPFS, ansonsten als Base64-Datenblock speichert und ohne Benutzerschlüssel auskommt.
  * **Entfernt:** Der frühere Setter `setStorageAdapter` steht nicht mehr unter `window`; Speichermodus-Wechsel greifen ausschließlich auf `switchStorage` zurück und erzeugen neue Adapter bei Bedarf über `createStorage`.
  * **`storage.capabilities`** – liefert Feature-Flags wie `blobs` (`opfs`, `base64` oder `none`) und `atomicWrite`, sodass die Oberfläche fehlende OPFS-Unterstützung erkennen und ausweichen kann.
  * **`storage.runTransaction(async tx => { ... })`** – führt mehrere Schreibvorgänge gebündelt aus und bricht bei Fehlern komplett ab.
  * **`acquireProjectLock(id)`** – verhandelt einen exklusiven Schreibzugriff pro Projekt und schaltet weitere Fenster in den Nur-Lesen-Modus.
  * **Entfernt:** Die Node-Hilfsfunktionen `journalWiederherstellen(basis)` und `garbageCollect(manifeste, basis, dryRun)` wurden aus dem Projekt gestrichen.
    Die Browser-Variante kümmert sich weiterhin um Journale; eine Blob-Aufräumroutine existiert derzeit nicht mehr.
  * **`validateProjectManifest(data)`** – prüft `project.json` gegen ein Zod-Schema und stellt sicher, dass `schemaVersion` und Name vorhanden sind.
  * **`switchProjectSafe(id)`** – wechselt Projekte atomar, bricht laufende Vorgänge ab, leert GPT-Zustände und repariert Verweise.
  * **`switchStorage(targetMode)`** – wechselt das Speichersystem ohne Migration, setzt globale Zustände zurück und lädt Projektliste und Wörterbuch neu.
  * **`LocalIndex`** – kleiner invertierter Index für lokale Volltextsuchen innerhalb eines Projekts; bietet `add(id, text)` zum Aufbau sowie `search(term)` für Trefferlisten. Beim Entfernen von Dateien wird der Index derzeit komplett neu aufgebaut, eine separate `remove`-Methode existiert nicht mehr.
  * **Beim Start** wird jetzt `navigator.storage.persist()` ausgeführt; zusammen mit `navigator.storage.estimate()` zeigt die Oberfläche an, wie viel lokaler Speicher verfügbar bleibt.
