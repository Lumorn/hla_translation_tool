# hla_translation_tool
# 🎮 Half‑Life: Alyx Translation Tool

![Half‑Life: Alyx Translation Tool](https://img.shields.io/badge/Version-1.40.6-green?style=for-the-badge)
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
* [💾 Backup](#-backup)
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
* **Direkter Spielstart:** Über eine zentrale Start-Leiste lässt sich das Spiel oder der Workshop in der gewünschten Sprache starten. Der Steam-Pfad wird automatisch aus der Windows‑Registry ermittelt.
* **Eigene Video-Links:** Über den Video-Manager lassen sich mehrere URLs speichern und per Knopfdruck öffnen. Fehlt die Desktop-App, werden die Links im Browser gespeichert.
* **Schnellstart im Player:** YouTube-Links aus der URL-Eingabe starten direkt im eingebetteten Player; andere Links werden extern geöffnet. Beim Öffnen wird automatisch ein Bookmark angelegt.
* **Video-Bookmarks:** Speichert Links für einen schnellen Zugriff.
* **Löschen per Desktop-API:** Einzelne Bookmarks lassen sich nun über einen zusätzlichen IPC-Kanal entfernen.
* **Tests für Video-Bookmarks:** Überprüfen Laden, Sortierung sowie Hinzufügen und Entfernen von Einträgen.
* **Tests für den YouTube-Player:** Prüfen Speicherung über das Intervall, Löschfunktion sowie Dialog und Slider.
* **Test für OCR-Overlay-Sichtbarkeit:** Stellt sicher, dass Overlay und Ergebnis-Panel korrekt ein- und ausgeblendet werden.
* **Neue Tests für die OCR-Pipeline:** Prüfen die Bildverarbeitung und den Auto-OCR-Start.
* **Prüfung von Video-Links:** Eingaben müssen mit `https://` beginnen und dürfen keine Leerzeichen enthalten.
* **Duplikat-Prüfung & dauerhafte Speicherung im Nutzerordner**
* **Automatische YouTube-Titel:** Beim Hinzufügen lädt das Tool den Videotitel per oEmbed und sortiert die Liste alphabetisch. Schlägt dies fehl, wird die eingegebene URL als Titel gespeichert.
* **Video-Manager mit integriertem Player:** Ein einziges Fenster zeigt links die gespeicherten Links und rechts den YouTube‑Player. Suchfeld, sortierbare Spalten sowie Hinzufügen‑, Umbenennen‑ und Lösch‑Buttons bleiben erhalten.
* **Überarbeitete Video-Manager-Oberfläche:** Neue Farbakzente, Suchfeld und deutlichere Aktions-Icons erleichtern die Bedienung.
* **Stabiles Sortieren:** Nach Filterung oder Sortierung funktionieren die Video-Buttons dank Originalindex weiterhin korrekt.
* **Thumbnail-Ansicht:** Die Tabelle zeigt Vorschaubilder statt Nummern. Ein Klick auf Bild oder Titel startet sofort das Video – der separate Play-Button entfällt.
* **YouTube-Player:** Läuft innerhalb des Managers. Beim Schließen des Players bleibt die exakte Position per `getCurrentTime()` erhalten. **Escape** schließt den Player, **Leertaste** startet oder pausiert und die **Pfeiltasten** springen 5 s.
* **`openPlayer`/`closePlayer` veraltet:** Diese Funktionen leiten jetzt intern auf `openVideoDialog` bzw. `closeVideoDialog` um.
* **16:9-Playerfenster:** Das eingebettete Video behält stets ein Seitenverhältnis von 16:9 und passt sich jeder Fenstergröße an.
* **Fehlerbehebung:** Der integrierte Player lässt sich mehrfach starten, ohne dass der `videoPlayerFrame` fehlt.
* **Korrekte Spaltenbreite im Video-Manager:** Kopfzeile und Tabelle sind jetzt bündig, komplette Videotitel erscheinen als Tooltip.
* **Dynamische Größenanpassung:** Dialog, Player und Buttons passen sich automatisch an die Fenstergröße an.
* **Behobenes Resize-Problem:** Nach einer Verkleinerung wächst der Videoplayer jetzt korrekt mit, sobald das Fenster wieder größer wird.
* **Korrektes Skalieren nach erneutem Öffnen:** Der Player passt sich nach dem Wiedereinblenden automatisch an die aktuelle Fenstergröße an.
* **Aktualisierung im Hintergrund:** Selbst bei geschlossenem Player wird die Größe im Hintergrund neu berechnet und beim nächsten Öffnen korrekt übernommen.
* **Verbesserte Thumbnail-Ladefunktion:** Vorschaubilder werden über `i.ytimg.com` geladen und die gesamte Zeile ist zum Öffnen des Videos anklickbar.
* **Fehlerhinweis bei fehlender YouTube-API:** Lädt der Player nicht, erscheint eine Meldung statt eines schwarzen Fensters.
* **Toast bei gesperrten Videos:** Tritt ein YouTube-Fehler auf, informiert ein roter Hinweis über mögliche Proxy-Pflicht.
* **Strg+Umschalt+V** liest eine YouTube-URL aus der Zwischenablage und fügt sie automatisch ein.
* **Dialog frei verschieb- und skalierbar:** Der Video-Manager lässt sich per Maus verschieben und in der Größe anpassen.
* **Hilfsfunktion `extractYoutubeId`:** Einheitliche Erkennung der Video-ID aus YouTube-Links.
* **Schlankerer Video-Manager:** URL-Eingabefeld unter den Buttons und eine klar beschriftete Aktions-Spalte. Der Player behält auf allen Monitoren sein 16:9-Format, ohne seitlichen Beschnitt, und die Steuerleiste bleibt sichtbar.
* **Maximierte Listenbreite:** Die gespeicherten Videos beanspruchen nun maximal 480 px Breite. Titelspalte und Vorschaubild bleiben schlank und das Thumbnail hält stets das Seitenverhältnis 16:9.
* **Verbesserte dynamische Dialoghöhe:** Der Video-Manager schrumpft nun auch bei kleinen Fenstern und entfernt überflüssigen Leerraum.
* **Automatische Dialogbreite:** Ohne geöffneten Player richtet sich die Breite des Video-Managers nach der Liste.
* **Flexibles Fenster für gespeicherte Videos:** Höhe passt sich jetzt automatisch an Videoplayer und Liste an.
* **Voll ausgenutzte Video-Liste:** Das Tabellenfeld wächst bis zum unteren Rand des Dialogs und lässt keinen Leerraum unter dem Schließen-Button.
* **Breitenbegrenzter Player:** Die Breite richtet sich nach der verfügbaren Höhe und überschreitet nie das Format 16:9.
* **Verbesserte Player-Anpassung:** Die Höhe des IFrames ergibt sich jetzt aus der Dialogbreite und wird auf 90 % der Fensterhöhe begrenzt. Zwei `requestAnimationFrame`-Aufrufe sorgen nach jedem Öffnen oder Resize für korrekte Maße.
* **Fehlerfreies Skalieren nach Schließen:** Ändert man die Fenstergröße bei geschlossenem Dialog, berechnet das IFrame seine Breite beim nächsten Öffnen korrekt neu.
* **Stabilerer ResizeObserver:** Die Dialog-Anpassung nutzt `requestAnimationFrame` und verhindert so die Fehlermeldung "ResizeObserver loop limit exceeded".
* **Gethrottleter Video-ResizeObserver:** `adjustVideoPlayerSize` und `positionOverlay` werden pro Frame gebündelt ausgeführt und umgehen so Endlos-Schleifen.
* **Dynamische Größenberechnung:** `calcLayout()` ermittelt Breite und Höhe des Players aus Dialog- und Panelgröße und wird per `ResizeObserver` automatisch aufgerufen.
* **Exportfunktion für Video-Bookmarks:** Gespeicherte Links lassen sich als `videoBookmarks.json` herunterladen.
* **Dauerhafte Video-Suche:** Der Suchbegriff im Video-Manager bleibt zwischen den Sitzungen erhalten.
* **Responsiver Video-Manager:** Fester Dialog-Abstand, flexible Toolbar mit Min-Buttons und kompaktem ❌-Icon bei schmaler Breite. Tabellenzeilen besitzen gleichmäßiges Padding und einen Hover-Effekt.
* **Aufgeräumtes Drei-Leisten-Layout** für Projektsteuerung, Spielstart und Dateifilter.
* **Flexible Player-Steuerleiste:** Bei schmalen Fenstern rutscht der Slider in eine zweite Zeile. Icons und Zeitangaben verkleinern sich automatisch.
* **Fixierte Steuerleiste im Player:** Die Bedienelemente haften nun dank `position: sticky` direkt unter dem Video, besitzen volle Breite und liegen mit höherem `z-index` stets über dem Ergebnis-Panel. Die Liste nutzt variabel 22 % Breite (min. 260 px, max. 320 px).
* **Scrollbarer Videobereich:** Wird das Video höher als der Dialog, lässt sich der Player innerhalb des Fensters scrollen und die Buttons bleiben sichtbar.
* **Verbesserte Scroll-Performance:** Der Wheel-Handler ist nun passiv und reagiert flüssiger auf Mausbewegungen.
* **Beobachter pausieren beim Schließen:** Der ResizeObserver meldet sich ab, sobald der Dialog verborgen wird, und startet erst beim erneuten Öffnen. Dank zusätzlicher Prüfungen entstehen keine Endlos-Schleifen mehr.
* **Kompatibles Öffnen des Video-Managers:** Erkennt fehlendes `showModal()` und zeigt den Dialog trotzdem an.
* **Reaktivierter Klick-Listener:** Der "Videos"-Button öffnet den Manager nun zuverlässig.
* **Sicheres Öffnen des Video-Managers:** `showModal()` wird nur noch aufgerufen, wenn der Dialog geschlossen ist.
* **Fehlerfreies Mehrfach-Öffnen:** Beide Klick-Handler prüfen jetzt das `open`-Attribut und vermeiden so eine DOMException.
* **Schnellerer Dialog-Aufruf:** Die `open`-Prüfung passiert vor dem Neuladen der Tabelle und spart so unnötige Arbeit.
* **Mindestgröße für den Video-Dialog:** Beim Öffnen passt sich der Dialog an die Fenstergröße an, bleibt aber mindestens 600×400 px groß. Alle ❌-Buttons rufen jetzt sicher `videoDlg.close()` auf.
* **Optimal genutzter Player-Bereich:** Breite und Höhe orientieren sich jetzt an der größeren freien Dimension. Die Player-Sektion schrumpft exakt auf die IFrame-Höhe und vermeidet so schwarze Balken.
* **Einheitliche Größenberechnung:** Auch `adjustVideoPlayerSize()` prüft nun freie Breite und Höhe und wählt automatisch das größere Maß.
* **OCR-Funktion im Player:** Ein präzises Overlay deckt nur die Untertitel ab. Der Auto-Modus pausiert bei einem Treffer das Video und sammelt den Text im rechten Panel. F9 erstellt jetzt einen einzelnen OCR‑Screenshot. Ein neuer 🔍‑Button aktiviert den Dauerlauf.
* **Verbesserte OCR-Pipeline:** Overlay und Panel passen sich dynamisch an, starten nur nach Aktivierung und zeigen den erkannten Text gut lesbar im neuen Ergebnis‑Panel.
* **Nahtloser Player mit OCR-Panel:** Die Breite des IFrames berücksichtigt die Panelbreite, die Steuerleiste reicht bis an den Rand und der blaue OCR‑Rahmen sitzt exakt auf dem Videobild.
* **Feinschliff am OCR‑Panel:** Breite clamped, Panel überlappt keine Buttons mehr, Text scrollt automatisch und der 🔍‑Button blinkt kurz bei einem Treffer.
* **Fest rechts verankertes Ergebnis-Panel:** Das Panel sitzt nun neben dem Video und passt seine Höhe automatisch an, ohne das Bild zu überdecken.
* **Aufräumarbeiten am Panel-Layout:** Überflüssige CSS-Regeln entfernt und Höhe dynamisch gesetzt.
* **Panelgröße korrekt berechnet:** Die Player-Anpassung zieht nun die Breite des Ergebnis-Panels ab und setzt dessen Höhe direkt nach dem Video.
* **Schnell-Fix:** Das Ergebnis-Panel überdeckt das Video nicht mehr und passt seine Höhe exakt an die IFrame-Größe an.
* **Responsive OCR-Anzeige:** Bei schmalen Dialogen rutscht das Ergebnis-Panel automatisch unter das Video.
 * **Robuster Auto‑OCR‑Loop:** Das Intervall startet nur bei aktivem Toggle, pausiert nach einem Treffer das Video, stoppt automatisch und setzt sich beim erneuten Abspielen fort.
 * **CPU-schonendere OCR:** Nach jedem Durchlauf wird das Intervall angehalten und erst mit einem erneuten Play-Befehl wieder gestartet.
* **GPU-beschleunigte EasyOCR-Engine:** Erkennt Texte deutlich schneller und liefert stabilere Ergebnisse als Tesseract.
* **Neuer 📋-Button:** Kopiert den letzten OCR-Treffer direkt in die Zwischenablage.
* **ROI-Vorschau im Panel:** Das geschnittene Bild wird live im rechten Bereich angezeigt.
* **F9 führt einen einzelnen OCR-Durchlauf aus und zeigt eine Bildvorschau.**
* **Korrektur der OCR-Breite:** Der blaue Rahmen deckt jetzt die komplette Videobreite ab.
* **Verschieb- und skalierbares OCR-Overlay:** Der Rahmen lässt sich per Maus anpassen und merkt sich die letzte Position.
* **Verbesserte Positionierung:** Overlay und Ergebnis-Panel orientieren sich exakt am Video und umschiffen so Steuerleiste und Bild.
* **Overlay kollidiert nicht mehr mit den Controls:** Der blaue Rahmen endet 48 px über dem Rand und liegt mit niedrigerem `z-index` unter den Bedienelementen.
* **Neues OCR-Pop‑up:** Erkennt die OCR Text, pausiert das Video und öffnet ein separates Fenster mit dem gefundenen Text.
* **Debug-Fenster für die OCR:** Ein 🐞‑Button öffnet ein separates Fenster. Jetzt wird nach jedem Durchlauf der Screenshot samt Rohtext per `postMessage` übertragen und in einer kleinen Galerie gesammelt; ein erneuter Klick schließt das Fenster und stoppt den Stream.
* **OCR nur noch per EasyOCR-Worker:** Die aufwändigen Tesseract-Fallbacks wurden entfernt. Die Erkennung läuft komplett über den lokalen Python-Worker.
* **Exakte Video-Positionierung:** Playerbreite, Steuerleiste und Overlay richten sich nun dynamisch nach Dialog- und Panelgröße aus. Das IFrame skaliert dabei rein per CSS und die Berechnung läuft auch im versteckten Zustand.
* **Vollbreite ohne OCR:** Das Ergebnis-Panel bleibt standardmäßig verborgen und erscheint nur bei aktivierter Erkennung.
* **Immer sichtbarer Player:** Eine Mindestgröße von 320×180 verhindert, dass der eingebettete Player verschwindet.
* **Screenshot per IPC:** Der Kanal `capture-frame` liefert einen sofortigen Screenshot des Hauptfensters.
* **Gesicherte Schnittstelle im Preload:** Über `window.api.captureFrame(bounds)` kann der Renderer nun sicher einen Screenshot anfordern.
* **Desktop-Capturer entfernt:** Die API `desktopCapturer.getSources` steht nicht mehr zur Verfügung.
* **Neuer Frame-Grab-Workflow im Renderer:** Für jeden OCR-Durchlauf wird das IFrame direkt fotografiert und das PNG ohne zusätzliche Berechtigungen verarbeitet.
* **Bildverarbeitung für exakteres OCR:** Der Screenshot wird noch heller und kontrastreicher aufbereitet und anschließend hart binarisiert.
* **Optimierte OCR-Parameter für bessere Trefferquote**
* **Genauere ROI-Erkennung dank Helligkeitsprüfung** – der erkannte Bereich wird geringfügig nach unten verschoben, wenn zu wenig helle Pixel vorhanden sind.
* **Stabilere Helligkeitsprüfung:** Überprüft zuerst die Abmessungen des Overlay-Bereichs und vermeidet so Fehlermeldungen.
* **OffscreenCanvas mit Graustufen-Verarbeitung:** Screenshots werden doppelt skaliert, kontrastverstärkt und in Graustufen umgewandelt.
* **willReadFrequently gesetzt:** Canvas-Kontexte nutzen das Attribut für schnellere Mehrfachzugriffe ohne Warnungen.
* **OCR-Tuning im Einstell-Drawer:** Der ⚙️‑Button klappt nun einen seitlichen Drawer aus. Darin lassen sich Helligkeit, Kontrast, Invertierung, Schärfen, Schwellenwert, PSM-Modus und Whitelist live anpassen. Eine kleine Vorschau zeigt sofort das gefilterte Bild und das erkannte Ergebnis. Das Ergebnisfeld färbt sich abhängig von der erkannten Confidence rot, gelb oder grün und alle Werte bleiben dank `localStorage` dauerhaft erhalten.
* **Escape schließt den Einstell-Drawer:** Mit der Escape-Taste verschwindet nur der Drawer, der Player bleibt sichtbar.
* **Präzisere Texterkennung:** Das Overlay endet jetzt 3 px über dem Slider und nutzt nur 14 % der Bildhöhe.
* **Schnellerer Auto‑OCR‑Loop:** Läuft alle 750 ms und pausiert das Video ab vier erkannten Zeichen.
### 📊 Fortschritts‑Tracking

* **Globale Dashboard‑Kacheln:** Gesamt, Übersetzt, Ordner komplett, **EN/DE/BEIDE/∑**
* **Level‑Statistik‑Panel** (aufklappbar im Ordner‑Browser)
* **Projekt‑übergreifende Fortschrittsanzeige:** Dateien und Dashboard zeigen Status über alle Projekte
* **Visuelle Gesamtbalken** in der Filter-Leiste zeigen den Fortschritt aller Projekte
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

* **Verbessertes Auto‑Resize** – Textfelder schneiden keine Zeilen mehr ab und bleiben zwischen EN & DE höhengleich
* **Automatische Anpassung beim Laden** der Textfelder beim Projektstart
* **Sofort‑Speicherung** nach 1 s Inaktivität
* **Tab/Shift+Tab Navigation** zwischen Textfeldern und Zeilen
* **Ctrl+Leertaste:** Audio‑Playback direkt im Textfeld
* **Copy‑Buttons:** 📋 neben jedem Textfeld für direktes Kopieren
* **Automatische Übersetzungsvorschau** unter jedem DE-Feld via *Argos Translate*
* **Umlaute korrekt anzeigen:** Die automatischen Übersetzungen nutzen nun immer UTF‑8
* **Gespeicherte Übersetzungen:** einmal erzeugte Vorschläge werden im Projekt abgelegt und nur bei Änderungen neu berechnet
* **Fortschrittsanzeige** beim automatischen Übersetzen aller fehlenden Texte
* **Lade-Indikator für Übersetzungen:** Jede Anfrage zeigt nun einen Spinner und das Ergebnis kommt über das IPC-Event `translate-finished`
* **Projekt-Playback:** ▶/⏸/⏹ spielt verfügbare DE-Dateien nacheinander ab
* **Feste Reihenfolge:** Beim Projekt-Playback wird die Dateiliste strikt von oben nach unten abgespielt, unabhängig vom Dateityp
* **Stabileres Audio-Playback:** Unterbrochene Wiedergabe erzeugt keine Fehlermeldungen mehr
* **Automatischer History-Eintrag:** Beim Lautstärkeabgleich wird das Original gespeichert
* **Funkgeräte-Effekt:** Alle Parameter (Bandpass, Sättigung, Rauschen, Knackser, Wet) lassen sich bequem per Regler einstellen und werden dauerhaft gespeichert.
* **Schneller Zugriff:** Die Funktionen Lautstärke angleichen – ⚡ und Funkgerät-Effekt – 📻 besitzen nun eigene Buttons mit Symbolen. Der Button **⟳ Standardwerte** befindet sich direkt daneben.
* **Verbessertes Speichern:** Nach dem Anwenden von Lautstärke angleichen oder Funkgerät‑Effekt bleiben die Änderungen nun zuverlässig erhalten.
* **Fehlerhinweise beim Speichern:** Tritt ein Problem auf, erscheint eine rote Toast-Meldung statt eines stummen Abbruchs.
* **Neue Meldung:** Scheitert das Anlegen einer History-Version, wird "Fehler beim Anlegen der History-Version" ausgegeben.
* **Dynamische Download-Spalte:** Die Spalte erscheint nur bei Bedarf und blendet sich aus, ohne die Tabellenüberschriften zu verschieben.

### 🔍 Suche & Import

* **Erweiterte Ähnlichkeitssuche** (ignoriert Groß‑/Kleinschreibung, Punkte)
* **Intelligenter Import** mit automatischer Spalten‑Erkennung
* **Multi‑Ordner‑Auswahl** bei mehrdeutigen Dateien
* **Live‑Highlighting** von Suchbegriffen

### ⌨️ Keyboard & Maus

* **Keyboard‑Navigation:** Pfeiltasten, Tab, Leertaste für Audio, Enter für Texteingabe
* **Context‑Menu** (Rechtsklick): Audio, Kopieren, Einfügen, Ordner öffnen, Löschen
* **Drag & Drop:** Projekte und Dateien sortieren
* **Klick auf Zeilennummer:** Position über Dialog anpassen
* **Doppelklick:** Projekt umbenennen

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
3. Im Ordner `electron/` `npm start` ausführen, um die Desktop-App ohne Browserdialog zu starten

   ```bash
   cd electron
   npm start
   ```
4. Das Projekt lässt sich plattformübergreifend mit `python start_tool.py` starten. Fehlt das Repository, wird es automatisch geklont; andernfalls werden die neuesten Änderungen geladen und die Desktop-App gestartet. `start_tool.py` erkennt dabei automatisch, ob es im Repository oder davor gestartet wurde.
5. Beim Start werden die Ordner `web/sounds/EN` und `web/sounds/DE` automatisch erstellt und eingelesen. Liegen die Ordner außerhalb des `web`-Verzeichnisses, erkennt das Tool sie nun ebenfalls.
6. Kopieren Sie Ihre Originaldateien in `web/sounds/EN` (oder den gefundenen Ordner) und legen Sie Übersetzungen in `web/sounds/DE` ab
7. Während des Setups erzeugt `start_tool.py` die Logdatei `setup.log`, in der alle Schritte gespeichert werden. Bei Fehlern weist die Konsole nun explizit auf diese Datei hin. Sowohl die Logdatei, `.last_head` als auch die automatisch erzeugten `.modules_hash`‑Dateien werden vom Repository ausgeschlossen (`.gitignore`).
8. Die Skripte verwerfen lokale Änderungen, **ohne** den Ordner `web/sounds` anzutasten – Projektdaten bleiben somit erhalten
9. `node check_environment.js` prueft Node- und npm-Version, installiert Abhaengigkeiten und startet einen kurzen Electron-Test. Mit `--tool-check` fuehrt das Skript zusaetzlich `python start_tool.py --check` aus, um die Desktop-App kurz zu testen. Ergebnisse stehen in `setup.log`.
10. `python verify_environment.py` versucht nun fehlende Dateien oder Abhängigkeiten automatisch nachzuladen. Mit `--check-only` lässt sich dieser Reparaturmodus abschalten. Jede Prüfung wird weiterhin mit einem ✓ ausgegeben.
11. Das Startskript kontrolliert die installierte Node-Version und bricht bei Abweichungen ab.
12. `reset_repo.py` setzt das Repository nun komplett zurück, installiert alle Abhängigkeiten in beiden Ordnern und startet anschließend automatisch die Desktop-App.
13. `start_tool.py` installiert nun zusätzlich alle Python-Abhängigkeiten aus `requirements.txt`. `translate_text.py` geht daher davon aus, dass `argostranslate` bereits vorhanden ist.
14. Zudem erkennt das Skript automatisch eine vorhandene NVIDIA‑GPU und installiert PyTorch mitsamt EasyOCR wahlweise als CUDA- oder CPU-Version.
15. Bereits vorhandene Python‑Pakete werden beim Start übersprungen, damit das Setup schneller abgeschlossen ist.
16. `run_easyocr.py` verwendet eine globale EasyOCR-Instanz. Über die Umgebungsvariable `HLA_OCR_LANGS` lassen sich die Sprachen anpassen (Standard: `en,de`).
17. Für die Bildvorverarbeitung installiert das Skript zusätzlich `opencv-python-headless` und `Pillow`.
18. `start_tool.py` merkt sich den letzten Git-Stand und den Hash der `package-lock.json`. Sind keine Änderungen erkennbar, werden `git reset`, `git fetch` und `npm ci` übersprungen. Fehlende Python-Pakete installiert ein einziger `pip`-Aufruf.
19. Der Hash wird in `.modules_hash` gespeichert, damit erneute `npm ci`-Aufrufe nur bei Änderungen erfolgen. Diese Datei ist ebenfalls vom Repository ausgeschlossen.
20. In `requirements.txt` gekennzeichnete Zeilen mit `# optional` werden bei `verify_environment.py` nur informativ geprüft und lassen den Test bestehen.

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
Die Datei `elevenlabs.js` stellt aktuell folgende Funktionen bereit: `createDubbing`, `getDubbingStatus`, `downloadDubbingAudio`, `getDefaultVoiceSettings`, `waitForDubbing`, `isDubReady`, `renderLanguage` und `pollRender`. Auskommentierte Alt-Funktionen wie `dubSegments`, `renderDubbingResource` oder `getDubbingResource` sind entfernt worden.

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
Persönliche Zusätze wie `_Alex` oder `-Bob` entfernt er dabei automatisch.
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
Seit Patch 1.40.45 erlaubt die Content Security Policy nun Web Worker aus `blob:`-URLs. Dadurch funktioniert die OCR wieder fehlerfrei.
Seit Patch 1.40.46 darf die Content Security Policy auch Skripte von `cdn.jsdelivr.net` laden. Damit startet der Tesseract-Worker ohne Fehlermeldung.
Seit Patch 1.40.47 erlaubt die Content Security Policy nun zusätzlich `'unsafe-eval'` und `'data:'` in den passenden Direktiven. Dadurch läuft die OCR ohne CSP-Fehler.
Seit Patch 1.40.48 akzeptiert die Richtlinie auch `tessdata.projectnaptha.com`, damit Tesseract seine Sprachdaten herunterladen kann.
Seit Patch 1.40.49 entfernt die Content Security Policy `'unsafe-eval'` wieder, da alle eingebundenen Bibliotheken ohne diese Option auskommen. Dadurch entfallen die Sicherheitshinweise beim Start.
Seit Patch 1.40.50 fügt die Richtlinie `'unsafe-eval'` erneut hinzu, damit der Tesseract-Worker ohne Fehler startet.
Seit Patch 1.40.51 wurde die CSS-Klasse `.video-player-section` bereinigt. Jetzt gilt ein eindeutiger Block mit `overflow-x:hidden`, `overflow-y:auto` und `min-height:0`, damit die Steuerelement-Leiste nicht mehr abgeschnitten wird.
Seit Patch 1.40.52 entfernt die Content Security Policy `'unsafe-eval'` erneut und erlaubt `worker-src 'self'`. Dadurch verschwindet die Electron-Sicherheitswarnung, ohne die App-Funktionalität einzuschränken.
Seit Patch 1.40.53 nutzt die Content Security Policy eine minimale Konfiguration. Sie erlaubt Blob‑Worker für Tesseract, ohne `'unsafe-eval'` zu verwenden.
Seit Patch 1.40.54 erlaubt die Richtlinie Skripte und Frames von `youtube.com` und `youtube-nocookie.com`. Vorschaubilder von `i.ytimg.com` bleiben erlaubt.
Seit Patch 1.40.55 wird die Datei `tesseract-core-simd.wasm.js` lokal eingebunden und über `corePath` geladen. Dadurch benötigt die OCR keine externen Skripte mehr.
Seit Patch 1.40.56 erlaubt die Content Security Policy zusätzlich `wasm-unsafe-eval` und `connect-src data:`, damit Tesseract im Browser ohne Fehlermeldungen startet.
Seit Patch 1.40.57 akzeptiert die Richtlinie auch `'unsafe-inline'` in `style-src`. Damit funktionieren eingebettete Style-Attribute wieder ohne CSP-Warnung.
Seit Patch 1.40.58 wird `style-src` aufgeteilt: `style-src-elem 'self'` und `style-src-attr 'self' 'unsafe-inline'`. Inline-Styles bleiben erlaubt, externe Styles müssen aber weiterhin lokal geladen werden.
Seit Patch 1.40.59 entfernt die Web-App alle Tesseract-Dateien. Die OCR läuft jetzt ausschließlich über EasyOCR und benötigt keine zusätzlichen CSP-Ausnahmen.

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

`translate_text.py` übersetzt kurze Texte offline mit Argos Translate. Die benötigten Pakete werden durch `start_tool.py` automatisch installiert. Fehlende Sprachpakete lädt das Skript beim ersten Aufruf automatisch herunter. Über `--no-download` lässt sich dieser Schritt verhindern. Für eine komplett Offline-Nutzung müssen die Pakete vorher mit `argos-translate-cli` installiert werden. Seit Version 1.40.13 wird korrekt erkannt, ob ein Paket bereits vorhanden ist. Anschließend kann der gewünschte Text per `echo "Hello" | python translate_text.py` übersetzt werden.
In der Desktop-App wird das Skript asynchron gestartet und das Ergebnis über das Event `translate-finished` zurückgegeben.

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
| **Half-Life: Alyx starten** | Zentrale Start-Leiste mit Modus‑ und Sprachauswahl sowie optionalem +map‑Parameter |

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

### Audio & Text

|  Aktion                    |  Bedienung |
| -------------------------- | ----------------------------------------------- |
| **Audio abspielen**       | ▶ Button oder Leertaste (bei ausgewaehlter Zeile) |
| **Projekt-Playback**      | ▶/⏸/⏹ spielt vorhandene DE-Dateien der Reihe nach |
| **Audio im Textfeld**     | `Ctrl + Leertaste` |
| **Text kopieren**         | 📋 Button neben Textfeld |
| **Zwischen Feldern**      | `Tab` / `Shift + Tab` |
| **Auto-Resize verbessert** | Textfelder passen sich sauber an und schneiden keine Zeilen mehr ab; beim Projektstart wird die korrekte Höhe jetzt sofort gesetzt |
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
### Player im Video-Manager

|  Taste             |  Funktion |
| ------------------ | ----------------------------- |
| **`Escape`**       | Player schließen |
| **`Leertaste`**    | Wiedergabe starten/pausieren |
| **`←` / `→`**      | 10 s zurück/vor |
| **`F9`**           | Einzelbild-OCR |
| **`Ctrl + Shift + O`** | OCR-Einstell-Drawer |
| **`R`**             | Reset der OCR-Einstellungen (nur bei offenem Drawer) |

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

---

### Untertitel-Import

Mit diesem Import liest das Tool die Dateien `closecaption_english.txt` und `closecaption_german.txt` aus dem Ordner `closecaption/` ein. Eine Utility-Funktion `loadClosecaptions()` verarbeitet beide Dateien und liefert ein Array aller Zeilen. Die Einträge werden über ihre ID zusammengeführt und mit der Datenbank abgeglichen. Bei eindeutiger Übereinstimmung wird der deutsche Text automatisch zugeordnet. Sind mehrere Dateien möglich, erscheint eine Auswahl, um den passenden Ordner festzulegen oder den Eintrag zu überspringen.
Ab sofort zeigt diese Auswahl zusätzlich die vorhandenen EN- und DE-Texte des jeweiligen Ordners an. Die gleiche Funktion wird auch für die neue Untertitel-Suche verwendet.

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

## 💾 Backup

Mit dem Backup-Dialog lassen sich alle Projekt-Daten als JSON speichern. Neu ist die Option, die Ordner **Sounds/DE**, **DE-Backup** und **DE-History** als ZIP-Archiv zu sichern. Die ZIP-Dateien liegen im Benutzerordner unter `Backups/sounds`. Das Tool behält automatisch nur die fünf neuesten ZIP-Backups.

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
* **🔄 Dateinamen-Prüfung:** Klick auf den Dateinamen öffnet einen Dialog mit passenden Endungen

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
* **🛠 Debug-Logging aktivieren:** Setze `localStorage.setItem('hla_debug_mode','true')` im Browser, um zusätzliche Konsolen-Ausgaben zu erhalten

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
Ab Node.js 22 werden unbehandelte Promises standardmäßig als Fehler gewertet und würden die Tests abbrechen.
Das Test-Skript ruft deshalb Jest mit `node --unhandled-rejections=warn` auf, sodass solche Fälle nur eine Warnung auslösen.

1. Tests starten
   ```bash
   npm test
   ```

Die wichtigsten Tests befinden sich im Ordner `tests/` und prüfen die Funktionen `calculateProjectStats`, die ElevenLabs‑Anbindung und den Datei‑Watcher. Ein GitHub‑Workflow führt sie automatisch mit Node 18–22 aus.

1. **Entwicklungsserver starten**
   ```bash
   cd electron
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
* **`create-sound-backup()`** – packt `Sounds/DE`, `DE-Backup` und `DE-History` als ZIP in `Backups/sounds`.
* **`list-sound-backups()`** – listet vorhandene ZIP-Sicherungen auf.
* **`delete-sound-backup(name)`** – entfernt ein ZIP-Backup.
* **`saveDeHistoryBuffer(relPath, data)`** – legt einen Buffer als neue History-Version ab.
* **`copyDubbedFile(originalPath, tempDubPath)`** – verschiebt eine heruntergeladene Dub-Datei in den deutschen Ordnerbaum.
* **`calculateProjectStats(project)`** – ermittelt pro Projekt den Übersetzungs‑ und Audio‑Fortschritt. Diese Funktion wird auch in den Tests ausführlich geprüft.
* **`ipcContracts.ts`** – definiert Typen für die IPC-Kommunikation zwischen Preload und Hauptprozess.
* **`syncProjectData(projects, filePathDatabase, textDatabase)`** – gleicht Projekte mit der Datenbank ab, korrigiert Dateiendungen und überträgt Texte.
* **`repairFileExtensions(projects, filePathDatabase, textDatabase)`** – aktualisiert veraltete Dateiendungen in Projekten und verschiebt vorhandene Texte.
  Die Funktionen stehen im Browser direkt unter `window` zur Verfügung und können ohne Import genutzt werden.
