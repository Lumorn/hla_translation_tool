# hla_translation_tool
# 🎮 Half‑Life: Alyx Translation Tool

![Half‑Life: Alyx Translation Tool](https://img.shields.io/badge/Version-1.40.103-green?style=for-the-badge)
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
* [🗂️ Projektstruktur](#-projektstruktur)
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
* **Eigenes Wörterbuch:** Der 📚-Knopf speichert nun sowohl englisch‑deutsche Übersetzungen als auch Lautschrift.
* **Audio-Datei zuordnen:** Lange Aufnahmen lassen sich automatisch in Segmente teilen, per Klick auswählen, farblich passenden Textzeilen zuweisen und direkt ins Projekt importieren. Über den 🚫‑Knopf markierte Bereiche werden dauerhaft übersprungen und in der Liste grau hinterlegt. Fehlhafte Eingaben löschen die Zuordnung automatisch, laufende Wiedergaben stoppen beim Neu‑Upload. Die gewählte Datei und alle Zuordnungen werden im Projekt gespeichert und sind Teil des Backups. In der Desktop‑Version landet die Originaldatei zusätzlich im Ordner `Sounds/Segments` und trägt die ID des Projekts. Beim Klicken werden ausgewählte Segmente sofort abgespielt. Die Segmentierungslogik ist fest im Hauptskript verankert. Der Datei‑Input besitzt zusätzlich ein `onchange`-Attribut und der Listener wird beim Öffnen des Dialogs neu gesetzt, sodass der Upload immer reagiert. Der Dialog setzt die HTML‑Elemente `segmentFileInput` und `segmentWaveform` voraus.
* **Segment-Zuordnungen behalten:** Beim Neustart lädt der Segment-Dialog automatisch die gespeicherte Audiodatei und zeigt alle zuvor getroffenen Zuordnungen.
* **Kopierhilfe für Emotionen:** Beim Öffnen kopiert der Assistent nun den aktuellen Schritt, ohne schon weiterzuschalten. Mit jedem Klick auf „Weiter“ folgt erst der Emotionstext und anschließend der nächste Name.
* **Zurück‑Knopf und Fortschritts‑Speicherung:** Die Kopierhilfe merkt sich nun auch den aktuellen Schritt und bietet einen neuen „Zurück“-Button zum erneuten Kopieren vorangegangener Einträge.
* **Aufgeräumte Filter-Leiste:** GPT-, Emotions- und Kopierhilfe-Knöpfe stehen jetzt direkt neben der Suche in einer Zeile.
* **Automatischer Voice-Abgleich:** Beim Öffnen der Kopierhilfe lädt das Tool die verfügbaren ElevenLabs-Stimmen und zeigt Namen und IDs korrekt an.
* **Zusätzliche Zwischenablage-Prüfung:** Die Kopierhilfe stellt sicher, dass im ersten Schritt der Name und im zweiten der Emotionstext in der Zwischenablage liegt.
* **Alle Emotionstexte kopieren:** Ein neuer Button sammelt alle Emotionstexte, entfernt darin Zeilenumbrüche und trennt die Blöcke jeweils mit einer Leerzeile.
* **Stabile Base64-Kodierung:** Große Audiodateien werden beim Hochladen in handlichen Blöcken verarbeitet, sodass kein "Maximum call stack size exceeded" mehr auftritt.
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
* **Eigenständige Score-Komponente:** Tooltip und Klick sind in `web/src/scoreColumn.js` gekapselt
* **Einheitliche Score-Klassen:** Die Funktion `scoreClass` vergibt überall die gleichen Farbstufen
* **Feineres Bewertungsschema:** Ab 95 % wird der Score grün, zwischen 85 % und 94 % gelb
* **Score in Prozent:** Die Bewertung wird in der Tabelle mit Prozentzeichen dargestellt
* **Aktive Score-Events:** Nach jedem Rendern bindet `attachScoreHandlers` Tooltip und Klick
* **Kommentar-Anzeige auf ganzer Fläche:** Der Tooltip reagiert jetzt auf das gesamte Score-Feld
* **Direkter Daten-Refresh:** Nach jeder Bewertung wird die Tabelle mit den aktualisierten Dateien neu gerendert
* **Farbiger GPT-Vorschlag:** Der empfohlene DE-Text erscheint nun oberhalb des Textfelds und nutzt die Score-Farbe
* **Feste Schriftfarben:** Gelber Score nutzt schwarze Schrift, rot und gruen weiss
* **Bereinigte Vorschau-Anzeige:** Leere GPT-Vorschläge lassen keinen zusätzlichen Abstand mehr
* **Kommentar über dem Vorschlag:** Ist ein Kommentar vorhanden, erscheint er in weißer Schrift direkt über der farbigen Box
* **Einheitliche GPT-Vorschau:** Der farbige Vorschlagsbalken ist nun direkt klickbar und es gibt nur noch einen Tooltip
* **Niedrigster GPT-Score pro Projekt:** Die Projektübersicht zeigt nun die schlechteste Bewertung aller Zeilen an
* **Automatische Übernahme von GPT-Vorschlägen:** Eine neue Option setzt empfohlene Texte sofort in das DE-Feld
* **Einfüge-Knopf versteht JSON:** Manuell in den GPT-Test kopierte Antworten können direkt übernommen werden
* **Zuverlässiges Einfügen:** Der Einfüge-Knopf lädt fehlende Module nach, überträgt Score und Vorschlag in die Daten und zeichnet die Tabelle neu
* **Kompatible Nachladung:** Beim Einfügen erkennt das Tool nun auch CommonJS-Exporte und verhindert so Fehler
* **Fehlerbehebung beim Einfügen:** Der Button funktioniert nun auch, wenn `applyEvaluationResults` nur global definiert war
* **Dritte Spalte im GPT-Test als Tabelle:** Rechts zeigt jetzt eine übersichtliche Tabelle mit ID, Dateiname, Ordner, Bewertung, Vorschlag und Kommentar alle Ergebnisse an
* **Speicherfunktion für GPT-Test:** Jeder Versand erzeugt einen neuen Tab mit Prompt, Antwort und Tabelle. Tabs lassen sich wechseln und löschen.
* **GPT-Tabs pro Projekt:** Geöffnete Tests bleiben gespeichert und erscheinen beim nächsten Öffnen wieder.
* **GPT-Knopf direkt neben der Suche:** Ein Klick öffnet die gespeicherten GPT-Tabs des aktuellen Projekts.
* **Einfüge-Knopf für gespeicherte Tests:** Beim Wechsel des Tabs wird der Button aktiviert und übernimmt Score und Vorschlag korrekt.
* **Feste Buttons im GPT-Test:** Das Fenster hat nun eine begrenzte Höhe, Prompt- und Ergebnis-Spalten scrollen separat.
* **Kompakter GPT-Versand:** Doppelte Zeilen werden zusammengefasst. Der Startdialog zeigt an, wie viele Zeilen wirklich übertragen werden.
* **Schlanker Video-Bereich:** Gespeicherte Links öffnen sich im Browser. Interner Player und OCR wurden entfernt.
* **Video-Bookmarks:** Speichert Links für einen schnellen Zugriff.
* **Löschen per Desktop-API:** Einzelne Bookmarks lassen sich über einen IPC-Kanal entfernen.
* **Tests für Video-Bookmarks:** Überprüfen Laden, Sortierung sowie Hinzufügen und Entfernen von Einträgen.
* **Tests für Segment-Dialog:** Stellt sicher, dass analysierte Segmente gespeichert und wieder geladen werden.
* **Prüfung von Video-Links:** Eingaben müssen mit `https://` beginnen und dürfen keine Leerzeichen enthalten.
* **Duplikat-Prüfung & dauerhafte Speicherung im Nutzerordner**
* **Automatische YouTube-Titel:** Beim Hinzufügen lädt das Tool den Videotitel per oEmbed und sortiert die Liste alphabetisch. Schlägt dies fehl, wird die eingegebene URL als Titel gespeichert.
* **Überarbeitete Video-Manager-Oberfläche:** Neue Farbakzente und deutliche Aktions-Icons erleichtern die Bedienung.
* **Stabiles Sortieren:** Nach Filterung oder Sortierung funktionieren die Video-Buttons dank Originalindex weiterhin korrekt.
* **Thumbnail-Ansicht:** Die Tabelle zeigt Vorschaubilder, ein Klick auf Titel oder Bild öffnet das Video im Browser.
* **Vorschaubilder direkt per ffmpeg:** Das Storyboard wird nicht mehr verwendet. Die Desktop-App erstellt das Bild sofort über `get-video-frame` im Ordner `videoFrames`.
* **Direkte URL via yt-dlp:** Ist `yt-dlp` installiert, nutzt das Tool diese Methode automatisch. `ytdl-core` und `play-dl` dienen nur noch als Fallback.
* **Hilfsfunktion `previewFor`:** Ruft direkt `get-video-frame` auf und zeigt bei Fehlern das normale YouTube-Thumbnail.
* **Moderne Rasteransicht:** Gespeicherte Videos erscheinen jetzt in einem übersichtlichen Grid mit großem Thumbnail und direktem "Aktualisieren"-Knopf.
* **Neues ⟳-Symbol:** Ein Klick auf das kleine Icon oben links lädt das Storyboard neu und aktualisiert das Vorschaubild.
* **Intuitiver Hinzufügen-Button:** Der +‑Button sitzt nun direkt neben dem URL-Feld und speichert den Link auf Knopfdruck.
* **Fixer Dialog-Abstand:** Der Video-Manager steht nun stets mit 10 % Rand im Fenster. Die Funktion `adjustVideoDialogHeight` wurde entfernt.
* **Behobenes Resize-Problem:** Nach einer Verkleinerung wächst der Videoplayer jetzt korrekt mit, sobald das Fenster wieder größer wird.
* **Stabiler Startzustand:** CSS-Duplikate entfernt; `video-dialog` startet immer mit 10 % Abstand.
* **Bereinigtes Stylesheet:** `style.css` enthält `video-dialog` und `wb-grid` nur noch einmal am Dateiende.
* **Finale Stylesheet-Overrides:** Am Dateiende erzwingen `!important`-Angaben die korrekte Größe des Video-Managers.
* **Korrektes Skalieren nach erneutem Öffnen:** Der Player passt sich nach dem Wiedereinblenden automatisch an die aktuelle Fenstergröße an.
* **Aktualisierung im Hintergrund:** Selbst bei geschlossenem Player wird die Größe im Hintergrund neu berechnet und beim nächsten Öffnen korrekt übernommen.
* **Video & OCR Workbench:** Liste und Player teilen sich die obere Zeile, das OCR-Ergebnis belegt den gesamten Bereich darunter.
* **Dreispaltiges Dialog-Layout:** Das OCR-Fenster sitzt jetzt rechts oben und die Steuerleiste belegt eine eigene Zeile.
* **Verbesserte Thumbnail-Ladefunktion:** Vorschaubilder werden über `i.ytimg.com` geladen und die gesamte Zeile ist zum Öffnen des Videos anklickbar.
* **Angepasste Content Security Policy:** `connect-src` erlaubt nun zusätzlich `i.ytimg.com` und `api.openai.com`, damit Storyboards und die GPT-API funktionieren.
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
* **Dauerhafte Video-Suche:** Der Suchbegriff im Video-Manager bleibt zwischen den Sitzungen erhalten.
* **Responsiver Video-Manager:** Fester Dialog-Abstand, flexible Toolbar mit Min-Buttons und kompaktem ❌-Icon bei schmaler Breite. Tabellenzeilen besitzen gleichmäßiges Padding und einen Hover-Effekt.
* **Zweispaltiges Video-Dashboard:** Links steht die Videoliste, rechts der 16:9‑Player mit schwebender Leiste. Das OCR‑Panel füllt darunter die komplette Breite und die Aktions-Icons befinden sich direkt unter dem Player.
* **Flexibles Dashboard-Layout:** Das Dashboard basiert jetzt auf einem vertikalen Flex-Layout. Liste, Player und OCR-Bereich ordnen sich untereinander an und passen sich dynamisch der Fensterhöhe an.
* **Robuster Video-Dialog:** Das Flex-Layout verhindert Überlappungen und lässt jede Sektion dynamisch wachsen.
* **Stabileres Grid-Layout im Video-Manager:** Die Aufteilung nutzt jetzt CSS-Grid und die Anzeige aller Dialoge wird komplett über die Klasse `.hidden` gesteuert.
* **Bereinigte CSS-Regeln:** Alte, starre Blöcke gelöscht; `video-dialog` und `wb-grid` stehen jetzt einmalig am Ende.
* **Vereinfachtes Dialoglayout:** Grundwerte und geöffnete Variante wurden zu einem Grid-Block zusammengeführt.
* **Dynamische Spaltenbreite im Video-Manager:** Die Liste schrumpft bis auf 30 % der Dialogbreite und bleibt mindestens 180 px breit. Gleichzeitig entfallen starre Zeilenhöhen, sodass Player und OCR-Bereich flexibel wachsen.
* **Entschlacktes Video-Dialog-Raster:** Kopf, Inhalt und Steuerleiste passen sich automatisch an und der Rahmen zeigt keine Scrollbalken mehr.
* **Klar kommentierte CSS-Blöcke:** `video-dialog` und `wb-grid` besitzen jetzt eindeutige Abschnittsüberschriften.
* **Aussagekräftige IDs:** Die drei Bereiche heißen nun `videoListSection`, `videoPlayerSection` und `ocrOutputSection`.
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
* **OCR-Funktion im Player:** Ein präzises Overlay deckt nur die Untertitel ab. Der Auto-Modus pausiert bei einem Treffer das Video und sammelt den Text im rechten Panel. F9 erstellt jetzt einen einzelnen OCR‑Screenshot. Ein neuer 🔍‑Button aktiviert den Dauerlauf.
* **Verbesserte OCR-Pipeline:** Overlay und Panel passen sich dynamisch an, starten nur nach Aktivierung und zeigen den erkannten Text gut lesbar im neuen Ergebnis‑Panel.
* **Nahtloser Player mit OCR-Panel:** Die Breite des IFrames berücksichtigt die Panelbreite, die Steuerleiste reicht bis an den Rand und der blaue OCR‑Rahmen sitzt exakt auf dem Videobild.
* **Feinschliff am OCR‑Panel:** Breite clamped, Panel überlappt keine Buttons mehr, Text scrollt automatisch und der 🔍‑Button blinkt kurz bei einem Treffer.
* **Fest rechts verankertes Ergebnis-Panel:** Das Panel sitzt nun neben dem Video und passt seine Höhe automatisch an, ohne das Bild zu überdecken.
* **Aufräumarbeiten am Panel-Layout:** Überflüssige CSS-Regeln entfernt und Höhe dynamisch gesetzt.
* **Panelgröße korrekt berechnet:** Die Player-Anpassung zieht nun die Breite des Ergebnis-Panels ab und setzt dessen Höhe direkt nach dem Video.
* **Schnell-Fix:** Das Ergebnis-Panel überdeckt das Video nicht mehr und passt seine Höhe exakt an die IFrame-Größe an.
* **Responsive OCR-Anzeige:** Bei schmalen Dialogen rutscht das Ergebnis-Panel automatisch unter das Video.
* **Dynamisch mitskalierender OCR-Bereich:** Overlay und Panel wachsen oder schrumpfen nun mit dem Dialog.
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
* **OCR-Panel immer sichtbar:** Ein Platzhalter weist nun darauf hin, wenn noch kein Text erkannt wurde.
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
* **Statusleiste mit GPU-Anzeige und Start-/Stop-Buttons** erleichtert die Kontrolle der Erkennung.
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
* **Emotionaler DE‑Text:** Unter jedem deutschen Textfeld befindet sich ein eigenes Feld mit violettem Hintergrund. Der Button „Emotional-Text (DE) generieren“ erstellt den Inhalt nun stets neu; ein 📋‑Knopf kopiert ihn.
* **Emotionen (DE) generieren:** Der Button oberhalb der Tabelle erstellt jetzt für alle Zeilen neue Emotional-Text-Felder – vorhandene Inhalte werden überschrieben.
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
* **Projekt-Playback:** ▶/⏸/⏹ spielt verfügbare DE-Dateien nacheinander ab
* **Feste Reihenfolge:** Beim Projekt-Playback wird die Dateiliste strikt von oben nach unten abgespielt, unabhängig vom Dateityp
* **Stabileres Audio-Playback:** Unterbrochene Wiedergabe erzeugt keine Fehlermeldungen mehr
* **Fehlerhinweis bei der Bearbeitungs-Vorschau:** Schlägt das Abspielen fehl, erscheint jetzt eine Meldung
* **Automatischer History-Eintrag:** Beim Lautstärkeabgleich wird das Original gespeichert
* **Funkgeräte-Effekt:** Alle Parameter (Bandpass, Sättigung, Rauschen, Knackser, Wet) lassen sich bequem per Regler einstellen und werden dauerhaft gespeichert.
* **Hall-Effekt mit Raumgröße, Hallintensität und Verzögerung:** alle Werte lassen sich justieren und bleiben erhalten.
* **Getrennte Effektbereiche:** Funkgerät- und Hall-Einstellungen liegen nun in eigenen Abschnitten des Dialogs.
* **Verbesserte Buttons:** Die kräftig gefärbten Schalter heben sich im aktiven Zustand blau hervor.
* **Schneller Zugriff:** Die Funktionen Lautstärke angleichen – ⚡ und Funkgerät-Effekt – 📻 besitzen nun eigene Buttons mit Symbolen. Der Button **⟳ Standardwerte** befindet sich direkt daneben.
* **Hall-Standardwerte:** Im Hall-Bereich setzt **⟳ Hall-Standardwerte** alle Parameter auf ihre Ausgangswerte zurück.
* **Verbessertes Speichern:** Nach dem Anwenden von Lautstärke angleichen oder Funkgerät‑Effekt bleiben die Änderungen nun zuverlässig erhalten.
* **Vier Bearbeitungssymbole:** Der Status neben der Schere zeigt nun bis zu vier Icons in zwei Reihen für Trimmen, Lautstärkeangleichung, Funkgerät- und Hall-Effekt an.
* **Ignorier-Bereiche im DE-Editor:** Mit gedrückter Umschalttaste lassen sich beliebige Abschnitte markieren, die beim Abspielen und Speichern übersprungen werden. Die Bereiche bleiben bearbeitbar und erscheinen in einer eigenen Liste. Vorschau und Export überspringen diese Stellen automatisch.
* **Manuelles Zuschneiden:** Start- und Endzeit lassen sich per Millisekundenfeld oder durch Ziehen der grünen Marker im Waveform-Editor setzen.
* **Automatische Pausenkürzung und Time‑Stretching:** Längere Pausen erkennt das Tool auf Wunsch selbst. Mit einem Regler lässt sich das Tempo von 1,00–3,00 anpassen oder automatisch auf die EN-Länge setzen. Ein Button „🎯 Anpassen & Anwenden“ kombiniert beide Schritte und eine farbige Anzeige warnt bei Abweichungen.
* **Sanftere Pausenkürzung:** Beim Entfernen langer Pausen bleiben jetzt 2 ms an jedem Übergang stehen, damit die Schnitte nicht zu hart wirken.
* **Längenvergleich visualisiert:** Unter der DE-Wellenform zeigt ein Tooltip die neue Dauer. Abweichungen über 5 % werden orange oder rot hervorgehoben.
* **Effektparameter speicherbar:** Trimmen, Pausenkürzung und Tempo werden im Projekt gesichert und lassen sich über "🔄 Zurücksetzen" rückgängig machen.
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
* **Zurücksetzen nach Upload oder Dubbing:** Sowohl beim Hochladen als auch beim erneuten Erzeugen einer deutschen Audiodatei werden Lautstärkeangleichung, Funkgerät‑Effekt und Hall‑Effekt automatisch deaktiviert.
* **Fehlerhinweise beim Speichern:** Tritt ein Problem auf, erscheint eine rote Toast-Meldung statt eines stummen Abbruchs.
* **Neue Meldung:** Scheitert das Anlegen einer History-Version, wird "Fehler beim Anlegen der History-Version" ausgegeben.
* **Kompaktere Dubbing-Spalte:** Der Statuspunkt und der Download-Pfeil stehen jetzt direkt neben dem Dubbing-Button in einer gemeinsamen Spalte.
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

### 🔍 Suche & Import

* **Erweiterte Ähnlichkeitssuche** (ignoriert Groß‑/Kleinschreibung, Punkte)
* **Intelligenter Import** mit automatischer Spalten‑Erkennung
* **Multi‑Ordner‑Auswahl** bei mehrdeutigen Dateien
* **Live‑Highlighting** von Suchbegriffen

### ⌨️ Keyboard & Maus

* **Keyboard‑Navigation:** Pfeiltasten, Tab, Leertaste für Audio, Enter für Texteingabe
* **Context‑Menu** (Rechtsklick): Audio, Kopieren, Einfügen, Ordner öffnen, Löschen
* **Schnell hinzufügen:** Rechtsklick auf Level → Schnellprojekt, Rechtsklick auf Kapitel → Schnell‑Level
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
* **Playwright** als zusätzliche Abhängigkeit für die Schritt-für-Schritt-Automatik
* **64‑Bit Python 3.9–3.12** erforderlich; 3.13+ wird moeglicherweise nicht unterstuetzt (Warnhinweis). 32‑Bit wird nicht unterstuetzt

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
6. Das Projekt lässt sich plattformübergreifend mit `python start_tool.py` starten. Fehlt das Repository, wird es automatisch geklont; andernfalls werden die neuesten Änderungen geladen und die Desktop-App gestartet. `start_tool.py` erkennt dabei automatisch, ob es im Repository oder davor gestartet wurde.
7. Beim Start werden die Ordner `web/sounds/EN` und `web/sounds/DE` automatisch erstellt und eingelesen. Liegen die Ordner außerhalb des `web`-Verzeichnisses, erkennt das Tool sie nun ebenfalls.
8. Kopieren Sie Ihre Originaldateien in `web/sounds/EN` (oder den gefundenen Ordner) und legen Sie Übersetzungen in `web/sounds/DE` ab
9. Während des Setups erzeugt `start_tool.py` die Logdatei `setup.log`, in der alle Schritte gespeichert werden. Bei Fehlern weist die Konsole nun explizit auf diese Datei hin. Sowohl die Logdatei, `.last_head` als auch die automatisch erzeugten `.modules_hash`‑Dateien werden vom Repository ausgeschlossen (`.gitignore`).
10. Die Skripte verwerfen lokale Änderungen, **ohne** den Ordner `web/sounds` anzutasten – Projektdaten bleiben somit erhalten
11. `node check_environment.js` prueft Node- und npm-Version, installiert Abhaengigkeiten und startet einen kurzen Electron-Test. Mit `--tool-check` fuehrt das Skript zusaetzlich `python start_tool.py --check` aus, um die Desktop-App kurz zu testen. Ergebnisse stehen in `setup.log`.
12. `python verify_environment.py` versucht nun fehlende Dateien oder Abhängigkeiten automatisch nachzuladen. Mit `--check-only` lässt sich dieser Reparaturmodus abschalten. Jede Prüfung wird weiterhin mit einem ✓ ausgegeben.
13. Das Startskript kontrolliert die installierte Node-Version und bricht bei Abweichungen ab.
14. `reset_repo.py` setzt das Repository nun komplett zurück, installiert alle Abhängigkeiten in beiden Ordnern und startet anschließend automatisch die Desktop-App.
15. `start_tool.py` installiert nun zusätzlich alle Python-Abhängigkeiten aus `requirements.txt`. `translate_text.py` geht daher davon aus, dass `argostranslate` bereits vorhanden ist.
16. Zudem erkennt das Skript automatisch eine vorhandene NVIDIA‑GPU und installiert PyTorch mitsamt EasyOCR wahlweise als CUDA- oder CPU-Version.
17. Bereits vorhandene Python‑Pakete werden beim Start übersprungen, damit das Setup schneller abgeschlossen ist.
18. `run_easyocr.py` verwendet eine globale EasyOCR-Instanz. Über die Umgebungsvariable `HLA_OCR_LANGS` lassen sich die Sprachen anpassen (Standard: `en,de`).
19. Für die Bildvorverarbeitung installiert das Skript `Pillow>=10.3`. Dieses Wheel unterstützt Python 3.12. `opencv-python-headless>=4.9.0` ist weiterhin optional.
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
const url = `https://elevenlabs.io/v1/dubbing/${job.dubbing_id}`;
console.log('Dubbing-Seite öffnen:', url);
if (await isDubReady(job.dubbing_id, 'de', apiKey)) {
    const blob = await fetch(`${API}/dubbing/${job.dubbing_id}/audio/de`, { headers: { 'xi-api-key': apiKey } }).then(r => r.blob());
    // blob speichern ...
}
```
Die Datei `elevenlabs.js` stellt aktuell folgende Funktionen bereit: `createDubbing`, `getDubbingStatus`, `downloadDubbingAudio`, `getDefaultVoiceSettings`, `waitForDubbing`, `isDubReady`, `renderLanguage`, `pollRender` und `sendTextV2`. Auskommentierte Alt-Funktionen wie `dubSegments`, `renderDubbingResource` oder `getDubbingResource` sind entfernt worden.
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

Ein Watcher überwacht automatisch den Ordner `web/Download` bzw. `web/Downloads` im Projekt. Taucht dort eine fertig gerenderte Datei auf, meldet das Tool „Datei gefunden“ und verschiebt sie nach `web/sounds/DE`. Seit Version 1.40.5 klappt das auch nach einem Neustart: Legen Sie die Datei einfach in den Ordner, sie wird anhand der Dubbing‑ID automatisch der richtigen Zeile zugeordnet. Der Status springt anschließend auf *fertig*. Alle 15 Sekunden erfolgt zusätzlich eine Status-Abfrage der offenen Jobs, allerdings nur im Beta-Modus. Beta-Jobs werden nun automatisch aus dieser Liste entfernt, sobald sie fertig sind. Der halbautomatische Modus verzichtet auf diese Abfrage. Der Download-Ordner wird zu Beginn jedes neuen Dubbings geleert. Nach dem Import entfernt der Watcher nur noch die bearbeitete Datei, damit parallel abgelegte Downloads erhalten bleiben. Seit Version 1.40.17 findet der Watcher auch Dateien mit leicht verändertem Namen und warnt bei fehlender Zuordnung im Terminal. Erkennt er keine Zuordnung, startet ein manueller Import.
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
| **Schnellprojekt**        | Rechtsklick auf Level → Schnellprojekt |
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
| **Schnellprojekt**        | Rechtsklick auf Level → Schnellprojekt |
| **Projekt auswählen**     | Klick auf Projekt‑Kachel                          |
| **Projekt anpassen**      | Rechtsklick auf Projekt → ⚙️ bearbeiten |
| **Projekt löschen**       | Rechtsklick auf Projekt → 🗑️ löschen |
| **Projekt umbenennen**    | Doppelklick auf Projekt‑Name                      |
| **Projekt sortieren**     | Drag & Drop der Projekt‑Kacheln                   |
| **Kapitel anpassen**      | Rechtsklick auf Kapitel-Titel → Bearbeiten/Löschen |
| **Schnell-Level**         | Rechtsklick auf Kapitel → Schnell-Level |
| **Level anpassen**        | Rechtsklick auf Level-Titel → Bearbeiten/Löschen |
| **Level‑Name kopieren**   | ⧉‑Button in Meta‑Leiste                           |
| **Half-Life: Alyx starten** | Zentrale Start-Leiste mit Modus‑ und Sprachauswahl sowie optionalem +map‑Parameter |

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
Dort gibt es jetzt auch einen Bereich **ChatGPT API**. Der Schlüssel wird lokal AES‑verschlüsselt im Nutzerordner gespeichert und lässt sich über einen Test-Knopf prüfen. Nach erfolgreichem Test kannst du die Liste der verfügbaren Modelle abrufen (↻) und eines auswählen. Die Modell-Liste wird 24&nbsp;Stunden zwischengespeichert. Vor dem Senden wird die geschätzte Tokenzahl angezeigt, ab 75k folgt ein Warnhinweis. Der Bewertungs‑Prompt liegt in `prompts/gpt_score.txt`. Beim Start der Bewertung öffnet sich zusätzlich eine Konsole, die alle GPT-Nachrichten anzeigt.

---

## 💾 Backup

Mit dem Backup-Dialog lassen sich alle Projekt-Daten als JSON speichern. Neu ist die Option, die Ordner **Sounds/DE**, **DE-Backup** und **DE-History** als ZIP-Archiv zu sichern. Die ZIP-Dateien liegen im Benutzerordner unter `Backups/sounds`. Das Tool behält automatisch nur die fünf neuesten ZIP-Backups. Die Liste der Backups zeigt nun Datum und Uhrzeit an, sortiert mit dem aktuellsten Eintrag oben.
Beim Erstellen eines Sound-Backups erscheint nun ein Fortschrittsbalken, damit man den laufenden Vorgang erkennt.


## 🗂️ Projektstruktur

Die wichtigsten JavaScript-Dateien sind nun thematisch gegliedert:
* **web/src/main.js** – Initialisierung der App
* **web/src/fileUtils.js** – Text-Funktionen wie `calculateTextSimilarity`
* **web/src/colorUtils.js** – Farb-Hilfsfunktionen wie `getVersionColor`
* **web/src/fileUtils.mjs** – Wrapper, der die Textfunktionen sowohl im Browser als auch unter Node bereitstellt
* **web/src/gptService.js** – Anbindung an die ChatGPT-API
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
* **📐 Längen-Vergleich:** Farbige Symbole zeigen, ob die deutsche Audiodatei kürzer (grün) oder länger (rot) als das englische Original ist
* **🎨 Theme‑System:** Automatische Icon‑ und Farb‑Zuweisungen
* **💡 Context‑Awareness:** Funktionen passen sich dem aktuellen Kontext an
* **🔄 Dateinamen-Prüfung:** Klick auf den Dateinamen öffnet einen Dialog mit passenden Endungen
* **📋 Strg+Klick auf Dateiname:** kopiert den Namen ohne Endung in die Zwischenablage

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
* **🔧 Debug-Konsole:** Über das Dropdown "Debug-Konsole" können Sie Logs einsehen. In der Desktop-Version öffnen sich die DevTools jetzt automatisch in einem separaten Fenster oder per `Ctrl+Shift+I`.
* **💡 Neues Debug-Fenster:** Gruppiert System- und Pfadinformationen übersichtlich und bietet eine Kopierfunktion.
* **📦 Modul-Status:** Neue Spalte im Debug-Fenster zeigt, ob alle Module korrekt geladen wurden und aus welcher Quelle sie stammen.
* **🖥️ Erweiterte Systemdaten:** Das Debug-Fenster zeigt jetzt Betriebssystem, CPU-Modell und freien Arbeitsspeicher an.
* **📸 VideoFrame-Details:** Zusätzlich werden der Pfad zum Frame-Ordner und die Versionen der Video-Abhängigkeiten angezeigt.
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

`npm test` installiert dank eines `pretest`-Skripts automatisch alle Abhängigkeiten per `npm ci --ignore-scripts`.
Wer alle optionalen Skripte ausführen möchte, startet vorher manuell `npm ci`.
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

### Tests ausführen

Für die automatischen Tests sind neben Node auch einige Python‑Pakete notwendig,
die in `requirements.txt` aufgeführt sind. Bei fehlender Internetverbindung
schlagen `npm ci` und `pip install` daher meist fehl. Als Workaround können die
benötigten Wheels vorab lokal zwischengespeichert und `npm ci --ignore-scripts`
verwendet werden, um optionale Downloads zu überspringen.

**Erfolgskriterien**

* Ausgabe erfolgt auf Deutsch.
* Timing der Sprachausgabe passt zum Original.

## 🧩 Wichtige Funktionen

* **`readAudioFiles(dir)`** – liest alle Audiodateien eines Ordners rekursiv ein und gibt ihre Pfade im POSIX‑Format zurück.
* **`createWindow()`** – öffnet das Hauptfenster der Electron‑App und richtet einen Shortcut zum Ein‑/Ausblenden der DevTools ein.
* **`backup-de-file(relPath)`** – kopiert eine vorhandene deutsche Audiodatei nach `DE-Backup`, sofern dort noch keine Sicherung existiert.
* **`delete-de-backup-file(relPath)`** – löscht eine Sicherung aus `DE-Backup` und entfernt leere Unterordner.
* **`restore-de-file(relPath)`** – stellt eine deutsche Audiodatei aus dem Backup wieder her.
* **`create-sound-backup()`** – packt `Sounds/DE`, `DE-Backup` und `DE-History` als ZIP in `Backups/sounds` und zeigt einen Fortschrittsbalken an.
* **`list-sound-backups()`** – listet vorhandene ZIP-Sicherungen auf.
* **`delete-sound-backup(name)`** – entfernt ein ZIP-Backup.
* **`saveDeHistoryBuffer(relPath, data)`** – legt einen Buffer als neue History-Version ab.
* **`copyDubbedFile(originalPath, tempDubPath)`** – verschiebt eine heruntergeladene Dub-Datei in den deutschen Ordnerbaum.
* **`extractRelevantFolder(parts)`** – gibt den relevanten Abschnitt eines Dateipfades ab "vo" oder ohne führendes "sounds" zurück (siehe `web/src/pathUtils.js`).
* **`calculateProjectStats(project)`** – ermittelt pro Projekt den Übersetzungs‑ und Audio‑Fortschritt. Diese Funktion wird auch in den Tests ausführlich geprüft.
* **`ipcContracts.ts`** – definiert Typen für die IPC-Kommunikation zwischen Preload und Hauptprozess.
* **`syncProjectData(projects, filePathDatabase, textDatabase)`** – gleicht Projekte mit der Datenbank ab, korrigiert Dateiendungen und überträgt Texte.
* **`repairFileExtensions(projects, filePathDatabase, textDatabase)`** – aktualisiert veraltete Dateiendungen in Projekten und verschiebt vorhandene Texte.
  Die Funktionen stehen im Browser direkt unter `window` zur Verfügung und können ohne Import genutzt werden.
* **`safeCopy(text)`** – kopiert Text in die Zwischenablage und greift bei Fehlern auf Electron zurück.
